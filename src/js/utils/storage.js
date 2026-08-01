export class Storage {
  constructor(prefix = '') {
    this.prefix = prefix;
  }
  
  get(key, def = null) {
    try {
      const val = localStorage.getItem(this.prefix + key);
      return val ? JSON.parse(val) : def;
    } catch {
      return def;
    }
  }
  
  set(key, value) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch {}
  }
  
  remove(key) {
    try {
      localStorage.removeItem(this.prefix + key);
    } catch {}
  }
}