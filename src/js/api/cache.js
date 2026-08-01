export class Cache {
  constructor() {
    this.data = new Map();
  }
  
  get(key) {
    const item = this.data.get(key);
    if (!item) return null;
    if (Date.now() > item.expires) {
      this.data.delete(key);
      return null;
    }
    return item.value;
  }
  
  set(key, value, ttl = 3600000) {
    this.data.set(key, {
      value,
      expires: Date.now() + ttl
    });
  }
  
  clear() {
    this.data.clear();
  }
}