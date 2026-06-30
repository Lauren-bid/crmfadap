// js/firebase.js
// Inicialização do Firebase (App + Firestore + Auth) usando os SDKs compat (CDN).
// As chaves abaixo são públicas por design — quem protege os dados são as Security Rules.

(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyB1I5vIUQHXpsn4YpS_bo5sM55zHna3PrU",
    authDomain: "crm-unifadap.firebaseapp.com",
    projectId: "crm-unifadap",
    storageBucket: "crm-unifadap.firebasestorage.app",
    messagingSenderId: "335562556078",
    appId: "1:335562556078:web:c17c747e225a88f803e33f"
  };

  if (!window.firebase || !firebase.initializeApp) {
    console.error('SDK do Firebase não carregou. Verifique os <script> no index.html.');
    return;
  }

  // App principal (sessão do usuário logado)
  const app = firebase.initializeApp(firebaseConfig);

  // App secundário: usado SÓ para criar contas (cadastro/novo usuário) sem
  // deslogar quem está usando o sistema (ex.: o admin criando um colaborador).
  const secondaryApp = firebase.initializeApp(firebaseConfig, 'Secondary');

  const db = firebase.firestore();

  // Camada 1 da otimização de leitura: cache de disco (IndexedDB) do Firestore.
  // synchronizeTabs:true permite o cache funcionar com várias abas abertas.
  // Falha de forma silenciosa em navegadores sem suporte (modo anônimo, etc.) —
  // nesse caso o app continua funcionando, só sem o cache persistente.
  db.enablePersistence({ synchronizeTabs: true })
    .catch(err => {
      if (err && err.code === 'failed-precondition') {
        console.warn('Persistência: múltiplas abas sem suporte a sync — cache limitado a uma aba.');
      } else if (err && err.code === 'unimplemented') {
        console.warn('Persistência não suportada neste navegador — seguindo sem cache de disco.');
      } else {
        console.warn('Persistência indisponível:', err && err.code);
      }
    });

  window.FB = {
    app,
    auth: firebase.auth(),
    db,
    // Auth + Firestore da instância secundária. Usados para criar contas:
    // após o createUser, a instância secundária fica logada como o novo usuário,
    // então o secondaryDb grava o doc /users/{uid} já autenticado como ele
    // (atendendo às Security Rules), sem afetar a sessão principal.
    secondaryAuth: secondaryApp.auth(),
    secondaryDb: secondaryApp.firestore()
  };
})();
