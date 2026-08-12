const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('hasAdminAccess reconhece perfis de administrador com variação de caixa', () => {
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

  assert.equal(context.hasAdminAccess({ perfil: 'Administrador' }), true);
  assert.equal(context.hasAdminAccess({ perfil: 'administrador' }), true);
  assert.equal(context.hasAdminAccess({ perfil: 'usuario' }), false);
  assert.equal(context.hasAdminAccess({ perfil: 'ADMINISTRADOR' }), true);
});

test('renderModuleContent do catálogo de status mantém ações de admin para perfis com caixa mista', () => {
  const context = {
    console,
    crypto: { randomUUID: () => 'test-id' },
    localStorage: {
      store: {},
      getItem(key) { return this.store[key] ?? null; },
      setItem(key, value) { this.store[key] = String(value); },
      removeItem(key) { delete this.store[key]; }
    },
    window: { alert() {}, prompt() { return null; } },
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

  const container = {
    innerHTML: '',
    querySelectorAll() { return []; },
    querySelector() { return null; }
  };

  vm.runInContext(`
    state = {
      statusCatalog: ['DFD', 'PARECER JURÍDICO', 'CONCLUÍDO'],
      modalidades: ['Contratação Direta'],
      ritosPorModalidade: { 'Contratação Direta': ['DFD', 'PARECER JURÍDICO'] }
    };
    currentUser = { perfil: 'Administrador' };
  `, context);

  context.document.getElementById = (id) => {
    if (id === 'moduleContent') {
      return container;
    }
    return null;
  };

  vm.runInContext('renderModuleContent("ritos")', context);

  assert.match(container.innerHTML, /data-status-remove=/);
  assert.match(container.innerHTML, /data-status-edit=/);
  assert.match(container.innerHTML, /Adicionar/);
});

test('isAdminUser aceita perfis de administrador persistidos em role ou caixa mista', () => {
  const context = {
    console,
    crypto: { randomUUID: () => 'test-id' },
    localStorage: {
      store: {},
      getItem(key) { return this.store[key] ?? null; },
      setItem(key, value) { this.store[key] = String(value); },
      removeItem(key) { delete this.store[key]; }
    },
    window: { alert() {}, prompt() { return null; } },
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

  assert.equal(context.isAdminUser({ perfil: 'ADMINISTRADOR' }), true);
  assert.equal(context.isAdminUser({ role: 'Administrador' }), true);
  assert.equal(context.isAdminUser({ roles: ['usuario', 'administrador'] }), true);
  assert.equal(context.isAdminUser({ perfil: 'usuario' }), false);
  assert.equal(context.normalizeUser({ perfil: 'Administrador' }).perfil, 'administrador');
});

test('renderModuleContent do módulo de ritos permite filtrar modalidades visíveis com seleção livre', () => {
  const context = {
    console,
    crypto: { randomUUID: () => 'test-id' },
    localStorage: {
      store: {},
      getItem(key) { return this.store[key] ?? null; },
      setItem(key, value) { this.store[key] = String(value); },
      removeItem(key) { delete this.store[key]; }
    },
    window: { alert() {}, prompt() { return null; } },
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

  const container = {
    innerHTML: '',
    querySelectorAll() { return []; },
    querySelector() { return null; }
  };

  vm.runInContext(`
    state = {
      statusCatalog: ['DFD', 'PARECER JURÍDICO', 'CONCLUÍDO'],
      modalidades: ['Contratação Direta', 'Pregão', 'Concorrência'],
      ritosPorModalidade: {
        'Contratação Direta': ['DFD'],
        'Pregão': ['DFD'],
        'Concorrência': ['DFD']
      },
      ritosModalidadesVisiveis: ['Contratação Direta']
    };
    currentUser = { perfil: 'Administrador' };
  `, context);

  context.document.getElementById = (id) => {
    if (id === 'moduleContent') {
      return container;
    }
    return null;
  };

  vm.runInContext('renderModuleContent("ritos")', context);

  assert.match(container.innerHTML, /Modalidades visíveis/);
  assert.match(container.innerHTML, /data-ritos-visibility-all/);
  assert.match(container.innerHTML, /data-ritos-visibility-modality="Contratação Direta"/);
  assert.match(container.innerHTML, /data-ritos-modalidade-card="Contratação Direta"/);
  assert.doesNotMatch(container.innerHTML, /data-ritos-modalidade-card="Pregão"/);
});
