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
            <button class="btn btn-primary" onclick="window.LeadsPage.openNewLeadModal()">
              <i data-lucide="plus"></i> Novo Lead
            </button>
          </div>
        </div>

        <div id="leads-filters-container"></div>
        <div id="leads-table-container"></div>
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
        { key: 'modality', label: 'Modalidade', type: 'select', options: Utils.MODALITIES }
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
          key: 'attendantId', label: 'Atendente',
          render: (val) => {
            if (!val) return '<span class="text-muted text-sm">Não atribuído</span>';
            const user = DataStore.getUser(val);
            if (!user) return '-';
            return `
              <div class="flex items-center gap-2">
                <div class="avatar avatar-sm" style="font-size: 0.6rem;">${user.avatar}</div>
                <span class="text-sm">${user.name}</span>
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
      ]
    };

    tableContainer.innerHTML = DataTable.render(tableConfig);
    
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
            <label class="form-label">Atendente Responsável</label>
            <select class="form-select" id="nl-attendant">
              <option value="">Não atribuir agora</option>
              ${attendants.map(u => `<option value="${u.id}">${u.name}</option>`).join('')}
            </select>
          </div>
        </div>
        
        <div class="form-row" style="margin-top: 12px;">
          <div class="form-group">
            <label class="form-label">Semestre de Entrada</label>
            <select class="form-select" id="nl-semester">
              ${Utils.SEMESTERS.map(s => `<option value="${s}">${s}</option>`).join('')}
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
        attendantId: document.getElementById('nl-attendant').value,
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

  // Allow global access to open modal if needed
  return {
    render,
    init,
    openNewLeadModal
  };
})();
