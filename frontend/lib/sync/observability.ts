interface TelemetryEntry {
  event: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

interface TimingMark {
  label: string;
  time: number;
}

class ObservabilityService {
  private entries: TelemetryEntry[] = [];
  private marks: Map<string, TimingMark[]> = new Map();
  private maxEntries = 500;

  track(event: string, duration: number, metadata?: Record<string, unknown>): void {
    this.entries.push({ event, duration, timestamp: Date.now(), metadata });
    if (this.entries.length > this.maxEntries) this.entries.shift();
  }

  startMark(key: string): void {
    if (!this.marks.has(key)) this.marks.set(key, []);
    this.marks.get(key)!.push({ label: 'start', time: performance.now() });
  }

  endMark(key: string, label?: string): void {
    const marks = this.marks.get(key);
    if (!marks || marks.length === 0) return;
    const start = marks[marks.length - 1];
    if (start.label !== 'start') return;
    const duration = performance.now() - start.time;
    this.track(key, duration, label ? { label } : undefined);
    marks.push({ label: label || 'end', time: performance.now() });
  }

  getEntries(event?: string): TelemetryEntry[] {
    if (event) return this.entries.filter((e) => e.event === event);
    return [...this.entries];
  }

  getStats(event: string): { count: number; avgMs: number; maxMs: number; minMs: number } | null {
    const filtered = this.entries.filter((e) => e.event === event);
    if (filtered.length === 0) return null;
    const durations = filtered.map((e) => e.duration);
    return {
      count: filtered.length,
      avgMs: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      maxMs: Math.max(...durations),
      minMs: Math.min(...durations),
    };
  }

  getSummary(): Record<string, { count: number; avgMs: number }> {
    const grouped: Record<string, number[]> = {};
    for (const entry of this.entries) {
      if (!grouped[entry.event]) grouped[entry.event] = [];
      grouped[entry.event].push(entry.duration);
    }
    const result: Record<string, { count: number; avgMs: number }> = {};
    for (const [event, durations] of Object.entries(grouped)) {
      result[event] = {
        count: durations.length,
        avgMs: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      };
    }
    return result;
  }

  clear(): void {
    this.entries = [];
    this.marks.clear();
  }
}

export const observability = new ObservabilityService();
