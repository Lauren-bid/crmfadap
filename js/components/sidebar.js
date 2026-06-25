// js/components/sidebar.js

window.Sidebar = (function() {
  
  function render() {
    const user = DataStore.getCurrentUser();
    const avatarInitials = user ? user.avatar : '??';
    const userName = user ? user.name : 'Usuário';
    const userRole = user ? user.role : '';

    return `
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-logo">
          <!-- We use a placeholder icon here, but in reality we'd load the unifadap logo image -->
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--primary-light)"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          <div>
            <h2>UNIFADAP</h2>
            <span>Centro Universitário</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="nav-section">Principal</div>
          <a href="#/dashboard" class="sidebar-nav-item" data-route="dashboard">
            <i data-lucide="bar-chart-3"></i>
            <span>Dashboard</span>
          </a>
          
          <div class="nav-section">Gestão</div>
          <a href="#/leads" class="sidebar-nav-item" data-route="leads">
            <i data-lucide="users"></i>
            <span>Todos os Leads</span>
          </a>
          <a href="#/kanban" class="sidebar-nav-item" data-route="kanban">
            <i data-lucide="columns-3"></i>
            <span>Funil Kanban</span>
          </a>
          
          <div class="nav-section">Sistema</div>
          <a href="#/import-export" class="sidebar-nav-item" data-route="import-export">
            <i data-lucide="arrow-left-right"></i>
            <span>Importar / Exportar</span>
          </a>
          ${userRole === 'Administrador' ? `
          <a href="#/users" class="sidebar-nav-item" data-route="users">
            <i data-lucide="user-cog"></i>
            <span>Usuários</span>
          </a>
          ` : ''}
          <a href="#/reports" class="sidebar-nav-item" data-route="reports">
            <i data-lucide="bar-chart-4"></i>
            <span>Relatórios</span>
          </a>
          <a href="#/commissions" class="sidebar-nav-item" data-route="commissions">
            <i data-lucide="dollar-sign"></i>
            <span>Comissões</span>
          </a>
          <a href="#/agenda" class="sidebar-nav-item" data-route="agenda">
            <i data-lucide="calendar-days"></i>
            <span>Agenda de Eventos</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <div class="avatar">${avatarInitials}</div>
          <div class="user-info">
            <span class="user-name">${userName}</span>
            <span class="user-role">${userRole}</span>
          </div>
        </div>

        <button class="sidebar-toggle" id="sidebar-toggle">
          <i data-lucide="chevron-left"></i>
        </button>
      </aside>
      <div class="sidebar-overlay" id="sidebar-overlay"></div>
    `;
  }

  function init() {
    const toggleBtn = document.getElementById('sidebar-toggle');
    const overlay = document.getElementById('sidebar-overlay');
    
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggle);
    }
    
    if (overlay) {
      overlay.addEventListener('click', () => {
        document.getElementById('sidebar').classList.remove('open');
        overlay.style.display = 'none';
      });
    }
  }

  function toggle() {
    const sidebar = document.getElementById('sidebar');
    if (window.innerWidth <= 768) {
      // Mobile behavior
      sidebar.classList.toggle('open');
      const overlay = document.getElementById('sidebar-overlay');
      if (sidebar.classList.contains('open')) {
        overlay.style.display = 'block';
      } else {
        overlay.style.display = 'none';
      }
    } else {
      // Desktop behavior
      sidebar.classList.toggle('collapsed');
      // Re-trigger chart resize if on dashboard
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 300);
    }
  }

  function setActive(route) {
    document.querySelectorAll('.sidebar-nav-item').forEach(el => {
      el.classList.remove('active');
    });
    
    // Exact match or starts with (e.g. lead-detail/123 -> matches leads or kanban conceptually, 
    // but we can just match the base path if we want)
    let activeRoute = route;
    if (route.startsWith('lead-detail')) {
      // Keep previous active or set to leads
      activeRoute = 'leads'; 
    }

    const activeEl = document.querySelector(`.sidebar-nav-item[data-route="${activeRoute}"]`);
    if (activeEl) {
      activeEl.classList.add('active');
    }
    
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768) {
      const sidebar = document.getElementById('sidebar');
      if (sidebar && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        const overlay = document.getElementById('sidebar-overlay');
        if (overlay) overlay.style.display = 'none';
      }
    }
  }

  return {
    render,
    init,
    setActive,
    toggle
  };
})();
