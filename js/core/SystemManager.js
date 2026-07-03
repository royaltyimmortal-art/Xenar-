/**
 * SystemManager.js - Task 1.2
 * Orchestrates all game systems (Physics, AI, Weather, Audio, etc.)
 * Handles system lifecycle: initialize, update, render, shutdown
 * =====================================================================
 */

class System {
  constructor(name, priority = 0) {
    this.name = name;
    this.priority = priority;
    this.enabled = true;
    this.initialized = false;
  }

  async initialize() {
    this.initialized = true;
  }

  update(dt) {}
  
  render() {}
  
  shutdown() {
    this.initialized = false;
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }
}

class SystemManager {
  constructor() {
    this.systems = [];
    this.systemMap = new Map();
    this.initializationPromise = null;
    this.updateTime = 0;
    this.renderTime = 0;
    this.paused = false;
  }

  /**
   * Register a system
   * @param {System} system - System instance
   * @param {string} name - System name (optional, uses system.name)
   */
  registerSystem(system, name = null) {
    const systemName = name || system.name;
    
    if (this.systemMap.has(systemName)) {
      console.warn(`[SystemManager] System '${systemName}' already registered. Skipping.`);
      return;
    }

    this.systems.push(system);
    this.systemMap.set(systemName, system);
    
    // Sort by priority (higher = first)
    this.systems.sort((a, b) => b.priority - a.priority);
    
    console.log(`[SystemManager] System registered: ${systemName} (priority: ${system.priority})`);
  }

  /**
   * Get system by name
   */
  getSystem(name) {
    return this.systemMap.get(name);
  }

  /**
   * Remove system
   */
  removeSystem(name) {
    const system = this.systemMap.get(name);
    if (!system) return false;

    const index = this.systems.indexOf(system);
    if (index !== -1) {
      this.systems.splice(index, 1);
    }
    this.systemMap.delete(name);
    console.log(`[SystemManager] System removed: ${name}`);
    return true;
  }

  /**
   * Initialize all systems
   */
  async initialize() {
    console.log('[SystemManager] Initializing systems...');
    this.initializationPromise = (async () => {
      for (const system of this.systems) {
        try {
          console.log(`  → Initializing ${system.name}...`);
          await system.initialize();
        } catch (error) {
          console.error(`[SystemManager] Failed to initialize ${system.name}:`, error);
        }
      }
      console.log('[SystemManager] All systems initialized.');
    })();

    return this.initializationPromise;
  }

  /**
   * Update all systems
   * @param {number} dt - Delta time in seconds
   */
  update(dt) {
    if (this.paused) return;

    const startTime = performance.now();

    for (const system of this.systems) {
      if (system.enabled && system.initialized) {
        try {
          system.update(dt);
        } catch (error) {
          console.error(`[SystemManager] Error updating ${system.name}:`, error);
        }
      }
    }

    this.updateTime = performance.now() - startTime;
  }

  /**
   * Render all systems
   */
  render() {
    if (this.paused) return;

    const startTime = performance.now();

    for (const system of this.systems) {
      if (system.enabled && system.initialized && system.render) {
        try {
          system.render();
        } catch (error) {
          console.error(`[SystemManager] Error rendering ${system.name}:`, error);
        }
      }
    }

    this.renderTime = performance.now() - startTime;
  }

  /**
   * Shutdown all systems
   */
  async shutdown() {
    console.log('[SystemManager] Shutting down systems...');
    for (const system of [...this.systems].reverse()) {
      try {
        console.log(`  → Shutting down ${system.name}...`);
        await system.shutdown();
      } catch (error) {
        console.error(`[SystemManager] Error shutting down ${system.name}:`, error);
      }
    }
    console.log('[SystemManager] All systems shut down.');
  }

  /**
   * Pause all systems
   */
  pause() {
    this.paused = true;
    console.log('[SystemManager] Paused.');
    eventBus.emit('system:paused');
  }

  /**
   * Resume all systems
   */
  resume() {
    this.paused = false;
    console.log('[SystemManager] Resumed.');
    eventBus.emit('system:resumed');
  }

  /**
   * Enable/disable system
   */
  setSystemEnabled(name, enabled) {
    const system = this.systemMap.get(name);
    if (!system) return false;

    if (enabled) {
      system.enable();
    } else {
      system.disable();
    }
    return true;
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      systemCount: this.systems.length,
      updateTime: this.updateTime,
      renderTime: this.renderTime,
      totalTime: this.updateTime + this.renderTime,
      paused: this.paused,
      systems: this.systems.map(s => ({
        name: s.name,
        enabled: s.enabled,
        initialized: s.initialized,
        priority: s.priority
      }))
    };
  }

  /**
   * Get detailed system info
   */
  getSystemInfo(name) {
    const system = this.systemMap.get(name);
    if (!system) return null;

    return {
      name: system.name,
      enabled: system.enabled,
      initialized: system.initialized,
      priority: system.priority
    };
  }

  /**
   * List all systems
   */
  listSystems() {
    return this.systems.map(s => s.name);
  }
}

// Singleton
const systemManager = new SystemManager();
