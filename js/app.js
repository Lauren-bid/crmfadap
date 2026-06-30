// js/app.js

window.App = (function() {
  
  let currentRoute = '';
  let _initRunning = false; // evita init() concorrente (onAuthStateChanged dispara várias vezes)

  // E-mail do administrador-semente (bate com a regra de bootstrap no Firestore).
  // NÃO é segredo: é só um identificador. A senha é definida pela Ana no cadastro.
  const ADMIN_SEED_EMAIL = 'lauren.bidoia@fadap.br';

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

  async function init() {
    if (!window.FB || !window.FB.auth) {
      document.getElementById('app').innerHTML =
        `<div style="padding:40px;text-align:center;font-family:sans-serif;color:#991B1B;">Erro ao conectar ao Firebase. Verifique sua internet e recarregue a página.</div>`;
      return;
    }

    if (_initRunning) return; // já há um init em andamento
    _initRunning = true;
    try {
      await _init();
    } finally {
      _initRunning = false;
    }
  }

  async function _init() {
    // Quem está logado é determinado pelo Firebase Auth.
    const authUser = window.FB.auth.currentUser;

    // Se não há sessão no Firebase, mostra o login.
    if (!authUser) {
      renderLoginScreen();
      return;
    }

    // 1. Lê primeiro o PRÓPRIO doc do usuário para checar aprovação/existência.
    //    (As regras só liberam ler a coleção inteira para aprovados, então
    //     pendentes precisam ser barrados antes de tentar carregar tudo.)
    let myProfile;
    try {
      const snap = await window.FB.db.collection('users').doc(authUser.uid).get();
      myProfile = snap.exists ? snap.data() : null;
    } catch (e) {
      console.error('Falha ao ler perfil do usuário:', e);
      document.getElementById('app').innerHTML =
        `<div style="padding:40px;text-align:center;font-family:sans-serif;color:#991B1B;">Não foi possível carregar seu perfil. Recarregue a página.</div>`;
      return;
    }

    // Auth existe mas não há perfil (ex.: usuário excluído): força logout.
    if (!myProfile) {
      await window.FB.auth.signOut();
      renderLoginScreen();
      return;
    }

    // Bloqueia acesso de quem ainda não foi aprovado.
    if (myProfile.status === 'pending') {
      await window.FB.auth.signOut();
      renderLoginScreen();
      setTimeout(() => showAuthMessage('Cadastro em análise. Aguarde a aprovação do Administrador.', 'warning'), 50);
      return;
    }

    // 2. Aprovado: carrega todos os dados do Firestore para o cache.
    try {
      await DataStore.init();
    } catch (e) {
      console.error('Falha ao carregar dados do Firestore:', e);
      document.getElementById('app').innerHTML =
        `<div style="padding:40px;text-align:center;font-family:sans-serif;color:#991B1B;">Não foi possível carregar os dados. Recarregue a página.</div>`;
      return;
    }

    DataStore.setCurrentUser(authUser.uid);

    // 4. Render main layout
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
      if (currentRoute === 'kanban') {
        // Let KanbanPage handle the search directly
        return;
      }
      
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

    // 6. Check for upcoming events
    setTimeout(checkUpcomingEvents, 1000);
  }

  function checkUpcomingEvents() {
    if (!window.DataStore || !window.DataStore.getEvents) return;
    const events = window.DataStore.getEvents();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    events.forEach(ev => {
      if (ev.status === 'Realizado') return;
      if (!ev.exactDate) return;

      const evDate = new Date(ev.exactDate + 'T00:00:00');
      const diffTime = evDate - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 2) {
        emit('toast', { 
          type: 'warning', 
          message: `Atenção: Faltam 2 dias para o evento "${ev.title}"!`
        });
      } else if (diffDays === 1) {
        emit('toast', { 
          type: 'warning', 
          message: `Atenção: Falta 1 dia para o evento "${ev.title}"!`
        });
      } else if (diffDays === 0) {
        emit('toast', { 
          type: 'info', 
          message: `Lembrete: O evento "${ev.title}" é HOJE!`
        });
      }
    });
  }

  function renderLoginScreen() {
    const html = `
      <div id="login-container" style="position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; font-family: 'Inter', sans-serif;">
        <!-- Animated Background Orbs -->
        <div class="login-bg-container">
          <div class="bg-orb bg-orb-1" data-speed="0.04"></div>
          <div class="bg-orb bg-orb-2" data-speed="-0.02"></div>
          <div class="bg-orb bg-orb-3" data-speed="1"></div>
        </div>

        <div class="card" style="position: relative; z-index: 10; max-width: 440px; width: 100%; text-align: center; border-radius: 16px; padding: 40px; box-shadow: 0 15px 50px rgba(0,0,0,0.4); background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px);">
          
          <div style="margin-bottom: 24px;">
            <div style="width: 80px; height: 80px; background-color: #f8f9fa; border-radius: 20px; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; color: #9B1B30;">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
            </div>
            <h2 style="color: #111827; font-weight: 800; font-size: 1.8rem; margin-bottom: 4px; letter-spacing: -0.5px;">CRM UNIFADAP</h2>
            <p style="color: #6B7280; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 0;">Centro Universitário da Alta Paulista</p>
          </div>

          <!-- Tabs -->
          <div id="auth-tabs" style="display: flex; margin-bottom: 24px; border-bottom: 2px solid #E5E7EB;">
            <button type="button" id="tab-login" class="auth-tab active" onclick="window.App.switchAuthTab('login')" style="flex: 1; padding: 10px; border: none; background: none; font-size: 0.95rem; font-weight: 600; cursor: pointer; color: #9B1B30; border-bottom: 2px solid #9B1B30; margin-bottom: -2px; transition: all 0.2s;">Entrar</button>
            <button type="button" id="tab-register" class="auth-tab" onclick="window.App.switchAuthTab('register')" style="flex: 1; padding: 10px; border: none; background: none; font-size: 0.95rem; font-weight: 600; cursor: pointer; color: #9CA3AF; border-bottom: 2px solid transparent; margin-bottom: -2px; transition: all 0.2s;">Criar Conta</button>
          </div>

          <div id="auth-message" style="display: none; padding: 12px; border-radius: 8px; font-size: 0.85rem; text-align: center; font-weight: 500; margin-bottom: 16px;"></div>

          <!-- LOGIN FORM -->
          <form id="login-form" style="text-align: left; display: flex; flex-direction: column; gap: 16px;">
            <div>
              <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 6px;">E-mail</label>
              <input type="email" id="login-email" required placeholder="seu@email.com" style="width: 100%; padding: 10px 14px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 0.95rem; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#9B1B30'" onblur="this.style.borderColor='#D1D5DB'">
            </div>
            <div>
              <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 6px;">Senha</label>
              <div style="position: relative;">
                <input type="password" id="login-password" required placeholder="Sua senha" style="width: 100%; padding: 10px 14px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 0.95rem; outline: none; transition: border-color 0.2s; padding-right: 44px;" onfocus="this.style.borderColor='#9B1B30'" onblur="this.style.borderColor='#D1D5DB'">
                <button type="button" onclick="window.App.togglePasswordVisibility('login-password', this)" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #9CA3AF; padding: 4px;" title="Mostrar senha">
                  <svg id="eye-icon-login" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>
            <button type="submit" style="width: 100%; padding: 12px; background-color: #9B1B30; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 1rem; cursor: pointer; margin-top: 4px; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#7A1526'" onmouseout="this.style.backgroundColor='#9B1B30'">
              Entrar
            </button>
          </form>

          <!-- REGISTER FORM -->
          <form id="register-form" style="text-align: left; display: none; flex-direction: column; gap: 16px;">
            <div>
              <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 6px;">Nome Completo</label>
              <input type="text" id="reg-name" required placeholder="Ex: João Silva" style="width: 100%; padding: 10px 14px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 0.95rem; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#9B1B30'" onblur="this.style.borderColor='#D1D5DB'">
            </div>
            <div>
              <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 6px;">E-mail</label>
              <input type="email" id="reg-email" required placeholder="seu@email.com" style="width: 100%; padding: 10px 14px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 0.95rem; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#9B1B30'" onblur="this.style.borderColor='#D1D5DB'">
            </div>
            <div>
              <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 6px;">Senha</label>
              <div style="position: relative;">
                <input type="password" id="reg-password" required minlength="6" placeholder="Mínimo 6 caracteres" style="width: 100%; padding: 10px 14px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 0.95rem; outline: none; transition: border-color 0.2s; padding-right: 44px;" onfocus="this.style.borderColor='#9B1B30'" onblur="this.style.borderColor='#D1D5DB'">
                <button type="button" onclick="window.App.togglePasswordVisibility('reg-password', this)" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: #9CA3AF; padding: 4px;" title="Mostrar senha">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
              </div>
            </div>
            <div>
              <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 6px;">Setor de Atuação</label>
              <select id="reg-role" required style="width: 100%; padding: 10px 14px; border: 1px solid #D1D5DB; border-radius: 8px; font-size: 0.95rem; outline: none; background-color: white; transition: border-color 0.2s;" onfocus="this.style.borderColor='#9B1B30'" onblur="this.style.borderColor='#D1D5DB'">
                <option value="" disabled selected>Selecione seu setor...</option>
                <option value="Comercial">Comercial</option>
                <option value="Marketing">Marketing</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Gestor">Gestor(a)</option>
                <option value="Coordenação">Coordenação Acadêmica</option>
                <option value="Secretaria">Secretaria</option>
              </select>
            </div>
            <button type="submit" style="width: 100%; padding: 12px; background-color: #9B1B30; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 1rem; cursor: pointer; margin-top: 4px; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='#7A1526'" onmouseout="this.style.backgroundColor='#9B1B30'">
              Criar Conta
            </button>
          </form>

        </div>
      <div style="position: absolute; bottom: 20px; left: 0; width: 100%; text-align: center; color: rgba(255,255,255,0.7); font-size: 0.75rem; z-index: 10;">
        &copy; ${new Date().getFullYear()} UNIFADAP. Todos os direitos reservados.
      </div>
      </div>
    `;
    
    document.getElementById('app').innerHTML = html;

    // Premium Orb Mouse Tracking Animation & Particles
    const loginContainer = document.getElementById('login-container');
    const orbs = document.querySelectorAll('.bg-orb');
    
    if (loginContainer) {
      let mouseX = window.innerWidth / 2;
      let mouseY = window.innerHeight / 2;

      // Mouse move listener
      loginContainer.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
      });

      // Generate particles
      const bgContainer = loginContainer.querySelector('.login-bg-container');
      const particles = [];
      const numParticles = 120;
      const colors = ['red', 'pink', 'purple', 'cyan', 'gold', 'white', 'white', 'white'];
      
      if (bgContainer) {
        for (let i = 0; i < numParticles; i++) {
          const p = document.createElement('div');
          p.className = 'bg-particle';
          const color = colors[Math.floor(Math.random() * colors.length)];
          p.setAttribute('data-color', color);

          const size = Math.random() * 3.5 + 1.5;
          p.style.width = `${size}px`;
          p.style.height = `${size}px`;
          p.style.opacity = Math.random() * 0.7 + 0.3;
          
          const startX = Math.random() * window.innerWidth;
          const startY = Math.random() * window.innerHeight;
          
          bgContainer.appendChild(p);
          
          particles.push({
            el: p,
            baseX: startX,
            baseY: startY,
            driftX: (Math.random() - 0.5) * 0.3,
            driftY: -Math.random() * 0.4 - 0.1,
            parallaxSpeed: Math.random() * 0.03 + 0.01
          });
        }
      }

      let currentX = window.innerWidth / 2;
      let currentY = window.innerHeight / 2;
      
      function animateOrbs() {
        if (document.getElementById('login-container')) {
          currentX += (mouseX - currentX) * 0.08;
          currentY += (mouseY - currentY) * 0.08;

          const centerX = window.innerWidth / 2;
          const centerY = window.innerHeight / 2;
          const deltaX = currentX - centerX;
          const deltaY = currentY - centerY;

          orbs.forEach(orb => {
            const speed = parseFloat(orb.getAttribute('data-speed'));
            if (speed === 1) {
              orb.style.left = `${currentX}px`;
              orb.style.top = `${currentY}px`;
            } else {
              const moveX = deltaX * speed;
              const moveY = deltaY * speed;
              orb.style.transform = `translate(${moveX}px, ${moveY}px)`;
            }
          });

          particles.forEach(p => {
             p.baseX += p.driftX;
             p.baseY += p.driftY;
             
             if (p.baseY < -20) p.baseY = window.innerHeight + 20;
             if (p.baseX < -20) p.baseX = window.innerWidth + 20;
             if (p.baseX > window.innerWidth + 20) p.baseX = -20;

             const moveX = deltaX * p.parallaxSpeed;
             const moveY = deltaY * p.parallaxSpeed;
             
             p.el.style.transform = `translate(${p.baseX + moveX}px, ${p.baseY + moveY}px)`;
          });

          requestAnimationFrame(animateOrbs);
        }
      }
      
      requestAnimationFrame(animateOrbs);
    }

    // LOGIN form handler (Firebase Auth)
    document.getElementById('login-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      try {
        // Autentica no Firebase. O onAuthStateChanged abaixo dispara init().
        await window.FB.auth.signInWithEmailAndPassword(email, password);
      } catch (err) {
        const code = err && err.code;
        if (code === 'auth/invalid-email') {
          showAuthMessage('E-mail inválido.', 'error');
        } else if (code === 'auth/user-not-found') {
          showAuthMessage('E-mail não encontrado. Crie uma conta primeiro.', 'error');
        } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
          showAuthMessage('E-mail ou senha incorretos.', 'error');
        } else if (code === 'auth/too-many-requests') {
          showAuthMessage('Muitas tentativas. Aguarde alguns minutos e tente de novo.', 'error');
        } else {
          showAuthMessage('Não foi possível entrar. Tente novamente.', 'error');
        }
      }
    });

    // REGISTER form handler (Firebase Auth)
    document.getElementById('register-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const role = document.getElementById('reg-role').value;

      if (password.length < 6) {
        showAuthMessage('A senha deve ter no mínimo 6 caracteres.', 'error');
        return;
      }

      try {
        // Cria a conta no Auth usando a instância SECUNDÁRIA, para não trocar
        // a sessão atual (importante quando um admin estiver logado).
        const cred = await window.FB.secondaryAuth.createUserWithEmailAndPassword(email, password);
        const uid = cred.user.uid;

        // Conta-semente do administrador (definida nas Security Rules): nasce já
        // aprovada como Administrador. Qualquer outro e-mail nasce pendente.
        const isSeedAdmin = email.toLowerCase() === ADMIN_SEED_EMAIL;

        // Grava o perfil via secondaryDb: está autenticado como o usuário recém
        // criado, então as regras "create do próprio doc" passam.
        await window.FB.secondaryDb.collection('users').doc(uid).set({
          id: uid,
          name: name,
          email: email,
          role: isSeedAdmin ? 'Administrador' : role,
          status: isSeedAdmin ? 'approved' : 'pending',
          active: true,
          avatar: Utils.getInitials(name)
        });

        // Encerra a sessão secundária (não queremos manter logado o recém-criado).
        await window.FB.secondaryAuth.signOut();

        if (isSeedAdmin) {
          showAuthMessage('Conta de administrador criada! Já pode entrar.', 'success');
        } else {
          showAuthMessage('Conta criada com sucesso! Aguarde a aprovação do Administrador para acessar o sistema.', 'success');
        }
        setTimeout(() => { switchAuthTab('login'); }, 3000);
      } catch (err) {
        const code = err && err.code;
        if (code === 'auth/email-already-in-use') {
          showAuthMessage('Já existe uma conta com este e-mail. Use a aba "Entrar".', 'error');
        } else if (code === 'auth/invalid-email') {
          showAuthMessage('E-mail inválido.', 'error');
        } else if (code === 'auth/weak-password') {
          showAuthMessage('A senha deve ter no mínimo 6 caracteres.', 'error');
        } else {
          showAuthMessage('Não foi possível criar a conta. Tente novamente.', 'error');
        }
      }
    });
  }

  function showAuthMessage(message, type) {
    const msgDiv = document.getElementById('auth-message');
    if (!msgDiv) return;
    msgDiv.style.display = 'block';
    msgDiv.textContent = message;
    if (type === 'error') {
      msgDiv.style.backgroundColor = '#FEF2F2';
      msgDiv.style.color = '#991B1B';
    } else if (type === 'success') {
      msgDiv.style.backgroundColor = '#F0FDF4';
      msgDiv.style.color = '#166534';
    } else if (type === 'warning') {
      msgDiv.style.backgroundColor = '#FFFBEB';
      msgDiv.style.color = '#92400E';
    }
  }

  function switchAuthTab(tab) {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('login-form');
    const formRegister = document.getElementById('register-form');
    const msgDiv = document.getElementById('auth-message');
    if (!tabLogin || !tabRegister || !formLogin || !formRegister) return;

    if (msgDiv) msgDiv.style.display = 'none';

    if (tab === 'login') {
      tabLogin.style.color = '#9B1B30';
      tabLogin.style.borderBottom = '2px solid #9B1B30';
      tabRegister.style.color = '#9CA3AF';
      tabRegister.style.borderBottom = '2px solid transparent';
      formLogin.style.display = 'flex';
      formRegister.style.display = 'none';
    } else {
      tabRegister.style.color = '#9B1B30';
      tabRegister.style.borderBottom = '2px solid #9B1B30';
      tabLogin.style.color = '#9CA3AF';
      tabLogin.style.borderBottom = '2px solid transparent';
      formLogin.style.display = 'none';
      formRegister.style.display = 'flex';
    }
  }

  function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === 'password') {
      input.type = 'text';
      btn.title = 'Ocultar senha';
    } else {
      input.type = 'password';
      btn.title = 'Mostrar senha';
    }
  }

  async function logout() {
    DataStore.setCurrentUser(null);
    window.location.hash = ''; // Clear hash
    await window.FB.auth.signOut(); // onAuthStateChanged re-renderiza o login
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
    else if (hash === 'commissions') {
      pageContainer.innerHTML = CommissionsPage.render();
      setTimeout(() => CommissionsPage.init(), 0);
      breadcrumbs = ['Sistema', 'Relatório de Comissões'];
    }
    else if (hash === 'agenda') {
      pageContainer.innerHTML = AgendaPage.render();
      setTimeout(() => AgendaPage.init(), 0);
      breadcrumbs = ['Sistema', 'Agenda de Eventos'];
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
    logout,
    navigate,
    getCurrentRoute: () => currentRoute,
    on,
    emit,
    switchAuthTab,
    togglePasswordVisibility
  };
})();

// Start App on DOM Ready
document.addEventListener('DOMContentLoaded', async () => {
  if (!window.FB || !window.FB.auth) {
    document.getElementById('app').innerHTML =
      `<div style="padding:40px;text-align:center;font-family:sans-serif;color:#991B1B;">Erro ao carregar o Firebase. Verifique a conexão e recarregue.</div>`;
    return;
  }

  // O Firebase restaura a sessão de forma assíncrona; reagimos a cada mudança.
  window.FB.auth.onAuthStateChanged(() => {
    window.App.init();
  });
});
