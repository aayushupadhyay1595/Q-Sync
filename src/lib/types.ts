export type UserRole = 'customer' | 'controller' | 'admin' | 'super_admin';

export type TokenStatus = 
  | 'waiting'
  | 'called'
  | 'serving'
  | 'completed'
  | 'cancelled'
  | 'skipped'
  | 'no_show'
  | 'transferred';

export type PriorityCategory = 
  | 'standard'
  | 'senior'
  | 'emergency'
  | 'accessible'
  | 'vip';

export type NotificationStage = 
  | 'stage_1_two_ahead' 
  | 'stage_2_next_in_line' 
  | 'stage_3_called';

export type NotificationChannel = 'in_app' | 'browser_push' | 'email' | 'sms' | 'whatsapp';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  category: 'hospital' | 'clinic' | 'bank' | 'government' | 'college' | 'salon' | 'diagnostic' | 'other';
  logo_url?: string;
  created_at: string;
}

export interface ServiceLocation {
  id: string;
  organization_id: string;
  name: string;
  address: string;
  city: string;
  timezone: string;
  is_active: boolean;
  operating_hours?: {
    open: string;
    close: string;
    days: number[]; // 0 = Sunday, 1 = Monday, etc.
  };
}

export interface Department {
  id: string;
  location_id: string;
  name: string;
  code: string;
  floor?: string;
  is_active: boolean;
}

export interface Service {
  id: string;
  department_id: string;
  name: string;
  code_prefix: string; // e.g. "CARD", "OPD", "BNK"
  avg_duration_minutes: number;
  buffer_time_minutes: number;
  is_active: boolean;
  daily_limit?: number;
  description?: string;
}

export interface ServiceCounter {
  id: string;
  location_id: string;
  name: string; // e.g. "Counter 1", "Room 102", "Window A"
  code: string;
  assigned_staff_id?: string;
  assigned_staff_name?: string;
  is_active: boolean;
  status: 'available' | 'busy' | 'paused' | 'offline';
  compatible_service_ids: string[];
}

export interface Token {
  id: string;
  ref_code: string; // non-guessable string e.g. "QS-A482X"
  display_number: string; // e.g. "OPD-025"
  organization_id: string;
  location_id: string;
  department_id: string;
  service_id: string;
  service_name?: string;
  department_name?: string;
  counter_id?: string;
  counter_name?: string;
  business_date: string; // YYYY-MM-DD
  sequence_number: number;
  
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_user_id?: string;
  
  status: TokenStatus;
  priority: PriorityCategory;
  
  // Timestamps
  created_at: string;
  called_at?: string;
  serving_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  skipped_at?: string;
  
  // Call metadata
  called_by_staff_id?: string;
  called_by_staff_name?: string;
  call_count: number;
  skip_reason?: string;
  notes?: string;
  
  // Dynamic queue calculation info
  position_in_queue?: number;
  estimated_wait_minutes?: number;
  people_ahead?: number;
}

export interface TokenEvent {
  id: string;
  token_id: string;
  event_type: 'created' | 'called' | 'recalled' | 'serving_started' | 'completed' | 'skipped' | 'no_show' | 'cancelled' | 'transferred' | 'override';
  actor_id?: string;
  actor_name?: string;
  actor_role?: UserRole;
  counter_id?: string;
  counter_name?: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface SmartNotification {
  id: string;
  token_id: string;
  ref_code: string;
  display_number: string;
  stage: NotificationStage;
  title: string;
  message: string;
  counter_name?: string;
  service_name?: string;
  channel: NotificationChannel;
  status: 'pending' | 'delivered' | 'failed';
  read: boolean;
  created_at: string;
}

export interface QueueState {
  service_id: string;
  service_name: string;
  is_paused: boolean;
  pause_reason?: string;
  total_issued_today: number;
  currently_waiting: number;
  currently_serving?: Token;
  recently_called: Token[];
  next_eligible_token?: Token;
  average_wait_minutes: number;
  active_counters: number;
  load_level: 'low' | 'moderate' | 'busy' | 'congested';
}

export interface ServiceFeedback {
  id: string;
  token_id: string;
  ref_code: string;
  rating: number; // 1 to 5
  comment?: string;
  wait_time_satisfaction: 'excellent' | 'acceptable' | 'too_long';
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  target_type: 'token' | 'queue' | 'counter' | 'service' | 'settings';
  target_id: string;
  description: string;
  reason?: string;
  created_at: string;
}

export interface QueueHealthRecommendation {
  id: string;
  level: 'info' | 'warning' | 'alert';
  title: string;
  message: string;
  suggested_action: string;
  service_id: string;
}
