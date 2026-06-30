// js/pages/users.js

window.UsersPage = (function() {

  function render() {
    return `
      <div class="page-container">
        <div class="page-header">
          <div class="page-title">
            <h1>Controle de Usuários</h1>
            <p>Gerenciamento de acessos da equipe</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-primary" onclick="window.UsersPage.openNewUserModal()">
              <i data-lucide="user-plus"></i> Novo Usuário
            </button>
          </div>
        </div>

        <div class="grid-2" style="margin-bottom: var(--spacing-6);" id="users-grid">
          <!-- User cards populated by init() -->
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-title">Matriz de Permissões</span>
          </div>
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Módulo / Ação</th>
                  <th class="text-center">Administrador</th>
                  <th class="text-center">Comercial</th>
                  <th class="text-center">Secretaria</th>
                  <th class="text-center">Coordenação</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Visualizar Dashboard</td>
                  <td class="text-center"><i data-lucide="check" class="text-success inline"></i></td>
                  <td class="text-center"><i data-lucide="check" class="text-success inline"></i></td>
                  <td class="text-center">-</td>
                  <td class="text-center"><i data-lucide="check" class="text-success inline"></i></td>
                </tr>
                <tr>
                  <td>Cadastrar Leads</td>
                  <td class="text-center"><i data-lucide="check" class="text-success inline"></i></td>
                  <td class="text-center"><i data-lucide="check" class="text-success inline"></i></td>
                  <td class="text-center">-</td>
                  <td class="text-center">-</td>
                </tr>
                <tr>
                  <td>Mover no Kanban</td>
                  <td class="text-center"><i data-lucide="check" class="text-success inline"></i></td>
                  <td class="text-center"><i data-lucide="check" class="text-success inline"></i></td>
                  <td class="text-center">-</td>
                  <td class="text-center">-</td>
                </tr>
                <tr>
                  <td>Gerar Contratos</td>
                  <td class="text-center"><i data-lucide="check" class="text-success inline"></i></td>
                  <td class="text-center">-</td>
                  <td class="text-center"><i data-lucide="check" class="text-success inline"></i></td>
                  <td class="text-center">-</td>
                </tr>
                <tr>
                  <td>Exportar Dados</td>
                  <td class="text-center"><i data-lucide="check" class="text-success inline"></i></td>
                  <td class="text-center">-</td>
                  <td class="text-center">-</td>
                  <td class="text-center"><i data-lucide="check" class="text-success inline"></i></td>
                </tr>
                <tr>
                  <td>Gerenciar Usuários</td>
                  <td class="text-center"><i data-lucide="check" class="text-success inline"></i></td>
                  <td class="text-center">-</td>
                  <td class="text-center">-</td>
                  <td class="text-center">-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;
  }

  function renderGrid() {
    const users = DataStore.getUsers();
    const grid = document.getElementById('users-grid');
    if (!grid) return;

    const currentUserId = DataStore.getCurrentUser().id;

    grid.innerHTML = users.map(u => {
      let roleBadge = 'badge-primary';
      if (u.role === 'Administrador') roleBadge = 'badge-error'; // Red
      if (u.role === 'Secretaria') roleBadge = 'badge-info';
      if (u.role === 'Coordenação') roleBadge = 'badge-warning';

      return `
        <div class="card" style="display: flex; gap: var(--spacing-4); align-items: center; position: relative;">
          ${!u.active ? `<div style="position: absolute; inset:0; background: rgba(255,255,255,0.7); z-index: 1;"></div>` : ''}
          <div class="avatar avatar-lg" style="background-color: ${!u.active ? 'var(--border)' : 'var(--primary-light)'}; z-index: 2;">${u.avatar}</div>
          <div style="flex-grow: 1; z-index: 2;">
            <div class="font-semibold text-lg" style="color: var(--text-primary); margin-bottom: 2px;">${u.name} ${u.id === currentUserId ? '(Você)' : ''}</div>
            <div class="text-sm text-secondary" style="margin-bottom: 4px;">${u.email}</div>
            ${u.whatsapp ? `<div class="text-sm" style="color: #25D366; margin-bottom: var(--spacing-2); display: flex; align-items: center; gap: 4px;"><svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg> ${u.whatsapp}</div>` : `<div style="font-size:0.75rem; color: var(--text-muted); margin-bottom: var(--spacing-2);">WhatsApp não cadastrado</div>`}
            <span class="badge ${roleBadge}">${u.role}</span>
            ${u.status === 'pending' ? `<span class="badge badge-warning" style="margin-left: 8px;">Pendente</span>` : `<span class="badge badge-success" style="margin-left: 8px;">Aprovado</span>`}
          </div>
          <div style="z-index: 2; display: flex; align-items: center; gap: 8px;">
            ${u.status === 'pending' ? `
              <button class="btn btn-primary" onclick="window.UsersPage.approveUser('${u.id}')" style="padding: 6px 12px; font-size: 0.85rem;">
                Aprovar Acesso
              </button>
            ` : ''}
            <button class="btn-icon btn-ghost" onclick="window.UsersPage.openEditUserModal('${u.id}')" title="Editar">
              <i data-lucide="edit"></i>
            </button>
            ${u.id !== currentUserId ? `
              <button class="btn-icon btn-ghost text-error" onclick="window.UsersPage.deleteUser('${u.id}')" title="Excluir">
                <i data-lucide="trash-2"></i>
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();
  }

  function init() {
    renderGrid();
  }

  function getFormHtml(user = null) {
    return `
      <form id="user-form">
        <div class="form-group">
          <label class="form-label">Nome Completo</label>
          <input type="text" class="form-input" id="usr-name" value="${user ? user.name : ''}" required>
        </div>
        <div class="form-group">
          <label class="form-label">E-mail Corporativo</label>
          <input type="email" class="form-input" id="usr-email" value="${user ? user.email : ''}" ${user ? 'readonly style="background:#F3F4F6;cursor:not-allowed;"' : 'required'}>
          ${user ? '<small style="color: var(--text-muted); font-size: 0.75rem;">O e-mail de login não pode ser alterado por aqui.</small>' : ''}
        </div>
        ${user ? '' : `
        <div class="form-group">
          <label class="form-label">Senha de Acesso Inicial</label>
          <input type="password" class="form-input" id="usr-password" minlength="6" placeholder="Mínimo 6 caracteres" required>
          <small style="color: var(--text-muted); font-size: 0.75rem;">O usuário poderá usar esta senha para entrar. Ele pode trocá-la depois.</small>
        </div>`}
        <div class="form-group">
          <label class="form-label">Perfil de Acesso</label>
          <select class="form-select" id="usr-role">
            <option value="Comercial" ${user && user.role === 'Comercial' ? 'selected' : ''}>Comercial</option>
            <option value="Administrador" ${user && user.role === 'Administrador' ? 'selected' : ''}>Administrador</option>
            <option value="Secretaria" ${user && user.role === 'Secretaria' ? 'selected' : ''}>Secretaria</option>
            <option value="Coordenação" ${user && user.role === 'Coordenação' ? 'selected' : ''}>Coordenação</option>
          </select>
        </div>
        <div class="form-group" style="display: flex; align-items: center; gap: 8px;">
          <input type="checkbox" id="usr-active" ${(!user || user.active) ? 'checked' : ''} style="width: 16px; height: 16px;">
          <label for="usr-active" style="margin: 0; font-weight: 500;">Usuário Ativo</label>
        </div>
        <div class="form-group">
          <label class="form-label" style="display: flex; align-items: center; gap: 6px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            Número de WhatsApp (do atendente)
          </label>
          <input type="text" class="form-input" id="usr-whatsapp" value="${user && user.whatsapp ? user.whatsapp : ''}" placeholder="Ex: (18) 99999-9999" oninput="this.value = Utils.maskPhone(this.value)">
          <small style="color: var(--text-muted); font-size: 0.75rem;">Usado para identificar o contato do atendente. Não afeta funcionalidades.</small>
        </div>
      </form>
    `;
  }

  function openNewUserModal() {
    Modal.show({
      title: 'Novo Usuário',
      content: getFormHtml(),
      footer: `
        <button class="btn btn-ghost" onclick="Modal.hide()">Cancelar</button>
        <button class="btn btn-primary" onclick="window.UsersPage.saveUser()">Salvar</button>
      `
    });
  }

  function openEditUserModal(id) {
    const user = DataStore.getUser(id);
    if (!user) return;
    
    Modal.show({
      title: 'Editar Usuário',
      content: getFormHtml(user),
      footer: `
        <button class="btn btn-ghost" onclick="Modal.hide()">Cancelar</button>
        <button class="btn btn-primary" onclick="window.UsersPage.saveUser('${id}')">Salvar</button>
      `
    });
  }

  async function saveUser(id = null) {
    const form = document.getElementById('user-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = {
      name: document.getElementById('usr-name').value,
      email: document.getElementById('usr-email').value.trim(),
      role: document.getElementById('usr-role').value,
      active: document.getElementById('usr-active').checked,
      whatsapp: document.getElementById('usr-whatsapp').value.trim()
    };

    if (id) {
      // Edição: não mexe em e-mail/senha (login), só nos dados do perfil.
      DataStore.updateUser(id, data);
      Toast.success('Usuário atualizado!');
      Modal.hide();
      renderGrid();
      return;
    }

    // Criação: cria a conta no Firebase Auth (instância secundária, sem deslogar
    // o admin) e o perfil no Firestore com o mesmo UID, já aprovado.
    const password = document.getElementById('usr-password').value;
    try {
      // Cria a conta no Auth via instância secundária (não desloga o admin).
      const cred = await window.FB.secondaryAuth.createUserWithEmailAndPassword(data.email, password);
      const uid = cred.user.uid;
      await window.FB.secondaryAuth.signOut();
      // O doc é gravado pela sessão principal (admin) -> nasce já aprovado.
      DataStore.addUser({ ...data, id: uid, status: 'approved' });
      Toast.success('Usuário criado com sucesso!');
      Modal.hide();
      renderGrid();
    } catch (err) {
      const code = err && err.code;
      if (code === 'auth/email-already-in-use') {
        Toast.error('Já existe uma conta com este e-mail.');
      } else if (code === 'auth/invalid-email') {
        Toast.error('E-mail inválido.');
      } else if (code === 'auth/weak-password') {
        Toast.error('A senha deve ter no mínimo 6 caracteres.');
      } else {
        Toast.error('Não foi possível criar o usuário.');
      }
    }
  }

  function approveUser(id) {
    const user = DataStore.getUser(id);
    if (!user) return;
    
    Modal.show({
      title: 'Aprovar Acesso',
      content: `
        <div style="margin-bottom: 16px;">
          <p>Você está prestes a aprovar o acesso de <strong>${user.name}</strong> (${user.email}).</p>
          <p style="margin-top: 8px;">Defina qual será o nível de permissão (Setor) deste colaborador no CRM:</p>
        </div>
        <div class="form-group">
          <label class="form-label">Perfil de Permissão</label>
          <select class="form-select" id="approve-role">
            <option value="Comercial" ${user.role === 'Comercial' ? 'selected' : ''}>Comercial (Acesso Padrão)</option>
            <option value="Administrador" ${user.role === 'Administrador' ? 'selected' : ''}>Administrador (Acesso Total)</option>
            <option value="Secretaria" ${user.role === 'Secretaria' ? 'selected' : ''}>Secretaria</option>
            <option value="Coordenação" ${user.role === 'Coordenação' ? 'selected' : ''}>Coordenação</option>
            <option value="Marketing" ${user.role === 'Marketing' ? 'selected' : ''}>Marketing</option>
            <option value="Gestor" ${user.role === 'Gestor' ? 'selected' : ''}>Gestor</option>
          </select>
        </div>
      `,
      footer: `
        <button class="btn btn-ghost" onclick="Modal.hide()">Cancelar</button>
        <button class="btn btn-primary" onclick="window.UsersPage.confirmApprove('${id}')">Confirmar Aprovação</button>
      `
    });
  }

  function confirmApprove(id) {
    const role = document.getElementById('approve-role').value;
    DataStore.updateUser(id, { status: 'approved', role: role });
    Modal.hide();
    Toast.success('Acesso do usuário aprovado!');
    renderGrid();
  }

  function deleteUser(id) {
    Modal.confirm('Tem certeza que deseja remover este usuário?', () => {
      DataStore.deleteUser(id);
      Toast.success('Usuário removido.');
      renderGrid();
    });
  }

  return {
    render,
    init,
    openNewUserModal,
    openEditUserModal,
    saveUser,
    approveUser,
    confirmApprove,
    deleteUser
  };
})();
