// js/pages/commissions.js

window.CommissionsPage = (function() {

  function render() {
    return `
      <div class="page-container" style="max-width: 900px; margin: 0 auto;">
        <div class="page-header">
          <div class="page-title">
            <h1>Relatório de Comissões</h1>
            <p>Comissões de matrículas para cursos <strong>Presenciais</strong> e <strong>EAD</strong></p>
          </div>
        </div>

        <div class="card" style="margin-bottom: var(--spacing-6);">
          <div style="display: flex; gap: 16px; align-items: flex-end;">
            <div style="flex: 1;">
              <label class="form-label">Mês / Ano</label>
              <input type="month" id="commissions-month" class="form-input">
            </div>
            <button class="btn btn-primary" id="btn-calc-commissions">
              <i data-lucide="calculator"></i> Calcular Comissões
            </button>
          </div>
        </div>

        <div id="commissions-result" style="display: none;">
          <div class="card" style="margin-bottom: var(--spacing-6);">
            <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px;">
              <h3 style="color: var(--primary); margin: 0;" id="commissions-title">Resultados</h3>
              <div class="text-sm text-secondary" style="background: var(--bg-color); padding: 12px; border-radius: 8px; border: 1px solid var(--border-light);">
                <strong>Presencial:</strong> 1 atendente = R$30 | 2 = R$15 | 3+ = R$10<br>
                <strong>EAD:</strong> 1 atendente = R$20 | 2 = R$10 | 3+ = R$6,66
              </div>
            </div>
            
            <div class="table-container">
              <table id="commissions-table">
                <thead>
                  <tr>
                    <th>Atendente</th>
                    <th style="text-align: center;">Presencial (Solo)</th>
                    <th style="text-align: center;">Presencial (Div)</th>
                    <th style="text-align: center;">EAD (Solo)</th>
                    <th style="text-align: center;">EAD (Div)</th>
                    <th style="text-align: right;">Comissão Total</th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Injetado via JS -->
                </tbody>
              </table>
            </div>
            
            <div style="margin-top: 16px; text-align: right;">
              <button class="btn btn-secondary" onclick="window.print()">
                <i data-lucide="printer"></i> Imprimir Relatório
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function init() {
    const btnCalc = document.getElementById('btn-calc-commissions');
    if (btnCalc) {
      btnCalc.addEventListener('click', calculateCommissions);
    }
    
    // Set default to current month
    const now = new Date();
    const monthInput = document.getElementById('commissions-month');
    if (monthInput) {
      monthInput.value = now.toISOString().slice(0, 7); // YYYY-MM
    }
  }

  function calculateCommissions() {
    const monthInput = document.getElementById('commissions-month').value;
    if (!monthInput) return;

    // Get all leads
    const allLeads = DataStore.getLeads();
    
    // Structure to hold attendant stats
    const stats = {};
    const users = DataStore.getUsers();
    users.forEach(u => {
      stats[u.id] = {
        name: u.name,
        avatar: u.avatar,
        solo: 0,
        split: 0,
        soloEad: 0,
        splitEad: 0,
        totalCommission: 0
      };
    });

    // We also need a "System/Nenhum" bucket
    stats['none'] = {
      name: 'Sem Atendente',
      avatar: '?',
      solo: 0,
      split: 0,
      soloEad: 0,
      splitEad: 0,
      totalCommission: 0
    };

    let validCount = 0;

    allLeads.forEach(lead => {
      if (lead.funnelStage !== 'Matriculado') return;
      if (lead.modality !== 'Presencial' && lead.modality !== 'EAD') return;

      // Find when it became matriculado
      let enrollDate = null;
      if (lead.changelog) {
        const enrollLog = lead.changelog.slice().reverse().find(c => 
          (c.field === 'funnelStage' || c.field === 'Lead Criado') && c.newValue === 'Matriculado'
        );
        if (enrollLog) enrollDate = enrollLog.timestamp;
      }
      
      // Fallback
      if (!enrollDate) enrollDate = lead.lastUpdate;

      const datePrefix = enrollDate ? enrollDate.substring(0, 7) : '';
      if (datePrefix !== monthInput) return;

      // It's a valid lead for this month
      validCount++;

      const attendants = lead.attendantIds && lead.attendantIds.length > 0 ? lead.attendantIds : ['none'];
      const count = attendants.length;
      
      let commissionValue = 0;
      if (lead.modality === 'Presencial') {
        if (count === 1) commissionValue = 30.00;
        else if (count === 2) commissionValue = 15.00;
        else if (count >= 3) commissionValue = 10.00;
      } else if (lead.modality === 'EAD') {
        if (count === 1) commissionValue = 20.00;
        else if (count === 2) commissionValue = 10.00;
        else if (count >= 3) commissionValue = 6.66;
      }

      attendants.forEach(attId => {
        if (!stats[attId]) {
           // Em caso de atendente apagado
           stats[attId] = { name: 'Desconhecido', avatar: '?', solo: 0, split: 0, soloEad: 0, splitEad: 0, totalCommission: 0 };
        }
        
        if (lead.modality === 'Presencial') {
          if (count === 1) stats[attId].solo++;
          else stats[attId].split++;
        } else if (lead.modality === 'EAD') {
          if (count === 1) stats[attId].soloEad++;
          else stats[attId].splitEad++;
        }
        
        stats[attId].totalCommission += commissionValue;
      });
    });

    // Render results
    document.getElementById('commissions-result').style.display = 'block';
    
    // Format month for title (e.g. 2026-06 -> 06/2026)
    const [y, m] = monthInput.split('-');
    document.getElementById('commissions-title').textContent = `Resultados - ${m}/${y} (${validCount} Matrículas)`;

    const tbody = document.querySelector('#commissions-table tbody');
    let rowsHtml = '';
    
    // Convert to array and sort by commission
    const resultArr = Object.values(stats)
      .filter(s => s.solo > 0 || s.split > 0 || s.soloEad > 0 || s.splitEad > 0 || s.totalCommission > 0)
      .sort((a, b) => b.totalCommission - a.totalCommission);

    if (resultArr.length === 0) {
      rowsHtml = '<tr><td colspan="6" class="text-center text-muted" style="padding: 32px 0;">Nenhuma comissão gerada neste mês.</td></tr>';
    } else {
      resultArr.forEach(s => {
        rowsHtml += `
          <tr>
            <td>
              <div class="flex items-center gap-2">
                <div class="avatar avatar-sm">${s.avatar}</div>
                <span class="font-medium">${s.name}</span>
              </div>
            </td>
            <td style="text-align: center;">${s.solo}</td>
            <td style="text-align: center;">${s.split}</td>
            <td style="text-align: center;">${s.soloEad}</td>
            <td style="text-align: center;">${s.splitEad}</td>
            <td style="text-align: right; font-weight: 600; color: var(--success);">
              R$ ${s.totalCommission.toFixed(2).replace('.', ',')}
            </td>
          </tr>
        `;
      });
    }

    tbody.innerHTML = rowsHtml;
    
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  return { render, init };
})();
