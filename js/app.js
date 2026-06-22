// js/app.js

window.App = (function() {
  
  let currentRoute = '';
  
  // Simple event bus
  const events = {};

  function on(eventName, callback) {
    if (!events[eventName]) events[eventName] = [];
    events[eventName].push(callback);
  }

  function emit(eventName, data) {
    if (events[eventName]) {
      events[eventName].forEach(cb => cb(data));
    }
  }

  function init() {
    // 1. Initialize data store
    DataStore.init();

    // 2. Check if logged in. If not, show login screen.
    const currentUser = DataStore.getCurrentUser();
    if (!currentUser) {
      renderLoginScreen();
      return;
    }

    // 3. Render main layout
    renderLayout();

    // 4. Initialize components
    Sidebar.init();
    Topbar.init();

    // 5. Setup Router
    window.addEventListener('hashchange', handleRouteChange);
    
    // Initial route
    handleRouteChange();

    // Listen to global search
    on('global_search', (query) => {
      if (!currentRoute.startsWith('leads')) {
        navigate('leads');
      }
      setTimeout(() => {
        const filtersContainer = document.getElementById('leads-filter');
        if (filtersContainer) {
          const input = filtersContainer.querySelector('[data-key="query"]');
          if (input) {
            input.value = query;
            input.dispatchEvent(new Event('input')); // trigger filter
          }
        }
      }, 100); // Wait for page to render
    });
  }

  function renderLoginScreen() {
    const html = `
      <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background-color: #9B1B30; padding: 20px; font-family: 'Inter', sans-serif;">
        <div class="card" style="max-width: 440px; width: 100%; text-align: center; border-radius: 16px; padding: 40px; box-shadow: 0 10px 25px rgba(0,0,0,0.2);">
          
          <div style="margin-bottom: 32px;">
            <div style="width: 80px; height: 80px; background-color: #f8f9fa; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #9B1B30;">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            </div>
            <h2 style="color: #111827; font-weight: 800; font-size: 1.8rem; margin-bottom: 4px; letter-spacing: -0.5px;">CRM UNIFADAP</h2>
            <p style="color: #6B7280; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 12px;">Centro Universitário da Alta Paulista</p>
            <p style="color: #4B5563; font-size: 0.9rem;">Identifique-se para acessar a plataforma</p>
          </div>
          
          <form id="login-form" style="text-align: left; display: flex; flex-direction: column; gap: 20px;">
            <div id="login-error" style="display: none; padding: 12px; background-color: #FEF2F2; color: #991B1B; border-radius: 8px; font-size: 0.85rem; text-align: center; font-weight: 500;"></div>
            
            <div>
              <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 6px;">Seu Nome Completo</label>
              <input type="text" id="login-name" required placeholder="Ex: João Silva" style="width: 100%; padding: 10px 14px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 0.95rem; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#9B1B30'" onblur="this.style.borderColor='#D1D5DB'">
            </div>

            <div>
              <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 6px;">Seu E-mail Institucional</label>
              <input type="email" id="login-email" required placeholder="Ex: joao@fadap.br" style="width: 100%; padding: 10px 14px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 0.95rem; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#9B1B30'" onblur="this.style.borderColor='#D1D5DB'">
            </div>
            
            <div>
              <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 6px;">Setor de Atuação</label>
              <select id="login-role" required style="width: 100%; padding: 10px 14px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 0.95rem; outline: none; background-color: white; transition: border-color 0.2s;" onfocus="this.style.borderColor='#9B1B30'" onblur="this.style.borderColor='#D1D5DB'">
                <option value="" disabled selected>Selecione seu setor...</option>
                <option value="Comercial">Comercial</option>
                <option value="Marketing">Marketing</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Gestor">Gestor(a)</option>
                <option value="Coordenação">Coordenação Acadêmica</option>
                <option value="Secretaria">Secretaria</option>
              </select>
            </div>
            
            <button type="submit" style="width: 100%; padding: 12px; background-color: #9B1B30; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 1rem; cursor: pointer; margin-top: 10px; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#7A1526'" onmouseout="this.style.backgroundColor='#9B1B30'">
              Acessar CRM
            </button>
          </form>

        </div>
      </div>
    `;
    document.getElementById('app').innerHTML = html;

    document.getElementById('login-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const name = document.getElementById('login-name').value.trim();
      const email = document.getElementById('login-email').value.trim();
      const role = document.getElementById('login-role').value;
      if (name && email && role) {
        window.App.loginNewUser(name, email, role);
      }
    });
  }

  function login(userId) {
    DataStore.setCurrentUser(userId);
    init(); // Re-init app
  }

  function loginNewUser(name, email, role) {
    const users = DataStore.getUsers();
    // Match by email if provided, otherwise by name
    let user = users.find(u => u.email.toLowerCase() === email.toLowerCase() || u.name.toLowerCase() === name.toLowerCase());
    
    if (!user) {
      // Create new user as pending
      user = DataStore.addUser({
        name: name,
        email: email,
        role: role,
        status: 'pending',
        active: true
      });
    } else {
      // Update missing info
      const updateData = { name: name, email: email };
      // Prevent demoting an Administrator
      if (user.role !== 'Administrador') {
        updateData.role = role;
      }
      // Force Ana Lauren to always be Admin
      if (user.name.toLowerCase() === 'ana lauren') {
        updateData.role = 'Administrador';
        updateData.status = 'approved';
      }
      DataStore.updateUser(user.id, updateData);
    }
    
    if (user.status === 'pending') {
      const errorDiv = document.getElementById('login-error');
      if (errorDiv) {
        errorDiv.style.display = 'block';
        errorDiv.textContent = 'Cadastro em análise. Aguarde a aprovação do Administrador.';
      }
      return;
    }

    login(user.id);
  }

  function logout() {
    DataStore.setCurrentUser(null);
    window.location.hash = ''; // Clear hash
    init(); // Re-init app
  }

  function renderLayout() {
    let breadcrumbs = ['CRM Unifadap'];
    
    // We update topbar on each route change, so we render an empty one initially
    const appHtml = `
      <div class="app-layout">
        ${Sidebar.render()}
        <main class="main-content" id="main-content-wrapper">
          <div id="topbar-container"></div>
          <div id="page-content" style="display: flex; flex-direction: column; flex-grow: 1; height: 100%; overflow-y: auto;"></div>
        </main>
      </div>
    `;
    document.getElementById('app').innerHTML = appHtml;
  }

  function handleRouteChange() {
    const hash = window.location.hash.slice(2) || 'dashboard'; // remove '#/'
    currentRoute = hash;
    
    const pageContainer = document.getElementById('page-content');
    const topbarContainer = document.getElementById('topbar-container');
    if (!pageContainer) return;

    // Default title
    let title = 'CRM Unifadap';
    let breadcrumbs = ['Principal'];

    // Route matching
    if (hash === 'dashboard') {
      pageContainer.innerHTML = DashboardPage.render();
      setTimeout(() => DashboardPage.init(), 0);
      breadcrumbs.push('Dashboard');
    } 
    else if (hash === 'leads') {
      pageContainer.innerHTML = LeadsPage.render();
      setTimeout(() => LeadsPage.init(), 0);
      breadcrumbs = ['Gestão', 'Todos os Leads'];
    }
    else if (hash.startsWith('lead-detail/')) {
      const id = hash.split('/')[1];
      pageContainer.innerHTML = LeadDetailPage.render(id);
      setTimeout(() => LeadDetailPage.init(id), 0);
      const lead = DataStore.getLead(id);
      breadcrumbs = ['Gestão', 'Lead', lead ? lead.name : 'Detalhes'];
    }
    else if (hash === 'kanban') {
      pageContainer.innerHTML = KanbanPage.render();
      setTimeout(() => KanbanPage.init(), 0);
      breadcrumbs = ['Gestão', 'Kanban'];
    }
    else if (hash === 'import-export') {
      pageContainer.innerHTML = ImportExportPage.render();
      setTimeout(() => ImportExportPage.init(), 0);
      breadcrumbs = ['Sistema', 'Importar / Exportar'];
    }
    else if (hash === 'users') {
      const currentUser = DataStore.getCurrentUser();
      if (currentUser && currentUser.role === 'Administrador') {
        pageContainer.innerHTML = UsersPage.render();
        setTimeout(() => UsersPage.init(), 0);
        breadcrumbs = ['Sistema', 'Controle de Usuários'];
      } else {
        pageContainer.innerHTML = `<div class="empty-state"><h3>Acesso Negado</h3><p>Você não tem permissão para acessar esta página.</p></div>`;
      }
    }
    else if (hash === 'reports') {
      pageContainer.innerHTML = ReportsPage.render();
      setTimeout(() => ReportsPage.init(), 0);
      breadcrumbs = ['Sistema', 'Relatórios Comparativos'];
    }
    else {
      // 404 fallback
      pageContainer.innerHTML = `<div class="empty-state"><h3>Página não encontrada</h3></div>`;
    }

    // Update Topbar
    if (topbarContainer) {
      topbarContainer.innerHTML = Topbar.render(title, breadcrumbs);
      Topbar.init();
    }

    // Update Sidebar active state
    Sidebar.setActive(hash);

    // Initialize icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  function navigate(route, forceReload = false) {
    if (window.location.hash === `#/${route}` && forceReload) {
      handleRouteChange(); // force update
    } else {
      window.location.hash = `/${route}`;
    }
  }

  return {
    init,
    login,
    loginNewUser,
    logout,
    navigate,
    getCurrentRoute: () => currentRoute,
    on,
    emit
  };
})();

// Start App on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.App.init();
});
