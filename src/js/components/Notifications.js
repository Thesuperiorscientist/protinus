export class Notifications {
  constructor() {
    this.container = document.getElementById('notifications');
  }
  
  show(title, message, type = '') {
    const el = document.createElement('div');
    el.className = `notification ${type}`;
    el.innerHTML = `
      <span class="icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <div class="msg"><strong>${title}</strong><span>${message}</span></div>
    `;
    this.container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(10px)';
      setTimeout(() => el.remove(), 300);
    }, 4000);
  }
}