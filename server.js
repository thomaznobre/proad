const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

let ImapFlow = null;
let simpleParser = null;

const ROOT_DIR = __dirname;

function loadDotEnvFile() {
  const envPath = path.join(ROOT_DIR, '.env');
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  content.split(/\r?\n/).forEach((line) => {
    const trimmed = String(line || '').trim();
    if (!trimmed || trimmed.startsWith('#')) {
      return;
    }

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex <= 0) {
      return;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (!key || Object.prototype.hasOwnProperty.call(process.env, key)) {
      return;
    }

    process.env[key] = value;
  });
}

loadDotEnvFile();

const DATA_DIR = path.join(ROOT_DIR, 'data');
const COMMUNICATIONS_FILE = path.join(DATA_DIR, 'communications.json');
const PORT = Number(process.env.PORT || 8000);
const IMAP_ENABLED = String(process.env.IMAP_ENABLED || 'false').toLowerCase() === 'true';
const IMAP_HOST = String(process.env.IMAP_HOST || '').trim();
const IMAP_PORT = Number(process.env.IMAP_PORT || 993);
const IMAP_SECURE = String(process.env.IMAP_SECURE || 'true').toLowerCase() !== 'false';
const IMAP_USER = String(process.env.IMAP_USER || '').trim();
const IMAP_PASS = String(process.env.IMAP_PASS || '').trim();
const IMAP_MAILBOX = String(process.env.IMAP_MAILBOX || 'INBOX').trim();
const IMAP_POLL_INTERVAL_MS = Number(process.env.IMAP_POLL_INTERVAL_MS || 60000);
const IMAP_MARK_SEEN = String(process.env.IMAP_MARK_SEEN || 'true').toLowerCase() !== 'false';

const SEEDED_DIRECTORY_USERS = [
  { id: 'user-joao-paulo-oliveira', nome: 'João Paulo Oliveira', email: 'joaopaulooliveira@fcaadvogados.com.br', perfil: 'usuario' },
  { id: 'user-leticia-lima', nome: 'Letícia Lima', email: 'leticialima@fcaadvogados.com.br', perfil: 'usuario' },
  { id: 'user-leandro-bittencourt', nome: 'Leandro Bittencourt', email: 'leandrobittencourt@fcaadvogados.com.br', perfil: 'usuario' },
  { id: 'user-felipe-caribe', nome: 'Felipe Caribé', email: 'felipecaribe@fcaadvogados.com.br', perfil: 'usuario' },
  { id: 'user-felipe-rocha', nome: 'Felipe Rocha', email: 'feliperocha@fcaadvogados.com.br', perfil: 'usuario' },
  { id: 'user-gabriel-gazzaneo', nome: 'Gabriel Gazzaneo', email: 'gabrielgazzaneo@fcaadvogados.com.br', perfil: 'usuario' },
  { id: 'user-lucas-alves', nome: 'Lucas Alves', email: 'lucasalves@fcaadvogados.com.br', perfil: 'usuario' },
  { id: 'user-luis-ferrrari', nome: 'Luís Ferrrari', email: 'luisferrrari@fcaadvogados.com.br', perfil: 'usuario' },
  { id: 'user-arykoerne-lima', nome: 'Arykoerne Lima', email: 'arykoernelima@fcaadvogados.com.br', perfil: 'visualizador' },
  { id: 'user-vitor-cavalcante', nome: 'Vitor Cavalcante', email: 'vitorcavalcante@fcaadvogados.com.br', perfil: 'usuario' }
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function ensureCommunicationsStore() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(COMMUNICATIONS_FILE)) {
    fs.writeFileSync(COMMUNICATIONS_FILE, JSON.stringify({ emails: [], rooms: [], presence: [] }, null, 2));
  }
}

function loadImapDependencies() {
  if (ImapFlow && simpleParser) {
    return true;
  }

  try {
    ({ ImapFlow } = require('imapflow'));
    ({ simpleParser } = require('mailparser'));
    return true;
  } catch (error) {
    return false;
  }
}

function normalizeExternalSyncState(externalSync) {
  const normalized = externalSync && typeof externalSync === 'object' ? externalSync : {};
  return {
    seenMessageIds: Array.isArray(normalized.seenMessageIds)
      ? normalized.seenMessageIds.map((item) => String(item || '').trim()).filter(Boolean).slice(-5000)
      : [],
    lastRunAt: normalized.lastRunAt ? String(normalized.lastRunAt) : null,
    lastError: normalized.lastError ? String(normalized.lastError) : null,
    importedCount: Number.isFinite(Number(normalized.importedCount)) ? Number(normalized.importedCount) : 0,
    configured: IMAP_ENABLED && Boolean(IMAP_HOST && IMAP_USER && IMAP_PASS)
  };
}

function normalizeStore(store) {
  const normalized = {
    emails: Array.isArray(store?.emails) ? store.emails : [],
    rooms: Array.isArray(store?.rooms) ? store.rooms : [],
    presence: Array.isArray(store?.presence) ? store.presence : [],
    externalSync: normalizeExternalSyncState(store?.externalSync)
  };
  return normalized;
}

function readCommunicationsStore() {
  ensureCommunicationsStore();

  try {
    const raw = fs.readFileSync(COMMUNICATIONS_FILE, 'utf-8');
    const parsed = JSON.parse(raw || '{}');
    const store = normalizeStore(parsed);
    ensureSeededCorporateEmails(store);
    writeCommunicationsStore(store);
    return store;
  } catch (error) {
    const store = normalizeStore({});
    ensureSeededCorporateEmails(store);
    writeCommunicationsStore(store);
    return store;
  }
}

function writeCommunicationsStore(store) {
  ensureCommunicationsStore();
  fs.writeFileSync(COMMUNICATIONS_FILE, JSON.stringify(store, null, 2));
}

function ensureSeededCorporateEmails(store) {
  const emailKeys = new Set(store.emails.map((email) => `${String(email.toUserId || '').trim()}::${String(email.subject || '').trim()}`));

  SEEDED_DIRECTORY_USERS.forEach((user) => {
    const subject = 'Boas-vindas ao correio corporativo';
    const emailKey = `${user.id}::${subject}`;
    if (emailKeys.has(emailKey)) {
      return;
    }

    store.emails.push({
      id: `seed-${user.id}`,
      toUserId: user.id,
      toEmail: user.email,
      fromUserId: 'admin-thomaz-nobre',
      fromName: 'Administração FCA Advogados',
      fromEmail: 'administracao@fcaadvogados.com.br',
      subject,
      body: `Olá, ${user.nome}.\n\nSeu e-mail corporativo ${user.email} já está liberado no PROAD com senha provisória 123*. O CPF será preenchido depois pelo administrador.`,
      sentAt: new Date().toISOString(),
      readBy: []
    });
  });

  store.emails.sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
}

function getEmailDirectoryMap() {
  const map = new Map();
  SEEDED_DIRECTORY_USERS.forEach((user) => {
    map.set(String(user.email || '').toLowerCase(), user);
  });
  return map;
}

function getAddressValues(addressObject) {
  if (!addressObject || !Array.isArray(addressObject.value)) {
    return [];
  }

  return addressObject.value
    .map((item) => ({
      name: String(item?.name || '').trim(),
      address: String(item?.address || '').trim().toLowerCase()
    }))
    .filter((item) => item.address);
}

function registerSeenMessage(store, messageId) {
  const ids = store.externalSync.seenMessageIds;
  ids.push(messageId);
  store.externalSync.seenMessageIds = ids.slice(-5000);
}

function buildExternalEmailRecord({ parsedMail, recipient, sourceUid }) {
  const from = getAddressValues(parsedMail.from)[0] || { name: 'Remetente externo', address: 'externo@desconhecido' };
  const date = parsedMail.date instanceof Date ? parsedMail.date : new Date();
  return {
    id: `ext-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    toUserId: recipient.id,
    toEmail: recipient.email,
    fromUserId: 'external-sender',
    fromName: from.name || from.address,
    fromEmail: from.address,
    subject: String(parsedMail.subject || '(Sem assunto)').trim(),
    body: String(parsedMail.text || parsedMail.html || '').trim() || '(Mensagem sem corpo legível)',
    sentAt: date.toISOString(),
    readBy: [],
    externalSourceUid: sourceUid
  };
}

function appendImportedExternalEmail(store, parsedMail, sourceUid) {
  const directoryByEmail = getEmailDirectoryMap();
  const recipients = [
    ...getAddressValues(parsedMail.to),
    ...getAddressValues(parsedMail.cc),
    ...getAddressValues(parsedMail.bcc)
  ];

  const importedRecords = [];
  recipients.forEach((recipientAddress) => {
    const directoryUser = directoryByEmail.get(recipientAddress.address);
    if (!directoryUser) {
      return;
    }

    const emailRecord = buildExternalEmailRecord({ parsedMail, recipient: directoryUser, sourceUid });
    store.emails.unshift(emailRecord);
    importedRecords.push(emailRecord);
  });

  return importedRecords;
}

async function pollExternalEmailsOnce() {
  if (!IMAP_ENABLED) {
    return { ok: false, reason: 'disabled' };
  }

  if (!(IMAP_HOST && IMAP_USER && IMAP_PASS)) {
    return { ok: false, reason: 'missing-config' };
  }

  if (!loadImapDependencies()) {
    return { ok: false, reason: 'missing-dependencies' };
  }

  const store = readCommunicationsStore();
  const seen = new Set(store.externalSync.seenMessageIds);
  const client = new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: IMAP_SECURE,
    auth: {
      user: IMAP_USER,
      pass: IMAP_PASS
    },
    logger: false
  });

  let importedCount = 0;
  try {
    await client.connect();
    const lock = await client.getMailboxLock(IMAP_MAILBOX);
    try {
      for await (const message of client.fetch({ seen: false }, { uid: true, source: true, envelope: true })) {
        const fallbackId = `uid-${message.uid}`;
        const parsedMail = await simpleParser(message.source);
        const messageId = String(parsedMail.messageId || fallbackId).trim();

        if (seen.has(messageId)) {
          if (IMAP_MARK_SEEN) {
            await client.messageFlagsAdd(message.uid, ['\\Seen']);
          }
          continue;
        }

        const imported = appendImportedExternalEmail(store, parsedMail, message.uid);
        registerSeenMessage(store, messageId);
        seen.add(messageId);
        importedCount += imported.length;

        if (IMAP_MARK_SEEN) {
          await client.messageFlagsAdd(message.uid, ['\\Seen']);
        }
      }
    } finally {
      lock.release();
    }

    store.externalSync.lastRunAt = new Date().toISOString();
    store.externalSync.lastError = null;
    store.externalSync.importedCount = Number(store.externalSync.importedCount || 0) + importedCount;
    writeCommunicationsStore(store);
    await client.logout();
    return { ok: true, importedCount };
  } catch (error) {
    store.externalSync.lastRunAt = new Date().toISOString();
    store.externalSync.lastError = error.message;
    writeCommunicationsStore(store);
    try {
      await client.logout();
    } catch (logoutError) {
      // no-op
    }
    return { ok: false, reason: 'error', error: error.message };
  }
}

function getExternalStatus(store) {
  const depsLoaded = loadImapDependencies();
  return {
    enabled: IMAP_ENABLED,
    configured: IMAP_ENABLED && Boolean(IMAP_HOST && IMAP_USER && IMAP_PASS),
    dependenciesInstalled: depsLoaded,
    mailbox: IMAP_MAILBOX,
    pollIntervalMs: IMAP_POLL_INTERVAL_MS,
    lastRunAt: store.externalSync.lastRunAt,
    lastError: store.externalSync.lastError,
    importedCount: store.externalSync.importedCount
  };
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

function sendText(response, statusCode, message) {
  response.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(message);
}

function collectBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Payload muito grande.'));
      }
    });
    request.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error('JSON inválido.'));
      }
    });
    request.on('error', reject);
  });
}

function normalizePresenceEntries(entries) {
  const now = Date.now();
  return entries.filter((entry) => {
    if (!entry || !entry.userId || !entry.lastSeenAt) {
      return false;
    }

    return now - new Date(entry.lastSeenAt).getTime() <= 1000 * 60 * 60 * 12;
  });
}

function handlePresenceUpsert(store, body) {
  const userId = String(body.userId || '').trim();
  if (!userId) {
    return { error: 'userId é obrigatório.' };
  }

  const nextPresence = normalizePresenceEntries(store.presence).filter((entry) => entry.userId !== userId);
  nextPresence.push({
    userId,
    nome: String(body.nome || '').trim(),
    email: String(body.email || '').trim(),
    perfil: String(body.perfil || 'usuario').trim(),
    setores: Array.isArray(body.setores) ? body.setores : [],
    isOnline: body.isOnline !== false,
    lastSeenAt: new Date().toISOString()
  });

  store.presence = nextPresence;
  writeCommunicationsStore(store);
  return { ok: true, presence: nextPresence };
}

function getCommunicationsPayload(store, query) {
  const userId = String(query.get('userId') || '').trim();
  const email = String(query.get('email') || '').trim().toLowerCase();
  const perfil = String(query.get('perfil') || 'usuario').trim();

  const emails = store.emails.filter((item) => {
    if (!userId && !email) {
      return perfil === 'administrador';
    }

    return item.toUserId === userId || String(item.toEmail || '').toLowerCase() === email;
  });

  const rooms = perfil === 'administrador'
    ? store.rooms
    : store.rooms.filter((room) => Array.isArray(room.memberIds) && room.memberIds.includes(userId));

  return {
    emails,
    rooms,
    presence: normalizePresenceEntries(store.presence)
  };
}

function normalizeRoomMembers(memberIds, createdBy) {
  return Array.from(new Set([createdBy, ...(Array.isArray(memberIds) ? memberIds : [])].map((item) => String(item || '').trim()).filter(Boolean)));
}

async function handleApi(request, response, url) {
  const store = readCommunicationsStore();

  if (request.method === 'GET' && url.pathname === '/api/health') {
    sendJson(response, 200, { ok: true });
    return true;
  }

  if (request.method === 'GET' && url.pathname === '/api/communications') {
    sendJson(response, 200, getCommunicationsPayload(store, url.searchParams));
    return true;
  }

  if (request.method === 'GET' && url.pathname === '/api/communications/external/status') {
    sendJson(response, 200, getExternalStatus(store));
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/communications/external/sync') {
    const result = await pollExternalEmailsOnce();
    sendJson(response, result.ok ? 200 : 500, result);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/communications/presence') {
    const body = await collectBody(request);
    const result = handlePresenceUpsert(store, body);
    if (result.error) {
      sendJson(response, 400, result);
      return true;
    }

    sendJson(response, 200, result);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/communications/emails') {
    const body = await collectBody(request);
    const toUserId = String(body.toUserId || '').trim();
    const toEmail = String(body.toEmail || '').trim();
    const subject = String(body.subject || '').trim();
    const fromUserId = String(body.fromUserId || '').trim();

    if (!toUserId || !toEmail || !subject || !String(body.body || '').trim() || !fromUserId) {
      sendJson(response, 400, { error: 'Destinatário, assunto, corpo e remetente são obrigatórios.' });
      return true;
    }

    const email = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      toUserId,
      toEmail,
      fromUserId,
      fromName: String(body.fromName || 'Usuário PROAD').trim(),
      fromEmail: String(body.fromEmail || 'nao-responda@proad.local').trim(),
      subject,
      body: String(body.body || '').trim(),
      sentAt: new Date().toISOString(),
      readBy: []
    };

    store.emails.unshift(email);
    writeCommunicationsStore(store);
    sendJson(response, 201, { email });
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/api/communications/rooms') {
    const body = await collectBody(request);
    const createdBy = String(body.createdBy || '').trim();
    const memberIds = normalizeRoomMembers(body.memberIds, createdBy);
    if (!createdBy || memberIds.length < 2) {
      sendJson(response, 400, { error: 'A sala precisa de ao menos dois participantes.' });
      return true;
    }

    const room = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: String(body.name || 'Nova sala').trim(),
      createdBy,
      createdAt: new Date().toISOString(),
      memberIds,
      messages: []
    };

    store.rooms.unshift(room);
    writeCommunicationsStore(store);
    sendJson(response, 201, { room });
    return true;
  }

  if (request.method === 'PATCH' && /^\/api\/communications\/rooms\/[^/]+$/.test(url.pathname)) {
    const roomId = url.pathname.split('/').pop();
    const body = await collectBody(request);
    let found = false;

    store.rooms = store.rooms.map((room) => {
      if (room.id !== roomId) {
        return room;
      }

      found = true;
      return {
        ...room,
        name: String(body.name || room.name).trim() || room.name,
        memberIds: body.memberIds ? normalizeRoomMembers(body.memberIds, room.createdBy) : room.memberIds
      };
    });

    if (!found) {
      sendJson(response, 404, { error: 'Sala não encontrada.' });
      return true;
    }

    writeCommunicationsStore(store);
    sendJson(response, 200, { room: store.rooms.find((room) => room.id === roomId) });
    return true;
  }

  if (request.method === 'DELETE' && /^\/api\/communications\/rooms\/[^/]+$/.test(url.pathname)) {
    const roomId = url.pathname.split('/').pop();
    const before = store.rooms.length;
    store.rooms = store.rooms.filter((room) => room.id !== roomId);

    if (before === store.rooms.length) {
      sendJson(response, 404, { error: 'Sala não encontrada.' });
      return true;
    }

    writeCommunicationsStore(store);
    sendJson(response, 200, { ok: true });
    return true;
  }

  if (request.method === 'POST' && /^\/api\/communications\/rooms\/[^/]+\/messages$/.test(url.pathname)) {
    const parts = url.pathname.split('/');
    const roomId = parts[parts.length - 2];
    const body = await collectBody(request);
    let found = false;

    store.rooms = store.rooms.map((room) => {
      if (room.id !== roomId) {
        return room;
      }

      found = true;
      const message = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        authorId: String(body.authorId || '').trim(),
        authorName: String(body.authorName || 'Usuário PROAD').trim(),
        body: String(body.body || '').trim(),
        sentAt: new Date().toISOString(),
        mentionUserIds: Array.isArray(body.mentionUserIds) ? body.mentionUserIds : [],
        seenBy: Array.isArray(body.seenBy) ? body.seenBy : []
      };

      return {
        ...room,
        messages: [...room.messages, message]
      };
    });

    if (!found) {
      sendJson(response, 404, { error: 'Sala não encontrada.' });
      return true;
    }

    writeCommunicationsStore(store);
    sendJson(response, 201, { ok: true });
    return true;
  }

  return false;
}

function serveStaticFile(requestPath, response) {
  const safePath = requestPath === '/' ? '/index.html' : requestPath;
  const absolutePath = path.join(ROOT_DIR, safePath);

  if (!absolutePath.startsWith(ROOT_DIR)) {
    sendText(response, 403, 'Acesso negado.');
    return;
  }

  fs.readFile(absolutePath, (error, content) => {
    if (error) {
      sendText(response, 404, 'Arquivo não encontrado.');
      return;
    }

    const ext = path.extname(absolutePath).toLowerCase();
    response.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    response.end(content);
  });
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);

    if (url.pathname.startsWith('/api/')) {
      const handled = await handleApi(request, response, url);
      if (!handled) {
        sendJson(response, 404, { error: 'Rota não encontrada.' });
      }
      return;
    }

    serveStaticFile(url.pathname, response);
  } catch (error) {
    sendJson(response, 500, { error: 'Falha interna no servidor.', details: error.message });
  }
});

if (IMAP_ENABLED) {
  setInterval(() => {
    pollExternalEmailsOnce().catch(() => {});
  }, IMAP_POLL_INTERVAL_MS);

  pollExternalEmailsOnce().catch(() => {});
}

server.listen(PORT, '0.0.0.0', () => {
  console.log(`PROAD disponível em http://0.0.0.0:${PORT}`);
});