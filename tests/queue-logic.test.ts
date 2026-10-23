import { calculateWaitTime, getEligibleQueuePosition } from '../src/lib/wait-time';
import { Token, Service } from '../src/lib/types';

function runTests() {
  console.log('🧪 Starting Q-Sync Queue Logic & Integrity Test Suite...\n');
  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${desc}`);
      process.exitCode = 1;
    }
  }

  // --- Test 1: Wait Time Estimation ---
  const sampleService: Service = {
    id: 'srv-test',
    department_id: 'dept-test',
    name: 'General Medicine',
    code_prefix: 'OPD',
    avg_duration_minutes: 10,
    buffer_time_minutes: 2,
    is_active: true
  };

  // Case A: 0 people ahead
  const est0 = calculateWaitTime(sampleService, 0, 1, []);
  assert(est0.peopleAhead === 0 && est0.displayText.includes('next'), 'Zero people ahead correctly shows "You are next"');

  // Case B: 3 people ahead on 1 counter with fallback baseline
  const est3 = calculateWaitTime(sampleService, 3, 1, []);
  assert(est3.estimatedMinutes === 36, '3 people ahead on 1 counter with 12m cycle yields 36m estimate');
  assert(est3.minRangeMinutes > 0 && est3.maxRangeMinutes > est3.minRangeMinutes, 'Realistic wait time range generated');

  // Case C: Multi-counter load distribution (2 active counters)
  const est3Multi = calculateWaitTime(sampleService, 4, 2, []);
  assert(est3Multi.estimatedMinutes === 24, '4 people ahead across 2 counters yields 2 batches (24m)');

  // Case D: Historical moving average override
  const completedTokens: Token[] = [
    { id: '1', serving_at: '2026-10-24T08:00:00Z', completed_at: '2026-10-24T08:05:00Z' } as any,
    { id: '2', serving_at: '2026-10-24T08:05:00Z', completed_at: '2026-10-24T08:11:00Z' } as any,
    { id: '3', serving_at: '2026-10-24T08:11:00Z', completed_at: '2026-10-24T08:17:00Z' } as any,
  ];
  const estMovingAvg = calculateWaitTime(sampleService, 2, 1, completedTokens);
  assert(estMovingAvg.modelType === 'historical_moving_average', 'Moving average activated when >= 3 historical completions exist');

  // --- Test 2: Priority Queue Ordering & Eligible Position ---
  const mockTokens: Token[] = [
    {
      id: 'tok-std-1',
      display_number: 'OPD-001',
      status: 'waiting',
      priority: 'standard',
      created_at: '2026-10-24T08:10:00Z'
    } as any,
    {
      id: 'tok-std-2',
      display_number: 'OPD-002',
      status: 'waiting',
      priority: 'standard',
      created_at: '2026-10-24T08:15:00Z'
    } as any,
    {
      id: 'tok-senior',
      display_number: 'OPD-003',
      status: 'waiting',
      priority: 'senior',
      created_at: '2026-10-24T08:20:00Z' // Arrived later, but is senior priority!
    } as any,
    {
      id: 'tok-emergency',
      display_number: 'OPD-004',
      status: 'waiting',
      priority: 'emergency',
      created_at: '2026-10-24T08:25:00Z' // Arrived last, but is emergency!
    } as any,
    {
      id: 'tok-cancelled',
      display_number: 'OPD-005',
      status: 'cancelled', // Must be excluded from active queue
      priority: 'emergency',
      created_at: '2026-10-24T08:00:00Z'
    } as any
  ];

  // Emergency token should jump to position 1
  const posEmergency = getEligibleQueuePosition(mockTokens, 'tok-emergency');
  assert(posEmergency.position === 1 && posEmergency.peopleAhead === 0, 'Emergency triage token is position 1 ahead of earlier arrivals');

  // Senior token should be position 2 (after emergency, ahead of standards)
  const posSenior = getEligibleQueuePosition(mockTokens, 'tok-senior');
  assert(posSenior.position === 2 && posSenior.peopleAhead === 1, 'Senior citizen priority is position 2 ahead of standard queue');

  // Standard token 1 should be position 3
  const posStd1 = getEligibleQueuePosition(mockTokens, 'tok-std-1');
  assert(posStd1.position === 3 && posStd1.peopleAhead === 2, 'Standard token 1 is position 3 (2 people ahead)');

  // Standard token 2 should be position 4
  const posStd2 = getEligibleQueuePosition(mockTokens, 'tok-std-2');
  assert(posStd2.position === 4 && posStd2.peopleAhead === 3, 'Standard token 2 is position 4 (3 people ahead)');

  // Cancelled token should be ignored
  const posCancelled = getEligibleQueuePosition(mockTokens, 'tok-cancelled');
  assert(posCancelled.position === 0, 'Cancelled token is excluded from active queue advancement');

  // --- Test 3: Non-Arithmetic Progression Guarantee ---
  assert(posStd1.position !== 1, 'Queue advancement is NOT based on token sequence number arithmetic');

  console.log(`\n🎉 Test Suite Completed: ${passed}/${total} assertions passed successfully!`);
}

runTests();
