// js/components/topbar.js

window.Topbar = (function() {
  
  function render(title, breadcrumbs = []) {
    const user = DataStore.getCurrentUser();
    const avatarInitials = user ? user.avatar : '??';

    let breadcrumbsHtml = '';
    if (breadcrumbs.length > 0) {
      breadcrumbsHtml = `
        <div class="breadcrumb">
          ${breadcrumbs.map((b, i) => `
            <span>${b}</span>
            ${i < breadcrumbs.length - 1 ? '<span class="breadcrumb-separator">/</span>' : ''}
          `).join('')}
        </div>
      `;
    }

    return `
      <header class="topbar">
        <div class="topbar-left">
          <button class="hamburger" id="hamburger-btn">
            <i data-lucide="menu"></i>
          </button>
          ${breadcrumbsHtml}
        </div>

        <div class="topbar-right">
          <div class="topbar-search">
            <i data-lucide="search"></i>
            <input type="text" id="global-search" placeholder="Buscar lead por nome, CPF...">
          </div>
          
          <div class="topbar-actions">
            <button class="notification-btn" title="Notificações">
              <i data-lucide="bell"></i>
              <span class="notification-badge"></span>
            </button>
            
            <div class="dropdown" id="user-dropdown">
              <div class="avatar avatar-sm" style="cursor: pointer;">${avatarInitials}</div>
              <div class="dropdown-menu">
                <div class="dropdown-item">
                  <i data-lucide="user"></i> Meu Perfil
                </div>
                <div class="dropdown-item">
                  <i data-lucide="settings"></i> Configurações
                </div>
                <div class="dropdown-divider"></div>
                <div class="dropdown-item text-error" id="logout-btn">
                  <i data-lucide="log-out"></i> Sair do Sistema
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    `;
  }

  function init() {
    // Hamburger Menu (Mobile)
    const hamburger = document.getElementById('hamburger-btn');
    if (hamburger) {
      hamburger.addEventListener('click', () => {
        if (window.Sidebar) window.Sidebar.toggle();
      });
    }

    // Global Search
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      searchInput.addEventListener('input', Utils.debounce((e) => {
        const query = e.target.value.trim();
        if (window.App) {
          window.App.emit('global_search', query);
        }
      }, 300));
    }

    // Dropdown toggle
    const userDropdown = document.getElementById('user-dropdown');
    if (userDropdown) {
      const avatar = userDropdown.querySelector('.avatar');
      avatar.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('open');
      });

      // Close when clicking outside
      document.addEventListener('click', (e) => {
        if (!userDropdown.contains(e.target)) {
          userDropdown.classList.remove('open');
        }
      });
    }

    // Logout simulation
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (window.App && window.App.logout) {
          window.App.logout();
        } else {
          DataStore.setCurrentUser(null);
          window.location.reload();
        }
      });
    }
  }

  return {
    render,
    init
  };
})();
