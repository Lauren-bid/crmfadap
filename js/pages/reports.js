// js/pages/reports.js

window.ReportsPage = (function() {
  let chartInstance = null;

  function render() {
    return `
      <div class="page-container">
        <div class="page-header">
          <div class="page-title">
            <h1>Relatórios Comparativos</h1>
            <p>Compare o desempenho de matrículas entre períodos</p>
          </div>
        </div>

        <div class="grid grid-2" style="margin-bottom: 20px;">
          <!-- Internal Comparison Area -->
          <div class="card">
            <h3>Comparativo Interno (CRM)</h3>
            <p class="text-muted" style="margin-bottom: 16px; font-size: 0.9rem;">
              Compare matrículas e recusas entre dois meses/anos diferentes baseando-se nas movimentações do seu Kanban.
            </p>
            <div class="form-row" style="margin-bottom: 16px;">
              <div>
                <label class="form-label">Período A (Ex: Mês Atual)</label>
                <input type="month" id="comp-period-1" class="form-input">
              </div>
              <div>
                <label class="form-label">Período B (Ex: Mês Anterior)</label>
                <input type="month" id="comp-period-2" class="form-input">
              </div>
            </div>
            <button class="btn btn-primary" id="btn-generate-internal">
              <i data-lucide="bar-chart-2"></i> Gerar Comparativo Interno
            </button>
            <div id="internal-status" style="margin-top: 10px; font-weight: 500;"></div>
          </div>

          <!-- Upload Area (Legacy) -->
          <div class="card">
            <h3>Importar Planilha Externa</h3>
            <p class="text-muted" style="margin-bottom: 16px; font-size: 0.9rem;">
              Compare o momento atual do Kanban (todo o histórico) com uma planilha de relatórios antigos.
            </p>
            <div class="form-group" style="display: flex; gap: 10px; align-items: center;">
              <input type="file" id="compare-file" accept=".xlsx, .xls, .csv" class="form-input" style="flex: 1;">
              <button class="btn btn-secondary" id="btn-process-compare">Importar e Comparar</button>
            </div>
            <div id="compare-status" style="margin-top: 10px; font-weight: 500;"></div>
          </div>
        </div>

        <div id="comparative-results" style="display: none;">
          <h2 id="comp-title" style="margin-bottom: 16px; font-size: 1.2rem; color: var(--primary);">Resultado do Comparativo</h2>
          
          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px;">
            <div class="card stat-card">
              <div class="stat-title" id="lbl-prev-total">Matrículas Período B</div>
              <div class="stat-value" id="comp-prev-total">0</div>
            </div>
            <div class="card stat-card">
              <div class="stat-title" id="lbl-curr-total">Matrículas Período A</div>
              <div class="stat-value" id="comp-curr-total">0</div>
            </div>
            <div class="card stat-card">
              <div class="stat-title">Crescimento / Queda</div>
              <div class="stat-value" id="comp-growth">0%</div>
            </div>
            <div class="card stat-card" style="border-left: 4px solid var(--error);">
              <div class="stat-title" id="lbl-prev-recusa">Recusas Período B</div>
              <div class="stat-value" id="comp-prev-recusa">0</div>
            </div>
            <div class="card stat-card" style="border-left: 4px solid var(--error);">
              <div class="stat-title" id="lbl-curr-recusa">Recusas Período A</div>
              <div class="stat-value" id="comp-curr-recusa">0</div>
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

  function init() {
    const btnInternal = document.getElementById('btn-generate-internal');
    if (btnInternal) {
      btnInternal.addEventListener('click', processInternalComparison);
    }

    const btnLegacy = document.getElementById('btn-process-compare');
    if (btnLegacy) {
      btnLegacy.addEventListener('click', processFile);
    }
    
    // Set default months
    const now = new Date();
    const p1 = document.getElementById('comp-period-1');
    const p2 = document.getElementById('comp-period-2');
    
    if (p1 && p2) {
      p1.value = now.toISOString().slice(0, 7); // YYYY-MM
      
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      p2.value = lastMonth.toISOString().slice(0, 7);
    }
  }

  // --- INTERNAL COMPARISON (CRM vs CRM) ---
  function processInternalComparison() {
    const p1 = document.getElementById('comp-period-1').value; // YYYY-MM
    const p2 = document.getElementById('comp-period-2').value; // YYYY-MM
    const statusEl = document.getElementById('internal-status');

    if (!p1 || !p2) {
      statusEl.textContent = 'Por favor, selecione ambos os períodos.';
      statusEl.style.color = 'var(--error)';
      return;
    }

    statusEl.textContent = '';
    
    const leads = DataStore.getLeads(); // All leads
    
    const dataA = aggregatePeriodData(leads, p1);
    const dataB = aggregatePeriodData(leads, p2);

    updateDashboard({
      title: `Comparativo: ${formatMonth(p1)} vs ${formatMonth(p2)}`,
      labelA: `Matrículas (${formatMonth(p1)})`,
      labelB: `Matrículas (${formatMonth(p2)})`,
      labelRecusaA: `Recusas (${formatMonth(p1)})`,
      labelRecusaB: `Recusas (${formatMonth(p2)})`,
      nameA: formatMonth(p1),
      nameB: formatMonth(p2),
      dataA: dataA,
      dataB: dataB
    });
  }

  function aggregatePeriodData(allLeads, yearMonthPrefix) {
    let enrollments = 0;
    let refusals = 0;
    let byCourse = {};

    allLeads.forEach(lead => {
      // Use lastUpdate to represent when the lead was moved/closed
      const dateStr = lead.lastUpdate || lead.createdAt;
      if (dateStr.startsWith(yearMonthPrefix)) {
        if (lead.funnelStage === 'Matriculado') {
          enrollments++;
          const c = lead.course || 'Não Informado';
          byCourse[c] = (byCourse[c] || 0) + 1;
        } else if (lead.funnelStage === 'Perdido') {
          refusals++;
        }
      }
    });

    return { total: enrollments, refusals: refusals, byCourse };
  }

  function formatMonth(yyyyMm) {
    if (!yyyyMm) return '';
    const parts = yyyyMm.split('-');
    return `${parts[1]}/${parts[0]}`;
  }

  // --- LEGACY IMPORT COMPARISON (Spreadsheet vs CRM Current) ---
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
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (rows.length < 2) throw new Error('Planilha vazia ou sem cabeçalhos.');

        const prevData = analyzeLegacyData(rows);
        statusEl.textContent = 'Planilha processada com sucesso!';
        statusEl.style.color = 'var(--success)';
        
        // Current CRM state
        const currentStats = DataStore.getStats();
        const currentData = {
          total: currentStats.enrollments || 0,
          refusals: currentStats.lostLeads || 0,
          byCourse: currentStats.enrollmentsByCourse || {}
        };

        updateDashboard({
          title: 'Comparativo: Planilha vs Kanban Atual (Geral)',
          labelA: 'Matrículas (Kanban Atual)',
          labelB: 'Matrículas (Planilha Antiga)',
          labelRecusaA: 'Recusas (Kanban Atual)',
          labelRecusaB: 'Recusas (Planilha Antiga)',
          nameA: 'Kanban Atual',
          nameB: 'Planilha Antiga',
          dataA: currentData,
          dataB: prevData
        });

      } catch (err) {
        console.error(err);
        statusEl.textContent = 'Erro ao processar: ' + err.message;
        statusEl.style.color = 'var(--error)';
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function analyzeLegacyData(rows) {
    let total = 0;
    let refusals = 0;
    let byCourse = {};

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      
      let courseName = row[2] ? String(row[2]).trim() : 'Não Informado';
      const statusStr = row[1] ? String(row[1]).trim().toUpperCase() : '';
      const recusaStr = row[3] ? String(row[3]).trim().toUpperCase() : '';
      
      if (recusaStr.includes('RECUSA')) refusals++;
      
      if (!statusStr.includes('MATRICULADO')) continue;
      if (courseName.toLowerCase().includes('total')) continue;

      total++;
      byCourse[courseName] = (byCourse[courseName] || 0) + 1;
    }
    return { total, refusals, byCourse };
  }

  // --- SHARED DASHBOARD RENDERER ---
  function updateDashboard(options) {
    document.getElementById('comparative-results').style.display = 'block';
    document.getElementById('comp-title').textContent = options.title;

    document.getElementById('lbl-curr-total').textContent = options.labelA;
    document.getElementById('lbl-prev-total').textContent = options.labelB;
    document.getElementById('lbl-curr-recusa').textContent = options.labelRecusaA;
    document.getElementById('lbl-prev-recusa').textContent = options.labelRecusaB;

    const totalA = options.dataA.total || 0;
    const totalB = options.dataB.total || 0;
    
    document.getElementById('comp-curr-total').textContent = totalA;
    document.getElementById('comp-prev-total').textContent = totalB;
    document.getElementById('comp-curr-recusa').textContent = options.dataA.refusals || 0;
    document.getElementById('comp-prev-recusa').textContent = options.dataB.refusals || 0;

    let growthStr = '0%';
    let growthColor = 'var(--text-primary)';
    
    if (totalB > 0) {
      const diff = totalA - totalB;
      const pct = (diff / totalB) * 100;
      growthStr = (pct > 0 ? '+' : '') + pct.toFixed(1) + '%';
      growthColor = pct >= 0 ? 'var(--success)' : 'var(--error)';
    } else if (totalA > 0) {
      growthStr = '+100%';
      growthColor = 'var(--success)';
    }

    const growthEl = document.getElementById('comp-growth');
    growthEl.textContent = growthStr;
    growthEl.style.color = growthColor;

    renderChart(options.dataA.byCourse, options.dataB.byCourse, options.nameA, options.nameB);
  }

  function renderChart(coursesA, coursesB, nameA, nameB) {
    const ctx = document.getElementById('comparativeChart');
    if (!ctx) return;

    if (chartInstance) {
      chartInstance.destroy();
    }

    const allCoursesSet = new Set([...Object.keys(coursesA), ...Object.keys(coursesB)]);
    allCoursesSet.delete('undefined');
    allCoursesSet.delete('');
    
    const labels = Array.from(allCoursesSet).sort();
    const dataA = labels.map(c => coursesA[c] || 0);
    const dataB = labels.map(c => coursesB[c] || 0);

    chartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: nameA,
            data: dataA,
            backgroundColor: 'rgba(30, 64, 175, 0.8)',
            borderColor: 'rgba(30, 64, 175, 1)',
            borderWidth: 1
          },
          {
            label: nameB,
            data: dataB,
            backgroundColor: 'rgba(155, 27, 48, 0.4)',
            borderColor: 'rgba(155, 27, 48, 0.8)',
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

