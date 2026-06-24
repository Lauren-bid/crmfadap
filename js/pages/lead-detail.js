// js/pages/lead-detail.js

window.LeadDetailPage = (function() {
  
  let currentLeadId = null;

  function render(id) {
    currentLeadId = id;
    const lead = DataStore.getLead(id);
    
    if (!lead) {
      return `
        <div class="page-container">
          <div class="empty-state">
            <h3>Lead não encontrado</h3>
            <button class="btn btn-primary" onclick="window.App.navigate('leads')">Voltar para a Lista</button>
          </div>
        </div>
      `;
    }

    const attendants = (lead.attendantIds || []).map(id => DataStore.getUser(id)).filter(Boolean);
    
    // Calculate progress for funnel
    const stages = DataStore.getFunnelStages();
    const stageIndex = stages.indexOf(lead.funnelStage);
    const progressPercent = ((stageIndex + 1) / stages.length) * 100;

    return `
      <div class="page-container" style="max-width: 1200px; margin: 0 auto;">
        
        <div style="margin-bottom: var(--spacing-4);">
          <button class="btn btn-ghost" onclick="window.App.navigate('leads')">
            <i data-lucide="arrow-left"></i> Voltar
          </button>
        </div>

        <!-- Header Card -->
        <div class="card" style="margin-bottom: var(--spacing-6);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--spacing-4);">
            <div style="display: flex; gap: var(--spacing-4); align-items: center;">
              <div class="avatar avatar-lg">${Utils.getInitials(lead.name)}</div>
              <div>
                <h1 style="font-size: 1.5rem; margin-bottom: 4px;">${lead.name}</h1>
                <div style="display: flex; gap: var(--spacing-3); color: var(--text-secondary); font-size: 0.875rem; align-items: center;">
                  <span class="badge badge-primary">${lead.course}</span>
                  <span><i data-lucide="phone" style="width:14px;height:14px;"></i> ${lead.phone}</span>
                  <span><i data-lucide="mail" style="width:14px;height:14px;"></i> ${lead.email}</span>
                </div>
              </div>
            </div>
            
            <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: var(--spacing-2);">
              <div style="margin-bottom: 4px; display: flex; flex-direction: column; align-items: flex-end;">
                <span class="text-sm text-secondary">Atendentes:</span>
                ${attendants.length > 0 ? `
                  <div style="display: flex; gap: 4px; margin-top: 4px;">
                    ${attendants.map(att => `<div class="avatar avatar-sm" title="${att.name}">${att.avatar}</div>`).join('')}
                  </div>
                ` : '<strong>Não atribuído</strong>'}
              </div>
              <div style="display: flex; gap: 8px;">
                ${(lead.phone || lead.whatsapp) ? `
                <a href="https://wa.me/55${(lead.whatsapp || lead.phone).replace(/\D/g, '')}" target="_blank" rel="noopener noreferrer"
                  class="btn btn-sm"
                  style="background: #25D366; color: white; border-color: #25D366; display: flex; align-items: center; gap: 6px; text-decoration: none;"
                  title="Abrir conversa no WhatsApp">
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  Abrir WhatsApp
                </a>` : ''}
                <button class="btn btn-secondary btn-sm" onclick="window.LeadDetailPage.openInteractionModal()">
                  <i data-lucide="plus"></i> Registrar Interação
                </button>
              </div>
            </div>
          </div>

          <!-- Funnel Progress -->
          <div style="margin-top: var(--spacing-6);">
            <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-2); font-size: 0.75rem; color: var(--text-secondary);">
              <span>Fase Atual: <strong>${lead.funnelStage}</strong></span>
              <span>${Math.round(progressPercent)}% Concluído</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${progressPercent}%; background-color: ${stageIndex === 7 ? 'var(--error)' : 'var(--success)'}"></div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: var(--spacing-1); font-size: 0.65rem; color: var(--text-muted);">
              ${stages.map((s, i) => `
                <span style="cursor: pointer; ${i <= stageIndex ? 'color: var(--primary); font-weight: 600;' : ''}" 
                      onclick="window.LeadDetailPage.changeStage('${s}')">${s}</span>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Tabs Navigation -->
        <div class="tabs" id="lead-tabs">
          <div class="tab active" data-target="tab-timeline">Linha do Tempo</div>
          <div class="tab" data-target="tab-personal">Dados Pessoais</div>
          <div class="tab" data-target="tab-academic">Dados Acadêmicos</div>
          <div class="tab" data-target="tab-attendant">Atendimento</div>
          <div class="tab" data-target="tab-contracts">Contratos & Documentos</div>
        </div>

        <!-- Tabs Content -->
        
        <!-- Tab: Timeline -->
        <div class="tab-content active" id="tab-timeline">
          <div class="timeline">
            ${renderTimeline(lead)}
          </div>
        </div>

        <!-- Tab: Personal Data -->
        <div class="tab-content" id="tab-personal">
          <div class="card">
            <div class="card-header">
              <span class="card-title">Dados Pessoais</span>
              <button class="btn btn-ghost btn-sm" onclick="window.LeadDetailPage.savePersonalData()"><i data-lucide="save"></i> Salvar Alterações</button>
            </div>
            <form id="form-personal">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Nome Completo</label>
                  <input type="text" class="form-input" id="pd-name" value="${lead.name}">
                </div>
                <div class="form-group">
                  <label class="form-label">E-mail</label>
                  <input type="email" class="form-input" id="pd-email" value="${lead.email}">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">CPF</label>
                  <input type="text" class="form-input" id="pd-cpf" value="${lead.cpf}" oninput="this.value = Utils.maskCPF(this.value)">
                </div>
                <div class="form-group">
                  <label class="form-label">RG</label>
                  <input type="text" class="form-input" id="pd-rg" value="${lead.rg || ''}">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Telefone</label>
                  <input type="text" class="form-input" id="pd-phone" value="${lead.phone}" oninput="this.value = Utils.maskPhone(this.value)">
                </div>
                <div class="form-group">
                  <label class="form-label">WhatsApp</label>
                  <input type="text" class="form-input" id="pd-whatsapp" value="${lead.whatsapp || lead.phone}" oninput="this.value = Utils.maskPhone(this.value)">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Data de Nascimento</label>
                  <input type="date" class="form-input" id="pd-birth" value="${lead.birthDate || ''}">
                </div>
                <div class="form-group">
                  <label class="form-label">Data Último Contato</label>
                  <input type="date" class="form-input" id="pd-contact-date" value="${lead.contactDate || ''}">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Origem</label>
                  <select class="form-select" id="pd-origin">
                    ${Utils.ORIGINS.map(o => `<option value="${o}" ${lead.origin === o ? 'selected' : ''}>${o}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Cidade</label>
                  <input type="text" class="form-input" id="pd-city" value="${lead.city || ''}">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Estado</label>
                  <select class="form-select" id="pd-state">
                    ${Utils.STATES_BR.map(s => `<option value="${s}" ${lead.state === s ? 'selected' : ''}>${s}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Base/Campanha</label>
                  <input type="text" class="form-input" id="pd-base-name" value="${lead.baseName || ''}">
                </div>
              </div>
              <div class="form-row">
                <div class="form-group" style="grid-column: 1 / -1;">
                  <label class="form-label">Observação / Histórico Resumido</label>
                  <textarea class="form-textarea" id="pd-observation" rows="3">${lead.observation || ''}</textarea>
                </div>
              </div>
            </form>
          </div>
        </div>

        <!-- Tab: Academic -->
        <div class="tab-content" id="tab-academic">
          <div class="card">
            <div class="card-header">
              <span class="card-title">Interesse Acadêmico</span>
              <button class="btn btn-ghost btn-sm" onclick="window.LeadDetailPage.saveAcademicData()"><i data-lucide="save"></i> Salvar</button>
            </div>
            <form id="form-academic">
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Curso</label>
                  <select class="form-select" id="ac-course">
                    ${Utils.COURSES.map(c => `<option value="${c}" ${lead.course === c ? 'selected' : ''}>${c}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Modalidade</label>
                  <select class="form-select" id="ac-modality">
                    ${Utils.MODALITIES.map(m => `<option value="${m}" ${lead.modality === m ? 'selected' : ''}>${m}</option>`).join('')}
                  </select>
                </div>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Semestre de Entrada</label>
                  <select class="form-select" id="ac-semester">
                    ${DataStore.getSemesters().map(s => `<option value="${s}" ${lead.semester === s ? 'selected' : ''}>${s}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Status Acadêmico Atual</label>
                  <select class="form-select" id="ac-status">
                    ${Utils.ACADEMIC_STATUSES.map(s => `<option value="${s}" ${lead.academicStatus === s ? 'selected' : ''}>${s}</option>`).join('')}
                  </select>
                </div>
              </div>

              <h4 style="margin-top: 16px; margin-bottom: 12px; color: var(--primary);">Classificação</h4>
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Status 1 (Geral)</label>
                  <select class="form-select" id="ac-status1">
                    <option value="">Selecione...</option>
                    ${Utils.STATUS_1.map(s => `<option value="${s}" ${lead.status1 === s ? 'selected' : ''}>${s}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Status 2 (Detalhe)</label>
                  <select class="form-select" id="ac-status2">
                    <option value="">Selecione...</option>
                    ${Utils.STATUS_2.map(s => `<option value="${s}" ${lead.status2 === s ? 'selected' : ''}>${s}</option>`).join('')}
                  </select>
                </div>
              </div>
            </form>
          </div>
        </div>

        <!-- Tab: Attendant -->
        <div class="tab-content" id="tab-attendant">
          <div class="card">
            <div class="card-header">
              <span class="card-title">Responsável pelo Atendimento</span>
            </div>
            <div class="flex items-center justify-between" style="padding: var(--spacing-4); border: 1px solid var(--border-light); border-radius: var(--radius-md);">
              <div class="flex items-center gap-4">
                ${attendants.length > 0 ? `
                  <div style="display: flex; gap: 8px;">
                    ${attendants.map(att => `<div class="avatar avatar-lg" title="${att.name}">${att.avatar}</div>`).join('')}
                  </div>
                  <div>
                    <div class="font-semibold">${attendants.map(att => att.name).join(', ')}</div>
                    <div class="text-sm text-secondary">Atribuído em: ${Utils.formatDate(lead.assignedDate)}</div>
                  </div>
                ` : `
                  <div class="avatar avatar-lg">?</div>
                  <div>
                    <div class="font-semibold">Nenhum atendente</div>
                  </div>
                `}
              </div>
              <button class="btn btn-secondary" onclick="window.LeadDetailPage.openTransferModal()">
                <i data-lucide="refresh-cw"></i> Transferir Lead
              </button>
            </div>
            
            <h4 style="margin-top: var(--spacing-6); margin-bottom: var(--spacing-4);">Histórico de Transferências</h4>
            <div class="table-container">
              <table>
                <thead>
                  <tr><th>Data</th><th>De</th><th>Para</th><th>Por</th></tr>
                </thead>
                <tbody>
                  ${lead.changelog.filter(c => c.field === 'Atendentes').map(c => `
                    <tr>
                      <td>${Utils.formatDateTime(c.timestamp)}</td>
                      <td>${c.oldValue || 'Ninguém'}</td>
                      <td>${c.newValue || 'Ninguém'}</td>
                      <td>${c.userId === 'system' ? 'Sistema' : (DataStore.getUser(c.userId)?.name || c.userId)}</td>
                    </tr>
                  `).join('') || '<tr><td colspan="4" class="text-center text-muted">Nenhuma transferência registrada.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Tab: Contracts -->
        <div class="tab-content" id="tab-contracts">
          <div class="card mb-6">
            <div class="card-header">
              <span class="card-title">Contratos</span>
              <button class="btn btn-secondary btn-sm" onclick="window.LeadDetailPage.openContractModal()"><i data-lucide="file-plus"></i> Novo Contrato</button>
            </div>
            <div class="table-container">
              <table>
                <thead>
                  <tr><th>Número</th><th>Emissão</th><th>Assinatura</th><th>Status</th></tr>
                </thead>
                <tbody>
                  ${(lead.contracts || []).map(c => `
                    <tr>
                      <td class="font-medium">${c.number}</td>
                      <td>${Utils.formatDate(c.issueDate)}</td>
                      <td>${Utils.formatDate(c.signDate) || '-'}</td>
                      <td><span class="badge ${c.status === 'Assinado' ? 'badge-success' : 'badge-warning'}">${c.status}</span></td>
                    </tr>
                  `).join('') || '<tr><td colspan="4" class="text-center text-muted">Nenhum contrato emitido.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
          
          <div class="card">
            <div class="card-header">
              <span class="card-title">Documentos Anexos</span>
              <button class="btn btn-secondary btn-sm" onclick="window.LeadDetailPage.openDocumentModal()"><i data-lucide="upload"></i> Anexar Documento</button>
            </div>
            <div class="table-container">
              <table>
                <thead>
                  <tr><th>Tipo</th><th>Nome do Arquivo</th><th>Data de Envio</th><th>Ações</th></tr>
                </thead>
                <tbody>
                  ${(lead.documents || []).map(d => `
                    <tr>
                      <td><span class="badge badge-neutral">${d.type}</span></td>
                      <td>${d.name}</td>
                      <td>${Utils.formatDateTime(d.uploadDate)}</td>
                      <td><button class="btn-icon btn-ghost"><i data-lucide="download"></i></button></td>
                    </tr>
                  `).join('') || '<tr><td colspan="4" class="text-center text-muted">Nenhum documento anexado.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  function renderTimeline(lead) {
    let items = [...(lead.interactions || [])];
    
    // Add changelog events to timeline for a unified view
    if (lead.changelog) {
      lead.changelog.forEach(log => {
        if (log.field === 'funnelStage' || log.field === 'Lead Criado') {
          items.push({
            isSystem: true,
            type: 'Sistema',
            date: log.timestamp.split('T')[0],
            time: log.timestamp.split('T')[1].substring(0,5),
            createdAt: log.timestamp,
            description: log.field === 'Lead Criado' ? 'Lead cadastrado no sistema.' : `Fase alterada para: ${log.newValue}`
          });
        }
      });
    }

    items.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (items.length === 0) return '<div class="text-muted padding-4">Nenhum histórico registrado.</div>';

    return items.map(item => {
      let icon = 'message-circle';
      let colorClass = '';
      
      if (item.isSystem) { icon = 'activity'; colorClass = 'style="background-color: var(--text-muted)"'; }
      else if (item.type === 'Ligação') icon = 'phone';
      else if (item.type === 'E-mail') icon = 'mail';
      else if (item.type === 'Atendimento Presencial') { icon = 'user-check'; colorClass = 'style="background-color: var(--info)"'; }
      else if (item.type === 'Reunião') icon = 'users';
      else if (item.type === 'Observação Interna') { icon = 'sticky-note'; colorClass = 'style="background-color: var(--warning)"'; }

      const user = item.userId ? DataStore.getUser(item.userId) : null;
      const userName = item.isSystem ? 'Sistema' : (user ? user.name : 'Desconhecido');

      return `
        <div class="timeline-item">
          <div class="timeline-dot" ${colorClass}>
            <i data-lucide="${icon}"></i>
          </div>
          <div class="timeline-content">
            <div class="timeline-header">
              <span class="font-semibold" style="color: var(--text-primary)">${item.type}</span>
              <span>${item.isSystem ? Utils.formatDateTime(item.createdAt) : Utils.formatDate(item.date) + ' às ' + item.time}</span>
            </div>
            <div class="timeline-body">
              <p>${Utils.escapeHtml(item.description)}</p>
              <div style="margin-top: 8px; font-size: 0.75rem; color: var(--text-muted);">Por: ${userName}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function init() {
    // Tabs Logic
    const tabs = document.querySelectorAll('#lead-tabs .tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active from all
        tabs.forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        // Add active to clicked
        tab.classList.add('active');
        document.getElementById(tab.getAttribute('data-target')).classList.add('active');
      });
    });
  }

  function changeStage(newStage) {
    Modal.confirm(`Mover lead para a fase <strong>${newStage}</strong>?`, () => {
      DataStore.updateLeadStage(currentLeadId, newStage);
      Toast.success('Fase atualizada com sucesso');
      window.App.navigate(`lead-detail/${currentLeadId}`, true); // force reload
    });
  }

  function openInteractionModal() {
    Modal.show({
      title: 'Registrar Interação',
      content: `
        <div class="form-group">
          <label class="form-label">Tipo de Interação</label>
          <select class="form-select" id="int-type">
            <option value="WhatsApp">WhatsApp</option>
            <option value="Ligação">Ligação</option>
            <option value="E-mail">E-mail</option>
            <option value="Atendimento Presencial">Atendimento Presencial</option>
            <option value="Reunião">Reunião</option>
            <option value="Observação Interna">Observação Interna</option>
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Data</label>
            <input type="date" class="form-input" id="int-date" value="${new Date().toLocaleString('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' })}">
          </div>
          <div class="form-group">
            <label class="form-label">Hora</label>
            <input type="time" class="form-input" id="int-time" value="${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false })}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Descrição</label>
          <textarea class="form-textarea" id="int-desc" placeholder="Detalhes do atendimento..."></textarea>
        </div>
      `,
      footer: `
        <button class="btn btn-ghost" onclick="Modal.hide()">Cancelar</button>
        <button class="btn btn-primary" onclick="window.LeadDetailPage.saveInteraction()">Salvar</button>
      `
    });
  }

  function saveInteraction() {
    const data = {
      type: document.getElementById('int-type').value,
      date: document.getElementById('int-date').value,
      time: document.getElementById('int-time').value,
      description: document.getElementById('int-desc').value
    };
    if(!data.description) { Toast.warning('A descrição é obrigatória'); return; }
    
    DataStore.addInteraction(currentLeadId, data);
    Modal.hide();
    Toast.success('Interação registrada!');
    window.App.navigate(`lead-detail/${currentLeadId}`, true);
  }

  function savePersonalData() {
    const data = {
      name: document.getElementById('pd-name').value,
      email: document.getElementById('pd-email').value,
      cpf: document.getElementById('pd-cpf').value,
      rg: document.getElementById('pd-rg').value,
      phone: document.getElementById('pd-phone').value,
      whatsapp: document.getElementById('pd-whatsapp').value,
      birthDate: document.getElementById('pd-birth').value,
      contactDate: document.getElementById('pd-contact-date').value,
      origin: document.getElementById('pd-origin').value,
      city: document.getElementById('pd-city').value,
      state: document.getElementById('pd-state').value,
      baseName: document.getElementById('pd-base-name').value,
      observation: document.getElementById('pd-observation').value,
    };
    DataStore.updateLead(currentLeadId, data);
    Toast.success('Dados salvos com sucesso!');
  }

  function saveAcademicData() {
    const data = {
      course: document.getElementById('ac-course').value,
      modality: document.getElementById('ac-modality').value,
      semester: document.getElementById('ac-semester').value,
      academicStatus: document.getElementById('ac-status').value,
      status1: document.getElementById('ac-status1').value,
      status2: document.getElementById('ac-status2').value
    };
    DataStore.updateLead(currentLeadId, data);
    Toast.success('Dados acadêmicos atualizados!');
  }

  function openTransferModal() {
    const attendants = DataStore.getUsers().filter(u => u.role === 'Comercial' || u.role === 'Administrador');
    const lead = DataStore.getLead(currentLeadId);
    const currentIds = lead.attendantIds || [];
    Modal.show({
      title: 'Transferir / Atribuir Lead',
      content: `
        <div class="form-group">
          <label class="form-label">Selecione os atendentes responsáveis:</label>
          <select class="form-select" id="trans-attendant" multiple style="height: 100px;">
            ${attendants.map(u => `<option value="${u.id}" ${currentIds.includes(u.id) ? 'selected' : ''}>${u.name}</option>`).join('')}
          </select>
          <small style="color: var(--text-muted); font-size: 0.75rem;">Segure Ctrl (ou Cmd) para selecionar múltiplos</small>
        </div>
      `,
      footer: `
        <button class="btn btn-ghost" onclick="Modal.hide()">Cancelar</button>
        <button class="btn btn-primary" onclick="window.LeadDetailPage.executeTransfer()">Atribuir</button>
      `
    });
  }

  function executeTransfer() {
    const selectedOptions = document.getElementById('trans-attendant').selectedOptions;
    const newIds = Array.from(selectedOptions).map(opt => opt.value);
    DataStore.updateLead(currentLeadId, { attendantIds: newIds });
    Modal.hide();
    Toast.success('Lead transferido!');
    window.App.navigate(`lead-detail/${currentLeadId}`, true);
  }

  function openContractModal() {
    Modal.show({
      title: 'Gerar Novo Contrato',
      content: `
        <div class="form-group">
          <label class="form-label">Status Inicial</label>
          <select class="form-select" id="ctr-status">
            <option value="Pendente">Pendente</option>
            <option value="Enviado">Enviado</option>
            <option value="Assinado">Assinado</option>
          </select>
        </div>
      `,
      footer: `
        <button class="btn btn-ghost" onclick="Modal.hide()">Cancelar</button>
        <button class="btn btn-primary" onclick="window.LeadDetailPage.saveContract()">Gerar</button>
      `
    });
  }

  function saveContract() {
    const status = document.getElementById('ctr-status').value;
    DataStore.addContract(currentLeadId, {
      number: 'CTR-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000),
      issueDate: new Date().toISOString().split('T')[0],
      signDate: status === 'Assinado' ? new Date().toISOString().split('T')[0] : '',
      status: status
    });
    Modal.hide();
    Toast.success('Contrato gerado!');
    window.App.navigate(`lead-detail/${currentLeadId}`, true);
  }

  function openDocumentModal() {
    Modal.show({
      title: 'Anexar Documento',
      content: `
        <div class="form-group">
          <label class="form-label">Tipo de Documento</label>
          <select class="form-select" id="doc-type">
            <option value="RG">RG</option>
            <option value="CPF">CPF</option>
            <option value="Comprovante de Residência">Comprovante de Residência</option>
            <option value="Histórico Escolar">Histórico Escolar</option>
            <option value="Contrato Assinado">Contrato Assinado</option>
            <option value="Outros">Outros</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Arquivo</label>
          <input type="file" class="form-input" id="doc-file">
          <small class="text-muted">Simulação: O arquivo não será salvo no disco.</small>
        </div>
      `,
      footer: `
        <button class="btn btn-ghost" onclick="Modal.hide()">Cancelar</button>
        <button class="btn btn-primary" onclick="window.LeadDetailPage.saveDocument()">Upload</button>
      `
    });
  }

  function saveDocument() {
    const fileInput = document.getElementById('doc-file');
    if(!fileInput.files || fileInput.files.length === 0) {
      Toast.warning('Selecione um arquivo.');
      return;
    }
    const type = document.getElementById('doc-type').value;
    DataStore.addDocument(currentLeadId, {
      type: type,
      name: fileInput.files[0].name
    });
    Modal.hide();
    Toast.success('Documento anexado!');
    window.App.navigate(`lead-detail/${currentLeadId}`, true);
  }

  return {
    render,
    init,
    changeStage,
    openInteractionModal,
    saveInteraction,
    savePersonalData,
    saveAcademicData,
    openTransferModal,
    executeTransfer,
    openContractModal,
    saveContract,
    openDocumentModal,
    saveDocument
  };
})();
