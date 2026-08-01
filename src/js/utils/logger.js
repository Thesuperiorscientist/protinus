export class Logger {
  constructor(namespace) {
    this.namespace = namespace;
    this.enabled = true;
  }
  
  info(...args) {
    if (this.enabled) {
      console.log(`[${this.namespace}]`, ...args);
    }
  }
  
  warn(...args) {
    if (this.enabled) {
      console.warn(`[${this.namespace}]`, ...args);
    }
  }
  
  error(...args) {
    if (this.enabled) {
      console.error(`[${this.namespace}]`, ...args);
    }
  }
}