// js/pages/dashboard.js

window.DashboardPage = (function() {
  let charts = [];
  let currentGoalsMode = 'presencial';

  function render() {
    return `
      <div class="page-container">
        <div class="page-header">
          <div class="page-title">
            <h1>Dashboard Executivo</h1>
            <p>Visão geral do funil e conversões — Processo Seletivo 2026</p>
          </div>
          <div class="page-actions">
            <button class="btn btn-secondary" onclick="window.App.navigate('leads')">Ver Todos os Leads</button>
            <button class="btn btn-primary" onclick="window.App.navigate('kanban')">Abrir Kanban</button>
          </div>
        </div>

        <!-- KPI Cards -->
        <div class="dashboard-grid" id="kpi-container"></div>

        <!-- Goals Section -->
        <div class="goals-section" id="goals-section" style="margin-bottom: 24px;">
          <!-- Content injected by JS -->
        </div>

        <!-- Charts Grid -->
        <div class="charts-grid">
          <div class="chart-card card">
            <div class="card-header"><span class="card-title">Funil de Conversão</span></div>
            <div class="chart-container" id="funnel-container"></div>
          </div>
          <div class="chart-card card">
            <div class="card-header"><span class="card-title">Leads por Origem</span></div>
            <div class="chart-container"><canvas id="originChart"></canvas></div>
          </div>
          <div class="chart-card card">
            <div class="card-header"><span class="card-title">Evolução Mensal</span></div>
            <div class="chart-container"><canvas id="evolutionChart"></canvas></div>
          </div>
          <div class="chart-card card">
            <div class="card-header"><span class="card-title">Investimento Marketing</span></div>
            <div class="chart-container"><canvas id="mktChart"></canvas></div>
          </div>
          <div class="chart-card card" style="grid-column: 1 / -1;">
            <div class="card-header"><span class="card-title">Desempenho da Equipe Comercial</span></div>
            <div class="chart-container"><canvas id="attendantChart"></canvas></div>
          </div>
        </div>
      </div>
    `;
  }

  function init() {
    charts.forEach(c => c.destroy());
    charts = [];
    const stats = DataStore.getStats();
    
    renderKPIs(stats);
    renderGoalsBoxes(stats);
    renderFunnel(stats);
    renderCharts(stats);
  }

  function renderKPIs(stats) {
    const kpiContainer = document.getElementById('kpi-container');
    if (!kpiContainer) return;
    kpiContainer.innerHTML = `
      <div class="kpi-card card">
        <div class="kpi-content">
          <div class="kpi-icon primary"><i data-lucide="users"></i></div>
          <div class="kpi-details">
            <span class="kpi-value">${stats.totalLeads}</span>
            <span class="kpi-label">Total de Leads</span>
          </div>
        </div>
      </div>
      
      <div class="kpi-card card">
        <div class="kpi-content">
          <div class="kpi-icon info"><i data-lucide="trending-up"></i></div>
          <div class="kpi-details">
            <span class="kpi-value">${stats.monthLeads}</span>
            <span class="kpi-label">Leads no Mês</span>
          </div>
        </div>
      </div>
      
      <div class="kpi-card card">
        <div class="kpi-content">
          <div class="kpi-icon success"><i data-lucide="graduation-cap"></i></div>
          <div class="kpi-details">
            <span class="kpi-value">${stats.presencialEnrollments}</span>
            <span class="kpi-label">Matrículas Presencial</span>
          </div>
        </div>
      </div>

      <div class="kpi-card card">
        <div class="kpi-content">
          <div class="kpi-icon success"><i data-lucide="graduation-cap"></i></div>
          <div class="kpi-details">
            <span class="kpi-value">${stats.eadEnrollments}</span>
            <span class="kpi-label">Matrículas EAD</span>
          </div>
        </div>
      </div>

      <div class="kpi-card card">
        <div class="kpi-content">
          <div class="kpi-icon warning"><i data-lucide="percent"></i></div>
          <div class="kpi-details">
            <span class="kpi-value">${stats.conversionRate}%</span>
            <span class="kpi-label">Taxa de Conversão</span>
          </div>
        </div>
      </div>

      <div class="kpi-card card">
        <div class="kpi-content">
          <div class="kpi-icon error"><i data-lucide="user-x"></i></div>
          <div class="kpi-details">
            <span class="kpi-value">${stats.lostLeads}</span>
            <span class="kpi-label">Leads Perdidos</span>
          </div>
        </div>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }

  function renderGoalsBoxes(stats) {
    const section = document.getElementById('goals-section');
    if (!section) return;

    // Presencial (Calouros)
    const pGoal = Utils.ENROLLMENT_GOALS.presencial.total;
    const pAct = stats.presencialEnrollments;
    const pFalta = Math.max(0, pGoal - pAct);

    // Transferencias
    const tGoal = Utils.ENROLLMENT_GOALS.presencial_transfer.total;
    const tAct = stats.presencialTransfers || 0;
    const tFalta = Math.max(0, tGoal - tAct);

    // EAD
    const eGoal = Utils.ENROLLMENT_GOALS.ead.total;
    const eAct = stats.eadEnrollments;
    const eFalta = Math.max(0, eGoal - eAct);

    // Build tables
    const renderTableHtml = (title, coursesObj, total) => {
      let rows = '';
      const sorted = Object.keys(coursesObj).sort((a,b) => coursesObj[b] - coursesObj[a]);
      
      if (sorted.length === 0 || total === 0) {
        rows = '<tr><td colspan="3" style="text-align:center; padding: 20px; color: var(--text-muted); font-style: italic;">Nenhuma matrícula neste período</td></tr>';
      } else {
        sorted.forEach(c => {
          if(coursesObj[c] > 0) {
            const pct = total > 0 ? ((coursesObj[c] / total) * 100).toFixed(2) + '%' : '0%';
            rows += `<tr><td style="font-size: 0.8rem;">${c}</td><td style="text-align:center;">${coursesObj[c]}</td><td style="text-align:right;">${pct}</td></tr>`;
          }
        });
      }
      return `
        <div class="card" style="flex: 1; min-width: 280px;">
          <h4 style="margin-bottom: 12px; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px;">${title}</h4>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1px solid #e5e7eb;">
                <th style="text-align:left; padding-bottom:8px; font-size: 0.75rem;">CURSO</th>
                <th style="text-align:center; padding-bottom:8px; font-size: 0.75rem;">QTDE</th>
                <th style="text-align:right; padding-bottom:8px; font-size: 0.75rem;">%</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
            <tfoot>
              <tr style="border-top: 2px solid #e5e7eb; font-weight: bold;">
                <td style="padding-top:8px;">Total geral</td>
                <td style="text-align:center; padding-top:8px;">${total}</td>
                <td style="text-align:right; padding-top:8px;">100.00%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
    };

    // Calculate separate tables dynamically from current leads in Kanban
    const leads = DataStore.getLeads({ funnelStage: 'Matriculado' });
    const calouros = {};
    const transfers = {};
    const eads = {};
    
    leads.forEach(l => {
      const c = l.course || 'Não Informado';
      if (l.modality === 'Presencial') {
        // Assume 'Transferência' string check from any field if available, but fallback to calouros
        if (l.enrollmentType === 'Transferência') {
          transfers[c] = (transfers[c] || 0) + 1;
        } else {
          calouros[c] = (calouros[c] || 0) + 1;
        }
      } else if (l.modality === 'EAD') {
        eads[c] = (eads[c] || 0) + 1;
      }
    });

    const tablesHtml = `
      <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 24px;">
        ${renderTableHtml('MATRÍCULAS ATIVAS - CALOUROS', calouros, pAct)}
        ${renderTableHtml('MATRÍCULAS ATIVAS - TRANSFERÊNCIAS', transfers, tAct)}
        ${renderTableHtml('MATRÍCULAS ATIVAS - EAD', eads, eAct)}
      </div>
    `;

    const renderGoalBox = (title, meta, realizado, falta) => `
      <div class="card" style="flex: 1; min-width: 250px; text-align: center; border: 2px solid #e5e7eb; padding: 20px;">
        <h4 style="margin-bottom: 20px; font-size: 0.9rem; text-transform: uppercase;">${title}</h4>
        <div style="display: flex; justify-content: space-around;">
          <div>
            <div style="font-size: 0.8rem; font-weight: bold; margin-bottom: 8px;">META</div>
            <div style="font-size: 1.8rem; font-weight: 800;">${meta}</div>
          </div>
          <div>
            <div style="font-size: 0.8rem; font-weight: bold; color: var(--success); margin-bottom: 8px;">REALIZADO</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--success);">${realizado}</div>
          </div>
          <div>
            <div style="font-size: 0.8rem; font-weight: bold; color: var(--error); margin-bottom: 8px;">FALTA</div>
            <div style="font-size: 1.8rem; font-weight: 800; color: var(--error);">${falta}</div>
          </div>
        </div>
      </div>
    `;

    const goalsBoxesHtml = `
      <div style="display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 24px;">
        ${renderGoalBox('META GRADUAÇÃO PRESENCIAL', pGoal, pAct, pFalta)}
        ${renderGoalBox('META GRADUAÇÃO PRESENCIAL - TRANSFERÊNCIAS', tGoal, tAct, tFalta)}
        ${renderGoalBox('META GRADUAÇÃO EAD', eGoal, eAct, eFalta)}
      </div>
    `;

    section.innerHTML = tablesHtml + goalsBoxesHtml;
  }

  function renderFunnel(stats) {
    const funnelContainer = document.getElementById('funnel-container');
    if (!funnelContainer) return;
    const activeStages = DataStore.getFunnelStages();
    let html = '<div class="funnel-wrapper">';
    activeStages.forEach((stage, index) => {
      const count = stats.leadsByStage[stage] || 0;
      const baseWidth = 100 - (index * 6); 
      const width = Math.max(30, baseWidth); 
      html += `
        <div class="funnel-stage" data-index="${index}" style="width: ${width}%;" title="${count} leads">
          <div class="funnel-label-inside">
            <span>${stage}</span>
            <span style="font-weight: 700;">${count}</span>
          </div>
        </div>
      `;
    });
    html += '</div>';
    funnelContainer.innerHTML = html;
  }

  function renderCharts(stats) {
    const palette = ['#9B1B30','#3B82F6','#10B981','#F59E0B','#8B5CF6','#EC4899','#14B8A6','#F97316','#6366F1'];
    Chart.defaults.font.family = 'Inter, sans-serif';
    Chart.defaults.color = '#6B7280';

    // Origin Chart
    const originCtx = document.getElementById('originChart');
    if (originCtx) {
      const labels = Object.keys(stats.leadsByOrigin).filter(k => stats.leadsByOrigin[k] > 0);
      const data = labels.map(k => stats.leadsByOrigin[k]);
      charts.push(new Chart(originCtx, {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{ data, backgroundColor: palette, borderWidth: 0 }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right', labels: { boxWidth: 12, padding: 15 } } },
          cutout: '70%'
        }
      }));
    }

    // Evolution Chart
    const evoCtx = document.getElementById('evolutionChart');
    if (evoCtx && stats.monthlyEvolution.length > 0) {
      const labels = stats.monthlyEvolution.map(d => d.month);
      const leadsData = stats.monthlyEvolution.map(d => d.leads);
      const enrollData = stats.monthlyEvolution.map(d => d.enrollments);
      
      charts.push(new Chart(evoCtx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            { label: 'Novos Leads', data: leadsData, borderColor: '#3B82F6', backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.4, fill: true },
            { label: 'Matrículas', data: enrollData, borderColor: '#10B981', backgroundColor: 'transparent', tension: 0.4 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
          scales: { y: { beginAtZero: true, grid: { borderDash: [2, 4], color: '#E5E7EB' } }, x: { grid: { display: false } } }
        }
      }));
    }

    // MKT Investment Chart
    const mktCtx = document.getElementById('mktChart');
    if (mktCtx) {
      const mktData = Utils.MKT_INVESTMENT;
      const labels = mktData.map(d => d.month);
      const presencialData = mktData.map(d => d.presencial);
      const eadData = mktData.map(d => d.ead);
      
      charts.push(new Chart(mktCtx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Investimento Presencial', data: presencialData, backgroundColor: '#9B1B30', borderRadius: 4 },
            { label: 'Investimento EAD', data: eadData, backgroundColor: '#3B82F6', borderRadius: 4 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, grid: { borderDash: [2, 4] }, ticks: { callback: function(value) { return 'R$ ' + value; } } },
            x: { grid: { display: false } }
          }
        }
      }));
    }

    // Attendant Chart
    const attCtx = document.getElementById('attendantChart');
    if (attCtx) {
      const attendants = Object.keys(stats.leadsByAttendant);
      const labels = attendants.map(id => {
        const u = DataStore.getUser(id);
        return u ? u.name : 'Desconhecido';
      });
      const totalData = attendants.map(id => stats.leadsByAttendant[id].total);
      const enrollData = attendants.map(id => stats.leadsByAttendant[id].enrolled);

      charts.push(new Chart(attCtx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: 'Leads Atendidos', data: totalData, backgroundColor: '#3B82F6', borderRadius: 4 },
            { label: 'Matrículas Convertidas', data: enrollData, backgroundColor: '#9B1B30', borderRadius: 4 }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, grid: { borderDash: [2, 4] } }, x: { grid: { display: false } } }
        }
      }));
    }
  }

  return {
    render,
    init
  };
})();
