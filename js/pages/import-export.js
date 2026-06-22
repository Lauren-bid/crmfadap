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
              <p class="text-sm text-secondary mb-4">Faça upload de uma planilha do Excel (.xlsx) ou arquivo CSV para importar novos leads. O sistema tentará mapear as colunas automaticamente.</p>
              
              <div class="form-group">
                <input type="file" id="import-file" accept=".xlsx,.csv" class="form-input" style="padding: 6px;">
              </div>
            </div>

            <div id="import-preview-container" class="hidden">
              <h4 class="mb-2">Preview dos Dados (Primeiras 5 linhas)</h4>
              <div id="import-table-wrapper" style="margin-bottom: var(--spacing-4); border: 1px solid var(--border-light); border-radius: var(--radius-sm); overflow-x: auto;">
                <!-- Preview table generated here -->
              </div>
              <button class="btn btn-primary w-full" id="import-btn">Importar <span id="import-count"></span> Leads</button>
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

    const reader = new FileReader();
    reader.onload = function(e) {
      const data = new Uint8Array(e.target.result);
      const workbook = window.XLSX.read(data, {type: 'array'});
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      const json = window.XLSX.utils.sheet_to_json(worksheet, {header: 1}); // Array of arrays
      
      if (json.length > 1) {
        processExcelData(json);
      } else {
        Toast.error('A planilha parece estar vazia ou em formato incorreto.');
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
      phone: headers.findIndex(h => h.includes('telefone') || h.includes('celular') || h.includes('whatsapp')),
      cpf: headers.findIndex(h => h.includes('cpf')),
      course: headers.findIndex(h => h.includes('curso')),
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
      Toast.error('Não foi possível encontrar uma coluna de "Nome" na planilha.');
      return;
    }

    importedData = [];
    const previewRows = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length === 0 || !row[map.name]) continue;

      const lead = {
        name: row[map.name],
        email: map.email !== -1 ? row[map.email] : '',
        phone: map.phone !== -1 ? row[map.phone] : '',
        cpf: map.cpf !== -1 ? row[map.cpf] : '',
        course: map.course !== -1 ? row[map.course] : '',
        origin: map.origin !== -1 ? row[map.origin] : '',
        city: map.city !== -1 ? row[map.city] : '',
        modality: map.modality !== -1 ? row[map.modality] : '',
        observation: map.observation !== -1 ? row[map.observation] : '',
        contactDate: map.contactDate !== -1 ? row[map.contactDate] : '',
        baseName: map.baseName !== -1 ? row[map.baseName] : '',
        funnelStage: map.funnelStage !== -1 ? row[map.funnelStage] : '',
        status1: map.status1 !== -1 ? row[map.status1] : '',
        status2: map.status2 !== -1 ? row[map.status2] : ''
      };

      importedData.push(lead);
      if (previewRows.length < 5) previewRows.push(lead);
    }

    // Render Preview
    const previewContainer = document.getElementById('import-preview-container');
    const tableWrapper = document.getElementById('import-table-wrapper');
    const countSpan = document.getElementById('import-count');

    let tableHtml = '<table style="width: 100%; white-space: nowrap; font-size: 0.75rem;"><thead><tr>';
    tableHtml += '<th>Nome</th><th>Telefone</th><th>E-mail</th><th>Curso</th>';
    tableHtml += '</tr></thead><tbody>';
    
    previewRows.forEach(r => {
      tableHtml += `<tr>
        <td>${r.name || '-'}</td>
        <td>${r.phone || '-'}</td>
        <td>${r.email || '-'}</td>
        <td>${r.course || '-'}</td>
      </tr>`;
    });
    tableHtml += '</tbody></table>';

    tableWrapper.innerHTML = tableHtml;
    countSpan.innerText = importedData.length;
    previewContainer.classList.remove('hidden');
    Toast.info(`Planilha lida com sucesso: ${importedData.length} leads encontrados.`);
  }

  function executeImport() {
    if (importedData.length === 0) return;
    
    DataStore.importLeads(importedData);
    Toast.success(`${importedData.length} leads importados com sucesso!`);
    
    // Reset
    document.getElementById('import-file').value = '';
    document.getElementById('import-preview-container').classList.add('hidden');
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
