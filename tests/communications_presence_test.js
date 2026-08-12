const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('getOnlineUsers mantém usuários offline visíveis com estado de presença', () => {
  const context = {
    console,
    crypto: { randomUUID: () => 'test-id' },
    localStorage: {
      store: {},
      getItem(key) { return this.store[key] ?? null; },
      setItem(key, value) { this.store[key] = String(value); },
      removeItem(key) { delete this.store[key]; }
    },
    window: { alert() {} },
    document: {
      addEventListener() {},
      body: { dataset: {} },
      getElementById() { return null; },
      querySelectorAll() { return []; },
      createElement() { return {}; }
    },
    setTimeout,
    clearTimeout,
    URLSearchParams,
    Date
  };

  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8'), context);

  vm.runInContext(`
    currentUser = {
      id: 'user-joao-paulo-oliveira',
      nome: 'João Paulo Oliveira',
      email: 'joaopaulooliveira@fcaadvogados.com.br',
      perfil: 'usuario',
      setores: []
    };
    communicationStore = {
      emails: [],
      rooms: [],
      presence: [
        { userId: 'user-joao-paulo-oliveira', isOnline: true, lastSeenAt: new Date().toISOString() },
        { userId: 'user-leticia-lima', isOnline: false, lastSeenAt: new Date().toISOString() }
      ]
    };
  `, context);

  const users = vm.runInContext('getOnlineUsers()', context);

  assert(users.some((user) => user.id === 'user-leticia-lima' && user.isOnline === false));
  assert(users.some((user) => user.id === 'user-joao-paulo-oliveira' && user.isOnline === true));
});
