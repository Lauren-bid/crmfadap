// js/components/modal.js

window.Modal = (function() {
  
  function getRoot() {
    let root = document.getElementById('modal-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'modal-root';
      document.body.appendChild(root);
    }
    return root;
  }

  function hide() {
    const root = getRoot();
    const overlay = root.querySelector('.modal-overlay');
    if (overlay) {
      overlay.style.animation = 'fadeOut var(--transition-fast)';
      setTimeout(() => {
        root.innerHTML = '';
      }, 150);
    }
  }

  function show(config) {
    const root = getRoot();
    
    // config = { title, content, size: 'default'|'lg', footer, onClose }
    const sizeClass = config.size === 'lg' ? 'modal-lg' : '';
    
    const html = `
      <div class="modal-overlay" id="modal-overlay">
        <div class="modal ${sizeClass}" onclick="event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">${config.title || ''}</h3>
            <button class="modal-close" id="modal-close-btn" title="Fechar">
              <i data-lucide="x"></i>
            </button>
          </div>
          <div class="modal-body">
            ${config.content || ''}
          </div>
          ${config.footer ? `
            <div class="modal-footer">
              ${config.footer}
            </div>
          ` : ''}
        </div>
      </div>
    `;

    root.innerHTML = html;
    
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Event Listeners
    const overlay = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('modal-close-btn');

    const handleClose = () => {
      if (config.onClose) config.onClose();
      hide();
    };

    if (overlay) overlay.addEventListener('click', handleClose);
    if (closeBtn) closeBtn.addEventListener('click', handleClose);
  }

  function confirm(message, onConfirm, title = 'Confirmar Ação') {
    show({
      title: title,
      content: `<p>${message}</p>`,
      footer: `
        <button class="btn btn-ghost" id="confirm-cancel-btn">Cancelar</button>
        <button class="btn btn-primary" id="confirm-ok-btn">Confirmar</button>
      `
    });

    setTimeout(() => {
      document.getElementById('confirm-cancel-btn').addEventListener('click', hide);
      document.getElementById('confirm-ok-btn').addEventListener('click', () => {
        onConfirm();
        hide();
      });
    }, 0);
  }

  return {
    show,
    hide,
    confirm
  };
})();
