// js/pages/leads.js

window.LeadsPage = (function() {

  function render() {
    return `
      <div class="page-container">
        <div class="page-header">
          <div class="page-title">
            <h1>Gestão de Leads</h1>
            <p>Lista completa de candidatos</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary" onclick="window.LeadsPage.openManageSemestersModal()">
              <i data-lucide="calendar"></i> Gerenciar Semestres
            </button>
            <button class="btn btn-primary" onclick="window.LeadsPage.openNewLeadModal()">
              <i data-lucide="plus"></i> Novo Lead
            </button>
          </div>
        </div>

        <div id="leads-filters-container"></div>
        <div id="leads-table-container"></div>
        <div id="leads-count-container" style="margin-top: 24px; font-weight: 500; color: var(--text-secondary); background: var(--bg-color); padding: 16px; border-radius: var(--radius-md); border: 1px solid var(--border-light); text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.02);"></div>
      </div>
    `;
  }

  function init() {
    const filtersConfig = {
      id: 'leads-filter',
      fields: [
        { key: 'query', label: 'Busca Rápida', type: 'text', placeholder: 'Nome, CPF, Telefone...' },
        { key: 'funnelStage', label: 'Fase do Funil', type: 'select', options: DataStore.getFunnelStages() },
        { key: 'course', label: 'Curso', type: 'select', options: Utils.COURSES },
        { key: 'origin', label: 'Origem', type: 'select', options: Utils.ORIGINS },
        { key: 'modality', label: 'Modalidade', type: 'select', options: Utils.MODALITIES },
        { key: 'semester', label: 'Semestre', type: 'select', options: DataStore.getSemesters() }
      ]
    };

    const filtersContainer = document.getElementById('leads-filters-container');
    if (filtersContainer) {
      filtersContainer.innerHTML = Filters.render(filtersConfig);
      Filters.init('leads-filter', (filterValues) => {
        renderTable(filterValues);
      });
    }

    renderTable({});
  }

  function renderTable(filters) {
    const leads = DataStore.getLeads(filters);
    const tableContainer = document.getElementById('leads-table-container');
    if (!tableContainer) return;

    const tableConfig = {
      id: 'leads-table',
      selectable: false,
      data: leads,
      emptyMessage: 'Nenhum lead encontrado com os filtros atuais.',
      columns: [
        { 
          key: 'name', label: 'Nome do Candidato', sortable: true,
          render: (val, row) => `
            <div style="font-weight: 500; color: var(--text-primary)">${val}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted)">${row.email || 'Sem e-mail'}</div>
          `
        },
        { key: 'phone', label: 'Telefone' },
        { key: 'course', label: 'Curso', sortable: true },
        { 
          key: 'funnelStage', label: 'Fase do Funil', sortable: true,
          render: (val) => {
            let badgeClass = 'badge-primary';
            if (val === 'Novo Lead') badgeClass = 'badge-info';
            if (val === 'Matriculado' || val === 'Aprovado') badgeClass = 'badge-success';
            if (val === 'Perdido') badgeClass = 'badge-error';
            if (val === 'Primeiro Contato' || val === 'Em Negociação') badgeClass = 'badge-warning';
            return `<span class="badge ${badgeClass}">${val}</span>`;
          }
        },
        { 
          key: 'status1', label: 'Status 1', sortable: true,
          render: (val) => {
            if(!val) return '-';
            let badgeClass = 'badge-neutral';
            if (val === 'RECUSA') badgeClass = 'badge-error';
            if (val === 'TEM INTERESSE' || val === 'APROVADO') badgeClass = 'badge-success';
            if (val === 'ANALISANDO PROPOSTA' || val === 'RETORNO NO MEIO DO ANO') badgeClass = 'badge-warning';
            return `<span class="badge ${badgeClass}" style="font-size: 0.65rem;">${val}</span>`;
          }
        },
        { 
          key: 'attendantIds', label: 'Atendentes',
          render: (val) => {
            if (!val || val.length === 0) return '<span class="text-muted text-sm">Não atribuído</span>';
            const users = val.map(id => DataStore.getUser(id)).filter(Boolean);
            if (users.length === 0) return '-';
            return `
              <div class="flex items-center gap-1 flex-wrap">
                ${users.map(user => `
                  <div class="avatar avatar-sm" style="font-size: 0.6rem; width: 24px; height: 24px;" title="${user.name}">${user.avatar}</div>
                `).join('')}
              </div>
            `;
          }
        },
        { 
          key: 'createdAt', label: 'Data', sortable: true,
          render: (val) => `<span class="text-sm">${Utils.formatDate(val)}</span>`
        },
        { 
          key: 'contactDate', label: 'Últ. Contato', sortable: true,
          render: (val) => val ? `<span class="text-sm">${Utils.formatDate(val)}</span>` : '<span class="text-muted text-sm">-</span>'
        },
        {
          key: 'observation', label: 'Observação',
          render: (val) => {
            if (!val) return '<span class="text-muted text-sm">-</span>';
            const truncated = val.length > 120 ? val.substring(0, 120) + '...' : val;
            return `<div class="text-sm" style="max-width: 250px; white-space: normal; line-height: 1.2;" title="${Utils.escapeHtml(val)}">${Utils.escapeHtml(truncated)}</div>`;
          }
        }
      ],
      actions: [
        { icon: 'eye', title: 'Ver Detalhes', onClickClass: 'action-view' },
        { icon: 'trash-2', title: 'Excluir', onClickClass: 'action-delete text-error' }
      ],
      renderActions: (row) => {
        const phone = (row.whatsapp || row.phone || '').replace(/\D/g, '');
        const waLink = phone ? `<a href="https://wa.me/55${phone}" target="_blank" rel="noopener noreferrer"
          class="btn-icon" style="color: #25D366; display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:6px; transition:background 0.2s;" title="Abrir WhatsApp"
          onmouseover="this.style.background='rgba(37,211,102,0.1)'" onmouseout="this.style.background='transparent'">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        </a>` : '';
        return `
          ${waLink}
          <button class="btn-icon btn-ghost action-view" data-id="${row.id}" title="Ver Detalhes"><i data-lucide="eye"></i></button>
          <button class="btn-icon btn-ghost text-error action-delete" data-id="${row.id}" title="Excluir"><i data-lucide="trash-2"></i></button>
        `;
      }
    };

    tableContainer.innerHTML = DataTable.render(tableConfig);
    
    // Update count container
    const countContainer = document.getElementById('leads-count-container');
    if (countContainer) {
      let filterText = [];
      if (filters && filters.query) filterText.push(`Busca: "${filters.query}"`);
      if (filters && filters.funnelStage) filterText.push(`Fase: ${filters.funnelStage}`);
      if (filters && filters.course) filterText.push(`Curso: ${filters.course}`);
      if (filters && filters.origin) filterText.push(`Origem: ${filters.origin}`);
      if (filters && filters.modality) filterText.push(`Modalidade: ${filters.modality}`);
      if (filters && filters.semester) filterText.push(`Semestre: ${filters.semester}`);
      if (filters && filters.date) filterText.push(`Data: ${Utils.formatDate(filters.date)}`);
      
      let filterString = filterText.length > 0 ? `<strong>Filtros ativos:</strong> ${filterText.join(' | ')}` : 'Exibindo todos os leads (Sem filtros)';
      
      countContainer.innerHTML = `
        <div style="font-size: 0.85rem; margin-bottom: 6px;">${filterString}</div>
        <div style="font-size: 1.1rem;">Quantidade de leads: <strong style="color: var(--primary); font-size: 1.3rem;">${leads.length}</strong></div>
      `;
    }
    
    if (window.lucide) window.lucide.createIcons();

    // Bind action events
    const viewBtns = tableContainer.querySelectorAll('.action-view');
    viewBtns.forEach(btn => btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      window.App.navigate(`lead-detail/${id}`);
    }));

    const delBtns = tableContainer.querySelectorAll('.action-delete');
    delBtns.forEach(btn => btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      Modal.confirm('Tem certeza que deseja excluir este lead permanentemente?', () => {
        DataStore.deleteLead(id);
        Toast.success('Lead excluído com sucesso');
        renderTable(Filters.getValues('leads-filter'));
      }, 'Excluir Lead');
    }));
  }

  function openNewLeadModal() {
    const attendants = DataStore.getUsers().filter(u => u.role === 'Comercial' || u.role === 'Administrador');
    
    const formHtml = `
      <form id="new-lead-form">
        <h4 style="margin-bottom: 12px; color: var(--primary);">Dados Pessoais</h4>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Nome Completo *</label>
            <input type="text" class="form-input" id="nl-name" required>
          </div>
          <div class="form-group">
            <label class="form-label">E-mail</label>
            <input type="email" class="form-input" id="nl-email">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Telefone (WhatsApp) *</label>
            <input type="text" class="form-input" id="nl-phone" required oninput="this.value = Utils.maskPhone(this.value)">
          </div>
          <div class="form-group">
            <label class="form-label">CPF</label>
            <input type="text" class="form-input" id="nl-cpf" oninput="this.value = Utils.maskCPF(this.value)">
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Cidade</label>
            <input type="text" class="form-input" id="nl-city">
          </div>
          <div class="form-group">
            <label class="form-label">Origem do Lead</label>
            <select class="form-select" id="nl-origin">
              ${Utils.ORIGINS.map(o => `<option value="${o}">${o}</option>`).join('')}
            </select>
          </div>
        </div>

        <h4 style="margin-bottom: 12px; margin-top: 12px; color: var(--primary);">Interesse Acadêmico</h4>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Curso de Interesse</label>
            <select class="form-select" id="nl-course">
              ${Utils.COURSES.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Status 1 (Geral)</label>
            <select class="form-select" id="nl-status1">
              <option value="">Selecione...</option>
              ${Utils.STATUS_1.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Status 2 (Detalhe)</label>
            <select class="form-select" id="nl-status2">
              <option value="">Selecione...</option>
              ${Utils.STATUS_2.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Atendentes Responsáveis</label>
            <select class="form-select" id="nl-attendant" multiple style="height: 80px;">
              ${attendants.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
            </select>
            <small style="color: var(--text-muted); font-size: 0.75rem;">Segure Ctrl (ou Cmd) para selecionar múltiplos</small>
          </div>
        </div>
        
        <div class="form-row" style="margin-top: 12px;">
          <div class="form-group">
            <label class="form-label">Semestre de Entrada</label>
            <select class="form-select" id="nl-semester">
              ${DataStore.getSemesters().map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Modalidade</label>
            <select class="form-select" id="nl-modality">
              ${Utils.MODALITIES.map(m => `<option value="${m}">${m}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-row" style="margin-top: 12px;">
          <div class="form-group" style="grid-column: 1 / -1;">
            <label class="form-label">Observação</label>
            <textarea class="form-textarea" id="nl-observation" rows="3" placeholder="Notas sobre o lead..."></textarea>
          </div>
        </div>
      </form>
    `;

    const footerHtml = `
      <button class="btn btn-ghost" onclick="Modal.hide()">Cancelar</button>
      <button class="btn btn-primary" id="nl-save-btn">Salvar Lead</button>
    `;

    Modal.show({
      title: 'Cadastrar Novo Lead',
      content: formHtml,
      size: 'lg',
      footer: footerHtml
    });

    document.getElementById('nl-save-btn').addEventListener('click', () => {
      const form = document.getElementById('new-lead-form');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const newLeadData = {
        name: document.getElementById('nl-name').value,
        email: document.getElementById('nl-email').value,
        phone: document.getElementById('nl-phone').value,
        whatsapp: document.getElementById('nl-phone').value, // auto-copy
        cpf: document.getElementById('nl-cpf').value,
        city: document.getElementById('nl-city').value,
        origin: document.getElementById('nl-origin').value,
        course: document.getElementById('nl-course').value,
        modality: document.getElementById('nl-modality').value,
        semester: document.getElementById('nl-semester').value,
        attendantIds: Array.from(document.getElementById('nl-attendant').selectedOptions).map(opt => opt.value),
        status1: document.getElementById('nl-status1').value,
        status2: document.getElementById('nl-status2').value,
        observation: document.getElementById('nl-observation').value,
        academicStatus: 'Interessado',
        funnelStage: 'Novo Lead',
        rg: '', state: 'SP', birthDate: ''
      };

      const added = DataStore.addLead(newLeadData);
      Modal.hide();
      Toast.success('Lead cadastrado com sucesso!');
      
      // Navigate to detail view
      window.App.navigate(`lead-detail/${added.id}`);
    });
  }

  function openManageSemestersModal() {
    const semesters = DataStore.getSemesters();
    
    const html = `
      <div style="margin-bottom: 20px;">
        <label class="form-label">Adicionar Novo Semestre</label>
        <div style="display: flex; gap: 10px;">
          <input type="text" id="new-semester-input" class="form-input" placeholder="Ex: 2027/1">
          <button class="btn btn-primary" onclick="window.LeadsPage.addSemester()">Adicionar</button>
        </div>
      </div>
      
      <div class="card" style="padding: 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-light); background: var(--bg-secondary);">
              <th style="padding: 12px; text-align: left; font-size: 0.8rem; text-transform: uppercase;">Semestre</th>
              <th style="padding: 12px; text-align: right; font-size: 0.8rem; text-transform: uppercase;">Ação</th>
            </tr>
          </thead>
          <tbody>
            ${semesters.map(s => `
              <tr style="border-bottom: 1px solid var(--border-light);">
                <td style="padding: 12px; font-weight: 500;">${s}</td>
                <td style="padding: 12px; text-align: right;">
                  <button class="btn-icon btn-ghost text-error" onclick="window.LeadsPage.deleteSemester('${s}')" title="Excluir">
                    <i data-lucide="trash-2"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
            ${semesters.length === 0 ? '<tr><td colspan="2" style="padding: 20px; text-align: center; color: var(--text-muted);">Nenhum semestre cadastrado.</td></tr>' : ''}
          </tbody>
        </table>
      </div>
    `;

    Modal.show({
      title: 'Gerenciar Semestres',
      content: html,
      footer: `<button class="btn btn-primary" onclick="Modal.hide()">Concluir</button>`
    });
  }

  function addSemester() {
    const input = document.getElementById('new-semester-input');
    const val = input.value.trim();
    if (!val) {
      Toast.warning('Digite um nome para o semestre.');
      return;
    }
    
    DataStore.addSemester(val);
    Toast.success('Semestre adicionado!');
    openManageSemestersModal(); // refresh modal
    
    // Refresh table filters silently if we are on leads page
    init();
  }

  function deleteSemester(name) {
    Modal.confirm(`Tem certeza que deseja excluir o semestre "${name}"? Leads que já usam esse semestre não serão apagados.`, () => {
      DataStore.deleteSemester(name);
      Toast.success('Semestre removido!');
      openManageSemestersModal(); // refresh modal
      init(); // refresh background filters
    });
  }

  // Allow global access to open modal if needed
  return {
    render,
    init,
    openNewLeadModal,
    openManageSemestersModal,
    addSemester,
    deleteSemester
  };
})();
