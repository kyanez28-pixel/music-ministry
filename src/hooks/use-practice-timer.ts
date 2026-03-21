import { useState, useRef, useEffect, useCallback } from 'react';

const TIMER_STORAGE_KEY = 'practice-timer';

export interface TimerState {
  startedAt: number | null;
  accumulatedMs: number;
  running: boolean;
}

function loadTimerState(): TimerState {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { startedAt: null, accumulatedMs: 0, running: false };
}

function saveTimerState(state: TimerState) {
  localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
}

function getElapsedSeconds(state: TimerState): number {
  let ms = state.accumulatedMs;
  if (state.running && state.startedAt) {
    ms += Date.now() - state.startedAt;
  }
  return Math.floor(ms / 1000);
}

export function formatTimer(s: number) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

export function usePracticeTimer() {
  const [timerState, setTimerState] = useState<TimerState>(loadTimerState);
  const [displaySeconds, setDisplaySeconds] = useState(() => getElapsedSeconds(loadTimerState()));
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerStateRef = useRef(timerState);

  // Keep ref in sync
  useEffect(() => {
    timerStateRef.current = timerState;
  }, [timerState]);

  // Persist to localStorage
  useEffect(() => {
    saveTimerState(timerState);
  }, [timerState]);

  // Poll localStorage to sync across components (same tab)
  useEffect(() => {
    const syncInterval = setInterval(() => {
      const stored = loadTimerState();
      const current = timerStateRef.current;
      if (
        stored.running !== current.running ||
        stored.startedAt !== current.startedAt ||
        stored.accumulatedMs !== current.accumulatedMs
      ) {
        setTimerState(stored);
      }
    }, 500);
    return () => clearInterval(syncInterval);
  }, []);

  // Update display every second
  useEffect(() => {
    const tick = () => setDisplaySeconds(getElapsedSeconds(timerStateRef.current));
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // Also update display when timerState changes
  useEffect(() => {
    setDisplaySeconds(getElapsedSeconds(timerState));
  }, [timerState]);

  const startTimer = useCallback(() => {
    setTimerState(prev => {
      if (!prev.running) {
        const next = { ...prev, startedAt: Date.now(), running: true };
        saveTimerState(next);
        return next;
      }
      return prev;
    });
  }, []);

  const pauseTimer = useCallback(() => {
    setTimerState(prev => {
      if (prev.running) {
        const elapsed = prev.startedAt ? Date.now() - prev.startedAt : 0;
        const next: TimerState = { accumulatedMs: prev.accumulatedMs + elapsed, startedAt: null, running: false };
        saveTimerState(next);
        return next;
      }
      return prev;
    });
  }, []);

  const resetTimer = useCallback(() => {
    const reset: TimerState = { startedAt: null, accumulatedMs: 0, running: false };
    setTimerState(reset);
    saveTimerState(reset);
    setDisplaySeconds(0);
  }, []);

  const toggleTimer = useCallback(() => {
    setTimerState(prev => {
      if (prev.running) {
        const elapsed = prev.startedAt ? Date.now() - prev.startedAt : 0;
        const next: TimerState = { accumulatedMs: prev.accumulatedMs + elapsed, startedAt: null, running: false };
        saveTimerState(next);
        return next;
      }
      const next = { ...prev, startedAt: Date.now(), running: true };
      saveTimerState(next);
      return next;
    });
  }, []);

  return {
    seconds: displaySeconds,
    running: timerState.running,
    startTimer,
    pauseTimer,
    resetTimer,
    toggleTimer,
  };
}
