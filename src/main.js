import App from './js/app.js';

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  window.__app = app; // For debugging
});