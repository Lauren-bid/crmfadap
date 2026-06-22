// js/components/filters.js

window.Filters = (function() {
  
  function render(config) {
    // config = { id, fields: [{key, label, type, options, placeholder}] }
    
    const fieldsHtml = config.fields.map(field => {
      if (field.type === 'select') {
        return `
          <div class="filter-item">
            <label class="form-label">${field.label}</label>
            <select class="form-select filter-input" data-key="${field.key}">
              <option value="">Todos</option>
              ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
            </select>
          </div>
        `;
      } else {
        // Text input default
        return `
          <div class="filter-item">
            <label class="form-label">${field.label}</label>
            <input type="text" class="form-input filter-input" data-key="${field.key}" placeholder="${field.placeholder || ''}">
          </div>
        `;
      }
    }).join('');

    return `
      <div class="filters-bar" id="${config.id}">
        ${fieldsHtml}
        <div class="filter-item" style="flex: 0 0 auto; display: flex; align-items: flex-end;">
          <button class="btn btn-secondary w-full" id="clear-filters-${config.id}">Limpar Filtros</button>
        </div>
      </div>
    `;
  }

  function getValues(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return {};
    
    const values = {};
    const inputs = container.querySelectorAll('.filter-input');
    inputs.forEach(input => {
      const val = input.value.trim();
      if (val !== '') {
        values[input.getAttribute('data-key')] = val;
      }
    });
    return values;
  }

  function clear(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const inputs = container.querySelectorAll('.filter-input');
    inputs.forEach(input => {
      input.value = '';
    });
  }

  function init(containerId, onChangeCallback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Listen to changes on inputs
    const inputs = container.querySelectorAll('.filter-input');
    inputs.forEach(input => {
      if (input.tagName === 'SELECT') {
        input.addEventListener('change', () => onChangeCallback(getValues(containerId)));
      } else {
        input.addEventListener('input', Utils.debounce(() => {
          onChangeCallback(getValues(containerId));
        }, 400));
      }
    });

    // Clear button
    const clearBtn = document.getElementById(`clear-filters-${containerId}`);
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        clear(containerId);
        onChangeCallback({});
      });
    }
  }

  return {
    render,
    getValues,
    clear,
    init
  };
})();
