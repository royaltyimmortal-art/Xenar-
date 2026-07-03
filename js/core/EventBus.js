/**
 * EventBus.js - Task 1.1
 * Centralized event system for decoupled communication between game systems
 * Supports event listeners, removal, and priority-based execution
 * =====================================================================
 */

class EventBus {
  constructor() {
    this.listeners = new Map();
    this.eventQueue = [];
    this.eventHistory = [];
    this.maxHistory = 1000;
    this.debug = false;
  }

  /**
   * Register an event listener
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Function to execute
   * @param {number} priority - Higher = executed first (default 0)
   * @returns {Function} Unsubscribe function
   */
  on(eventName, callback, priority = 0) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    const listener = { callback, priority, id: Math.random() };
    this.listeners.get(eventName).push(listener);
    
    this.listeners.get(eventName).sort((a, b) => b.priority - a.priority);

    if (this.debug) console.log(`[EventBus] Listener added: ${eventName} (priority: ${priority})`);

    return () => this.off(eventName, callback);
  }

  /**
   * Register one-time listener
   */
  once(eventName, callback, priority = 0) {
    const wrapper = (data) => {
      callback(data);
      this.off(eventName, wrapper);
    };
    this.on(eventName, wrapper, priority);
  }

  /**
   * Remove an event listener
   */
  off(eventName, callback) {
    if (!this.listeners.has(eventName)) return;
    
    const listeners = this.listeners.get(eventName);
    const index = listeners.findIndex(l => l.callback === callback);
    
    if (index !== -1) {
      listeners.splice(index, 1);
      if (this.debug) console.log(`[EventBus] Listener removed: ${eventName}`);
    }

    if (listeners.length === 0) {
      this.listeners.delete(eventName);
    }
  }

  /**
   * Emit an event (synchronous)
   */
  emit(eventName, data = null) {
    if (!this.listeners.has(eventName)) return;

    this._recordEvent(eventName, data);
    const listeners = this.listeners.get(eventName);
    for (const listener of listeners) {
      try {
        listener.callback(data);
      } catch (error) {
        console.error(`[EventBus] Error in '${eventName}':`, error);
      }
    }
  }

  /**
   * Queue an event for deferred processing
   */
  emitQueued(eventName, data = null, delay = 0) {
    const timestamp = performance.now() + delay;
    this.eventQueue.push({ eventName, data, timestamp });
  }

  /**
   * Process queued events (call from main loop)
   */
  processQueue(currentTime = performance.now()) {
    while (this.eventQueue.length > 0 && this.eventQueue[0].timestamp <= currentTime) {
      const { eventName, data } = this.eventQueue.shift();
      this.emit(eventName, data);
    }
  }

  /**
   * Remove all listeners
   */
  clear(eventName) {
    if (eventName) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.clear();
      this.eventQueue = [];
    }
  }

  /**
   * Get listener count
   */
  getListenerCount(eventName) {
    if (eventName) {
      return this.listeners.get(eventName)?.length || 0;
    }
    let total = 0;
    for (const listeners of this.listeners.values()) {
      total += listeners.length;
    }
    return total;
  }

  /**
   * Record event for debugging
   */
  _recordEvent(eventName, data) {
    this.eventHistory.push({
      event: eventName,
      timestamp: performance.now(),
      data
    });
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.shift();
    }
  }

  /**
   * Get event history
   */
  getHistory(eventName = null) {
    if (eventName) {
      return this.eventHistory.filter(e => e.event === eventName);
    }
    return this.eventHistory;
  }
}

// Singleton
const eventBus = new EventBus();
