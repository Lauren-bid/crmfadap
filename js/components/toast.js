// js/components/toast.js

window.Toast = (function() {
  
  function getContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function show(message, type = 'info', duration = 4000) {
    const container = getContainer();
    const id = 'toast-' + Date.now();
    
    let iconName = 'info';
    let title = 'Informação';
    
    switch(type) {
      case 'success': iconName = 'check-circle'; title = 'Sucesso'; break;
      case 'error': iconName = 'x-circle'; title = 'Erro'; break;
      case 'warning': iconName = 'alert-triangle'; title = 'Aviso'; break;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.id = id;
    
    toast.innerHTML = `
      <div class="toast-icon">
        <i data-lucide="${iconName}"></i>
      </div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${Utils.escapeHtml(message)}</div>
      </div>
      <button class="toast-close" onclick="document.getElementById('${id}').remove()">
        <i data-lucide="x" style="width: 16px; height: 16px;"></i>
      </button>
      <div class="toast-progress" style="animation-duration: ${duration}ms"></div>
    `;

    container.appendChild(toast);
    
    if (window.lucide) {
      lucide.createIcons({ root: toast });
    }

    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.style.opacity = '0';
        el.style.transform = 'translateY(-20px)';
        el.style.transition = 'all var(--transition-fast)';
        setTimeout(() => el.remove(), 200);
      }
    }, duration);
  }

  return {
    show,
    success: (msg) => show(msg, 'success'),
    error: (msg) => show(msg, 'error'),
    warning: (msg) => show(msg, 'warning'),
    info: (msg) => show(msg, 'info')
  };
})();
