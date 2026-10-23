import { Token, Service } from './types';

export interface WaitTimeEstimate {
  estimatedMinutes: number;
  minRangeMinutes: number;
  maxRangeMinutes: number;
  displayText: string;
  peopleAhead: number;
  activeCounters: number;
  modelType: 'historical_moving_average' | 'service_baseline_fallback';
}

/**
 * Calculates estimated wait time range based on eligible tokens ahead,
 * actual active counters, and moving average of completed services.
 */
export function calculateWaitTime(
  service: Service,
  peopleAhead: number,
  activeCounters: number = 1,
  recentCompletedTokens: Token[] = []
): WaitTimeEstimate {
  const safeCounters = Math.max(1, activeCounters);

  // 1. Calculate average service duration from recent completed tokens if available
  let avgDuration = service.avg_duration_minutes;
  let modelType: 'historical_moving_average' | 'service_baseline_fallback' = 'service_baseline_fallback';

  const validDurations = recentCompletedTokens
    .filter(t => t.serving_at && t.completed_at)
    .map(t => {
      const start = new Date(t.serving_at!).getTime();
      const end = new Date(t.completed_at!).getTime();
      return Math.max(1, Math.round((end - start) / (1000 * 60)));
    })
    .slice(-10); // last 10 completed consultations

  if (validDurations.length >= 3) {
    const sum = validDurations.reduce((acc, curr) => acc + curr, 0);
    avgDuration = Math.round((sum / validDurations.length) * 10) / 10;
    modelType = 'historical_moving_average';
  }

  // 2. Queue backlog calculation
  // Each counter processes one patient every (avgDuration + bufferTime) minutes
  const cycleTime = avgDuration + (service.buffer_time_minutes || 1);
  const queueBatches = Math.ceil(peopleAhead / safeCounters);
  const rawEstimate = Math.max(0, queueBatches * cycleTime);

  // 3. Create a realistic range (accounting for variability in human consultations)
  const varianceFactor = 0.25; // ±25%
  const minRange = Math.max(2, Math.round(rawEstimate * (1 - varianceFactor)));
  const maxRange = Math.max(minRange + 3, Math.round(rawEstimate * (1 + varianceFactor)));

  let displayText = '';
  if (peopleAhead === 0) {
    displayText = 'You are next! Please be ready.';
  } else if (rawEstimate <= 3) {
    displayText = 'Approximately 2 - 5 mins';
  } else {
    displayText = `${minRange} - ${maxRange} mins`;
  }

  return {
    estimatedMinutes: rawEstimate,
    minRangeMinutes: minRange,
    maxRangeMinutes: maxRange,
    displayText,
    peopleAhead,
    activeCounters: safeCounters,
    modelType
  };
}

/**
 * Determines exact eligible queue position.
 * Only tokens with status 'waiting' (ordered by priority desc, created_at asc) are eligible.
 */
export function getEligibleQueuePosition(
  tokens: Token[],
  targetTokenId: string
): { position: number; peopleAhead: number } {
  const targetToken = tokens.find(t => t.id === targetTokenId);
  if (!targetToken || targetToken.status !== 'waiting') {
    return { position: 0, peopleAhead: 0 };
  }

  const eligibleTokens = tokens
    .filter(t => t.status === 'waiting')
    .sort((a, b) => {
      // Emergency & senior priority first
      const priorityWeights: Record<string, number> = {
        emergency: 5,
        senior: 3,
        accessible: 3,
        vip: 2,
        standard: 1
      };
      const weightA = priorityWeights[a.priority] || 1;
      const weightB = priorityWeights[b.priority] || 1;

      if (weightA !== weightB) {
        return weightB - weightA; // higher weight first
      }

      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

  const index = eligibleTokens.findIndex(t => t.id === targetTokenId);
  if (index === -1) {
    return { position: 0, peopleAhead: 0 };
  }

  return {
    position: index + 1,
    peopleAhead: index
  };
}
