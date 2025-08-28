type Listener<T extends any[] = any[]> = (...args: T) => void;

export class Emitter<Events extends Record<string, any[]>> {
  private listeners: { [K in keyof Events]?: Listener<Events[K]>[] } = {};

  on<K extends keyof Events>(event: K, fn: Listener<Events[K]>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(fn);
    return () => this.off(event, fn);
  }

  off<K extends keyof Events>(event: K, fn: Listener<Events[K]>) {
    this.listeners[event] = (this.listeners[event] || []).filter(
      (l) => l !== fn,
    );
  }

  emit<K extends keyof Events>(event: K, ...args: Events[K]) {
    (this.listeners[event] || []).forEach((fn) => fn(...args));
  }
}
