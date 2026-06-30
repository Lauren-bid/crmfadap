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

  window.FB = {
    app,
    auth: firebase.auth(),
    db: firebase.firestore(),
    // Auth + Firestore da instância secundária. Usados para criar contas:
    // após o createUser, a instância secundária fica logada como o novo usuário,
    // então o secondaryDb grava o doc /users/{uid} já autenticado como ele
    // (atendendo às Security Rules), sem afetar a sessão principal.
    secondaryAuth: secondaryApp.auth(),
    secondaryDb: secondaryApp.firestore()
  };
})();
