-- ============================================================
-- Q-SYNC: SMART QUEUE MANAGEMENT SYSTEM
-- Schema Migration: Core Tables, Indexes, and Constraints
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'clinic',
    logo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Service Locations
CREATE TABLE IF NOT EXISTS service_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Departments
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES service_locations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    floor TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Services
CREATE TABLE IF NOT EXISTS services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code_prefix TEXT NOT NULL, -- e.g. "OPD", "CARD", "LAB"
    avg_duration_minutes INT NOT NULL DEFAULT 10,
    buffer_time_minutes INT NOT NULL DEFAULT 2,
    daily_limit INT DEFAULT 150,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Service Counters (Rooms/Desks)
CREATE TABLE IF NOT EXISTS service_counters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_id UUID NOT NULL REFERENCES service_locations(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. "Counter 1 - General Medicine"
    code TEXT NOT NULL,
    assigned_staff_id UUID,
    assigned_staff_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'busy', 'paused', 'offline')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Counter compatible services (many-to-many)
CREATE TABLE IF NOT EXISTS counter_services (
    counter_id UUID NOT NULL REFERENCES service_counters(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    PRIMARY KEY (counter_id, service_id)
);

-- Queues state (open / paused / closed)
CREATE TABLE IF NOT EXISTS queues (
    service_id UUID PRIMARY KEY REFERENCES services(id) ON DELETE CASCADE,
    is_paused BOOLEAN NOT NULL DEFAULT false,
    pause_reason TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Queue Daily Sequences (Atomic daily sequence tracking)
CREATE TABLE IF NOT EXISTS queue_daily_sequences (
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    business_date DATE NOT NULL,
    last_sequence INT NOT NULL DEFAULT 0,
    PRIMARY KEY (service_id, business_date)
);

-- Tokens Table
CREATE TABLE IF NOT EXISTS tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ref_code TEXT NOT NULL UNIQUE, -- Non-guessable public reference e.g. "QS-A9B4C"
    display_number TEXT NOT NULL, -- e.g. "OPD-025"
    organization_id UUID NOT NULL REFERENCES organizations(id),
    location_id UUID NOT NULL REFERENCES service_locations(id),
    department_id UUID NOT NULL REFERENCES departments(id),
    service_id UUID NOT NULL REFERENCES services(id),
    counter_id UUID REFERENCES service_counters(id),
    
    business_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sequence_number INT NOT NULL,
    
    customer_name TEXT,
    customer_phone TEXT,
    customer_email TEXT,
    customer_user_id UUID,
    
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN (
        'waiting', 'called', 'serving', 'completed', 'cancelled', 'skipped', 'no_show', 'transferred'
    )),
    priority TEXT NOT NULL DEFAULT 'standard' CHECK (priority IN (
        'standard', 'senior', 'emergency', 'accessible', 'vip'
    )),
    
    call_count INT NOT NULL DEFAULT 0,
    skip_reason TEXT,
    notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    called_at TIMESTAMPTZ,
    serving_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    skipped_at TIMESTAMPTZ,
    
    called_by_staff_id UUID,
    called_by_staff_name TEXT
);

-- Enforce uniqueness of sequence per service per business date
CREATE UNIQUE INDEX IF NOT EXISTS idx_tokens_service_date_seq 
ON tokens(service_id, business_date, sequence_number);

-- Indexes for lightning fast queue progression queries
CREATE INDEX IF NOT EXISTS idx_tokens_queue_lookup 
ON tokens(service_id, status, priority, created_at);

CREATE INDEX IF NOT EXISTS idx_tokens_ref_code 
ON tokens(ref_code);

CREATE INDEX IF NOT EXISTS idx_tokens_business_date 
ON tokens(business_date);

-- Token Events (Immutable audit log of all transitions)
CREATE TABLE IF NOT EXISTS token_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    actor_id UUID,
    actor_name TEXT,
    actor_role TEXT,
    counter_id UUID REFERENCES service_counters(id),
    counter_name TEXT,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_token_events_token_id ON token_events(token_id);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
    stage TEXT NOT NULL CHECK (stage IN ('stage_1_two_ahead', 'stage_2_next_in_line', 'stage_3_called')),
    channel TEXT NOT NULL DEFAULT 'in_app',
    status TEXT NOT NULL DEFAULT 'pending',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Service Feedback
CREATE TABLE IF NOT EXISTS service_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token_id UUID NOT NULL REFERENCES tokens(id) ON DELETE CASCADE,
    ref_code TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    wait_time_satisfaction TEXT NOT NULL DEFAULT 'acceptable',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT NOT NULL,
    description TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for catalogs
CREATE POLICY "Public read for active services and locations" ON services FOR SELECT USING (is_active = true);
CREATE POLICY "Public read for locations" ON service_locations FOR SELECT USING (is_active = true);
CREATE POLICY "Public read for departments" ON departments FOR SELECT USING (is_active = true);
CREATE POLICY "Public read for counters" ON service_counters FOR SELECT USING (is_active = true);

-- Public read access for tracking a token with its unguessable ref_code
CREATE POLICY "Public token lookup by ref_code" ON tokens FOR SELECT USING (true);
CREATE POLICY "Public read feedback" ON service_feedback FOR INSERT WITH CHECK (true);
