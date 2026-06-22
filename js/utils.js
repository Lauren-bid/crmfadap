// js/utils.js

window.Utils = (function() {
  
  // Constants - Updated with real spreadsheet data
  const COURSES_PRESENCIAL = [
    'Direito', 'Psicologia', 'Fisioterapia', 'Enfermagem', 'Farmácia', 
    'Biomedicina', 'Inteligência Artificial', 'Estética e Cosmética', 
    'Terapia Ocupacional', 'Administração'
  ];

  const COURSES_EAD = [
    'Pedagogia', 'Educação Física (Lic.)', 'Engenharia Civil', 
    'Análise e Desenvolvimento de Sistemas', 'Ciências Contábeis', 
    'Marketing', 'Gestão Hospitalar', 'Gestão do Agronegócio', 
    'Gestão Comercial', 'Logística', 'Processos Gerenciais', 
    'Engenharia da Computação', 'Gastronomia', 'Teologia', 
    'Secretariado', 'Jogos Digitais', 'Gestão de RH', 
    'Gestão de Qualidade', 'Gestão de Segurança Privada', 
    'Gestão da Produção Industrial', 'Gestão de Serviços Judiciais',
    'Gestão Financeira'
  ];

  const COURSES = [...COURSES_PRESENCIAL, ...COURSES_EAD, 'Pós-graduação', '(Outro Curso)', 'Não Preencheu'];

  const ORIGINS = [
    'Agência', 'Whatsapp', 'Site', 'Indicação', 'Presencial',
    'Ligação no fixo da instituição', 'Lead Antigo', 'Ação externa',
    'Ação Comercial', 'VENDA DIRETA', 'Outros'
  ];

  const STATUS_1 = [
    'TEM INTERESSE', 'RECUSA', 'WHATSAPP', 'CONTATO SEM SUCESSO',
    'ANALISANDO PROPOSTA', 'APROVADO', 'RETORNO NO MEIO DO ANO'
  ];

  const STATUS_2 = [
    'MATRICULA REALIZADA', 'AGUARDANDO INTERAÇÃO', 'NÃO TEM INTERESSE',
    'OPTOU POR OUTRA IES', 'TENTATIVA DE CONTATO 7X NÃO CORRESPONDIDA',
    'MENSALIDADE NÃO CABE NO ORÇAMENTO MESMO COM DESCONTO',
    'INTERESSE EM 2026-2', 'INTERESSE EM 2027-1', 'NÃO ATENDE',
    'RETORNAR LIGAÇÃO', 'IRÁ ANALISAR A PROPOSTA (PENSAR)',
    'FARÁ MATRÍCULA', 'LOCALIZAÇÃO', 'PREENCHEU SEM QUERER',
    'JÁ É ALUNO', 'CURSO NÃO OFERTADO', 'DIRECIONADO PARA O PRESENCIAL',
    'INTERESSE EM PÓS', 'IDOSO', 'TELEFONE NÃO EXISTE',
    'INTERAGINDO', 'NÃO RESPONDE NO WHATSAPP', 'DESLIGOU NA CARA',
    'PESSOA DESCONHECIDA', 'INDISPONIBILIDADE DE HORÁRIO',
    'FARÁ INSCRIÇÃO', 'IRÁ AGUARDAR PARA FAZER A MATRÍCULA',
    'INTERESSE PARA 2026', 'QUER FAZER PRESENCIAL',
    'SEGUNDA LICENCIATURA (6 A 18 MESES)', 'PESSOA DE IDADE - SEM INTERESSE',
    'CURSOS GRADUAÇÃO EAD'
  ];

  const FUNNEL_STAGES = ['Novo Lead', 'Primeiro Contato', 'Em Negociação', 'Visitou a Instituição', 'Inscrito', 'Aprovado', 'Matriculado', 'Perdido'];
  const FUNNEL_STAGES_SHEET = ['LEAD', 'MATRÍCULA CANCELADA', 'APROVADO', 'INSCRITO INCOMPLETO', 'MATRICULADO', 'JÁ É ALUNO', 'TRANSFERÊNCIA', 'REMATRICULA'];

  const ACADEMIC_STATUSES = ['Interessado','Inscrito','Processo Seletivo','Aprovado','Matriculado','Desistente'];
  const MODALITIES = ['Presencial','EAD','Semipresencial'];
  const SEMESTERS = ['2025/2','2026/1','2026/2','2027/1'];

  // Enrollment Goals from spreadsheet image
  const ENROLLMENT_GOALS = {
    presencial: {
      total: 100,
      courses: {
        'Direito': 25, 'Psicologia': 25, 'Fisioterapia': 20, 'Enfermagem': 20,
        'Farmácia': 20, 'Biomedicina': 20, 'Inteligência Artificial': 20,
        'Estética e Cosmética': 20, 'Terapia Ocupacional': 20, 'Administração': 15
      }
    },
    presencial_transfer: {
      total: 30
    },
    ead: {
      total: 150,
      perCourse: 15
    }
  };

  // Marketing Investment from spreadsheet
  const MKT_INVESTMENT = [
    { month: 'Maio', presencial: 2000, ead: 3000 },
    { month: 'Junho', presencial: 3500, ead: 4000 },
    { month: 'Julho', presencial: 3500, ead: 4000 },
    { month: 'Agosto', presencial: 2000, ead: 3000 }
  ];

  // Enrollment actuals from report
  const ENROLLMENT_ACTUALS = {
    presencial: {
      total: 28,
      courses: {
        'Direito': 9, 'Biomedicina': 4, 'Administração': 4, 'Farmácia': 3,
        'Terapia Ocupacional': 2, 'Fisioterapia': 2, 'Enfermagem': 2,
        'Psicologia': 1, 'Estética e Cosmética': 1
      }
    },
    ead: {
      total: 11,
      courses: {
        'Análise e Desenvolvimento de Sistemas': 3, 'Gestão da Produção Industrial': 2,
        'Engenharia da Computação': 2, 'Teologia': 1, 'Secretariado': 1,
        'Pedagogia': 1, 'Educação Física (Lic.)': 1
      }
    }
  };

  // Stage mapping from sheet to CRM funnel
  const STAGE_MAP = {
    'LEAD': 'Novo Lead',
    'MATRÍCULA CANCELADA': 'Perdido',
    'APROVADO': 'Aprovado',
    'INSCRITO INCOMPLETO': 'Inscrito',
    'MATRICULADO': 'Matriculado',
    'JÁ É ALUNO': 'Matriculado',
    'TRANSFERÊNCIA': 'Matriculado',
    'REMATRICULA': 'Matriculado'
  };

  // ID Generator
  function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Formatters
  function formatCPF(cpf) {
    if (!cpf) return '';
    const numeric = cpf.replace(/\D/g, '');
    if (numeric.length !== 11) return cpf;
    return numeric.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }

  function formatPhone(phone) {
    if (!phone) return '';
    const numeric = phone.replace(/\D/g, '');
    if (numeric.length === 11) {
      return numeric.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numeric.length === 10) {
      return numeric.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return phone;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('pt-BR');
    } catch(e) {
      return dateStr;
    }
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
    } catch(e) {
      return dateStr;
    }
  }

  function formatRelativeTime(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Agora mesmo';
    if (diffMins < 60) return `Há ${diffMins} min`;
    if (diffHours < 24) return `Há ${diffHours} h`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `Há ${diffDays} dias`;
    
    return formatDate(dateStr);
  }

  // Validators
  function validateCPF(cpf) {
    const numeric = cpf.replace(/\D/g, '');
    return numeric.length === 11;
  }

  function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Input Masks
  function maskCPF(value) {
    let v = value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d)/, '$1.$2.$3-$4');
    else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d)/, '$1.$2.$3');
    else if (v.length > 3) v = v.replace(/(\d{3})(\d)/, '$1.$2');
    return v;
  }

  function maskPhone(value) {
    let v = value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    if (v.length > 10) v = v.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    else if (v.length > 6) v = v.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    else if (v.length > 2) v = v.replace(/(\d{2})(\d)/, '($1) $2');
    return v;
  }

  // Function wrappers
  function debounce(fn, delay) {
    let timeoutId;
    return function(...args) {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fn.apply(this, args);
      }, delay);
    };
  }

  function throttle(fn, delay) {
    let lastCall = 0;
    return function(...args) {
      const now = new Date().getTime();
      if (now - lastCall >= delay) {
        lastCall = now;
        return fn.apply(this, args);
      }
    };
  }

  // Text Utils
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.innerText = str;
    return div.innerHTML;
  }

  function sanitize(str) {
    return escapeHtml((str || '').trim());
  }

  function getInitials(name) {
    if (!name) return '??';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return '??';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // Array Utils
  function sortBy(array, key, direction = 'asc') {
    return [...array].sort((a, b) => {
      let valA = a[key];
      let valB = b[key];
      
      // Handle missing values
      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';
      
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }

  function filterByQuery(array, query, keys) {
    if (!query) return array;
    const term = query.toLowerCase().trim();
    return array.filter(item => {
      return keys.some(key => {
        const val = item[key];
        return val && String(val).toLowerCase().includes(term);
      });
    });
  }

  // File Utils
  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }

  return {
    generateId, formatCPF, formatPhone, formatDate, formatDateTime, formatRelativeTime,
    validateCPF, validateEmail, maskCPF, maskPhone, debounce, throttle,
    escapeHtml, sanitize, getInitials, sortBy, filterByQuery, downloadFile,
    COURSES, COURSES_PRESENCIAL, COURSES_EAD, ORIGINS, STATUS_1, STATUS_2,
    STATES_BR: ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'],
    FUNNEL_STAGES, FUNNEL_STAGES_SHEET, ACADEMIC_STATUSES, MODALITIES, SEMESTERS,
    ENROLLMENT_GOALS, MKT_INVESTMENT, ENROLLMENT_ACTUALS, STAGE_MAP
  };
})();
