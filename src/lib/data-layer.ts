import { 
  Token, 
  Service, 
  ServiceCounter, 
  Organization, 
  ServiceLocation, 
  Department, 
  TokenStatus, 
  PriorityCategory, 
  QueueState, 
  AuditLogEntry, 
  ServiceFeedback,
  QueueHealthRecommendation
} from './types';
import { 
  SEED_ORGANIZATIONS, 
  SEED_LOCATIONS, 
  SEED_DEPARTMENTS, 
  SEED_SERVICES, 
  SEED_COUNTERS, 
  SEED_TOKENS, 
  SEED_AUDIT_LOGS 
} from './seed-data';
import { calculateWaitTime, getEligibleQueuePosition } from './wait-time';
import { dispatchTurnNotification } from './notifications';
import { isSupabaseConfigured, supabase } from './supabase/client';

const STORAGE_KEY_TOKENS = 'qsync_tokens_v1';
const STORAGE_KEY_COUNTERS = 'qsync_counters_v1';
const STORAGE_KEY_SERVICES = 'qsync_services_v1';
const STORAGE_KEY_AUDIT = 'qsync_audit_v1';
const STORAGE_KEY_FEEDBACK = 'qsync_feedback_v1';
const STORAGE_KEY_PAUSED = 'qsync_paused_v1';

class DataLayer {
  private broadcastChannel: BroadcastChannel | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('qsync_live_channel');
        this.broadcastChannel.onmessage = () => {
          this.notifySubscribers();
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported', e);
      }

      window.addEventListener('storage', () => {
        this.notifySubscribers();
      });

      this.initializeDefaults();
    }
  }

  private notifySubscribers() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error(e);
      }
    });
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  private emitChange() {
    this.notifySubscribers();
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({ type: 'SYNC_UPDATE', timestamp: Date.now() });
    }
  }

  private initializeDefaults() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(STORAGE_KEY_TOKENS)) {
      localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(SEED_TOKENS));
    }
    if (!localStorage.getItem(STORAGE_KEY_COUNTERS)) {
      localStorage.setItem(STORAGE_KEY_COUNTERS, JSON.stringify(SEED_COUNTERS));
    }
    if (!localStorage.getItem(STORAGE_KEY_SERVICES)) {
      localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(SEED_SERVICES));
    }
    if (!localStorage.getItem(STORAGE_KEY_AUDIT)) {
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(SEED_AUDIT_LOGS));
    }
    if (!localStorage.getItem(STORAGE_KEY_FEEDBACK)) {
      localStorage.setItem(STORAGE_KEY_FEEDBACK, JSON.stringify([]));
    }
  }

  // --- Read operations ---

  public getOrganizations(): Organization[] {
    return SEED_ORGANIZATIONS;
  }

  public getLocations(): ServiceLocation[] {
    return SEED_LOCATIONS;
  }

  public getDepartments(locationId?: string): Department[] {
    if (!locationId) return SEED_DEPARTMENTS;
    return SEED_DEPARTMENTS.filter(d => d.location_id === locationId);
  }

  public getServices(departmentId?: string): Service[] {
    if (typeof window === 'undefined') return SEED_SERVICES;
    try {
      const data = localStorage.getItem(STORAGE_KEY_SERVICES);
      const services: Service[] = data ? JSON.parse(data) : SEED_SERVICES;
      if (departmentId) {
        return services.filter(s => s.department_id === departmentId);
      }
      return services;
    } catch {
      return SEED_SERVICES;
    }
  }

  public getCounters(locationId?: string): ServiceCounter[] {
    if (typeof window === 'undefined') return SEED_COUNTERS;
    try {
      const data = localStorage.getItem(STORAGE_KEY_COUNTERS);
      const counters: ServiceCounter[] = data ? JSON.parse(data) : SEED_COUNTERS;
      if (locationId) {
        return counters.filter(c => c.location_id === locationId);
      }
      return counters;
    } catch {
      return SEED_COUNTERS;
    }
  }

  public getTokens(serviceId?: string): Token[] {
    if (typeof window === 'undefined') return SEED_TOKENS;
    try {
      const data = localStorage.getItem(STORAGE_KEY_TOKENS);
      const tokens: Token[] = data ? JSON.parse(data) : SEED_TOKENS;
      if (serviceId) {
        return tokens.filter(t => t.service_id === serviceId);
      }
      return tokens;
    } catch {
      return SEED_TOKENS;
    }
  }

  public getTokenByRef(refCode: string): Token | null {
    const tokens = this.getTokens();
    const token = tokens.find(t => t.ref_code.toUpperCase() === refCode.trim().toUpperCase());
    if (!token) return null;

    // Attach dynamic real-time queue position
    const serviceTokens = tokens.filter(t => t.service_id === token.service_id);
    const { position, peopleAhead } = getEligibleQueuePosition(serviceTokens, token.id);
    const service = this.getServices().find(s => s.id === token.service_id);
    const counters = this.getCounters().filter(c => c.compatible_service_ids.includes(token.service_id) && c.status !== 'offline');
    
    const waitEstimate = service 
      ? calculateWaitTime(service, peopleAhead, counters.length || 1, serviceTokens.filter(t => t.status === 'completed'))
      : null;

    return {
      ...token,
      position_in_queue: position,
      people_ahead: peopleAhead,
      estimated_wait_minutes: waitEstimate ? waitEstimate.estimatedMinutes : 10
    };
  }

  public getAuditLogs(): AuditLogEntry[] {
    if (typeof window === 'undefined') return SEED_AUDIT_LOGS;
    try {
      const data = localStorage.getItem(STORAGE_KEY_AUDIT);
      return data ? JSON.parse(data) : SEED_AUDIT_LOGS;
    } catch {
      return SEED_AUDIT_LOGS;
    }
  }

  public getFeedback(): ServiceFeedback[] {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY_FEEDBACK);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public isQueuePaused(serviceId: string): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const pausedMap = JSON.parse(localStorage.getItem(STORAGE_KEY_PAUSED) || '{}');
      return Boolean(pausedMap[serviceId]);
    } catch {
      return false;
    }
  }

  public toggleQueuePause(serviceId: string, reason?: string): boolean {
    if (typeof window === 'undefined') return false;
    const pausedMap = JSON.parse(localStorage.getItem(STORAGE_KEY_PAUSED) || '{}');
    const newState = !pausedMap[serviceId];
    pausedMap[serviceId] = newState;
    localStorage.setItem(STORAGE_KEY_PAUSED, JSON.stringify(pausedMap));

    this.logAudit({
      actor_name: 'Controller / Reception',
      actor_role: 'controller',
      action: newState ? 'QUEUE_PAUSED' : 'QUEUE_RESUMED',
      target_type: 'queue',
      target_id: serviceId,
      description: newState ? `Queue temporarily paused: ${reason || 'General break'}` : 'Queue resumed calling',
      reason
    });

    this.emitChange();
    return newState;
  }

  // --- Queue State & Health ---

  public getQueueState(serviceId: string): QueueState {
    const service = this.getServices().find(s => s.id === serviceId) || SEED_SERVICES[0];
    const allTokens = this.getTokens(serviceId);
    const counters = this.getCounters().filter(c => c.compatible_service_ids.includes(serviceId) && c.status !== 'offline');
    const waitingTokens = allTokens.filter(t => t.status === 'waiting');
    const servingToken = allTokens.find(t => t.status === 'serving' && t.service_id === serviceId);
    
    // Sort waiting tokens by priority desc, created_at asc
    const nextEligible = [...waitingTokens].sort((a, b) => {
      const pWeights: Record<string, number> = { emergency: 5, senior: 3, accessible: 3, vip: 2, standard: 1 };
      const wDiff = (pWeights[b.priority] || 1) - (pWeights[a.priority] || 1);
      if (wDiff !== 0) return wDiff;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    })[0];

    const recentlyCalled = allTokens
      .filter(t => t.status === 'called' || t.status === 'serving')
      .sort((a, b) => new Date(b.called_at || b.created_at).getTime() - new Date(a.called_at || a.created_at).getTime())
      .slice(0, 5);

    const waitEstimate = calculateWaitTime(
      service, 
      waitingTokens.length, 
      counters.length || 1, 
      allTokens.filter(t => t.status === 'completed')
    );

    // Compute load level
    let loadLevel: 'low' | 'moderate' | 'busy' | 'congested' = 'low';
    if (waitingTokens.length > 15) {
      loadLevel = 'congested';
    } else if (waitingTokens.length > 8) {
      loadLevel = 'busy';
    } else if (waitingTokens.length > 3) {
      loadLevel = 'moderate';
    }

    return {
      service_id: service.id,
      service_name: service.name,
      is_paused: this.isQueuePaused(service.id),
      total_issued_today: allTokens.length,
      currently_waiting: waitingTokens.length,
      currently_serving: servingToken,
      recently_called: recentlyCalled,
      next_eligible_token: nextEligible,
      average_wait_minutes: waitEstimate.estimatedMinutes,
      active_counters: counters.length,
      load_level: loadLevel
    };
  }

  public getHealthRecommendations(): QueueHealthRecommendation[] {
    const services = this.getServices();
    const recommendations: QueueHealthRecommendation[] = [];

    services.forEach(srv => {
      const qState = this.getQueueState(srv.id);
      if (qState.load_level === 'congested') {
        recommendations.push({
          id: `rec-cong-${srv.id}`,
          level: 'alert',
          title: `High Congestion in ${srv.name}`,
          message: `${qState.currently_waiting} patients are waiting with an estimated wait of ${qState.average_wait_minutes} mins.`,
          suggested_action: 'Open an additional compatible counter or assign float staff.',
          service_id: srv.id
        });
      } else if (qState.load_level === 'busy' && qState.active_counters <= 1) {
        recommendations.push({
          id: `rec-busy-${srv.id}`,
          level: 'warning',
          title: `Single Counter Bottleneck: ${srv.name}`,
          message: `Only 1 counter is active while ${qState.currently_waiting} patients wait.`,
          suggested_action: 'Activate Counter 2 to reduce wait time by ~50%.',
          service_id: srv.id
        });
      }
    });

    return recommendations;
  }

  // --- Core Mutations ---

  public issueToken(params: {
    serviceId: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    priority?: PriorityCategory;
    notes?: string;
  }): Token {
    const services = this.getServices();
    const service = services.find(s => s.id === params.serviceId) || services[0];
    const tokens = this.getTokens();

    const todayDate = new Date().toISOString().split('T')[0];
    const serviceTodayTokens = tokens.filter(t => t.service_id === service.id && t.business_date === todayDate);
    const nextSeq = serviceTodayTokens.length + 1;

    // Concurrency-safe prefix format
    const prefix = service.code_prefix || 'Q';
    const displayNumber = `${prefix}-${String(nextSeq).padStart(3, '0')}`;
    
    // Non-guessable alphanumeric 6-char public reference code
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const refCode = `QS-${randomHex}`;

    const department = this.getDepartments().find(d => d.id === service.department_id);
    const location = this.getLocations().find(l => l.id === department?.location_id);

    const newToken: Token = {
      id: `tok-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ref_code: refCode,
      display_number: displayNumber,
      organization_id: location?.organization_id || 'org-metro-health',
      location_id: location?.id || 'loc-main-hospital',
      department_id: department?.id || 'dept-opd',
      service_id: service.id,
      service_name: service.name,
      department_name: department?.name,
      business_date: todayDate,
      sequence_number: nextSeq,
      customer_name: params.customerName?.trim() || 'Visitor',
      customer_phone: params.customerPhone?.trim(),
      customer_email: params.customerEmail?.trim(),
      status: 'waiting',
      priority: params.priority || 'standard',
      created_at: new Date().toISOString(),
      call_count: 0,
      notes: params.notes
    };

    const updatedTokens = [...tokens, newToken];
    localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(updatedTokens));

    // Save token to customer's personal recent tokens history
    this.saveToCustomerHistory(newToken);

    this.logAudit({
      actor_name: params.customerName || 'Customer Portal',
      actor_role: 'customer',
      action: 'TOKEN_ISSUED',
      target_type: 'token',
      target_id: newToken.id,
      description: `Issued token ${newToken.display_number} (${newToken.priority.toUpperCase()}) for ${service.name}`
    });

    this.emitChange();
    return newToken;
  }

  public callNextToken(params: {
    serviceId: string;
    counterId: string;
    staffId?: string;
    staffName?: string;
  }): { success: boolean; token?: Token; message?: string } {
    const tokens = this.getTokens();
    const counters = this.getCounters();
    const counter = counters.find(c => c.id === params.counterId);

    // Filter waiting tokens for this service
    const waitingTokens = tokens.filter(t => t.service_id === params.serviceId && t.status === 'waiting');

    if (waitingTokens.length === 0) {
      return { success: false, message: 'No waiting tokens remaining in this queue.' };
    }

    // Sort by priority desc, created_at asc
    const sorted = [...waitingTokens].sort((a, b) => {
      const pWeights: Record<string, number> = { emergency: 5, senior: 3, accessible: 3, vip: 2, standard: 1 };
      const wDiff = (pWeights[b.priority] || 1) - (pWeights[a.priority] || 1);
      if (wDiff !== 0) return wDiff;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    const calledToken = sorted[0];
    const now = new Date().toISOString();

    const updatedTokens = tokens.map(t => {
      if (t.id === calledToken.id) {
        return {
          ...t,
          status: 'called' as TokenStatus,
          called_at: now,
          counter_id: params.counterId,
          counter_name: counter?.name || 'Counter',
          called_by_staff_id: params.staffId,
          called_by_staff_name: params.staffName || 'Staff Member',
          call_count: (t.call_count || 0) + 1
        };
      }
      return t;
    });

    // Update counter status to busy
    const updatedCounters = counters.map(c => {
      if (c.id === params.counterId) {
        return { ...c, status: 'busy' as const };
      }
      return c;
    });

    localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(updatedTokens));
    localStorage.setItem(STORAGE_KEY_COUNTERS, JSON.stringify(updatedCounters));

    // Send Stage 3 Notification to called patient!
    const targetToken = updatedTokens.find(t => t.id === calledToken.id)!;
    dispatchTurnNotification(targetToken, 'stage_3_called', { counterName: counter?.name });

    // Calculate smart turn approach notifications for remaining waiting queue
    this.evaluateTurnApproachNotifications(updatedTokens, params.serviceId);

    this.logAudit({
      actor_name: params.staffName || 'Queue Controller',
      actor_role: 'controller',
      action: 'CALL_NEXT',
      target_type: 'token',
      target_id: calledToken.id,
      description: `Called ${calledToken.display_number} to ${counter?.name || 'Counter'}`
    });

    this.emitChange();
    return { success: true, token: targetToken };
  }

  public startServingToken(tokenId: string, staffName?: string): Token | null {
    const tokens = this.getTokens();
    const token = tokens.find(t => t.id === tokenId);
    if (!token || token.status !== 'called') return null;

    const updatedTokens = tokens.map(t => {
      if (t.id === tokenId) {
        return {
          ...t,
          status: 'serving' as TokenStatus,
          serving_at: new Date().toISOString()
        };
      }
      return t;
    });

    localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(updatedTokens));

    this.logAudit({
      actor_name: staffName || 'Queue Controller',
      actor_role: 'controller',
      action: 'START_SERVING',
      target_type: 'token',
      target_id: tokenId,
      description: `Started consultation for token ${token.display_number}`
    });

    this.emitChange();
    return updatedTokens.find(t => t.id === tokenId) || null;
  }

  public completeToken(tokenId: string, counterId?: string, staffName?: string): Token | null {
    const tokens = this.getTokens();
    const token = tokens.find(t => t.id === tokenId);
    if (!token) return null;

    const updatedTokens = tokens.map(t => {
      if (t.id === tokenId) {
        return {
          ...t,
          status: 'completed' as TokenStatus,
          completed_at: new Date().toISOString()
        };
      }
      return t;
    });

    // Set counter available
    if (counterId) {
      const counters = this.getCounters();
      const updatedCounters = counters.map(c => {
        if (c.id === counterId) return { ...c, status: 'available' as const };
        return c;
      });
      localStorage.setItem(STORAGE_KEY_COUNTERS, JSON.stringify(updatedCounters));
    }

    localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(updatedTokens));

    this.logAudit({
      actor_name: staffName || 'Queue Controller',
      actor_role: 'controller',
      action: 'COMPLETE_TOKEN',
      target_type: 'token',
      target_id: tokenId,
      description: `Completed service for token ${token.display_number}`
    });

    this.emitChange();
    return updatedTokens.find(t => t.id === tokenId) || null;
  }

  public completeAndCallNext(params: {
    currentTokenId?: string;
    serviceId: string;
    counterId: string;
    staffId?: string;
    staffName?: string;
  }): { completedToken?: Token | null; nextTokenResult: { success: boolean; token?: Token; message?: string } } {
    let completedToken: Token | null = null;
    if (params.currentTokenId) {
      completedToken = this.completeToken(params.currentTokenId, params.counterId, params.staffName);
    }

    const nextTokenResult = this.callNextToken({
      serviceId: params.serviceId,
      counterId: params.counterId,
      staffId: params.staffId,
      staffName: params.staffName
    });

    return { completedToken, nextTokenResult };
  }

  public recallToken(tokenId: string, staffName?: string): Token | null {
    const tokens = this.getTokens();
    const token = tokens.find(t => t.id === tokenId);
    if (!token) return null;

    const updatedTokens = tokens.map(t => {
      if (t.id === tokenId) {
        return {
          ...t,
          called_at: new Date().toISOString(),
          call_count: (t.call_count || 0) + 1
        };
      }
      return t;
    });

    localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(updatedTokens));

    // Re-dispatch notification
    dispatchTurnNotification(token, 'stage_3_called', { counterName: token.counter_name });

    this.logAudit({
      actor_name: staffName || 'Queue Controller',
      actor_role: 'controller',
      action: 'RECALL_TOKEN',
      target_type: 'token',
      target_id: tokenId,
      description: `Repeated announcement for token ${token.display_number} (Call #${(token.call_count || 0) + 1})`
    });

    this.emitChange();
    return updatedTokens.find(t => t.id === tokenId) || null;
  }

  public skipToken(tokenId: string, reason: string, staffName?: string): Token | null {
    const tokens = this.getTokens();
    const token = tokens.find(t => t.id === tokenId);
    if (!token) return null;

    const updatedTokens = tokens.map(t => {
      if (t.id === tokenId) {
        return {
          ...t,
          status: 'skipped' as TokenStatus,
          skipped_at: new Date().toISOString(),
          skip_reason: reason
        };
      }
      return t;
    });

    localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(updatedTokens));

    this.logAudit({
      actor_name: staffName || 'Queue Controller',
      actor_role: 'controller',
      action: 'SKIP_TOKEN',
      target_type: 'token',
      target_id: tokenId,
      description: `Marked token ${token.display_number} as skipped. Reason: ${reason}`,
      reason
    });

    this.emitChange();
    return updatedTokens.find(t => t.id === tokenId) || null;
  }

  public cancelToken(tokenId: string, reason?: string): boolean {
    const tokens = this.getTokens();
    const token = tokens.find(t => t.id === tokenId);
    if (!token || ['completed', 'cancelled'].includes(token.status)) return false;

    const updatedTokens = tokens.map(t => {
      if (t.id === tokenId) {
        return {
          ...t,
          status: 'cancelled' as TokenStatus,
          cancelled_at: new Date().toISOString()
        };
      }
      return t;
    });

    localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(updatedTokens));

    this.logAudit({
      actor_name: token.customer_name || 'Customer',
      actor_role: 'customer',
      action: 'CANCEL_TOKEN',
      target_type: 'token',
      target_id: tokenId,
      description: `Token ${token.display_number} was cancelled by customer. Reason: ${reason || 'User cancelled'}`
    });

    this.emitChange();
    return true;
  }

  public transferToken(tokenId: string, targetServiceId: string, staffName?: string, reason?: string): Token | null {
    const tokens = this.getTokens();
    const token = tokens.find(t => t.id === tokenId);
    const targetService = this.getServices().find(s => s.id === targetServiceId);
    if (!token || !targetService) return null;

    const updatedTokens = tokens.map(t => {
      if (t.id === tokenId) {
        return {
          ...t,
          service_id: targetService.id,
          service_name: targetService.name,
          status: 'waiting' as TokenStatus,
          counter_id: undefined,
          counter_name: undefined,
          notes: `${t.notes || ''} [Transferred to ${targetService.name}: ${reason || 'Staff reassigned'}]`
        };
      }
      return t;
    });

    localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(updatedTokens));

    this.logAudit({
      actor_name: staffName || 'Queue Controller',
      actor_role: 'controller',
      action: 'TRANSFER_TOKEN',
      target_type: 'token',
      target_id: tokenId,
      description: `Transferred token ${token.display_number} to ${targetService.name}. Reason: ${reason || 'N/A'}`
    });

    this.emitChange();
    return updatedTokens.find(t => t.id === tokenId) || null;
  }

  public manualOverridePriority(tokenId: string, newPriority: PriorityCategory, staffName: string, reason: string): boolean {
    const tokens = this.getTokens();
    const token = tokens.find(t => t.id === tokenId);
    if (!token) return false;

    const updatedTokens = tokens.map(t => {
      if (t.id === tokenId) {
        return {
          ...t,
          priority: newPriority,
          notes: `${t.notes || ''} [Override to ${newPriority.toUpperCase()} by ${staffName}: ${reason}]`
        };
      }
      return t;
    });

    localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(updatedTokens));

    this.logAudit({
      actor_name: staffName,
      actor_role: 'controller',
      action: 'MANUAL_OVERRIDE_PRIORITY',
      target_type: 'token',
      target_id: tokenId,
      description: `Priority manually updated to ${newPriority.toUpperCase()} for token ${token.display_number}`,
      reason
    });

    this.emitChange();
    return true;
  }

  // --- Smart Approach Notifications Trigger ---

  private evaluateTurnApproachNotifications(tokens: Token[], serviceId: string) {
    const waitingTokens = tokens
      .filter(t => t.service_id === serviceId && t.status === 'waiting')
      .sort((a, b) => {
        const pWeights: Record<string, number> = { emergency: 5, senior: 3, accessible: 3, vip: 2, standard: 1 };
        const wDiff = (pWeights[b.priority] || 1) - (pWeights[a.priority] || 1);
        if (wDiff !== 0) return wDiff;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

    // Patient next in line (index 0)
    if (waitingTokens.length > 0) {
      dispatchTurnNotification(waitingTokens[0], 'stage_2_next_in_line', { peopleAhead: 0 });
    }

    // Patient 2 positions away (index 1 or 2)
    if (waitingTokens.length > 1) {
      dispatchTurnNotification(waitingTokens[1], 'stage_1_two_ahead', { peopleAhead: 1 });
    }
    if (waitingTokens.length > 2) {
      dispatchTurnNotification(waitingTokens[2], 'stage_1_two_ahead', { peopleAhead: 2 });
    }
  }

  // --- Customer History ---

  private saveToCustomerHistory(token: Token) {
    if (typeof window === 'undefined') return;
    try {
      const historyKey = 'qsync_customer_token_history';
      const existing: string[] = JSON.parse(localStorage.getItem(historyKey) || '[]');
      if (!existing.includes(token.ref_code)) {
        existing.unshift(token.ref_code);
        localStorage.setItem(historyKey, JSON.stringify(existing.slice(0, 10)));
      }
    } catch (e) {
      console.warn('Customer history storage error', e);
    }
  }

  public getCustomerTokenHistory(): Token[] {
    if (typeof window === 'undefined') return [];
    try {
      const historyKey = 'qsync_customer_token_history';
      const refCodes: string[] = JSON.parse(localStorage.getItem(historyKey) || '[]');
      const allTokens = this.getTokens();
      return refCodes
        .map(ref => allTokens.find(t => t.ref_code === ref))
        .filter((t): t is Token => Boolean(t));
    } catch {
      return [];
    }
  }

  // --- Feedback ---

  public submitFeedback(feedback: Omit<ServiceFeedback, 'id' | 'created_at'>): void {
    if (typeof window === 'undefined') return;
    const existing = this.getFeedback();
    const entry: ServiceFeedback = {
      ...feedback,
      id: `fb-${Date.now()}`,
      created_at: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY_FEEDBACK, JSON.stringify([entry, ...existing]));
    this.emitChange();
  }

  // --- Audit ---

  public logAudit(log: Omit<AuditLogEntry, 'id' | 'created_at'>): void {
    if (typeof window === 'undefined') return;
    const existing = this.getAuditLogs();
    const entry: AuditLogEntry = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify([entry, ...existing].slice(0, 200)));
  }

  // --- Reset to Fresh Seed State ---
  public resetToDefaultSeed(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(SEED_TOKENS));
    localStorage.setItem(STORAGE_KEY_COUNTERS, JSON.stringify(SEED_COUNTERS));
    localStorage.setItem(STORAGE_KEY_SERVICES, JSON.stringify(SEED_SERVICES));
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(SEED_AUDIT_LOGS));
    localStorage.setItem(STORAGE_KEY_FEEDBACK, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEY_PAUSED);
    this.emitChange();
  }
}

export const dataLayer = new DataLayer();
