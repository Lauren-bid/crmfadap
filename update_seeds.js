const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

async function downloadAndParse() {
  const url = 'https://docs.google.com/spreadsheets/d/1VQMPS7xuBXbECbVuG7sQ7teDVLkFPytWNDjWCggox-k/export?format=xlsx';
  
  console.log('Downloading...');
  const res = await fetch(url);
  const buffer = await res.arrayBuffer();
  
  console.log('Parsing workbook...');
  const wb = xlsx.read(buffer, { type: 'buffer' });
  
  let allLeads = [];
  
  function processSheet(sheetName, modality) {
    console.log('Processing sheet:', sheetName);
    const sheet = wb.Sheets[sheetName];
    if (!sheet) return;
    
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    const headers = rows[0].map(h => h ? String(h).trim().toLowerCase() : '');
    
    const map = {
      name: headers.findIndex(h => h && h.includes('nome')),
      phone: headers.findIndex(h => h && (h.includes('telefone') || h.includes('celular') || h.includes('whatsapp') || h.includes('contato') || h.includes('número') || h.includes('numero'))),
      city: headers.findIndex(h => h && h.includes('cidade')),
      origin: 4, // Coluna E = índice 4 (fixo, conforme planilha da Ana Lauren)
      statusSheet: headers.findIndex(h => h && (h === 'status' || h.includes('status do lead') || h.includes('etapa do funil'))),
      course: headers.findIndex(h => h && h.includes('curso')),
      attendant: headers.findIndex(h => h && (h.includes('atendente') || h.includes('responsável'))),
      date: headers.findIndex(h => h && h.includes('data')),
      obs: headers.findIndex(h => h && h.includes('obs')),
      status1: headers.findIndex(h => h && h.includes('status 1')),
      status2: headers.findIndex(h => h && h.includes('status 2')),
      baseName: headers.findIndex(h => h && (h.includes('base') || h.includes('campanha')))
    };

    console.log('Mapping for', sheetName, map);
    console.log('Header at col E:', headers[4]);

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0 || map.name === -1 || !row[map.name]) continue;
      
      allLeads.push({
        name: row[map.name] ? String(row[map.name]).trim() : '',
        phone: map.phone !== -1 && row[map.phone] ? String(row[map.phone]).trim() : '',
        city: map.city !== -1 && row[map.city] ? String(row[map.city]).trim() : '',
        origin: (function() {
          if (map.origin === -1 || !row[map.origin]) return 'Outros';
          const raw = String(row[map.origin]).trim();
          const rawLower = raw.toLowerCase();
          
          if (rawLower === 'agência' || rawLower === 'agencia' || rawLower.includes('tráfego')) return 'Tráfego Pago';
          if (rawLower === 'whatsapp') return 'WhatsApp';
          if (rawLower === 'site') return 'Site';
          if (rawLower === 'indicação' || rawLower === 'indicacao') return 'Indicação';
          if (rawLower === 'presencial') return 'Presencial';
          if (rawLower.includes('fixo')) return 'Fixo Instituição';
          if (rawLower === 'lead antigo') return 'Lead Antigo';
          if (rawLower.startsWith('ação externa') || rawLower.startsWith('ação de')) return 'Ação Externa';
          if (rawLower.startsWith('ação comercial')) return 'Ação Comercial';
          if (rawLower === 'venda direta') return 'VENDA DIRETA';
          
          return raw || 'Outros';
        })(),
        course: map.course !== -1 && row[map.course] ? String(row[map.course]).trim() : '',
        attendant: map.attendant !== -1 && row[map.attendant] ? String(row[map.attendant]).trim() : '',
        date: map.date !== -1 && row[map.date] ? String(row[map.date]).trim() : '',
        obs: map.obs !== -1 && row[map.obs] ? String(row[map.obs]).trim() : '',
        status1: map.status1 !== -1 && row[map.status1] ? String(row[map.status1]).trim() : '',
        status2: map.status2 !== -1 && row[map.status2] ? String(row[map.status2]).trim() : '',
        statusSheet: map.statusSheet !== -1 && row[map.statusSheet] ? String(row[map.statusSheet]).trim() : '',
        baseName: map.baseName !== -1 && row[map.baseName] ? String(row[map.baseName]).trim() : sheetName,
        modality: modality
      });
    }
  }

  processSheet('BASE EAD', 'EAD');
  processSheet('BASE 2026-2', 'Presencial');

  console.log('Total leads found:', allLeads.length);
  
  // Generate seed.js content
  const seedContent = `// js/seed.js

window.SeedData = (function() {
  
  const USERS = [
    { id: 'u1', name: 'Giovana', email: 'giovana@unifadap.edu.br', role: 'Administrador', active: true, avatar: 'GI' },
    { id: 'u2', name: 'Maria Fernanda', email: 'maria.fernanda@unifadap.edu.br', role: 'Comercial', active: true, avatar: 'MF' },
    { id: 'u3', name: 'Ana Lauren', email: 'ana.lauren@unifadap.edu.br', role: 'Comercial', active: true, avatar: 'AL' },
    { id: 'u4', name: 'Daiane', email: 'daiane@unifadap.edu.br', role: 'Secretaria', active: true, avatar: 'DA' },
    { id: 'u5', name: 'Fernanda', email: 'fernanda@unifadap.edu.br', role: 'Coordenação', active: true, avatar: 'FE' },
    { id: 'u6', name: 'Nathalia', email: 'nathalia@unifadap.edu.br', role: 'Comercial', active: true, avatar: 'NA' },
    { id: 'u7', name: 'Bruna', email: 'bruna@unifadap.edu.br', role: 'Comercial', active: true, avatar: 'BR' },
    { id: 'u8', name: 'Inayara', email: 'inayara@unifadap.edu.br', role: 'Comercial', active: true, avatar: 'IN' }
  ];

  function getAttendantId(name) {
    if(!name) return '';
    const n = String(name).toUpperCase();
    if(n.includes('GIOVANA')) return 'u1';
    if(n.includes('MARIA') || n.includes('FERNANDA') || n.includes('MF')) return 'u2';
    if(n.includes('ANA') || n.includes('LAUREN')) return 'u3';
    if(n.includes('DAIANE')) return 'u4';
    if(n.includes('NATHALIA')) return 'u6';
    if(n.includes('BRUNA')) return 'u7';
    if(n.includes('INAYARA')) return 'u8';
    return '';
  }

  function parseDate(dateStr) {
    if (!dateStr) return '';
    if (typeof dateStr === 'number') {
      // Excel date
      const date = new Date(Math.round((dateStr - 25569)*86400*1000));
      return date.toISOString();
    }
    const str = String(dateStr);
    const parts = str.split('/');
    if (parts.length === 3) {
      return \`\${parts[2]}-\${parts[1].padStart(2, '0')}-\${parts[0].padStart(2, '0')}T12:00:00Z\`;
    }
    return new Date().toISOString();
  }

  function getFunnelStage(sheetStage) {
    if (!sheetStage) return 'Novo Lead';
    const stg = String(sheetStage).trim().toUpperCase();
    if (stg === 'LEAD') return 'Novo Lead';
    if (stg === 'PRIMEIRO CONTATO') return 'Primeiro Contato';
    if (stg === 'MATRICULADO' || stg === 'JÁ É ALUNO' || stg === 'REMATRICULA' || stg === 'TRANSFERÊNCIA') return 'Matriculado';
    if (stg === 'APROVADO') return 'Aprovado';
    if (stg === 'MATRÍCULA CANCELADA' || stg === 'PERDIDO') return 'Perdido';
    if (stg === 'INSCRITO INCOMPLETO' || stg === 'INSCRITO') return 'Inscrito';
    if (stg === 'INTERAGINDO' || stg.includes('NEGOCIA')) return 'Em Negociação';
    return Utils.STAGE_MAP[stg] || 'Novo Lead';
  }

  const rawLeads = ${JSON.stringify(allLeads)};

  function generate() {
    let leads = [];

    for (const data of rawLeads) {
      const contactD = parseDate(data.date);
      leads.push({
        id: Utils.generateId(),
        name: data.name,
        email: '',
        phone: data.phone,
        whatsapp: data.phone,
        cpf: '',
        city: data.city || '',
        state: 'SP',
        origin: (function() {
          const raw = String(data.origin || '').trim();
          // Direct match first
          const directMatch = Utils.ORIGINS.find(o => o.toLowerCase() === raw.toLowerCase());
          if (directMatch) return directMatch;
          // Group 'Ação externa #...' into 'Ação externa'
          if (raw.toLowerCase().startsWith('ação externa')) return 'Ação externa';
          // Group 'Ação Comercial...' into 'Ação Comercial'
          if (raw.toLowerCase().startsWith('ação comercial')) return 'Ação Comercial';
          // Group 'Ação de Panfletagem...' into 'Ação externa'
          if (raw.toLowerCase().startsWith('ação de')) return 'Ação externa';
          // Fallback
          return raw || 'Outros';
        })(),
        course: Utils.COURSES.find(c => c.toLowerCase() === String(data.course).toLowerCase()) || data.course || 'Não Preencheu',
        modality: data.modality,
        semester: data.modality === 'EAD' ? '2026/1' : '2026/2',
        funnelStage: getFunnelStage(data.statusSheet),
        enrollmentType: (String(data.statusSheet).toUpperCase().trim() === 'TRANSFERÊNCIA') ? 'Transferência' : 'Calouro',
        academicStatus: 'Interessado',
        attendantId: getAttendantId(data.attendant),
        status1: data.status1 || '',
        status2: data.status2 || '',
        observation: data.obs || '',
        contactDate: contactD ? contactD.split('T')[0] : '',
        baseName: data.baseName || '',
        createdAt: contactD || new Date().toISOString(),
        lastUpdate: contactD || new Date().toISOString(),
        assignedDate: contactD || new Date().toISOString(),
        interactions: data.obs ? [{
          id: Utils.generateId(),
          type: 'Observação Interna',
          date: contactD ? contactD.split('T')[0] : new Date().toISOString().split('T')[0],
          time: '12:00',
          description: data.obs,
          userId: 'system',
          createdAt: contactD || new Date().toISOString()
        }] : [],
        contracts: [],
        documents: [],
        changelog: [
          { field: 'Lead Criado', oldValue: '', newValue: data.name, userId: 'system', timestamp: contactD || new Date().toISOString() }
        ]
      });
    }

    return {
      leads: leads,
      users: USERS,
      currentUserId: null
    };
  }

  return { generate };
})();
`;

  fs.writeFileSync(path.join(__dirname, 'js/seed.js'), seedContent);
  console.log('Successfully wrote', allLeads.length, 'leads to js/seed.js');
}

downloadAndParse().catch(console.error);
