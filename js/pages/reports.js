// js/pages/reports.js

window.ReportsPage = (function() {
  let previousYearData = null; // { total: 0, byCourse: {}, byModality: {} }

  function render() {
    return `
      <div class="page-container">
        <div class="page-header">
          <div class="page-title">
            <h1>Relatórios Comparativos</h1>
            <p>Compare o desempenho de matrículas entre períodos</p>
          </div>
        </div>

        <div class="grid" style="grid-template-columns: 1fr; gap: 20px; margin-bottom: 20px;">
          <!-- Upload Area -->
          <div class="card">
            <h3>Importar Dados do Ano Anterior</h3>
            <p class="text-muted" style="margin-bottom: 16px; font-size: 0.9rem;">
              Faça o upload de uma planilha contendo as matrículas do ano anterior para gerar o comparativo. 
              A planilha pode conter uma lista de alunos ou um resumo com colunas como "Curso" e "Quantidade".
            </p>
            <div class="form-group" style="display: flex; gap: 10px; align-items: center;">
              <input type="file" id="compare-file" accept=".xlsx, .xls, .csv" class="form-input" style="flex: 1;">
              <button class="btn btn-primary" id="btn-process-compare">Gerar Comparativo</button>
            </div>
            <div id="compare-status" style="margin-top: 10px; font-weight: 500;"></div>
          </div>
        </div>

        <div id="comparative-results" style="display: none;">
          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
            <div class="card stat-card">
              <div class="stat-title">Matrículas Ano Anterior</div>
              <div class="stat-value" id="comp-prev-total">0</div>
            </div>
            <div class="card stat-card">
              <div class="stat-title">Matrículas Ano Atual (CRM)</div>
              <div class="stat-value" id="comp-curr-total">0</div>
            </div>
            <div class="card stat-card">
              <div class="stat-title">Crescimento / Queda</div>
              <div class="stat-value" id="comp-growth">0%</div>
            </div>
            <div class="card stat-card" style="border-left: 4px solid var(--error);">
              <div class="stat-title">Recusas (Ano Anterior)</div>
              <div class="stat-value" id="comp-prev-recusa">0</div>
            </div>
          </div>

          <div class="grid" style="grid-template-columns: 1fr; gap: 20px;">
            <div class="card">
              <h3>Comparativo por Curso</h3>
              <div class="chart-container" style="height: 400px; position: relative;">
                <canvas id="comparativeChart"></canvas>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  let chartInstance = null;

  function init() {
    document.getElementById('btn-process-process-compare') // fix typo below
    const btn = document.getElementById('btn-process-compare');
    if (btn) {
      btn.addEventListener('click', processFile);
    }
  }

  function processFile() {
    const fileInput = document.getElementById('compare-file');
    const statusEl = document.getElementById('compare-status');
    
    if (!fileInput.files.length) {
      statusEl.textContent = 'Por favor, selecione um arquivo primeiro.';
      statusEl.style.color = 'var(--error)';
      return;
    }

    const file = fileInput.files[0];
    statusEl.textContent = 'Processando...';
    statusEl.style.color = 'var(--primary)';

    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Take first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (rows.length < 2) {
          throw new Error('A planilha está vazia ou sem cabeçalhos.');
        }

        analyzePreviousData(rows);
        statusEl.textContent = 'Planilha processada com sucesso!';
        statusEl.style.color = 'var(--success)';
        
        renderComparative();
      } catch (err) {
        console.error(err);
        statusEl.textContent = 'Erro ao processar: ' + err.message;
        statusEl.style.color = 'var(--error)';
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function analyzePreviousData(rows) {
    let total = 0;
    let recusaTotal = 0;
    let byCourse = {};

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;

      // Coluna B = index 1 (MATRICULADO)
      // Coluna C = index 2 (CURSO)
      // Coluna D = index 3 (RECUSA)
      
      let courseName = row[2] ? String(row[2]).trim() : 'Não Informado';
      
      const statusStr = row[1] ? String(row[1]).trim().toUpperCase() : '';
      const recusaStr = row[3] ? String(row[3]).trim().toUpperCase() : '';
      
      if (recusaStr.includes('RECUSA')) {
        recusaTotal += 1;
      }
      
      if (!statusStr.includes('MATRICULADO')) {
        continue; // Only count students that are enrolled
      }

      // Ignore totals row often found in spreadsheets
      if (courseName.toLowerCase().includes('total')) continue;

      total += 1;
      byCourse[courseName] = (byCourse[courseName] || 0) + 1;
    }

    previousYearData = {
      total,
      recusaTotal,
      byCourse
    };
  }

  function renderComparative() {
    if (!previousYearData) return;

    document.getElementById('comparative-results').style.display = 'block';

    // Get current data from CRM
    const stats = DataStore.getStats();
    // stats.enrollments = total enrolled
    // stats.enrollmentsByCourse = object with course enrollments

    const currentTotal = stats.enrollments || 0;
    const prevTotal = previousYearData.total || 0;
    const prevRecusa = previousYearData.recusaTotal || 0;

    document.getElementById('comp-prev-total').textContent = prevTotal;
    document.getElementById('comp-curr-total').textContent = currentTotal;
    document.getElementById('comp-prev-recusa').textContent = prevRecusa;

    let growthStr = '0%';
    let growthColor = 'var(--text-primary)';
    
    if (prevTotal > 0) {
      const diff = currentTotal - prevTotal;
      const pct = (diff / prevTotal) * 100;
      growthStr = (pct > 0 ? '+' : '') + pct.toFixed(1) + '%';
      growthColor = pct >= 0 ? 'var(--success)' : 'var(--error)';
    } else if (currentTotal > 0) {
      growthStr = '+100%';
      growthColor = 'var(--success)';
    }

    const growthEl = document.getElementById('comp-growth');
    growthEl.textContent = growthStr;
    growthEl.style.color = growthColor;

    renderChart(previousYearData.byCourse, stats.enrollmentsByCourse);
  }

  function renderChart(prevCourses, currCourses) {
    const ctx = document.getElementById('comparativeChart');
    if (!ctx) return;

    if (chartInstance) {
      chartInstance.destroy();
    }

    // Unify all courses found in both
    const allCoursesSet = new Set([...Object.keys(prevCourses), ...Object.keys(currCourses)]);
    // Clean up empty or invalid
    allCoursesSet.delete('undefined');
    allCoursesSet.delete('');
    
    const labels = Array.from(allCoursesSet).sort();

    const dataPrev = labels.map(c => prevCourses[c] || 0);
    const dataCurr = labels.map(c => currCourses[c] || 0);

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Ano Anterior',
            data: dataPrev,
            backgroundColor: 'rgba(155, 27, 48, 0.4)',
            borderColor: 'rgba(155, 27, 48, 0.8)',
            borderWidth: 1
          },
          {
            label: 'Ano Atual (CRM)',
            data: dataCurr,
            backgroundColor: 'rgba(30, 64, 175, 0.8)',
            borderColor: 'rgba(30, 64, 175, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  return {
    render,
    init
  };
})();
