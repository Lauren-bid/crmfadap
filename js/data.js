// js/data.js
//
// Camada de dados do CRM.
// Estratégia: o Firestore é a fonte da verdade. No boot, carregamos TUDO para um
// cache em memória (_data). As páginas continuam lendo de forma síncrona desse
// cache (nada muda nelas). Toda ESCRITA atualiza o cache e grava no Firestore
// por trás (assíncrono). A sessão (quem está logado) é controlada pelo Firebase Auth.

window.DataStore = (function() {
  let _data = {
    leads: [],
    users: [],
    funnelStages: null,
    semesters: null,
    events: [],
    currentUserId: null
  };

  function db() { return window.FB && window.FB.db; }

  // --- Persistência por documento (Firestore) ---------------------------------

  function saveLeadDoc(lead) {
    if (!db() || !lead) return;
    db().collection('leads').doc(lead.id).set(lead)
      .catch(e => console.error('Erro ao salvar lead no Firestore:', e));
  }

  function deleteLeadDoc(id) {
    if (!db()) return;
    db().collection('leads').doc(id).delete()
      .catch(e => console.error('Erro ao excluir lead no Firestore:', e));
  }

  function saveUserDoc(user) {
    if (!db() || !user) return;
    db().collection('users').doc(user.id).set(user)
      .catch(e => console.error('Erro ao salvar usuário no Firestore:', e));
  }

  function deleteUserDoc(id) {
    if (!db()) return;
    db().collection('users').doc(id).delete()
      .catch(e => console.error('Erro ao excluir usuário no Firestore:', e));
  }

  function saveEventDoc(ev) {
    if (!db() || !ev) return;
    db().collection('events').doc(ev.id).set(ev)
      .catch(e => console.error('Erro ao salvar evento no Firestore:', e));
  }

  function deleteEventDoc(id) {
    if (!db()) return;
    db().collection('events').doc(id).delete()
      .catch(e => console.error('Erro ao excluir evento no Firestore:', e));
  }

  // Configurações globais (funnelStages, semesters) ficam num único doc.
  function saveSettings() {
    if (!db()) return;
    db().collection('settings').doc('global').set({
      funnelStages: _data.funnelStages || [],
      semesters: _data.semesters || []
    }).catch(e => console.error('Erro ao salvar settings no Firestore:', e));
  }

  // --- Carregamento inicial ----------------------------------------------------

  async function init() {
    if (!db()) {
      throw new Error('Firestore não inicializado (window.FB.db ausente).');
    }

    // Carrega todas as coleções em paralelo.
    const [leadsSnap, usersSnap, eventsSnap, settingsSnap] = await Promise.all([
      db().collection('leads').get(),
      db().collection('users').get(),
      db().collection('events').get(),
      db().collection('settings').doc('global').get()
    ]);

    _data.leads = leadsSnap.docs.map(d => d.data());
    _data.users = usersSnap.docs.map(d => d.data());
    _data.events = eventsSnap.docs.map(d => d.data());

    const settings = settingsSnap.exists ? settingsSnap.data() : null;
    _data.funnelStages = (settings && Array.isArray(settings.funnelStages) && settings.funnelStages.length)
      ? settings.funnelStages
      : [...Utils.FUNNEL_STAGES];
    _data.semesters = (settings && Array.isArray(settings.semesters) && settings.semesters.length)
      ? settings.semesters
      : [...Utils.SEMESTERS];

    // Primeira execução: banco vazio -> grava os settings padrão.
    if (!settingsSnap.exists) {
      saveSettings();
    }

    // Garante os eventos-base na primeira execução (banco sem eventos).
    if (_data.events.length === 0) {
      const seedEvents = [
        { id: 'ev-1', title: 'Corrida Academia Corpus', dateText: '27/06', exactDate: '2026-06-27', location: '', status: 'Pendente', ownerId: 'usr-admin', createdAt: new Date().toISOString() },
        { id: 'ev-2', title: 'Feira Casul', dateText: '01 e 02/07', exactDate: '2026-07-01', location: '', status: 'Pendente', ownerId: 'usr-admin', createdAt: new Date().toISOString() },
        { id: 'ev-3', title: 'Café da Manhã com Pastores', dateText: '04/07', exactDate: '2026-07-04', location: '', status: 'Pendente', ownerId: 'usr-admin', createdAt: new Date().toISOString() },
        { id: 'ev-4', title: 'SIPAT Amenco', dateText: '27 a 30/07', exactDate: '2026-07-27', location: '', status: 'Pendente', ownerId: 'usr-admin', createdAt: new Date().toISOString() },
        { id: 'ev-5', title: 'Volta às Aulas FADAP', dateText: '03/08', exactDate: '2026-08-03', location: '', status: 'Pendente', ownerId: 'usr-admin', createdAt: new Date().toISOString() },
        { id: 'ev-6', title: 'Dia da Saúde Jacto', dateText: '08/08', exactDate: '2026-08-08', location: '', status: 'Pendente', ownerId: 'usr-admin', createdAt: new Date().toISOString() }
      ];
      seedEvents.forEach(ev => { _data.events.push(ev); saveEventDoc(ev); });
    }

    // Migra attendantId -> attendantIds (compatibilidade com dados antigos).
    _data.leads.forEach(l => {
      if (!l.attendantIds) {
        l.attendantIds = l.attendantId ? [l.attendantId] : [];
        saveLeadDoc(l);
      }
    });
  }

  // --- Leads CRUD --------------------------------------------------------------

  function getLeads(filters = {}) {
    let result = [..._data.leads];

    if (filters.query) {
      const q = filters.query.toLowerCase();
      result = result.filter(l =>
        (l.name && l.name.toLowerCase().includes(q)) ||
        (l.cpf && l.cpf.includes(q)) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.phone && l.phone.includes(q))
      );
    }

    if (filters.origin && filters.origin !== '') result = result.filter(l => (l.origin || '').toLowerCase() === filters.origin.toLowerCase());
    if (filters.course && filters.course !== '') result = result.filter(l => (l.course || '').toLowerCase() === filters.course.toLowerCase());
    if (filters.funnelStage && filters.funnelStage !== '') result = result.filter(l => (l.funnelStage || '').toLowerCase() === filters.funnelStage.toLowerCase());
    if (filters.attendantId && filters.attendantId !== '') result = result.filter(l => l.attendantIds && l.attendantIds.includes(filters.attendantId));
    if (filters.semester && filters.semester !== '') result = result.filter(l => (l.semester || '').toLowerCase() === filters.semester.toLowerCase());
    if (filters.modality && filters.modality !== '') result = result.filter(l => (l.modality || '').toLowerCase() === filters.modality.toLowerCase());
    if (filters.date && filters.date !== '') {
      result = result.filter(l => {
        let lastContactDate = null;
        if (l.interactions && l.interactions.length > 0) {
          lastContactDate = l.interactions[0].createdAt;
        }
        if (!lastContactDate) lastContactDate = l.lastUpdate || l.createdAt;
        const contactIso = new Date(lastContactDate).toISOString().split('T')[0];
        return contactIso === filters.date;
      });
    }

    return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function getLead(id) {
    return _data.leads.find(l => l.id === id);
  }

  function addLead(data) {
    const now = new Date().toISOString();
    const newLead = {
      ...data,
      id: Utils.generateId(),
      createdAt: now,
      lastUpdate: now,
      assignedDate: (data.attendantIds && data.attendantIds.length > 0) ? now : '',
      attendantIds: data.attendantIds || [],
      interactions: [],
      contracts: [],
      documents: [],
      observation: data.observation || '',
      contactDate: data.contactDate || '',
      baseName: data.baseName || '',
      changelog: [{
        id: Utils.generateId(),
        field: 'Lead Criado',
        oldValue: '',
        newValue: data.funnelStage || 'Novo Lead',
        userId: _data.currentUserId,
        timestamp: now
      }]
    };
    _data.leads.push(newLead);
    saveLeadDoc(newLead);
    return newLead;
  }

  function updateLead(id, data) {
    const leadIndex = _data.leads.findIndex(l => l.id === id);
    if (leadIndex === -1) return null;

    const lead = _data.leads[leadIndex];
    const now = new Date().toISOString();

    for (const key in data) {
      if (key === 'attendantIds') {
        const oldIds = lead.attendantIds || [];
        const newIds = data.attendantIds || [];
        if (oldIds.join(',') !== newIds.join(',')) {
          lead.changelog.push({
            id: Utils.generateId(),
            field: 'Atendentes',
            oldValue: oldIds.map(id => { const u = getUser(id); return u ? u.name : id; }).join(', '),
            newValue: newIds.map(id => { const u = getUser(id); return u ? u.name : id; }).join(', '),
            userId: _data.currentUserId,
            timestamp: now
          });
          data.assignedDate = now;
        }
      } else if (data[key] !== lead[key] && key !== 'id' && key !== 'interactions' && key !== 'contracts' && key !== 'documents' && key !== 'changelog' && key !== 'lastUpdate') {
        lead.changelog.push({
          id: Utils.generateId(),
          field: key,
          oldValue: lead[key],
          newValue: data[key],
          userId: _data.currentUserId,
          timestamp: now
        });
      }
    }

    _data.leads[leadIndex] = { ...lead, ...data, lastUpdate: now };
    saveLeadDoc(_data.leads[leadIndex]);
    return _data.leads[leadIndex];
  }

  function deleteLead(id) {
    _data.leads = _data.leads.filter(l => l.id !== id);
    deleteLeadDoc(id);
  }

  function updateLeadStage(id, newStage) {
    const lead = getLead(id);
    if (!lead || lead.funnelStage === newStage) return;

    let newStatus = lead.academicStatus;
    if (newStage === 'Inscrito') newStatus = 'Inscrito';
    if (newStage === 'Aprovado') newStatus = 'Aprovado';
    if (newStage === 'Matriculado') newStatus = 'Matriculado';
    if (newStage === 'Perdido') newStatus = 'Desistente';

    updateLead(id, { funnelStage: newStage, academicStatus: newStatus });
  }

  // --- Interactions ------------------------------------------------------------

  function addInteraction(leadId, data) {
    const lead = getLead(leadId);
    if (!lead) return;

    const now = new Date().toISOString();
    const interaction = {
      ...data,
      id: Utils.generateId(),
      userId: _data.currentUserId,
      createdAt: now
    };

    if (!lead.interactions) lead.interactions = [];
    lead.interactions.unshift(interaction);
    lead.lastUpdate = now;
    saveLeadDoc(lead);
    return interaction;
  }

  function getInteractions(leadId) {
    const lead = getLead(leadId);
    return lead ? (lead.interactions || []) : [];
  }

  // --- Contracts & Documents ---------------------------------------------------

  function addContract(leadId, data) {
    const lead = getLead(leadId);
    if (!lead) return;

    if (!lead.contracts) lead.contracts = [];
    const contract = { ...data, id: Utils.generateId() };
    lead.contracts.push(contract);
    saveLeadDoc(lead);
    return contract;
  }

  function updateContract(leadId, contractId, data) {
    const lead = getLead(leadId);
    if (!lead || !lead.contracts) return;
    const idx = lead.contracts.findIndex(c => c.id === contractId);
    if (idx !== -1) {
      lead.contracts[idx] = { ...lead.contracts[idx], ...data };
      saveLeadDoc(lead);
    }
  }

  function addDocument(leadId, data) {
    const lead = getLead(leadId);
    if (!lead) return;
    if (!lead.documents) lead.documents = [];

    const doc = { ...data, id: Utils.generateId(), uploadDate: new Date().toISOString() };
    lead.documents.push(doc);
    saveLeadDoc(lead);
    return doc;
  }

  // --- Users CRUD --------------------------------------------------------------

  function getUsers() {
    return _data.users;
  }

  function getUser(id) {
    return _data.users.find(u => u.id === id);
  }

  // addUser aceita um id opcional (usado para casar com o UID do Firebase Auth).
  function addUser(data) {
    const newUser = {
      ...data,
      id: data.id || Utils.generateId(),
      avatar: Utils.getInitials(data.name),
      status: data.status || 'pending',
      active: data.active !== undefined ? data.active : true
    };
    // Não persistimos a senha em texto puro: quem cuida de senha é o Firebase Auth.
    delete newUser.password;
    _data.users.push(newUser);
    saveUserDoc(newUser);
    return newUser;
  }

  function updateUser(id, data) {
    const idx = _data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      if (data.name) data.avatar = Utils.getInitials(data.name);
      const merged = { ..._data.users[idx], ...data };
      delete merged.password; // segurança: nunca guardar senha no Firestore
      _data.users[idx] = merged;
      saveUserDoc(merged);
      return _data.users[idx];
    }
  }

  function deleteUser(id) {
    if (id === _data.currentUserId) return; // Prevent self-delete
    _data.users = _data.users.filter(u => u.id !== id);
    deleteUserDoc(id);
  }

  function getCurrentUser() {
    return getUser(_data.currentUserId);
  }

  // Apenas define quem está logado no cache (a sessão real é do Firebase Auth).
  function setCurrentUser(id) {
    _data.currentUserId = id;
  }

  // --- Stats and Reports -------------------------------------------------------

  function getStats() {
    const leads = _data.leads;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);

    const stats = {
      totalLeads: leads.length,
      monthLeads: 0,
      weekLeads: 0,
      enrollments: 0,
      presencialEnrollments: 0,
      presencialTransfers: 0,
      eadEnrollments: 0,
      conversionRate: 0,
      lostLeads: 0,
      pendingContracts: 0,
      leadsByOrigin: {},
      leadsByCourse: {},
      leadsByStage: {},
      leadsByAttendant: {},
      leadsByModality: { 'Presencial': 0, 'EAD': 0, 'Semipresencial': 0 },
      monthlyEvolution: [],
      enrollmentsByCourse: {}
    };

    Utils.ORIGINS.forEach(o => stats.leadsByOrigin[o] = 0);
    Utils.COURSES.forEach(c => {
      stats.leadsByCourse[c] = 0;
      stats.enrollmentsByCourse[c] = 0;
    });
    getFunnelStages().forEach(s => stats.leadsByStage[s] = 0);

    const monthlyData = {};

    leads.forEach(lead => {
      const createdDate = new Date(lead.createdAt);

      if (createdDate >= startOfMonth) stats.monthLeads++;
      if (createdDate >= oneWeekAgo) stats.weekLeads++;

      if (lead.modality) {
        if (stats.leadsByModality[lead.modality] !== undefined) {
          stats.leadsByModality[lead.modality]++;
        }
      }

      if (lead.funnelStage === 'Matriculado') {
        stats.enrollments++;
        if (lead.modality === 'Presencial') {
          if (lead.enrollmentType === 'Transferência') {
            stats.presencialTransfers++;
          } else {
            stats.presencialEnrollments++;
          }
        }
        if (lead.modality === 'EAD') stats.eadEnrollments++;

        if (stats.enrollmentsByCourse[lead.course] !== undefined) {
          stats.enrollmentsByCourse[lead.course]++;
        }
      }
      if (lead.funnelStage === 'Perdido') stats.lostLeads++;

      if (lead.contracts && lead.contracts.length > 0) {
        const pending = lead.contracts.filter(c => c.status === 'Pendente' || c.status === 'Enviado');
        stats.pendingContracts += pending.length;
      }

      if (stats.leadsByOrigin[lead.origin] !== undefined) stats.leadsByOrigin[lead.origin]++;
      else stats.leadsByOrigin['Outros'] = (stats.leadsByOrigin['Outros'] || 0) + 1;

      if (stats.leadsByCourse[lead.course] !== undefined) stats.leadsByCourse[lead.course]++;

      if (stats.leadsByStage[lead.funnelStage] !== undefined) stats.leadsByStage[lead.funnelStage]++;

      if (lead.attendantIds && lead.attendantIds.length > 0) {
        lead.attendantIds.forEach(attId => {
          if (!stats.leadsByAttendant[attId]) {
            stats.leadsByAttendant[attId] = { total: 0, enrolled: 0 };
          }
          stats.leadsByAttendant[attId].total++;
          if (lead.funnelStage === 'Matriculado') {
            stats.leadsByAttendant[attId].enrolled++;
          }
        });
      }

      const monthYear = `${createdDate.getMonth() + 1}/${createdDate.getFullYear().toString().substring(2)}`;
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = { leads: 0, enrollments: 0, time: createdDate.getTime() };
      }
      monthlyData[monthYear].leads++;
      if (lead.funnelStage === 'Matriculado') {
        monthlyData[monthYear].enrollments++;
      }
    });

    if (stats.totalLeads > 0) {
      stats.conversionRate = ((stats.enrollments / stats.totalLeads) * 100).toFixed(1);
    }

    const sortedMonths = Object.keys(monthlyData).sort((a, b) => monthlyData[a].time - monthlyData[b].time);
    stats.monthlyEvolution = sortedMonths.slice(-6).map(key => ({
      month: key,
      leads: monthlyData[key].leads,
      enrollments: monthlyData[key].enrollments
    }));

    return stats;
  }

  function getEnrollmentGoals() {
    return Utils.ENROLLMENT_GOALS;
  }

  function getMktInvestment() {
    return Utils.MKT_INVESTMENT;
  }

  function getEnrollmentActuals() {
    return Utils.ENROLLMENT_ACTUALS;
  }

  function importLeads(leadsArray) {
    let count = 0;
    const now = new Date().toISOString();
    const created = [];

    leadsArray.forEach(data => {
      if (!data.name) return;

      const newLead = {
        name: data.name,
        cpf: data.cpf || '',
        rg: data.rg || '',
        birthDate: data.birthDate || '',
        phone: data.phone || '',
        whatsapp: data.whatsapp || '',
        email: data.email || '',
        city: data.city || '',
        state: data.state || 'SP',
        origin: Utils.ORIGINS.includes(data.origin) ? data.origin : 'Outros',
        course: Utils.COURSES.includes(data.course) ? data.course : Utils.COURSES[0],
        modality: Utils.MODALITIES.includes(data.modality) ? data.modality : 'Presencial',
        semester: Utils.SEMESTERS.includes(data.semester) ? data.semester : Utils.SEMESTERS[0],
        academicStatus: Utils.ACADEMIC_STATUSES.includes(data.academicStatus) ? data.academicStatus : 'Interessado',
        funnelStage: getFunnelStages().includes(data.funnelStage) ? data.funnelStage : 'Novo Lead',
        status1: Utils.STATUS_1.includes(data.status1) ? data.status1 : '',
        status2: Utils.STATUS_2.includes(data.status2) ? data.status2 : '',
        observation: data.observation || '',
        contactDate: data.contactDate || '',
        baseName: data.baseName || '',
        id: Utils.generateId(),
        createdAt: now,
        lastUpdate: now,
        attendantIds: [],
        interactions: [],
        contracts: [],
        documents: [],
        changelog: [{
          id: Utils.generateId(),
          field: 'Importação',
          oldValue: '',
          newValue: 'Criado via Planilha',
          userId: _data.currentUserId,
          timestamp: now
        }]
      };

      _data.leads.push(newLead);
      created.push(newLead);
      count++;
    });

    // Grava em lotes (batch) de até 500 — bem mais rápido/barato que 1 a 1.
    if (db() && created.length) {
      for (let i = 0; i < created.length; i += 450) {
        const slice = created.slice(i, i + 450);
        const batch = db().batch();
        slice.forEach(l => batch.set(db().collection('leads').doc(l.id), l));
        batch.commit().catch(e => console.error('Erro ao importar leads (batch):', e));
      }
    }

    return count;
  }

  function searchLeads(query) {
    return getLeads({ query });
  }

  function exportLeadsData(filters = {}) {
    const leads = getLeads(filters);
    return leads.map(l => {
      const attendant = getUser(l.attendantId);
      return {
        'Nome': l.name,
        'CPF': l.cpf,
        'Telefone': l.phone,
        'E-mail': l.email,
        'Cidade': l.city,
        'Estado': l.state,
        'Origem': l.origin,
        'Curso': l.course,
        'Modalidade': l.modality,
        'Semestre': l.semester,
        'Fase do Funil': l.funnelStage,
        'Status Acadêmico': l.academicStatus,
        'Status 1': l.status1 || '-',
        'Status 2': l.status2 || '-',
        'Observação': l.observation || '',
        'Data Contato': Utils.formatDate(l.contactDate),
        'Atendente': attendant ? attendant.name : 'Não atribuído',
        'Data de Cadastro': Utils.formatDate(l.createdAt),
        'Última Atualização': Utils.formatDate(l.lastUpdate)
      };
    });
  }

  // --- Funnel Stages CRUD ------------------------------------------------------

  function getFunnelStages() {
    if (!_data.funnelStages || !Array.isArray(_data.funnelStages)) {
      _data.funnelStages = [...Utils.FUNNEL_STAGES];
    }
    return _data.funnelStages;
  }

  function addFunnelStage(name) {
    if (!_data.funnelStages) _data.funnelStages = [...Utils.FUNNEL_STAGES];
    if (_data.funnelStages.includes(name)) return false;
    _data.funnelStages.push(name);
    saveSettings();
    return true;
  }

  function removeFunnelStage(name) {
    if (!_data.funnelStages) return false;
    const leadsInStage = _data.leads.filter(l => l.funnelStage === name);
    if (leadsInStage.length > 0) return { error: 'HAS_LEADS', count: leadsInStage.length };
    _data.funnelStages = _data.funnelStages.filter(s => s !== name);
    saveSettings();
    return true;
  }

  function renameFunnelStage(oldName, newName) {
    if (!_data.funnelStages) return false;
    const idx = _data.funnelStages.indexOf(oldName);
    if (idx === -1) return false;
    if (_data.funnelStages.includes(newName)) return false;
    _data.funnelStages[idx] = newName;
    _data.leads.forEach(l => {
      if (l.funnelStage === oldName) {
        l.funnelStage = newName;
        saveLeadDoc(l);
      }
    });
    saveSettings();
    return true;
  }

  function reorderFunnelStages(newOrder) {
    _data.funnelStages = newOrder;
    saveSettings();
  }

  // --- Semesters CRUD ----------------------------------------------------------

  function getSemesters() {
    return _data.semesters || [...Utils.SEMESTERS];
  }

  function addSemester(name) {
    if (!_data.semesters) _data.semesters = [...Utils.SEMESTERS];
    if (!_data.semesters.includes(name)) {
      _data.semesters.push(name);
      saveSettings();
    }
  }

  function deleteSemester(name) {
    if (!_data.semesters) _data.semesters = [...Utils.SEMESTERS];
    _data.semesters = _data.semesters.filter(s => s !== name);
    saveSettings();
  }

  // --- Events CRUD -------------------------------------------------------------

  function getEvents() {
    return _data.events || [];
  }

  function addEvent(eventData) {
    if (!_data.events) _data.events = [];
    const newEvent = {
      id: Utils.generateId(),
      title: eventData.title,
      dateText: eventData.dateText,
      exactDate: eventData.exactDate,
      location: eventData.location || '',
      description: eventData.description || '',
      status: eventData.status || 'Pendente',
      ownerId: eventData.ownerId || _data.currentUserId,
      createdAt: new Date().toISOString()
    };
    _data.events.push(newEvent);
    saveEventDoc(newEvent);
    return newEvent;
  }

  function updateEvent(id, eventData) {
    if (!_data.events) return null;
    const index = _data.events.findIndex(e => e.id === id);
    if (index > -1) {
      _data.events[index] = { ..._data.events[index], ...eventData };
      saveEventDoc(_data.events[index]);
      return _data.events[index];
    }
    return null;
  }

  function deleteEvent(id) {
    if (!_data.events) return;
    _data.events = _data.events.filter(e => e.id !== id);
    deleteEventDoc(id);
  }

  return {
    init,
    getLeads,
    getLead,
    addLead,
    updateLead,
    deleteLead,
    updateLeadStage,
    addInteraction,
    getInteractions,
    addContract,
    updateContract,
    addDocument,
    getUsers,
    getUser,
    addUser,
    updateUser,
    deleteUser,
    getCurrentUser,
    setCurrentUser,
    getStats,
    getEnrollmentGoals,
    getMktInvestment,
    getEnrollmentActuals,
    importLeads,
    searchLeads,
    exportLeadsData,
    getFunnelStages,
    addFunnelStage,
    removeFunnelStage,
    renameFunnelStage,
    reorderFunnelStages,
    getSemesters,
    addSemester,
    deleteSemester,
    getEvents,
    addEvent,
    updateEvent,
    deleteEvent
  };
})();
