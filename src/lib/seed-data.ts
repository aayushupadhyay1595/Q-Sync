import { Organization, ServiceLocation, Department, Service, ServiceCounter, Token, AuditLogEntry } from './types';

const BASE_DATE = '2026-10-24';
const BASE_TIMESTAMP = '2026-10-24T08:00:00.000Z';

export const SEED_ORGANIZATIONS: Organization[] = [
  {
    id: 'org-metro-health',
    name: 'Metro Health Multi-Speciality Clinic',
    slug: 'metro-health',
    category: 'clinic',
    created_at: BASE_TIMESTAMP
  },
  {
    id: 'org-apex-bank',
    name: 'Pinnacle Trust Bank & Wealth',
    slug: 'pinnacle-bank',
    category: 'bank',
    created_at: BASE_TIMESTAMP
  }
];

export const SEED_LOCATIONS: ServiceLocation[] = [
  {
    id: 'loc-main-hospital',
    organization_id: 'org-metro-health',
    name: 'Metro Health - Central Wing',
    address: '42 Medical Plaza, Healthcare Boulevard',
    city: 'Metro City',
    timezone: 'Asia/Kolkata',
    is_active: true,
    operating_hours: {
      open: '08:00',
      close: '20:00',
      days: [0, 1, 2, 3, 4, 5, 6]
    }
  },
  {
    id: 'loc-bank-branch',
    organization_id: 'org-apex-bank',
    name: 'Downtown Financial Branch',
    address: '100 Financial Square, Tower 1',
    city: 'Metro City',
    timezone: 'Asia/Kolkata',
    is_active: true,
    operating_hours: {
      open: '09:30',
      close: '17:30',
      days: [1, 2, 3, 4, 5]
    }
  }
];

export const SEED_DEPARTMENTS: Department[] = [
  {
    id: 'dept-opd',
    location_id: 'loc-main-hospital',
    name: 'Outpatient Department (OPD)',
    code: 'OPD',
    floor: 'Ground Floor, Block A',
    is_active: true
  },
  {
    id: 'dept-cardio',
    location_id: 'loc-main-hospital',
    name: 'Cardiology & Diagnostic Clinic',
    code: 'CARD',
    floor: 'First Floor, Room 104-108',
    is_active: true
  },
  {
    id: 'dept-lab',
    location_id: 'loc-main-hospital',
    name: 'Clinical Diagnostics & Blood Lab',
    code: 'LAB',
    floor: 'Basement Level 1',
    is_active: true
  },
  {
    id: 'dept-bank-teller',
    location_id: 'loc-bank-branch',
    name: 'Customer Cash & Teller Services',
    code: 'BNK',
    floor: 'Main Banking Hall',
    is_active: true
  }
];

export const SEED_SERVICES: Service[] = [
  {
    id: 'srv-gen-opd',
    department_id: 'dept-opd',
    name: 'General Physician Consultation',
    code_prefix: 'OPD',
    avg_duration_minutes: 8,
    buffer_time_minutes: 2,
    is_active: true,
    daily_limit: 150,
    description: 'Routine general health consultation, vital check, prescription refills.'
  },
  {
    id: 'srv-cardio',
    department_id: 'dept-cardio',
    name: 'Cardiology Specialist Consultation',
    code_prefix: 'CARD',
    avg_duration_minutes: 15,
    buffer_time_minutes: 3,
    is_active: true,
    daily_limit: 60,
    description: 'Specialist cardiac evaluation, ECG review, echo interpretation.'
  },
  {
    id: 'srv-blood-test',
    department_id: 'dept-lab',
    name: 'Diagnostic Blood Draw & Sample Lab',
    code_prefix: 'LAB',
    avg_duration_minutes: 5,
    buffer_time_minutes: 1,
    is_active: true,
    daily_limit: 200,
    description: 'Fasting blood tests, lipid panel, metabolic profiles, and urinalysis collection.'
  },
  {
    id: 'srv-teller',
    department_id: 'dept-bank-teller',
    name: 'Teller & Cash Deposit / Withdrawal',
    code_prefix: 'CSH',
    avg_duration_minutes: 6,
    buffer_time_minutes: 2,
    is_active: true,
    daily_limit: 180,
    description: 'Cash deposits, currency exchange, draft issuance, statement requests.'
  }
];

export const SEED_COUNTERS: ServiceCounter[] = [
  {
    id: 'cnt-1',
    location_id: 'loc-main-hospital',
    name: 'Counter 1 — Dr. Ananya Sharma',
    code: 'C1',
    assigned_staff_id: 'stf-01',
    assigned_staff_name: 'Dr. Ananya Sharma (General Medicine)',
    is_active: true,
    status: 'busy',
    compatible_service_ids: ['srv-gen-opd']
  },
  {
    id: 'cnt-2',
    location_id: 'loc-main-hospital',
    name: 'Counter 2 — Dr. Rajesh Verma',
    code: 'C2',
    assigned_staff_id: 'stf-02',
    assigned_staff_name: 'Dr. Rajesh Verma (Consultant Physician)',
    is_active: true,
    status: 'available',
    compatible_service_ids: ['srv-gen-opd']
  },
  {
    id: 'cnt-3',
    location_id: 'loc-main-hospital',
    name: 'Counter 3 — Dr. Vikram Mehta',
    code: 'C3',
    assigned_staff_id: 'stf-03',
    assigned_staff_name: 'Dr. Vikram Mehta (Senior Cardiologist)',
    is_active: true,
    status: 'busy',
    compatible_service_ids: ['srv-cardio']
  },
  {
    id: 'cnt-4',
    location_id: 'loc-main-hospital',
    name: 'Counter 4 — Phlebotomy Station 1',
    code: 'C4',
    assigned_staff_id: 'stf-04',
    assigned_staff_name: 'Nurse Priya Sen (Phlebotomist)',
    is_active: true,
    status: 'available',
    compatible_service_ids: ['srv-blood-test']
  }
];

export const SEED_TOKENS: Token[] = [
  {
    id: 'tok-opd-021',
    ref_code: 'QS-A91B4C',
    display_number: 'OPD-021',
    organization_id: 'org-metro-health',
    location_id: 'loc-main-hospital',
    department_id: 'dept-opd',
    service_id: 'srv-gen-opd',
    service_name: 'General Physician Consultation',
    department_name: 'Outpatient Department (OPD)',
    counter_id: 'cnt-1',
    counter_name: 'Counter 1 — Dr. Ananya Sharma',
    business_date: BASE_DATE,
    sequence_number: 21,
    customer_name: 'Rohan Mehra',
    customer_phone: '+91 98765 43210',
    status: 'serving',
    priority: 'standard',
    created_at: '2026-10-24T08:15:00.000Z',
    called_at: '2026-10-24T08:42:00.000Z',
    serving_at: '2026-10-24T08:44:00.000Z',
    called_by_staff_id: 'stf-01',
    called_by_staff_name: 'Dr. Ananya Sharma',
    call_count: 1
  },
  {
    id: 'tok-opd-022',
    ref_code: 'QS-B28E9F',
    display_number: 'OPD-022',
    organization_id: 'org-metro-health',
    location_id: 'loc-main-hospital',
    department_id: 'dept-opd',
    service_id: 'srv-gen-opd',
    service_name: 'General Physician Consultation',
    department_name: 'Outpatient Department (OPD)',
    counter_id: 'cnt-2',
    counter_name: 'Counter 2 — Dr. Rajesh Verma',
    business_date: BASE_DATE,
    sequence_number: 22,
    customer_name: 'Sunita Kapur',
    customer_phone: '+91 98111 22334',
    status: 'called',
    priority: 'senior',
    created_at: '2026-10-24T08:25:00.000Z',
    called_at: '2026-10-24T08:49:00.000Z',
    called_by_staff_id: 'stf-02',
    called_by_staff_name: 'Dr. Rajesh Verma',
    call_count: 1
  },
  {
    id: 'tok-opd-023',
    ref_code: 'QS-C37K1D',
    display_number: 'OPD-023',
    organization_id: 'org-metro-health',
    location_id: 'loc-main-hospital',
    department_id: 'dept-opd',
    service_id: 'srv-gen-opd',
    service_name: 'General Physician Consultation',
    department_name: 'Outpatient Department (OPD)',
    business_date: BASE_DATE,
    sequence_number: 23,
    customer_name: 'Amitabh Sen',
    customer_phone: '+91 97234 56789',
    status: 'waiting',
    priority: 'standard',
    created_at: '2026-10-24T08:30:00.000Z',
    call_count: 0
  },
  {
    id: 'tok-opd-024',
    ref_code: 'QS-D48M5E',
    display_number: 'OPD-024',
    organization_id: 'org-metro-health',
    location_id: 'loc-main-hospital',
    department_id: 'dept-opd',
    service_id: 'srv-gen-opd',
    service_name: 'General Physician Consultation',
    department_name: 'Outpatient Department (OPD)',
    business_date: BASE_DATE,
    sequence_number: 24,
    customer_name: 'Kavita Joshi',
    customer_phone: '+91 99887 76655',
    status: 'waiting',
    priority: 'standard',
    created_at: '2026-10-24T08:35:00.000Z',
    call_count: 0
  },
  {
    id: 'tok-opd-025',
    ref_code: 'QS-E59P7W',
    display_number: 'OPD-025',
    organization_id: 'org-metro-health',
    location_id: 'loc-main-hospital',
    department_id: 'dept-opd',
    service_id: 'srv-gen-opd',
    service_name: 'General Physician Consultation',
    department_name: 'Outpatient Department (OPD)',
    business_date: BASE_DATE,
    sequence_number: 25,
    customer_name: 'Devendra Patel',
    customer_phone: '+91 98450 11223',
    status: 'waiting',
    priority: 'standard',
    created_at: '2026-10-24T08:40:00.000Z',
    call_count: 0
  },
  {
    id: 'tok-card-008',
    ref_code: 'QS-F61T3Q',
    display_number: 'CARD-008',
    organization_id: 'org-metro-health',
    location_id: 'loc-main-hospital',
    department_id: 'dept-cardio',
    service_id: 'srv-cardio',
    service_name: 'Cardiology Specialist Consultation',
    department_name: 'Cardiology & Diagnostic Clinic',
    counter_id: 'cnt-3',
    counter_name: 'Counter 3 — Dr. Vikram Mehta',
    business_date: BASE_DATE,
    sequence_number: 8,
    customer_name: 'Harish Nambiar',
    status: 'serving',
    priority: 'standard',
    created_at: '2026-10-24T08:10:00.000Z',
    called_at: '2026-10-24T08:38:00.000Z',
    serving_at: '2026-10-24T08:40:00.000Z',
    call_count: 1
  },
  {
    id: 'tok-card-009',
    ref_code: 'QS-G72X9R',
    display_number: 'CARD-009',
    organization_id: 'org-metro-health',
    location_id: 'loc-main-hospital',
    department_id: 'dept-cardio',
    service_id: 'srv-cardio',
    service_name: 'Cardiology Specialist Consultation',
    department_name: 'Cardiology & Diagnostic Clinic',
    business_date: BASE_DATE,
    sequence_number: 9,
    customer_name: 'Meenakshi Iyer',
    status: 'waiting',
    priority: 'senior',
    created_at: '2026-10-24T08:32:00.000Z',
    call_count: 0
  }
];

export const SEED_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-1',
    actor_name: 'Dr. Ananya Sharma',
    actor_role: 'controller',
    action: 'START_SERVING',
    target_type: 'token',
    target_id: 'tok-opd-021',
    description: 'Started serving patient OPD-021 at Counter 1',
    created_at: '2026-10-24T08:44:00.000Z'
  },
  {
    id: 'log-2',
    actor_name: 'Dr. Rajesh Verma',
    actor_role: 'controller',
    action: 'CALL_NEXT',
    target_type: 'token',
    target_id: 'tok-opd-022',
    description: 'Called next eligible patient OPD-022 (Senior Priority) to Counter 2',
    created_at: '2026-10-24T08:49:00.000Z'
  },
  {
    id: 'log-3',
    actor_name: 'Admin Desk',
    actor_role: 'admin',
    action: 'QUEUE_OPENED',
    target_type: 'queue',
    target_id: 'srv-gen-opd',
    description: 'Queue opened for morning session (08:00 - 20:00)',
    created_at: '2026-10-24T08:00:00.000Z'
  }
];
