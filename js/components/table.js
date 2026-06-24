// js/components/table.js

window.DataTable = (function() {
  
  function render(config) {
    // config = { id, columns: [{key, label, width?, render?, sortable?}], data: [], actions: [{icon, title, onClickClass}], selectable, emptyMessage }
    
    if (!config.data || config.data.length === 0) {
      return `
        <div class="empty-state">
          <i data-lucide="inbox" style="width: 64px; height: 64px; color: var(--border);"></i>
          <h3>Nenhum dado encontrado</h3>
          <p>${config.emptyMessage || 'Não há registros para exibir no momento.'}</p>
        </div>
      `;
    }

    let theadHtml = '<tr>';
    if (config.selectable) {
      theadHtml += `<th style="width: 40px"><input type="checkbox" id="selectAll-${config.id}"></th>`;
    }
    
    config.columns.forEach(col => {
      const widthAttr = col.width ? `style="width: ${col.width}"` : '';
      const sortClass = col.sortable ? 'class="sortable" style="cursor: pointer"' : '';
      theadHtml += `<th data-key="${col.key}" ${widthAttr} ${sortClass}>
        <div class="flex items-center gap-1">
          ${col.label}
          ${col.sortable ? '<i data-lucide="arrow-up-down" style="width: 12px; height: 12px; opacity: 0.5"></i>' : ''}
        </div>
      </th>`;
    });

    if ((config.actions && config.actions.length > 0) || config.renderActions) {
      theadHtml += `<th style="width: 140px; text-align: right;">Ações</th>`;
    }
    theadHtml += '</tr>';

    let tbodyHtml = '';
    config.data.forEach(row => {
      tbodyHtml += `<tr data-id="${row.id}">`;
      
      if (config.selectable) {
        tbodyHtml += `<td><input type="checkbox" class="row-select-${config.id}" value="${row.id}"></td>`;
      }

      config.columns.forEach(col => {
        let cellValue = row[col.key];
        if (col.render) {
          cellValue = col.render(cellValue, row);
        } else {
          cellValue = Utils.escapeHtml(String(cellValue || ''));
        }
        tbodyHtml += `<td>${cellValue}</td>`;
      });

      if ((config.actions && config.actions.length > 0) || config.renderActions) {
        tbodyHtml += `<td style="text-align: right;">
          <div class="flex justify-end gap-1" style="align-items: center;">
            ${config.renderActions ? config.renderActions(row) : config.actions.map(action => `
              <button class="btn-icon btn-ghost ${action.onClickClass}" data-id="${row.id}" title="${action.title}">
                <i data-lucide="${action.icon}"></i>
              </button>
            `).join('')}
          </div>
        </td>`;
      }
      
      tbodyHtml += '</tr>';
    });

    return `
      <div class="table-container">
        <table id="${config.id}">
          <thead>${theadHtml}</thead>
          <tbody>${tbodyHtml}</tbody>
        </table>
      </div>
    `;
  }

  function getSelectedIds(tableId) {
    const checkboxes = document.querySelectorAll(`.row-select-${tableId}:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
  }

  function initSelectAll(tableId) {
    const selectAll = document.getElementById(`selectAll-${tableId}`);
    if (selectAll) {
      selectAll.addEventListener('change', (e) => {
        const checkboxes = document.querySelectorAll(`.row-select-${tableId}`);
        checkboxes.forEach(cb => cb.checked = e.target.checked);
      });
    }
  }

  return {
    render,
    getSelectedIds,
    initSelectAll
  };
})();
