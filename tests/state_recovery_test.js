const fs = require('fs');
const vm = require('vm');
const path = require('path');

function createElement() {
  return {
    style: {},
    classList: {
      add() {},
      remove() {},
      toggle() {},
      contains() { return false; }
    },
    dataset: {},
    value: '',
    checked: false,
    hidden: false,
    textContent: '',
    innerHTML: '',
    outerHTML: '',
    appendChild() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
    addEventListener() {},
    removeEventListener() {},
    setAttribute() {},
    getAttribute() { return null; },
    reset() {},
    focus() {},
    blur() {},
    closest() { return null; },
    parentElement: null,
    children: []
  };
}

function buildContext() {
  const storage = {};
  const document = {
    body: createElement(),
    addEventListener() {},
    removeEventListener() {},
    createElement() { return createElement(); },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    getElementById(id) {
      if (id === 'moduleContent') {
        return createElement();
      }
      return createElement();
    },
    title: 'Proad'
  };

  const context = {
    console,
    document,
    window: {
      addEventListener() {},
      removeEventListener() {},
      prompt() { return null; },
      alert() {},
      location: { href: '' }
    },
    localStorage: {
      getItem(key) { return storage[key] ?? null; },
      setItem(key, value) { storage[key] = String(value); },
      removeItem(key) { delete storage[key]; }
    },
    crypto: { randomUUID: () => 'mock-uuid' },
    setTimeout,
    clearTimeout,
    Date,
    JSON,
    Math,
    String,
    Number,
    Boolean,
    Array,
    Object,
    RegExp,
    Map,
    Set,
    URL,
    navigator: { userAgent: 'node' }
  };

  context.global = context;
  context.globalThis = context;
  return { context, storage };
}

function loadApp() {
  const appPath = path.join(__dirname, '..', 'app.js');
  const source = fs.readFileSync(appPath, 'utf8');
  const { context } = buildContext();
  vm.createContext(context);
  vm.runInContext(source, context, { filename: appPath });
  return context;
}

const { context, storage } = buildContext();
context.localStorage.setItem('proad-state', JSON.stringify({ processes: [] }));
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8'), context, { filename: path.join(__dirname, '..', 'app.js') });

const recoveredState = vm.runInContext('state', context);
if (!recoveredState || !Array.isArray(recoveredState.processes) || recoveredState.processes.length === 0) {
  throw new Error('A aplicação deveria restaurar pelo menos um processo quando o estado salvo estiver vazio.');
}

console.log('State recovery test passed');
