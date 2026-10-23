import { SmartNotification, NotificationStage, Token } from './types';

// Track already triggered notifications to prevent duplicate alerts
const dispatchedNotificationKeys = new Set<string>();

/**
 * Requests browser push notification permission if available
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

/**
 * Dispatches a smart turn-approach notification
 */
export function dispatchTurnNotification(
  token: Token,
  stage: NotificationStage,
  extra?: { counterName?: string; peopleAhead?: number }
): SmartNotification | null {
  const dedupKey = `${token.id}_${stage}`;
  if (dispatchedNotificationKeys.has(dedupKey)) {
    return null; // Already sent for this stage!
  }

  // Do not send approach alerts if token is cancelled, completed, or skipped
  if (['cancelled', 'completed', 'skipped', 'no_show'].includes(token.status)) {
    return null;
  }

  let title = '';
  let message = '';

  switch (stage) {
    case 'stage_1_two_ahead':
      title = '⏳ Your turn is approaching';
      message = `Q-Sync: Only ${extra?.peopleAhead ?? 2} patient(s) ahead of you for ${token.service_name || 'your consultation'}. Please stay nearby.`;
      break;
    case 'stage_2_next_in_line':
      title = '⚡ You are next in line!';
      message = `Q-Sync: Token ${token.display_number}, you are next! Please return to the waiting area or approach the designated counter.`;
      break;
    case 'stage_3_called':
      title = '🔔 Token Called Now!';
      const counter = extra?.counterName || token.counter_name || 'Assigned Counter';
      message = `Q-Sync: Token ${token.display_number} is now called! Please proceed immediately to ${counter}.`;
      break;
  }

  dispatchedNotificationKeys.add(dedupKey);

  const notification: SmartNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    token_id: token.id,
    ref_code: token.ref_code,
    display_number: token.display_number,
    stage,
    title,
    message,
    counter_name: extra?.counterName || token.counter_name,
    service_name: token.service_name,
    channel: 'in_app',
    status: 'delivered',
    read: false,
    created_at: new Date().toISOString()
  };

  // Trigger Native Browser Notification if permitted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: message,
        icon: '/favicon.ico',
        tag: dedupKey,
        requireInteraction: stage === 'stage_3_called'
      });
      
      // Haptic feedback on mobile devices
      if ('vibrate' in navigator) {
        if (stage === 'stage_3_called') {
          navigator.vibrate([200, 100, 200, 100, 300]);
        } else {
          navigator.vibrate(200);
        }
      }
    } catch (e) {
      console.warn('Browser notification trigger failed:', e);
    }
  }

  // Trigger optional transactional email via API route if email is present
  if (token.customer_email && typeof window !== 'undefined') {
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: token.customer_email,
        title,
        message,
        stage,
        tokenNumber: token.display_number,
        refCode: token.ref_code
      })
    }).catch(err => {
      // Non-blocking
      console.log('Optional email notification log:', err);
    });
  }

  return notification;
}
