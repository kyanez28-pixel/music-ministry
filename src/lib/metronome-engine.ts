// ─── Web Audio Metronome Engine ───────────────────────────────────────────────

export class MetronomeEngine {
  private audioCtx: AudioContext | null = null;
  private nextBeatTime = 0;
  private currentBeat = 0;
  private schedulerTimer: ReturnType<typeof setTimeout> | null = null;
  private bpm = 120;
  private beatsPerMeasure = 4;
  private onBeat: ((beat: number) => void) | null = null;

  private getCtx(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioCtx;
  }

  private playClick(time: number, isAccent: boolean) {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (isAccent) {
      // Tiempo 1: tono más alto y fuerte
      osc.frequency.value = 1800;
      gain.gain.setValueAtTime(0.9, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      osc.start(time);
      osc.stop(time + 0.08);
    } else {
      // Tiempos 2,3,4: tono más bajo
      osc.frequency.value = 1000;
      gain.gain.setValueAtTime(0.5, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
      osc.start(time);
      osc.stop(time + 0.05);
    }
  }

  private schedule() {
    const ctx = this.getCtx();
    const scheduleAhead = 0.1; // segundos adelante a programar

    while (this.nextBeatTime < ctx.currentTime + scheduleAhead) {
      const isAccent = this.currentBeat === 0;
      this.playClick(this.nextBeatTime, isAccent);

      // Notificar UI del beat actual
      const beatToNotify = this.currentBeat;
      const timeUntilBeat = (this.nextBeatTime - ctx.currentTime) * 1000;
      setTimeout(() => {
        if (this.onBeat) this.onBeat(beatToNotify);
      }, Math.max(0, timeUntilBeat));

      this.nextBeatTime += 60.0 / this.bpm;
      this.currentBeat = (this.currentBeat + 1) % this.beatsPerMeasure;
    }

    this.schedulerTimer = setTimeout(() => this.schedule(), 25);
  }

  start(bpm: number, beatsPerMeasure: number, onBeat: (beat: number) => void) {
    const ctx = this.getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    this.bpm = bpm;
    this.beatsPerMeasure = beatsPerMeasure;
    this.onBeat = onBeat;
    this.currentBeat = 0;
    this.nextBeatTime = ctx.currentTime + 0.05;
    this.schedule();
  }

  stop() {
    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }
    this.currentBeat = 0;
    this.onBeat = null;
  }

  updateBpm(bpm: number) {
    this.bpm = bpm;
  }

  updateBeats(beatsPerMeasure: number) {
    this.beatsPerMeasure = beatsPerMeasure;
    this.currentBeat = 0;
  }
}
