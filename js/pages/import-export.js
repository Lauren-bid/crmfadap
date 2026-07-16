// js/pages/import-export.js

window.ImportExportPage = (function() {

  let importedData = [];

  function render() {
    return `
      <div class="page-container">
        <div class="page-header">
          <div class="page-title">
            <h1>Importar e Exportar Dados</h1>
            <p>Gerencie dados em massa via planilhas (XLSX, CSV)</p>
          </div>
        </div>

        <div class="grid-2">
          
          <!-- IMPORT SECTION -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">Importar Leads</span>
            </div>
            <div style="margin-bottom: var(--spacing-4);">
              <p class="text-sm text-secondary mb-4">Faça upload de uma planilha do Excel (.xlsx) ou arquivo CSV para importar novos leads.<br>Colunas esperadas: <strong>Nome</strong>, <strong>Telefone</strong>, <strong>Curso de Interesse</strong>.</p>
              
              <div class="form-group" style="margin-bottom: 1rem;">
                <input type="file" id="import-file" accept=".xlsx,.csv" class="form-input" style="padding: 6px;">
              </div>

              <!-- Status da leitura do arquivo -->
              <div id="import-status" class="hidden" style="padding: 10px; border-radius: var(--radius-sm); margin-bottom: 1rem; font-size: 0.85rem;"></div>

              <!-- Botão IMPORTAR – aparece após selecionar arquivo -->
              <button class="btn btn-primary w-full hidden" id="import-btn" style="padding: 14px; font-size: 1rem; font-weight: 700; letter-spacing: 0.5px;">
                <i data-lucide="upload"></i> IMPORTAR LEADS
              </button>
            </div>

            <div id="import-preview-container" class="hidden">
              <h4 class="mb-2" style="font-size: 0.85rem; color: var(--text-muted);">Preview dos Leads</h4>
              <div id="import-table-wrapper" style="margin-bottom: var(--spacing-4); border: 1px solid var(--border-light); border-radius: var(--radius-sm); overflow-x: auto;">
                <!-- Preview table generated here -->
              </div>
            </div>
          </div>

          <!-- EXPORT SECTION -->
          <div class="card">
            <div class="card-header">
              <span class="card-title">Exportar Dados</span>
            </div>
            <div style="margin-bottom: var(--spacing-4);">
              <p class="text-sm text-secondary mb-4">Exporte a base de leads atual de acordo com os filtros selecionados.</p>
              
              <div class="form-row mb-4">
                <div class="form-group">
                  <label class="form-label">Fase do Funil</label>
                  <select class="form-select" id="export-stage">
                    <option value="">Todas as Fases</option>
                    ${DataStore.getFunnelStages().map(s => `<option value="${s}">${s}</option>`).join('')}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Curso</label>
                  <select class="form-select" id="export-course">
                    <option value="">Todos os Cursos</option>
                    ${Utils.COURSES.map(c => `<option value="${c}">${c}</option>`).join('')}
                  </select>
                </div>
              </div>

              <div class="flex-col gap-3">
                <button class="btn btn-secondary w-full" id="export-xlsx-btn">
                  <i data-lucide="file-spreadsheet"></i> Exportar para Excel (.xlsx)
                </button>
                <button class="btn btn-secondary w-full" id="export-csv-btn">
                  <i data-lucide="file-text"></i> Exportar para CSV
                </button>
                <button class="btn btn-secondary w-full" id="export-pdf-btn">
                  <i data-lucide="file"></i> Exportar para PDF
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;
  }

  function init() {
    // Import Logic
    const fileInput = document.getElementById('import-file');
    if (fileInput) {
      // Clear value on click so 'change' fires even if selecting the same file
      fileInput.addEventListener('click', (e) => e.target.value = null);
      fileInput.addEventListener('change', handleFileUpload);
    }

    const importBtn = document.getElementById('import-btn');
    if (importBtn) {
      importBtn.addEventListener('click', executeImport);
    }

    // Export Logic
    document.getElementById('export-xlsx-btn').addEventListener('click', () => exportData('xlsx'));
    document.getElementById('export-csv-btn').addEventListener('click', () => exportData('csv'));
    document.getElementById('export-pdf-btn').addEventListener('click', () => exportData('pdf'));
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const statusEl = document.getElementById('import-status');
    if (statusEl) {
      statusEl.classList.remove('hidden');
      statusEl.style.background = 'var(--bg-tertiary)';
      statusEl.style.color = 'var(--text-secondary)';
      statusEl.innerHTML = '<i data-lucide="loader" style="width:14px;height:14px;display:inline;"></i> Lendo arquivo: <strong>' + file.name + '</strong>...';
      if (window.lucide) lucide.createIcons();
    }

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = window.XLSX.read(data, {type: 'array'});
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const json = window.XLSX.utils.sheet_to_json(worksheet, {header: 1}); // Array of arrays
        
        if (json.length > 1) {
          processExcelData(json);
        } else {
          Toast.error('A planilha parece estar vazia ou em formato incorreto.');
          if (statusEl) {
            statusEl.style.background = 'rgba(220,53,69,0.1)';
            statusEl.style.color = '#dc3545';
            statusEl.textContent = 'Erro: planilha vazia ou formato incorreto.';
          }
        }
      } catch (err) {
        console.error("Erro ao ler a planilha:", err);
        Toast.error('Erro ao ler a planilha. O arquivo pode estar corrompido ou num formato não suportado.');
        if (statusEl) {
          statusEl.style.background = 'rgba(220,53,69,0.1)';
          statusEl.style.color = '#dc3545';
          statusEl.textContent = 'Erro ao ler: ' + (err.message || 'formato não suportado');
        }
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function processExcelData(data) {
    // data[0] is headers
    const headers = data[0].map(h => String(h).trim().toLowerCase());
    
    // Map columns heuristically
    const map = {
      name: headers.findIndex(h => h.includes('nome')),
      email: headers.findIndex(h => h.includes('email') || h.includes('e-mail')),
      phone: headers.findIndex(h => h.includes('telefone') || h.includes('celular') || h.includes('whatsapp') || h.includes('fone') || h.includes('tel')),
      cpf: headers.findIndex(h => h.includes('cpf')),
      course: headers.findIndex(h => h.includes('curso') || h.includes('interesse')),
      origin: headers.findIndex(h => h.includes('origem') || h.includes('canal')),
      city: headers.findIndex(h => h.includes('cidade')),
      modality: headers.findIndex(h => h.includes('modalidade')),
      observation: headers.findIndex(h => h.includes('obs')),
      contactDate: headers.findIndex(h => h.includes('data de contato') || h.includes('data contato')),
      baseName: headers.findIndex(h => h.includes('base') || h.includes('campanha')),
      funnelStage: headers.findIndex(h => h.includes('fase') || h.includes('funil') || h.includes('status do lead')),
      status1: headers.findIndex(h => h.includes('status 1')),
      status2: headers.findIndex(h => h.includes('status 2'))
    };

    if (map.name === -1) {
      Toast.error('Não foi possível encontrar a coluna "NOME" na primeira linha da planilha.');
      return;
    }

    importedData = [];
    const previewRows = [];

    // Helper: normaliza telefone da planilha (pode vir como número)
    const normalizePhone = (val) => {
      if (val === undefined || val === null) return '';
      let str = String(val).trim();
      str = str.replace(/\D/g, '');
      if (str.length === 13 && str.startsWith('55')) str = str.substring(2);
      return str;
    };

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0 || !row[map.name]) continue;

      const safeString = (val) => val === undefined || val === null ? '' : String(val).trim();
      
      const rawCourse = map.course !== -1 ? safeString(row[map.course]) : '';
      const phone = map.phone !== -1 ? normalizePhone(row[map.phone]) : '';

      const lead = {
        name: safeString(row[map.name]),
        email: map.email !== -1 ? safeString(row[map.email]) : '',
        phone: phone,
        cpf: map.cpf !== -1 ? safeString(row[map.cpf]) : '',
        course: rawCourse,
        origin: map.origin !== -1 ? safeString(row[map.origin]) : '',
        city: map.city !== -1 ? safeString(row[map.city]) : '',
        modality: map.modality !== -1 ? safeString(row[map.modality]) : '',
        observation: map.observation !== -1 ? safeString(row[map.observation]) : '',
        contactDate: map.contactDate !== -1 ? safeString(row[map.contactDate]) : '',
        baseName: map.baseName !== -1 ? safeString(row[map.baseName]) : '',
        funnelStage: map.funnelStage !== -1 ? safeString(row[map.funnelStage]) : '',
        status1: map.status1 !== -1 ? safeString(row[map.status1]) : '',
        status2: map.status2 !== -1 ? safeString(row[map.status2]) : ''
      };

      importedData.push(lead);
      if (previewRows.length < 10) previewRows.push(lead);
    }

    if (importedData.length === 0) {
      Toast.warning('Nenhum dado válido encontrado para importar.');
      return;
    }

    // --- Mostrar o botão IMPORTAR ---
    const importBtn = document.getElementById('import-btn');
    if (importBtn) {
      importBtn.classList.remove('hidden');
      importBtn.innerHTML = '<i data-lucide="upload"></i> IMPORTAR ' + importedData.length + ' LEADS';
      if (window.lucide) lucide.createIcons();
    }

    // --- Status ---
    const statusEl = document.getElementById('import-status');
    if (statusEl) {
      statusEl.classList.remove('hidden');
      statusEl.style.background = 'rgba(40,167,69,0.1)';
      statusEl.style.color = '#28a745';
      const colsDetected = [];
      if (map.name !== -1) colsDetected.push('Nome');
      if (map.phone !== -1) colsDetected.push('Telefone');
      if (map.course !== -1) colsDetected.push('Curso');
      if (map.email !== -1) colsDetected.push('E-mail');
      statusEl.innerHTML = '✅ <strong>' + importedData.length + ' leads</strong> encontrados. Colunas detectadas: ' + colsDetected.join(', ') + '.';
    }

    // Render Preview
    const previewContainer = document.getElementById('import-preview-container');
    const tableWrapper = document.getElementById('import-table-wrapper');

    let tableHtml = '<table style="width: 100%; white-space: nowrap; font-size: 0.75rem;"><thead><tr>';
    tableHtml += '<th style="padding:6px 8px;">#</th><th style="padding:6px 8px;">Nome</th><th style="padding:6px 8px;">Telefone</th>';
    if (map.email !== -1) tableHtml += '<th style="padding:6px 8px;">E-mail</th>';
    tableHtml += '<th style="padding:6px 8px;">Curso (planilha)</th><th style="padding:6px 8px;">Curso (reconhecido)</th>';
    tableHtml += '</tr></thead><tbody>';
    
    previewRows.forEach((r, idx) => {
      // Tenta casar o curso usando o matchCourse do DataStore (com fallback seguro)
      let matchedCourse = r.course || '-';
      let isCourseMatched = false;
      try {
        if (r.course && DataStore._matchCourse) {
          matchedCourse = DataStore._matchCourse(r.course);
          isCourseMatched = matchedCourse && Utils.COURSES.includes(matchedCourse);
        }
      } catch(e) {
        console.warn('matchCourse fallback:', e);
      }

      const courseIcon = isCourseMatched 
        ? '<span style="color: #28a745; margin-right: 4px;" title="Curso reconhecido">✓</span>'
        : (r.course ? '<span style="color: #ffc107; margin-right: 4px;" title="Curso será importado como está">⚠</span>' : '');
      const phoneFormatted = r.phone ? Utils.formatPhone(r.phone) : '-';

      tableHtml += `<tr style="border-bottom: 1px solid var(--border-light);">
        <td style="padding:6px 8px; color: var(--text-muted);">${idx + 1}</td>
        <td style="padding:6px 8px;"><strong>${r.name || '-'}</strong></td>
        <td style="padding:6px 8px;">${phoneFormatted}</td>`;
      if (map.email !== -1) tableHtml += `<td style="padding:6px 8px;">${r.email || '-'}</td>`;
      tableHtml += `<td style="padding:6px 8px; font-size: 0.7rem; color: var(--text-muted);">${r.course || '-'}</td>
        <td style="padding:6px 8px;">${courseIcon}${isCourseMatched ? matchedCourse : (r.course || '-')}</td>
      </tr>`;
    });

    if (importedData.length > 10) {
      const colSpan = map.email !== -1 ? 7 : 6;
      tableHtml += `<tr><td colspan="${colSpan}" style="text-align: center; color: var(--text-muted); padding: 8px;">... e mais ${importedData.length - 10} leads</td></tr>`;
    }
    tableHtml += '</tbody></table>';

    tableWrapper.innerHTML = tableHtml;
    previewContainer.classList.remove('hidden');
    Toast.success(`Planilha lida: ${importedData.length} leads prontos para importar!`);
  }

  function executeImport() {
    if (importedData.length === 0) return;
    
    const count = importedData.length;

    // Execute import to datastore
    DataStore.importLeads(importedData);
    Toast.success(`${count} leads importados com sucesso! Eles já estão disponíveis em "Todos os Leads" e no Kanban.`);
    
    // Reset inputs
    document.getElementById('import-file').value = '';
    document.getElementById('import-preview-container').classList.add('hidden');
    
    const importBtn = document.getElementById('import-btn');
    if (importBtn) importBtn.classList.add('hidden');

    const statusEl = document.getElementById('import-status');
    if (statusEl) {
      statusEl.style.background = 'rgba(40,167,69,0.1)';
      statusEl.style.color = '#28a745';
      statusEl.innerHTML = '✅ <strong>' + count + ' leads importados com sucesso!</strong> Disponíveis em Todos os Leads e Kanban.';
    }

    importedData = [];
  }

  function exportData(format) {
    const filters = {
      funnelStage: document.getElementById('export-stage').value,
      course: document.getElementById('export-course').value
    };

    const data = DataStore.exportLeadsData(filters);
    
    if (data.length === 0) {
      Toast.warning('Não há dados para exportar com os filtros atuais.');
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Leads_Unifadap_${dateStr}`;

    if (format === 'xlsx') {
      const ws = window.XLSX.utils.json_to_sheet(data);
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, "Leads");
      window.XLSX.writeFile(wb, `${filename}.xlsx`);
      Toast.success('Excel exportado com sucesso!');
    } 
    else if (format === 'csv') {
      const ws = window.XLSX.utils.json_to_sheet(data);
      const csv = window.XLSX.utils.sheet_to_csv(ws);
      Utils.downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
      Toast.success('CSV exportado com sucesso!');
    }
    else if (format === 'pdf') {
      const doc = new window.jspdf.jsPDF('l', 'pt', 'a4'); // landscape
      
      // We need to define columns manually for AutoTable
      const columns = ["Nome", "Telefone", "Origem", "Curso", "Fase do Funil", "Atendente", "Data"];
      const rows = data.map(d => [
        d['Nome'], d['Telefone'], d['Origem'], d['Curso'], d['Fase do Funil'], d['Atendente'], d['Data de Cadastro']
      ]);

      doc.setFontSize(18);
      doc.text("Relatório de Leads - CRM Unifadap", 40, 40);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} - Total: ${data.length} leads`, 40, 60);

      doc.autoTable({
        head: [columns],
        body: rows,
        startY: 80,
        theme: 'striped',
        headStyles: { fillColor: '#9B1B30' },
        styles: { fontSize: 8, cellPadding: 4 }
      });

      doc.save(`${filename}.pdf`);
      Toast.success('PDF exportado com sucesso!');
    }
  }

  return {
    render,
    init
  };
})();
