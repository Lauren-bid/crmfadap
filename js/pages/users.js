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
            <div class="text-sm text-secondary" style="margin-bottom: var(--spacing-2);">${u.email}</div>
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
          <input type="email" class="form-input" id="usr-email" value="${user ? user.email : ''}" required>
        </div>
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

  function saveUser(id = null) {
    const form = document.getElementById('user-form');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = {
      name: document.getElementById('usr-name').value,
      email: document.getElementById('usr-email').value,
      role: document.getElementById('usr-role').value,
      active: document.getElementById('usr-active').checked
    };

    if (id) {
      DataStore.updateUser(id, data);
      Toast.success('Usuário atualizado!');
    } else {
      DataStore.addUser(data);
      Toast.success('Usuário criado com sucesso!');
    }

    Modal.hide();
    renderGrid();
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
