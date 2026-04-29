export const environment = {
  production: true,
  defaultauth: 'keycloak',
  apiBaseUrl: '/api',
  keycloak: {
    url: 'https://keycloak.example.com',
    realm: 'rhcamunda-realm',
    clientId: 'angular-frontend',
    onLoad: 'check-sso'
  },
  firebaseConfig: {
    apiKey: '',
    authDomain: '',
    databaseURL: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    measurementId: ''
  }
};
