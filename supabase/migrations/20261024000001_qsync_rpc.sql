-- ============================================================
-- Q-SYNC: PostgreSQL RPC Functions for Atomic Queue Operations
-- ============================================================

-- Function 1: Atomic Issue Token
CREATE OR REPLACE FUNCTION issue_token(
    p_service_id UUID,
    p_customer_name TEXT DEFAULT NULL,
    p_customer_phone TEXT DEFAULT NULL,
    p_customer_email TEXT DEFAULT NULL,
    p_priority TEXT DEFAULT 'standard',
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_service RECORD;
    v_seq INT;
    v_prefix TEXT;
    v_display_num TEXT;
    v_ref_code TEXT;
    v_today DATE := CURRENT_DATE;
    v_token RECORD;
BEGIN
    -- 1. Fetch service details
    SELECT s.*, d.location_id, l.organization_id, d.id as dept_id
    INTO v_service
    FROM services s
    JOIN departments d ON s.department_id = d.id
    JOIN service_locations l ON d.location_id = l.id
    WHERE s.id = p_service_id AND s.is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Service not found or is currently inactive';
    END IF;

    -- 2. Concurrency-safe atomic sequence allocation
    INSERT INTO queue_daily_sequences (service_id, business_date, last_sequence)
    VALUES (p_service_id, v_today, 1)
    ON CONFLICT (service_id, business_date)
    DO UPDATE SET last_sequence = queue_daily_sequences.last_sequence + 1
    RETURNING last_sequence INTO v_seq;

    -- 3. Check daily limit
    IF v_service.daily_limit IS NOT NULL AND v_seq > v_service.daily_limit THEN
        RAISE EXCEPTION 'Daily token capacity reached for this service (% tokens)', v_service.daily_limit;
    END IF;

    -- 4. Format display number (e.g. OPD-001)
    v_prefix := COALESCE(v_service.code_prefix, 'Q');
    v_display_num := v_prefix || '-' || LPAD(v_seq::text, 3, '0');

    -- 5. Generate secure non-guessable 8-character public reference code
    v_ref_code := 'QS-' || UPPER(SUBSTRING(MD5(RANDOM()::text || CLOCK_TIMESTAMP()::text) FROM 1 FOR 6));

    -- 6. Insert new token
    INSERT INTO tokens (
        ref_code,
        display_number,
        organization_id,
        location_id,
        department_id,
        service_id,
        business_date,
        sequence_number,
        customer_name,
        customer_phone,
        customer_email,
        customer_user_id,
        status,
        priority
    ) VALUES (
        v_ref_code,
        v_display_num,
        v_service.organization_id,
        v_service.location_id,
        v_service.dept_id,
        p_service_id,
        v_today,
        v_seq,
        p_customer_name,
        p_customer_phone,
        p_customer_email,
        p_user_id,
        'waiting',
        p_priority
    )
    RETURNING * INTO v_token;

    -- 7. Record immutable event
    INSERT INTO token_events (token_id, event_type, details)
    VALUES (v_token.id, 'created', jsonb_build_object(
        'display_number', v_display_num,
        'priority', p_priority,
        'source', 'customer_portal'
    ));

    RETURN to_jsonb(v_token);
END;
$$;


-- Function 2: Atomic Call Next Eligible Token
CREATE OR REPLACE FUNCTION call_next_token(
    p_service_id UUID,
    p_counter_id UUID,
    p_staff_id UUID DEFAULT NULL,
    p_staff_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_next_token RECORD;
    v_counter RECORD;
BEGIN
    SELECT * INTO v_counter FROM service_counters WHERE id = p_counter_id;
    
    -- Select next eligible token using FOR UPDATE SKIP LOCKED
    SELECT * INTO v_next_token
    FROM tokens
    WHERE service_id = p_service_id
      AND status = 'waiting'
      AND business_date = CURRENT_DATE
    ORDER BY 
      CASE priority
        WHEN 'emergency' THEN 5
        WHEN 'senior' THEN 3
        WHEN 'accessible' THEN 3
        WHEN 'vip' THEN 2
        ELSE 1
      END DESC,
      created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'No waiting tokens remaining in this queue');
    END IF;

    -- Update token to called
    UPDATE tokens
    SET status = 'called',
        called_at = NOW(),
        counter_id = p_counter_id,
        called_by_staff_id = p_staff_id,
        called_by_staff_name = p_staff_name,
        call_count = call_count + 1
    WHERE id = v_next_token.id
    RETURNING * INTO v_next_token;

    -- Update counter status
    UPDATE service_counters
    SET status = 'busy'
    WHERE id = p_counter_id;

    -- Log event
    INSERT INTO token_events (token_id, event_type, actor_id, actor_name, counter_id, counter_name, details)
    VALUES (
        v_next_token.id, 
        'called', 
        p_staff_id, 
        p_staff_name, 
        p_counter_id, 
        v_counter.name,
        jsonb_build_object('display_number', v_next_token.display_number)
    );

    RETURN jsonb_build_object('success', true, 'token', to_jsonb(v_next_token));
END;
$$;


-- Function 3: Start Serving Token
CREATE OR REPLACE FUNCTION start_serving_token(
    p_token_id UUID,
    p_staff_id UUID DEFAULT NULL,
    p_staff_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token RECORD;
BEGIN
    UPDATE tokens
    SET status = 'serving',
        serving_at = NOW()
    WHERE id = p_token_id
      AND status = 'called'
    RETURNING * INTO v_token;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Token cannot be marked as serving (invalid status or not found)';
    END IF;

    INSERT INTO token_events (token_id, event_type, actor_id, actor_name)
    VALUES (p_token_id, 'serving_started', p_staff_id, p_staff_name);

    RETURN to_jsonb(v_token);
END;
$$;


-- Function 4: Complete Token
CREATE OR REPLACE FUNCTION complete_token(
    p_token_id UUID,
    p_counter_id UUID DEFAULT NULL,
    p_staff_id UUID DEFAULT NULL,
    p_staff_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token RECORD;
BEGIN
    UPDATE tokens
    SET status = 'completed',
        completed_at = NOW()
    WHERE id = p_token_id
      AND status IN ('serving', 'called')
    RETURNING * INTO v_token;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Token cannot be completed (invalid status or already closed)';
    END IF;

    IF p_counter_id IS NOT NULL THEN
        UPDATE service_counters
        SET status = 'available'
        WHERE id = p_counter_id;
    END IF;

    INSERT INTO token_events (token_id, event_type, actor_id, actor_name)
    VALUES (p_token_id, 'completed', p_staff_id, p_staff_name);

    RETURN to_jsonb(v_token);
END;
$$;


-- Function 5: Atomic Complete & Call Next
CREATE OR REPLACE FUNCTION complete_and_call_next(
    p_current_token_id UUID,
    p_service_id UUID,
    p_counter_id UUID,
    p_staff_id UUID DEFAULT NULL,
    p_staff_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_completed_token JSONB;
    v_next_token_result JSONB;
BEGIN
    -- 1. Complete the current token if provided
    IF p_current_token_id IS NOT NULL THEN
        v_completed_token := complete_token(p_current_token_id, p_counter_id, p_staff_id, p_staff_name);
    END IF;

    -- 2. Call the next eligible token
    v_next_token_result := call_next_token(p_service_id, p_counter_id, p_staff_id, p_staff_name);

    RETURN jsonb_build_object(
        'completed', v_completed_token,
        'next', v_next_token_result
    );
END;
$$;
