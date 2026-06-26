// js/pages/agenda.js

window.AgendaPage = (function() {

  function canEdit() {
    const user = DataStore.getCurrentUser();
    return user && (user.role === 'Marketing' || user.role === 'Administrador');
  }

  function render() {
    const isEditor = canEdit();
    return `
      <div class="page-container" style="max-width: 1000px; margin: 0 auto;">
        <div class="page-header" style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px;">
          <div class="page-title">
            <h1>Agenda de Eventos</h1>
            <p>Acompanhe os próximos eventos, campanhas e ações do Marketing.</p>
          </div>
          ${isEditor ? `
            <div class="page-actions">
              <button class="btn btn-primary" id="btn-new-event">
                <i data-lucide="plus"></i> Novo Evento
              </button>
            </div>
          ` : ''}
        </div>

        <div class="card">
          <div id="events-list" style="display: flex; flex-direction: column; gap: 16px;">
            <!-- Renderizado via JS -->
          </div>
        </div>
      </div>
    `;
  }

  function init() {
    renderEvents();

    const btnNew = document.getElementById('btn-new-event');
    if (btnNew) {
      btnNew.addEventListener('click', () => openEventModal());
    }

    // Use global events to re-render if needed
    window.App.on('event_updated', () => renderEvents());
  }

  function renderEvents() {
    const eventsList = document.getElementById('events-list');
    if (!eventsList) return;

    let events = DataStore.getEvents();
    
    // Sort events by exactDate ascending
    events.sort((a, b) => new Date(a.exactDate || '2099-01-01') - new Date(b.exactDate || '2099-01-01'));

    if (events.length === 0) {
      eventsList.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <div style="display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; border-radius: 50%; background: var(--bg-body); color: var(--text-secondary); margin-bottom: 16px;">
            <i data-lucide="calendar" style="width: 32px; height: 32px;"></i>
          </div>
          <h3>Nenhum evento agendado</h3>
          <p>A agenda está vazia no momento.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const isEditor = canEdit();
    let html = '';

    // Group by month/year
    let currentGroup = '';

    events.forEach(ev => {
      // Use exactDate to group by month
      const dateObj = ev.exactDate ? new Date(ev.exactDate + 'T00:00:00') : new Date(); 
      const monthYear = dateObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
      
      if (monthYear !== currentGroup) {
        currentGroup = monthYear;
        html += `<h3 style="color: var(--primary); margin: 24px 0 8px; font-size: 1rem; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">${currentGroup}</h3>`;
      }

      let statusBadge = ev.status === 'Realizado' 
        ? '<span class="badge badge-success">Realizado</span>' 
        : '<span class="badge badge-warning">Pendente</span>';

      html += `
        <div style="display: flex; gap: 16px; align-items: stretch; background: var(--bg-body); border-radius: 8px; border: 1px solid var(--border-light); padding: 16px; transition: transform 0.2s, box-shadow 0.2s;" class="event-card hover-lift">
          
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 4px;">
              <h4 style="margin: 0; font-size: 1.1rem; color: var(--text-primary);">${Utils.escapeHtml(ev.title)}</h4>
              ${statusBadge}
            </div>
            
            <div style="display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 8px;">
              <span style="font-size: 0.9rem; font-weight: 500; color: var(--primary); display: flex; align-items: center; gap: 4px;"><i data-lucide="calendar" style="width: 16px; height: 16px;"></i> ${Utils.escapeHtml(ev.dateText || '')}</span>
              ${ev.location ? `<span style="font-size: 0.85rem; color: var(--text-muted); display: flex; align-items: center; gap: 4px;"><i data-lucide="map-pin" style="width: 14px; height: 14px;"></i> ${Utils.escapeHtml(ev.location)}</span>` : ''}
            </div>
            ${ev.description ? `<p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary); line-height: 1.4;">${Utils.escapeHtml(ev.description).replace(/\n/g, '<br>')}</p>` : ''}
          </div>

          ${isEditor ? `
            <div style="display: flex; flex-direction: column; gap: 8px; justify-content: center; padding-left: 16px; border-left: 1px solid var(--border-light);">
              <button class="btn-icon btn-ghost btn-edit-event" data-id="${ev.id}" title="Editar" style="color: var(--text-secondary);"><i data-lucide="edit-2"></i></button>
              <button class="btn-icon btn-ghost text-error btn-delete-event" data-id="${ev.id}" title="Excluir"><i data-lucide="trash-2"></i></button>
            </div>
          ` : ''}
        </div>
      `;
    });

    eventsList.innerHTML = html;

    if (window.lucide) window.lucide.createIcons();

    if (isEditor) {
      document.querySelectorAll('.btn-edit-event').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          openEventModal(id);
        });
      });

      document.querySelectorAll('.btn-delete-event').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const id = e.currentTarget.getAttribute('data-id');
          Modal.confirm('Tem certeza que deseja excluir este evento?', () => {
            DataStore.deleteEvent(id);
            window.App.emit('toast', { type: 'success', message: 'Evento excluído com sucesso.' });
            renderEvents();
          });
        });
      });
    }
  }

  function openEventModal(id = null) {
    const isEdit = !!id;
    let ev = { title: '', dateText: '', exactDate: '', location: '', description: '', status: 'Pendente' };
    
    if (isEdit) {
      const allEvents = DataStore.getEvents();
      const found = allEvents.find(e => e.id === id);
      if (found) ev = found;
    }

    const html = `
      <form id="event-form" class="event-form">
        <div class="form-group">
          <label class="form-label">Nome do Evento *</label>
          <input type="text" id="ev-title" class="form-input" required value="${Utils.escapeHtml(ev.title)}">
        </div>
        
        <div style="display: flex; gap: 16px; margin-bottom: 16px;">
          <div style="flex: 2;">
            <label class="form-label">Data (Texto livre) *</label>
            <input type="text" id="ev-date-text" class="form-input" placeholder="Ex: 27 a 30/07" required value="${Utils.escapeHtml(ev.dateText || '')}">
          </div>
          <div style="flex: 1;">
            <label class="form-label" title="Data real para alertas e organização">Data Base *</label>
            <input type="date" id="ev-exact-date" class="form-input" required value="${ev.exactDate || ''}">
          </div>
        </div>

        <div style="display: flex; gap: 16px; margin-bottom: 16px;">
          <div style="flex: 2;">
            <label class="form-label">Local</label>
            <input type="text" id="ev-location" class="form-input" value="${Utils.escapeHtml(ev.location || '')}">
          </div>
          <div style="flex: 1;">
            <label class="form-label">Status</label>
            <select id="ev-status" class="form-input">
              <option value="Pendente" ${ev.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
              <option value="Realizado" ${ev.status === 'Realizado' ? 'selected' : ''}>Realizado</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Descrição / Observações</label>
          <textarea id="ev-desc" class="form-input" rows="3">${Utils.escapeHtml(ev.description || '')}</textarea>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
          <button type="button" class="btn btn-secondary" onclick="Modal.hide()">Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? 'Salvar Alterações' : 'Criar Evento'}</button>
        </div>
      </form>
    `;

    Modal.show({
      title: isEdit ? 'Editar Evento' : 'Novo Evento',
      content: html
    });

    document.getElementById('event-form').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const exactDateVal = document.getElementById('ev-exact-date').value;
      const eventData = {
        title: document.getElementById('ev-title').value.trim(),
        dateText: document.getElementById('ev-date-text').value.trim(),
        exactDate: exactDateVal,
        location: document.getElementById('ev-location').value.trim(),
        status: document.getElementById('ev-status').value,
        description: document.getElementById('ev-desc').value.trim()
      };

      if (isEdit) {
        DataStore.updateEvent(id, eventData);
        window.App.emit('toast', { type: 'success', message: 'Evento atualizado.' });
      } else {
        DataStore.addEvent(eventData);
        window.App.emit('toast', { type: 'success', message: 'Evento criado.' });
      }

      Modal.hide();
      renderEvents();
    });
  }

  return { render, init };
})();
