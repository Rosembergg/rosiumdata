export type EventHandler = (...args: unknown[]) => void

export class EventEmitter {
  private listeners = new Map<string, EventHandler[]>()

  on(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event)
    if (handlers) {
      handlers.push(handler)
    } else {
      this.listeners.set(event, [handler])
    }
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.listeners.get(event)
    if (!handlers) return
    const index = handlers.indexOf(handler)
    if (index !== -1) {
      handlers.splice(index, 1)
    }
  }

  emit(event: string, ...args: unknown[]): void {
    const handlers = this.listeners.get(event)
    if (!handlers) return
    for (const handler of handlers) {
      handler(...args)
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }
}
