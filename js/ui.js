// ui.js
document.addEventListener("DOMContentLoaded", () => {
  // Core: loader, tema, nav, videos
  Core.init();

  // Módulos funcionales
  Config.init();
  Products.init();
  Clients.init();
  Budgets.init();
});
