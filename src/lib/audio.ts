/**
 * Web Audio API synthesizer for clean attention chime
 * and Web Speech API synthesizer for crystal-clear vocal queue announcements.
 */

class AudioQueueAnnouncer {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Plays a pleasant airport/hospital style two-tone chime (F5 -> A5)
   */
  public playChime(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isMuted || typeof window === 'undefined') {
        resolve();
        return;
      }

      try {
        const ctx = this.getAudioContext();
        if (!ctx) {
          resolve();
          return;
        }

        const now = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = 'sine';
        osc2.type = 'sine';

        // Tone 1: 698.46 Hz (F5), Tone 2: 880.00 Hz (A5)
        osc1.frequency.setValueAtTime(698.46, now);
        osc2.frequency.setValueAtTime(880.00, now + 0.18);

        gainNode.gain.setValueAtTime(0.001, now);
        gainNode.gain.exponentialRampToValueAtTime(0.3, now + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.2);

        osc2.start(now + 0.18);
        osc2.stop(now + 0.6);

        setTimeout(() => resolve(), 600);
      } catch (e) {
        console.warn('Audio chime error:', e);
        resolve();
      }
    });
  }

  /**
   * Vocal announcement of token call
   * e.g. "Token O-P-D 0 2 2, please proceed to Counter 2"
   */
  public announceToken(tokenNumber: string, counterName: string): Promise<void> {
    return new Promise(async (resolve) => {
      if (this.isMuted || typeof window === 'undefined') {
        resolve();
        return;
      }

      // First play chime
      await this.playChime();

      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }

      try {
        // Spell out prefix letters for clarity: OPD-025 -> "O P D 0 2 5"
        const formattedToken = tokenNumber.replace(/[-_]/g, ' ').split('').join(' ');
        const speechText = `Token ${formattedToken}. Please proceed to ${counterName}.`;

        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.rate = 0.92; // Slightly measured, clear cadence
        utterance.pitch = 1.05;
        utterance.lang = 'en-US';

        utterance.onend = () => resolve();
        utterance.onerror = () => resolve();

        // Cancel previous if stuck
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis error:', e);
        resolve();
      }
    });
  }
}

export const audioAnnouncer = new AudioQueueAnnouncer();
