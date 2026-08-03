/* ===== SISTEMA DE AUTENTICAÇÃO ===== */

// Usuário logado atualmente
let currentUser = null;

const seededDirectoryUsers = [
  { id: 'admin-thomaz-nobre', nome: 'Thomaz Nobre', email: 'thomaz.nobre@hotmail.com', perfil: 'administrador', password: '@Sebastian87*' },
  { id: 'user-thomaz-nobre-corporativo', nome: 'Thomaz Nobre', email: 'thomaznobre@fcaadvogados.com.br', perfil: 'usuario', password: '@Sebastian87*' },
  { id: 'user-joao-paulo-oliveira', nome: 'João Paulo Oliveira', email: 'joaopaulooliveira@fcaadvogados.com.br', perfil: 'usuario', password: '123*' },
  { id: 'user-leticia-lima', nome: 'Letícia Lima', email: 'leticialima@fcaadvogados.com.br', perfil: 'usuario', password: '123*' },
  { id: 'user-leandro-bittencourt', nome: 'Leandro Bittencourt', email: 'leandrobittencourt@fcaadvogados.com.br', perfil: 'usuario', password: '123*' },
  { id: 'user-felipe-caribe', nome: 'Felipe Caribé', email: 'felipecaribe@fcaadvogados.com.br', perfil: 'usuario', password: '123*' },
  { id: 'user-felipe-rocha', nome: 'Felipe Rocha', email: 'feliperocha@fcaadvogados.com.br', perfil: 'usuario', password: '123*' },
  { id: 'user-gabriel-gazzaneo', nome: 'Gabriel Gazzaneo', email: 'gabrielgazzaneo@fcaadvogados.com.br', perfil: 'usuario', password: '123*' },
  { id: 'user-lucas-alves', nome: 'Lucas Alves', email: 'lucasalves@fcaadvogados.com.br', perfil: 'usuario', password: '123*' },
  { id: 'user-luis-ferrrari', nome: 'Luís Ferrrari', email: 'luisferrrari@fcaadvogados.com.br', perfil: 'usuario', password: '123*' },
  { id: 'user-arykoerne-lima', nome: 'Arykoerne Lima', email: 'arykoernelima@fcaadvogados.com.br', perfil: 'visualizador', password: '123*' },
  { id: 'user-vitor-cavalcante', nome: 'Vitor Cavalcante', email: 'vitorcavalcante@fcaadvogados.com.br', perfil: 'usuario', password: '123*' }
];

function normalizeUser(user) {
  const source = user && typeof user === 'object' ? user : {};
  return {
    id: String(source.id || crypto.randomUUID()),
    nome: String(source.nome || '').trim(),
    email: String(source.email || '').trim(),
    cpf: String(source.cpf || '').trim(),
    phone: String(source.phone || '').trim(),
    password: String(source.password || ''),
    perfil: String(source.perfil || 'usuario').trim(),
    createdAt: String(source.createdAt || new Date().toISOString())
  };
}

function getAllUsers() {
  const saved = localStorage.getItem('proad-users');
  if (!saved) {
    return seededDirectoryUsers.map(normalizeUser);
  }

  try {
    const parsed = JSON.parse(saved);
    const users = Array.isArray(parsed) ? parsed : [];
    return users.map(normalizeUser);
  } catch (error) {
    return seededDirectoryUsers.map(normalizeUser);
  }
}

function saveAllUsers(users) {
  const normalized = Array.isArray(users) ? users.map(normalizeUser) : [];
  localStorage.setItem('proad-users', JSON.stringify(normalized));
  return normalized;
}

function ensureSeededUsers() {
  const existingUsers = getAllUsers();
  const byEmail = new Map();
  const byCpf = new Map();

  existingUsers.forEach((user) => {
    const emailKey = String(user.email || '').trim().toLowerCase();
    const cpfKey = String(user.cpf || '').replace(/\D/g, '');
    if (emailKey) {
      byEmail.set(emailKey, user);
    }
    if (cpfKey) {
      byCpf.set(cpfKey, user);
    }
  });

  seededDirectoryUsers.map(normalizeUser).forEach((seedUser) => {
    const emailKey = String(seedUser.email || '').trim().toLowerCase();
    const cpfKey = String(seedUser.cpf || '').replace(/\D/g, '');
    if (emailKey && byEmail.has(emailKey)) {
      return;
    }
    if (cpfKey && byCpf.has(cpfKey)) {
      return;
    }
    existingUsers.push(seedUser);
    if (emailKey) {
      byEmail.set(emailKey, seedUser);
    }
    if (cpfKey) {
      byCpf.set(cpfKey, seedUser);
    }
  });

  saveAllUsers(existingUsers);
}

function buildCurrentUserSession(user) {
  const normalized = normalizeUser(user);
  return {
    id: normalized.id,
    nome: normalized.nome,
    email: normalized.email,
    cpf: normalized.cpf,
    perfil: normalized.perfil,
    permissions: Array.isArray(user?.permissions) ? user.permissions : []
  };
}

function saveCurrentUser() {
  if (!currentUser) {
    localStorage.removeItem('proad-current-user');
    return;
  }

  localStorage.setItem('proad-current-user', JSON.stringify(currentUser));
}

function syncCurrentUserSession() {
  const saved = localStorage.getItem('proad-current-user');
  if (!saved) {
    currentUser = null;
    return;
  }

  try {
    currentUser = buildCurrentUserSession(JSON.parse(saved));
  } catch (error) {
    currentUser = null;
  }
}

function updateUserPresence(userId, isOnline) {
  const currentPresence = Array.isArray(state.communications?.presence) ? state.communications.presence : [];
  const nextPresence = currentPresence.filter((item) => item.userId !== userId);
  if (userId) {
    nextPresence.push({ userId, isOnline: Boolean(isOnline), updatedAt: new Date().toISOString() });
  }
  state.communications = {
    ...normalizeCommunicationsState(state.communications),
    presence: nextPresence
  };
  persistState();
}

function validateCPF(cpf) {
  return String(cpf || '').replace(/\D/g, '').length === 11;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

// Carregar usuário do localStorage se existir
function loadCurrentUser() {
  const saved = localStorage.getItem('proad-current-user');
  if (!saved) {
    currentUser = null;
    return;
  }

  try {
    currentUser = JSON.parse(saved);
  } catch (error) {
    currentUser = null;
  }
}

function validatePhone(phone) {
  const cleanPhone = String(phone || '').replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}

function validatePassword(password) {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*]/.test(password)
  };
  
  return {
    isValid: Object.values(requirements).every(r => r),
    requirements
  };
}

function formatCPF(cpf) {
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return cpf;
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function formatPhone(phone) {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (clean.length === 10) {
    return clean.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return phone;
}

// ===== LÓGICA DE LOGIN =====

function showLoginScreen() {
  const loginScreen = document.getElementById('loginScreen');
  const appScreen = document.getElementById('appScreen');
  
  if (loginScreen) loginScreen.style.display = 'flex';
  if (appScreen) appScreen.style.display = 'none';
}

function showAppScreen() {
  const loginScreen = document.getElementById('loginScreen');
  const appScreen = document.getElementById('appScreen');
  
  if (loginScreen) loginScreen.style.display = 'none';
  if (appScreen) appScreen.style.display = 'block';
}

function handleLogin(e) {
  e.preventDefault();
  
  const loginInput = document.getElementById('loginInput');
  const loginPassword = document.getElementById('loginPassword');
  const loginInputError = document.getElementById('loginInputError');
  const loginPasswordError = document.getElementById('loginPasswordError');
  const loginMessage = document.getElementById('loginMessage');
  
  // Limpar erros
  loginInputError.textContent = '';
  loginPasswordError.textContent = '';
  loginMessage.textContent = '';
  loginMessage.classList.remove('error', 'success');
  
  const input = loginInput.value.trim();
  const password = loginPassword.value;
  
  if (!input) {
    loginInputError.textContent = 'CPF ou e-mail é obrigatório';
    return;
  }
  
  if (!password) {
    loginPasswordError.textContent = 'Senha é obrigatória';
    return;
  }
  
  // Buscar usuário
  const users = getAllUsers();
  const user = users.find(u => {
    const cleanCPF = String(u.cpf || '').replace(/\D/g, '');
    const inputCPF = input.replace(/\D/g, '');
    const emailMatches = String(u.email || '').toLowerCase() === input.toLowerCase();
    const cpfMatches = cleanCPF && cleanCPF === inputCPF;
    return (cpfMatches || emailMatches) && u.password === password;
  });
  
  if (!user) {
    loginMessage.textContent = 'CPF/E-mail ou senha inválidos';
    loginMessage.classList.add('error');
    return;
  }
  
  // Login bem-sucedido
  currentUser = buildCurrentUserSession(user);
  saveCurrentUser();
  updateUserPresence(user.id, true);
  loginInput.value = '';
  loginPassword.value = '';
  showAppScreen();
  
  // Inicializar app
  if (typeof init === 'function') {
    init();
  }
}

function handleLogout() {
  if (confirm('Tem certeza que deseja fazer logout?')) {
    if (currentUser?.id) {
      updateUserPresence(currentUser.id, false);
      syncPresenceWithApi(false).catch(() => {});
    }
    closeMessagesPopover();
    currentUser = null;
    saveCurrentUser();
    communicationDataLoaded = false;
    communicationStore = { emails: [], rooms: [], presence: [] };
    showLoginScreen();
    document.getElementById('loginForm').reset();
  }
}

function openSignupModal() {
  const modal = document.getElementById('signupModal');
  if (modal) {
    modal.classList.add('active');
  }
}

function closeSignupModal() {
  const modal = document.getElementById('signupModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function updatePasswordRequirements() {
  const password = document.getElementById('signupPassword').value;
  const validation = validatePassword(password);
  
  const reqLength = document.getElementById('reqLength');
  const reqUppercase = document.getElementById('reqUppercase');
  const reqLowercase = document.getElementById('reqLowercase');
  const reqNumber = document.getElementById('reqNumber');
  const reqSpecial = document.getElementById('reqSpecial');
  const signupBtn = document.getElementById('signupBtn');
  
  if (validation.requirements.length) {
    reqLength.classList.add('met');
  } else {
    reqLength.classList.remove('met');
  }
  
  if (validation.requirements.uppercase) {
    reqUppercase.classList.add('met');
  } else {
    reqUppercase.classList.remove('met');
  }
  
  if (validation.requirements.lowercase) {
    reqLowercase.classList.add('met');
  } else {
    reqLowercase.classList.remove('met');
  }
  
  if (validation.requirements.number) {
    reqNumber.classList.add('met');
  } else {
    reqNumber.classList.remove('met');
  }
  
  if (validation.requirements.special) {
    reqSpecial.classList.add('met');
  } else {
    reqSpecial.classList.remove('met');
  }
  
  // Habilitar botão se validação passar
  if (validation.isValid) {
    signupBtn.disabled = false;
  } else {
    signupBtn.disabled = true;
  }
}

function handleSignup(e) {
  e.preventDefault();
  
  const firstName = document.getElementById('signupFirstName').value.trim();
  const lastName = document.getElementById('signupLastName').value.trim();
  const cpf = document.getElementById('signupCPF').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const phone = document.getElementById('signupPhone').value.trim();
  const password = document.getElementById('signupPassword').value;
  
  // Limpar mensagens de erro
  const errors = {};
  document.getElementById('signupFirstNameError').textContent = '';
  document.getElementById('signupLastNameError').textContent = '';
  document.getElementById('signupCPFError').textContent = '';
  document.getElementById('signupEmailError').textContent = '';
  document.getElementById('signupPhoneError').textContent = '';
  document.getElementById('signupPasswordError').textContent = '';
  document.getElementById('signupMessage').textContent = '';
  document.getElementById('signupMessage').classList.remove('error', 'success');
  
  // Validações
  if (!firstName) {
    errors.firstName = 'Nome é obrigatório';
  }
  
  if (!lastName) {
    errors.lastName = 'Sobrenome é obrigatório';
  }
  
  if (!validateCPF(cpf)) {
    errors.cpf = 'CPF inválido';
  } else {
    // Verificar se CPF já está registrado
    const users = getAllUsers();
    const cleanCPF = cpf.replace(/\D/g, '');
    if (users.some(u => String(u.cpf || '').replace(/\D/g, '') === cleanCPF)) {
      errors.cpf = 'CPF já está registrado';
    }
  }
  
  if (!validateEmail(email)) {
    errors.email = 'E-mail inválido';
  } else {
    // Verificar se e-mail já está registrado
    const users = getAllUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      errors.email = 'E-mail já está registrado';
    }
  }
  
  if (!validatePhone(phone)) {
    errors.phone = 'Telefone inválido (deve incluir DDD)';
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    errors.password = 'Senha não atende aos requisitos';
  }
  
  // Exibir erros
  if (Object.keys(errors).length > 0) {
    if (errors.firstName) {
      document.getElementById('signupFirstNameError').textContent = errors.firstName;
      document.getElementById('signupFirstName').classList.add('error');
    }
    if (errors.lastName) {
      document.getElementById('signupLastNameError').textContent = errors.lastName;
      document.getElementById('signupLastName').classList.add('error');
    }
    if (errors.cpf) {
      document.getElementById('signupCPFError').textContent = errors.cpf;
      document.getElementById('signupCPF').classList.add('error');
    }
    if (errors.email) {
      document.getElementById('signupEmailError').textContent = errors.email;
      document.getElementById('signupEmail').classList.add('error');
    }
    if (errors.phone) {
      document.getElementById('signupPhoneError').textContent = errors.phone;
      document.getElementById('signupPhone').classList.add('error');
    }
    if (errors.password) {
      document.getElementById('signupPasswordError').textContent = errors.password;
      document.getElementById('signupPassword').classList.add('error');
    }
    return;
  }
  
  // Remover classes de erro
  document.getElementById('signupFirstName').classList.remove('error');
  document.getElementById('signupLastName').classList.remove('error');
  document.getElementById('signupCPF').classList.remove('error');
  document.getElementById('signupEmail').classList.remove('error');
  document.getElementById('signupPhone').classList.remove('error');
  document.getElementById('signupPassword').classList.remove('error');
  
  // Criar novo usuário
  const newUser = {
    id: crypto.randomUUID(),
    nome: `${firstName} ${lastName}`,
    cpf: formatCPF(cpf),
    email,
    phone: formatPhone(phone),
    password, // Em produção, isso deveria ser hasheado
    perfil: 'usuario',
    createdAt: new Date().toISOString()
  };
  
  const users = getAllUsers();
  users.push(newUser);
  saveAllUsers(users);
  
  // Mensagem de sucesso
  const signupMessage = document.getElementById('signupMessage');
  signupMessage.textContent = 'Conta criada com sucesso! Você pode fazer login agora.';
  signupMessage.classList.add('success');
  
  // Limpar formulário
  document.getElementById('signupForm').reset();
  
  // Fechar modal após 2 segundos
  setTimeout(() => {
    closeSignupModal();
    showLoginScreen();
  }, 2000);
}

// ===== INICIALIZAÇÃO DO SISTEMA DE AUTENTICAÇÃO =====

function initAdminUser() {
  ensureSeededUsers();
  localStorage.setItem('proad-admin-initialized', 'true');
}

function initPasswordToggles() {
  if (document.body.dataset.passwordToggleBound) {
    return;
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('.password-toggle-btn');
    if (!button) {
      return;
    }

    event.preventDefault();
    const targetId = button.getAttribute('data-target');
    const input = document.getElementById(targetId);
    if (!input) {
      return;
    }

    const shouldShow = input.type === 'password';
    input.type = shouldShow ? 'text' : 'password';
    button.textContent = shouldShow ? '🙈' : '👁';
    button.setAttribute('aria-pressed', shouldShow ? 'true' : 'false');
  });

  document.body.dataset.passwordToggleBound = '1';
}

function handleStartupResetQuery() {
  try {
    const url = new URL(window.location.href);
    const resetFlag = String(url.searchParams.get('reset') || '').trim();
    if (resetFlag !== '1') {
      return false;
    }

    localStorage.removeItem('proad-state');
    localStorage.removeItem('proad-current-user');

    url.searchParams.delete('reset');
    window.location.replace(url.toString());
    return true;
  } catch (error) {
    console.error('Falha ao processar reset de inicialização por URL.', error);
    return false;
  }
}

function initAuth() {
  if (handleStartupResetQuery()) {
    return;
  }

  // Cadastrar administrador padrão na primeira execução
  initAdminUser();

  // Carregar usuário salvo
  loadCurrentUser();
  syncCurrentUserSession();
  
  // Se houver usuário logado, mostrar app, senão mostrar login
  if (currentUser) {
    showAppScreen();
  } else {
    showLoginScreen();
  }
  
  // Bind login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Bind signup buttons
  const signupBtnLogin = document.getElementById('signupBtnLogin');
  if (signupBtnLogin) {
    signupBtnLogin.addEventListener('click', (e) => {
      e.preventDefault();
      openSignupModal();
    });
  }
  
  const closeSignupBtn = document.getElementById('closeSignupModal');
  if (closeSignupBtn) {
    closeSignupBtn.addEventListener('click', closeSignupModal);
  }
  
  // Fechar modal ao clicar fora
  const signupModal = document.getElementById('signupModal');
  if (signupModal) {
    signupModal.addEventListener('click', (e) => {
      if (e.target === signupModal) {
        closeSignupModal();
      }
    });
  }
  
  // Bind signup form
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', handleSignup);
  }

  bindProtocolModalEvents();
  
  // Monitorar mudanças na senha para atualizar requisitos
  const signupPassword = document.getElementById('signupPassword');
  if (signupPassword) {
    signupPassword.addEventListener('input', updatePasswordRequirements);
  }

  // Inicializar botões de mostrar/ocultar senha
  initPasswordToggles();
  
  // Limpar erros ao digitar
  const inputs = document.querySelectorAll('.login-form input, .signup-form input');
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      input.classList.remove('error');
    });
  });
  
  // Bind logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Bind home button
  const homeBtn = document.getElementById('homeBtn');
  if (homeBtn) {
    homeBtn.addEventListener('click', handleLogout);
  }

  bindTopbarMessages();
  
  // Inicializar app se usuário estiver logado
  if (currentUser) {
    init();
  }
}

// ===== FIM SISTEMA DE AUTENTICAÇÃO =====

const moduleConfig = [
  { key: 'painel', label: 'Painel Geral', icon: '▣', description: 'Visualização diferenciada por perfil do usuário.' },
  { key: 'estrutura-municipal', label: 'Estrutura Municipal', icon: '🏛', description: 'Cadastro de municípios, secretarias e setores em organograma.' },
  { key: 'licitacoes', label: 'Licitações', icon: '⚖', description: 'Fluxo de compras e procedimentos licitatórios.' },
  { key: 'ritos', label: 'Ritos', icon: '🧭', description: 'Configuração de status por modalidade.' },
  { key: 'contratos', label: 'Gestão de Contratos / ARPs', icon: '📄', description: 'Acompanhamento de contratos e análise de riscos.' },
  { key: 'fornecedores', label: 'Fornecedores', icon: '🏢', description: 'Planilha com cadastro e dados dos fornecedores.' },
  { key: 'comunicacao', label: 'Correio e Chat', icon: '✉', description: 'Caixa de entrada corporativa e salas de conversa internas.' },
  { key: 'usuarios', label: 'Permissões e Usuários', icon: '🔐', description: 'Controle de acesso e perfis.' }
];

const defaultSetoresDestino = [
  'Gabinete do Prefeito',
  'Setor de Licitações',
  'Setor de Contratos',
  'Setor Financeiro',
  'Setor de Compras',
  'Procuradoria'
];

const defaultModalidades = [
  'Inexigibilidade',
  'Pregão-e',
  'Dispensa-e',
  'Dispensa',
  'Concorrência',
  'Diálogo Competitivo',
  'Chamada Pública'
].sort((a, b) => a.localeCompare(b, 'pt-BR'));

const defaultStatusCatalog = [
  'DFD',
  'ETP',
  'TR',
  'APROVAÇÃO',
  'PARECER JURÍDICO',
  'AUTORIZAÇÃO',
  'PUBLICAÇÕES DE EXTRATO',
  'TERMO DE AQUIVAMENTO',
  'TCE'
];

const defaultRitosPorModalidade = {
  'Inexigibilidade': ['DFD', 'ETP', 'TR', 'APROVAÇÃO', 'PARECER JURÍDICO', 'AUTORIZAÇÃO', 'PUBLICAÇÕES DE EXTRATO', 'TERMO DE AQUIVAMENTO', 'TCE'],
  'Pregão-e': ['DFD', 'ETP', 'TR', 'APROVAÇÃO', 'PARECER JURÍDICO', 'AUTORIZAÇÃO', 'PUBLICAÇÕES DE EXTRATO', 'TERMO DE AQUIVAMENTO', 'TCE'],
  'Dispensa-e': ['DFD', 'TR', 'APROVAÇÃO', 'PARECER JURÍDICO', 'AUTORIZAÇÃO', 'PUBLICAÇÕES DE EXTRATO', 'TERMO DE AQUIVAMENTO', 'TCE'],
  'Dispensa': ['DFD', 'TR', 'APROVAÇÃO', 'PARECER JURÍDICO', 'AUTORIZAÇÃO', 'PUBLICAÇÕES DE EXTRATO', 'TERMO DE AQUIVAMENTO', 'TCE'],
  'Concorrência': ['DFD', 'ETP', 'TR', 'APROVAÇÃO', 'PARECER JURÍDICO', 'AUTORIZAÇÃO', 'PUBLICAÇÕES DE EXTRATO', 'TERMO DE AQUIVAMENTO', 'TCE'],
  'Diálogo Competitivo': ['DFD', 'ETP', 'TR', 'APROVAÇÃO', 'PARECER JURÍDICO', 'AUTORIZAÇÃO', 'PUBLICAÇÕES DE EXTRATO', 'TERMO DE AQUIVAMENTO', 'TCE'],
  'Chamada Pública': ['DFD', 'ETP', 'TR', 'APROVAÇÃO', 'PARECER JURÍDICO', 'AUTORIZAÇÃO', 'PUBLICAÇÕES DE EXTRATO', 'TERMO DE AQUIVAMENTO', 'TCE']
};

const licitacoesColumnOrder = ['processoNumero', 'secretaria', 'objeto', 'responsavel', 'status', 'modalidade', 'numeroOrdem'];
const defaultLicitacoesColumnWidths = {
  processoNumero: 'auto',
  secretaria: '16%',
  objeto: '30%',
  responsavel: '14%',
  status: '14%',
  modalidade: '13%',
  numeroOrdem: '13%'
};


const fornecedoresData = [
  {
    id: 'fornecedor-1',
    nome: 'ELLOELLA DISTRIBUIDORA LTDA',
    cnpj: '53.571.459/0001-01',
    objeto: 'AQUISIÇÃO DE LIVROS DIDÁTICOS COMPLEMENTAR',
    fundo: 'Fundo da Educação',
    fonte: 'Conteúdo público extraído do Notion compartilhado',
    vinculos: [
      { tipo: 'Contrato', numero: '001/2026', status: 'Vigente', objeto: 'AQUISIÇÃO DE LIVROS DIDÁTICOS COMPLEMENTAR', fundo: 'Fundo da Educação', dataInicio: '15/01/2026', dataTermino: '15/01/2027', parentId: null },
      { tipo: 'Aditivo', numero: '01', status: 'Vigente', objeto: 'Prorrogação de prazo e adequação contratual', fundo: 'Fundo da Educação', dataInicio: '15/01/2027', dataTermino: '15/03/2027', parentId: '001/2026' }
    ]
  },
  {
    id: 'fornecedor-2',
    nome: 'JB PRODUTORA LTDA',
    cnpj: '51.034.132/0001-75',
    objeto: 'AQUISIÇÃO DE MATERIAL PARA CÂMARA FRIA',
    fundo: 'Fundo da Educação',
    fonte: 'Conteúdo público extraído do Notion compartilhado',
    vinculos: [
      { tipo: 'Contrato', numero: '217/2025', status: 'Vigente', objeto: 'AQUISIÇÃO DE MATERIAL PARA CÂMARA FRIA', fundo: 'Fundo da Educação', dataInicio: '12/02/2026', dataTermino: '12/02/2027', parentId: null }
    ]
  },
  {
    id: 'fornecedor-3',
    nome: 'LIDER LOGISTICA ALIMENTAR E DISTRIBUICAO LTDA',
    cnpj: '31.380.662/0001-12',
    objeto: 'GÊNEROS ALIMENTÍCIOS (MERENDA ESCOLAR)',
    fundo: 'Fundo da Educação',
    fonte: 'Conteúdo público extraído do Notion compartilhado',
    vinculos: [
      { tipo: 'ARP', numero: '023/2025', status: 'Vigente', objeto: 'GÊNEROS ALIMENTÍCIOS (MERENDA ESCOLAR)', fundo: 'Fundo da Educação', dataInicio: '10/04/2026', dataTermino: '10/04/2027', parentId: null },
      { tipo: 'Apostilamento', numero: '01', status: 'Vigente', objeto: 'Atualização de cronograma de entrega', fundo: 'Fundo da Educação', dataInicio: '10/04/2027', dataTermino: '10/05/2027', parentId: '023/2025' }
    ]
  },
  {
    id: 'fornecedor-4',
    nome: 'MIRANDA REFRIGERACAO E INFORMATICA LTDA',
    cnpj: '17.136.563/0001-04',
    objeto: 'APRESENTAÇÃO - FORRÓ DOS BOSSAS',
    fundo: 'Fundo da Educação',
    fonte: 'Conteúdo público extraído do Notion compartilhado',
    vinculos: [
      { tipo: 'Contrato', numero: '006/2026', status: 'Vigente', objeto: 'APRESENTAÇÃO - FORRÓ DOS BOSSAS', fundo: 'Fundo da Educação', dataInicio: '30/01/2026', dataTermino: '30/01/2027', parentId: null }
    ]
  },
  {
    id: 'fornecedor-5',
    nome: 'SEJA + EDUCAÇÃO E CULTURA LTDA',
    cnpj: '46.805.083/0001-24',
    objeto: 'APRESENTAÇÃO - FELIPE DINIZ',
    fundo: 'Fundo da Educação',
    fonte: 'Conteúdo público extraído do Notion compartilhado',
    vinculos: [
      { tipo: 'Contrato', numero: '002/2026', status: 'Vigente', objeto: 'APRESENTAÇÃO - FELIPE DINIZ', fundo: 'Fundo da Educação', dataInicio: '23/01/2026', dataTermino: '23/01/2027', parentId: null }
    ]
  },
  {
    id: 'fornecedor-6',
    nome: 'YMS DISTRIBUIDORA DE PRODUTOS E SERVIÇOS',
    cnpj: '45.277.978/0001-33',
    objeto: 'LOUSAS DE VIDRO',
    fundo: 'Fundo da Educação',
    fonte: 'Conteúdo público extraído do Notion compartilhado',
    vinculos: [
      { tipo: 'ARP', numero: '026/2026', status: 'Vigente', objeto: 'LOUSAS DE VIDRO', fundo: 'Fundo da Educação', dataInicio: '23/04/2026', dataTermino: '23/04/2027', parentId: null }
    ]
  },
  {
    id: 'fornecedor-7',
    nome: 'FRANCISCO S DA COSTA',
    cnpj: '32.482.767/0001-90',
    objeto: 'APRESENTAÇÃO - MICHELE ANDRADE',
    fundo: 'Fundo da Educação',
    fonte: 'Conteúdo público extraído do Notion compartilhado',
    vinculos: [
      { tipo: 'Contrato', numero: '007/2026', status: 'Encerrado', objeto: 'APRESENTAÇÃO - MICHELE ANDRADE', fundo: 'Fundo da Educação', dataInicio: '02/02/2026', dataTermino: '02/03/2026', parentId: null }
    ]
  },
  {
    id: 'fornecedor-8',
    nome: 'BK MUSIC LTDA',
    cnpj: '21.776.314/0001-04',
    objeto: 'APRESENTAÇÃO - FLAY',
    fundo: 'Fundo da Educação',
    fonte: 'Conteúdo público extraído do Notion compartilhado',
    vinculos: [
      { tipo: 'Contrato', numero: '013/2026', status: 'Encerrado', objeto: 'APRESENTAÇÃO - FLAY', fundo: 'Fundo da Educação', dataInicio: '04/02/2026', dataTermino: '04/05/2026', parentId: null }
    ]
  },
  {
    id: 'fornecedor-9',
    nome: 'FLAY INVESTIMENTOS & ENTRETENIMENTOS LTDA',
    cnpj: '58.898.002/0001-20',
    objeto: 'APRESENTAÇÃO - ANDRÉ MARRETA',
    fundo: 'Fundo da Educação',
    fonte: 'Conteúdo público extraído do Notion compartilhado',
    vinculos: [
      { tipo: 'Contrato', numero: '014/2026', status: 'Encerrado', objeto: 'APRESENTAÇÃO - ANDRÉ MARRETA', fundo: 'Fundo da Educação', dataInicio: '04/02/2026', dataTermino: '04/03/2026', parentId: null }
    ]
  },
  {
    id: 'fornecedor-10',
    nome: 'DEADLINE PRODUCOES LTDA',
    cnpj: '47.412.593/0001-67',
    objeto: 'SERVIÇO DE DECORAÇÃO CARNAVALESCA',
    fundo: 'Fundo da Educação',
    fonte: 'Conteúdo público extraído do Notion compartilhado',
    vinculos: [
      { tipo: 'Contrato', numero: '010/2026', status: 'Vigente', objeto: 'SERVIÇO DE DECORAÇÃO CARNAVALESCA', fundo: 'Fundo da Educação', dataInicio: '12/02/2026', dataTermino: '12/02/2027', parentId: null }
    ]
  },
  {
    id: 'fornecedor-11',
    nome: 'N10 EVENTO E SERVIÇO',
    cnpj: '53.307.046/0001-14',
    objeto: 'SERVIÇOS DE BUFFET E LIVROS PEDAGÓGICOS PARA TEA',
    fundo: 'Fundo da Educação',
    fonte: 'Conteúdo público extraído do Notion compartilhado',
    vinculos: [
      { tipo: 'Contrato', numero: '011/2026', status: 'Vigente', objeto: 'SERVIÇOS DE BUFFET', fundo: 'Fundo da Educação', dataInicio: '12/02/2026', dataTermino: '12/02/2027', parentId: null },
      { tipo: 'Contrato', numero: '008/2026', status: 'Vigente', objeto: 'LIVROS PEDAGÓGICOS PARA TEA', fundo: 'Fundo da Educação', dataInicio: '05/03/2026', dataTermino: '05/03/2027', parentId: null }
    ]
  },
  {
    id: 'fornecedor-12',
    nome: 'FOCCUS EDITORA E SERVIÇOS EDUCACIONAIS LTDA',
    cnpj: '10.424.655/0001-40',
    objeto: 'SERVIÇO DE LOCAÇÃO DE MOBILIÁRIO E EQUIPAMENTOS PARA ORGANIZAÇÃO DE CAMARINS',
    fundo: 'Fundo da Educação',
    fonte: 'Conteúdo público extraído do Notion compartilhado',
    vinculos: [
      { tipo: 'Contrato', numero: '012/2026', status: 'Vigente', objeto: 'SERVIÇO DE LOCAÇÃO DE MOBILIÁRIO E EQUIPAMENTOS PARA ORGANIZAÇÃO DE CAMARINS', fundo: 'Fundo da Educação', dataInicio: '12/02/2026', dataTermino: '12/02/2027', parentId: null }
    ]
  },
  {
    id: 'fornecedor-13',
    nome: 'VS SERVIÇOS E EVENTOS',
    cnpj: '50.529.656/0001-74',
    objeto: 'APRESENTAÇÃO - DANY KEBRANÇA (CARNAVAL)',
    fundo: 'Fundo da Educação',
    fonte: 'Conteúdo público extraído do Notion compartilhado',
    vinculos: [
      { tipo: 'Contrato', numero: '017/2026', status: 'Vigente', objeto: 'APRESENTAÇÃO - DANY KEBRANÇA (CARNAVAL)', fundo: 'Fundo da Educação', dataInicio: '12/02/2026', dataTermino: '12/02/2027', parentId: null }
    ]
  },
  {
    id: 'fornecedor-14',
    nome: 'DANIEL BRITO DE LIMA',
    cnpj: '49.400.453/0001-02',
    objeto: 'APRESENTAÇÃO ARTÍSTICA DO CANTOR SILVÔNIO VIEIRA- FESTA DE CALDERÕES DOS GUEDES',
    fundo: 'Fundo da Educação',
    fonte: 'Conteúdo público extraído do Notion compartilhado',
    vinculos: [
      { tipo: 'Contrato', numero: '019/2026', status: 'Encerrado', objeto: 'APRESENTAÇÃO ARTÍSTICA DO CANTOR SILVÔNIO VIEIRA- FESTA DE CALDERÕES DOS GUEDES', fundo: 'Fundo da Educação', dataInicio: '26/02/2026', dataTermino: '26/03/2026', parentId: null }
    ]
  },
  {
    id: 'fornecedor-15',
    nome: 'CHARLES CRISTIANE DAS NEVES-ME',
    cnpj: '05.445.990/0001-95',
    objeto: 'APRESENTAÇÃO - EVERTON FREITAS E FORRÓ DO AMASSO',
    fundo: 'Fundo da Educação',
    fonte: 'Conteúdo público extraído do Notion compartilhado',
    vinculos: [
      { tipo: 'Contrato', numero: '018/2026', status: 'Encerrado', objeto: 'APRESENTAÇÃO - EVERTON FREITAS E FORRÓ DO AMASSO', fundo: 'Fundo da Educação', dataInicio: '03/03/2026', dataTermino: '03/04/2026', parentId: null }
    ]
  },
  {
    id: 'fornecedor-16',
    nome: 'EF PROMOÇÕES LTDA – EVERTON FREITAS',
    cnpj: '46.637.770/0001-40',
    objeto: 'CONTRATAÇÃO DE EMPRESA PARA SERVIÇO DE CONSULTORIA EM GESTÃO EDUCACIONAL- DISPENSA Nº 004/2026',
    fundo: 'Fundo da Educação',
    fonte: 'Conteúdo público extraído do Notion compartilhado',
    vinculos: [
      { tipo: 'Contrato', numero: '009/2026', status: 'Vigente', objeto: 'CONTRATAÇÃO DE EMPRESA PARA SERVIÇO DE CONSULTORIA EM GESTÃO EDUCACIONAL- DISPENSA Nº 004/2026', fundo: 'Fundo da Educação', dataInicio: '17/03/2026', dataTermino: '31/12/2026', parentId: null }
    ]
  },
  {
    id: 'fornecedor-17',
    nome: 'PAULO HERBERT & ARAÚJO CONSULTORIA LTDA',
    cnpj: '17.126.655/0001-03',
    objeto: 'LOCAÇÃO DE IMÓVEL (ESCOLA BILÍNGUE)-INEXIGIBILIDADE Nº 011/2026',
    fundo: 'Fundo da Educação',
    fonte: 'Conteúdo público extraído do Notion compartilhado',
    vinculos: [
      { tipo: 'Contrato', numero: '023/2026', status: 'Vigente', objeto: 'LOCAÇÃO DE IMÓVEL (ESCOLA BILÍNGUE)-INEXIGIBILIDADE Nº 011/2026', fundo: 'Fundo da Educação', dataInicio: '02/02/2026', dataTermino: '02/02/2027', parentId: null }
    ]
  },
  {
    id: 'fornecedor-18',
    nome: 'MUSIC SOWS BRASIL LTDA',
    cnpj: '01.397.976/0001-02',
    objeto: 'JORNADA PEDAGÓGICA',
    fundo: 'Fundo da Educação',
    fonte: 'Conteúdo público extraído do Notion compartilhado',
    vinculos: [
      { tipo: 'Contrato', numero: '021/2026', status: 'Vencendo', objeto: 'JORNADA PEDAGÓGICA', fundo: 'Fundo da Educação', dataInicio: '05/02/2026', dataTermino: '05/05/2026', parentId: null }
    ]
  },
  {
    id: 'fornecedor-19',
    nome: 'INSTITUTO SUPERAR',
    cnpj: '43.435.258/0001-23',
    objeto: 'FORMAÇÃO PEDAGÓGICA E AGRICULTURA FAMILIAR',
    fundo: 'Fundo da Educação',
    fonte: 'Conteúdo público extraído do Notion compartilhado',
    vinculos: [
      { tipo: 'Contrato', numero: '022/2026', status: 'Vigente', objeto: 'FORMAÇÃO PEDAGÓGICA', fundo: 'Fundo da Educação', dataInicio: '05/02/2026', dataTermino: '05/02/2027', parentId: null },
      { tipo: 'Contrato', numero: '005/2026', status: 'Vigente', objeto: 'AGRICULTURA FAMILIAR (PNAE)-GÊNEROS ALIMENTÍCIOS', fundo: 'Fundo da Educação', dataInicio: '09/04/2026', dataTermino: '09/04/2027', parentId: null }
    ]
  },
  {
    id: 'fornecedor-20',
    nome: 'ASSOCIAÇÃO DOS PEQUENOS PRODUTORES RURAIS DO SÍTIO BARROCÃO',
    cnpj: '05.645.535/0001-33',
    objeto: 'AGRICULTURA FAMILIAR (PNAE) GÊNEROS ALIMENTÍCIOS',
    fundo: 'Fundo da Educação',
    fonte: 'Conteúdo público extraído do Notion compartilhado',
    vinculos: [
      { tipo: 'Contrato', numero: '005/2026', status: 'Vigente', objeto: 'AGRICULTURA FAMILIAR (PNAE) GÊNEROS ALIMENTÍCIOS', fundo: 'Fundo da Educação', dataInicio: '09/04/2026', dataTermino: '09/04/2027', parentId: null }
    ]
  },
  {
    id: 'fornecedor-21',
    nome: 'ASSOCIAÇÃO COM.EFIGÊNIO BARROS COUTO DO SÍTIO OLHO D”ÁGUA DE SÃO DE SÃO VICTOR',
    cnpj: '07.952.920/0001-59',
    objeto: 'AGRICULTURA FAMILIAR (PNAE) GÊNEROS ALIMENTÍCIOS',
    fundo: 'Fundo da Educação',
    fonte: 'Conteúdo público extraído do Notion compartilhado',
    vinculos: [
      { tipo: 'Contrato', numero: '005/2026', status: 'Vigente', objeto: 'AGRICULTURA FAMILIAR (PNAE) GÊNEROS ALIMENTÍCIOS', fundo: 'Fundo da Educação', dataInicio: '09/04/2026', dataTermino: '09/04/2027', parentId: null }
    ]
  },
  {
    id: 'fornecedor-22',
    nome: 'COOPERATIVA AGRICOLA DAS MULHERES DA AGRICULTURA FAMILIAR DE BOM CONSELHO-COOPAMAF',
    cnpj: '58.430.914/0001-72',
    objeto: 'AGRICULTURA FAMILIAR (PNAE) GÊNEROS ALIMENTÍCIOS',
    fundo: 'Fundo da Educação',
    fonte: 'Conteúdo público extraído do Notion compartilhado',
    vinculos: [
      { tipo: 'Contrato', numero: '005/2026', status: 'Vigente', objeto: 'AGRICULTURA FAMILIAR (PNAE) GÊNEROS ALIMENTÍCIOS', fundo: 'Fundo da Educação', dataInicio: '09/04/2026', dataTermino: '09/04/2027', parentId: null }
    ]
  }
].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

const processosData = [
  { id: '001', titulo: 'Processo 001', prioridade: 'urgente', orgao: 'Secretaria de Educação', municipio: 'Bom Conselho/PE' },
  { id: '002', titulo: 'Processo 002', prioridade: 'alta', orgao: 'Secretaria de Educação', municipio: 'Bom Conselho/PE' },
  { id: '003', titulo: 'Processo 003', prioridade: 'urgente', orgao: 'Secretaria de Saúde', municipio: 'Bom Conselho/PE' },
  { id: '004', titulo: 'Processo 004', prioridade: 'média', orgao: 'Secretaria de Saúde', municipio: 'Bom Conselho/PE' },
  { id: '005', titulo: 'Processo 005', prioridade: 'baixa', orgao: 'Secretaria de Administração', municipio: 'Bom Conselho/PE' },
  { id: '006', titulo: 'Processo 006', prioridade: 'urgente', orgao: 'Secretaria de Educação', municipio: 'Japaratinga/AL' },
  { id: '007', titulo: 'Processo 007', prioridade: 'urgente', orgao: 'Secretaria de Infraestrutura', municipio: 'Bom Conselho/PE' },
  { id: '008', titulo: 'Processo 008', prioridade: '-', orgao: 'Secretaria de Administração', municipio: 'Japaratinga/AL' },
  { id: '009', titulo: 'Processo 009', prioridade: 'alta', orgao: 'Secretaria de Saúde', municipio: 'Marechal Deodoro/AL' },
  { id: '010', titulo: 'Processo 010', prioridade: 'urgente', orgao: 'Secretaria de Educação', municipio: 'Bom Conselho/PE' },
  { id: '011', titulo: 'Processo 011', prioridade: 'média', orgao: 'Secretaria de Infraestrutura', municipio: 'Marechal Deodoro/AL' },
  { id: '012', titulo: 'Processo 012', prioridade: 'urgente', orgao: 'Secretaria de Saúde', municipio: 'Bom Conselho/PE' },
  { id: '013', titulo: 'Processo 013', prioridade: 'baixa', orgao: 'Secretaria de Educação', municipio: 'Japaratinga/AL' },
  { id: '014', titulo: 'Processo 014', prioridade: 'alta', orgao: 'Secretaria de Administração', municipio: 'Matriz de Camaragibe/AL' },
  { id: '015', titulo: 'Processo 015', prioridade: '-', orgao: 'Secretaria de Infraestrutura', municipio: 'São Miguel dos Campos/AL' }
];

const orgaosPorMunicipio = {
  'Bom Conselho/PE': ['Secretaria de Educação', 'Secretaria de Saúde', 'Secretaria de Administração', 'Secretaria de Infraestrutura'],
  'Japaratinga/AL': ['Secretaria de Educação', 'Secretaria de Administração', 'Secretaria de Saúde'],
  'Marechal Deodoro/AL': ['Secretaria de Saúde', 'Secretaria de Infraestrutura', 'Secretaria de Educação'],
  'Matriz de Camaragibe/AL': ['Secretaria de Administração', 'Secretaria de Educação'],
  'São Miguel dos Campos/AL': ['Secretaria de Infraestrutura', 'Secretaria de Saúde']
};

const chartData = [
  { modalidade: 'Pregão Eletrônico', valor: 680000, quantidade: 12 },
  { modalidade: 'Registro de Preços', valor: 420000, quantidade: 8 },
  { modalidade: 'Tomada de Preços', valor: 360000, quantidade: 6 },
  { modalidade: 'Concorrência', valor: 950000, quantidade: 5 },
  { modalidade: 'Dispensa', valor: 280000, quantidade: 14 }
];

const municipios = [
  'Bom Conselho/PE',
  'Japaratinga/AL',
  'Marechal Deodoro/AL',
  'Matriz de Camaragibe/AL',
  'São Miguel dos Campos/AL'
].sort((a, b) => a.localeCompare(b, 'pt-BR'));

const defaultMunicipalStructure = buildDefaultMunicipalStructure();
const defaultPainelLayout = {
  order: ['panel-prioridades', 'panel-urgentes', 'panel-responsaveis', 'panel-treemap'],
  spans: {
    'panel-prioridades': 6,
    'panel-urgentes': 6,
    'panel-responsaveis': 6,
    'panel-treemap': 6
  }
};

const modalidades = ['Todas', ...Array.from(new Set(chartData.map((item) => item.modalidade)))];
let activeChartBar = null;
let filtrosPainel = { municipio: [], modalidade: [], secretaria: [], status: [] };
let filtrosFornecedores = { termo: '' };
let activeModuleKey = 'painel';
let selectedSupplierId = fornecedoresData[0]?.id || null;
let selectedCorporateEmailId = null;
let selectedChatRoomId = null;
let selectedChatMemberIds = new Set();
let painelCardDraggingKey = '';
let communicationStore = { emails: [], rooms: [], presence: [] };
let communicationDataLoaded = false;
let editingUserId = null;
let showAddUserForm = false;
let estruturaSelectedMunicipio = '';
let estruturaSelectedSecretaria = '';
let draggingCatalogStatus = '';
const estruturaExpandedMunicipios = new Set();
const estruturaExpandedSecretarias = new Set();

function getDemandValueNumber(value) {
  const raw = String(value || '').trim();
  if (!raw) {
    return 0;
  }

  const normalized = raw
    .replace(/[R$\s]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');
  const parsed = Number(normalized.replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizePanelSelection(selectedValues, availableOptions) {
  const options = Array.isArray(availableOptions) ? Array.from(new Set(availableOptions.map((item) => String(item || '').trim()).filter(Boolean))) : [];
  const selected = Array.isArray(selectedValues)
    ? Array.from(new Set(selectedValues.map((item) => String(item || '').trim()).filter(Boolean)))
    : [];

  if (!options.length) {
    return [];
  }

  const filtered = selected.filter((item) => options.includes(item));
  return filtered.length ? filtered : [...options];
}

function normalizePainelFilters(filters, demandas = [], modalidadesDisponiveis = defaultModalidades) {
  const demandasList = Array.isArray(demandas) ? demandas : [];
  const municipiosOptions = Array.from(new Set(demandasList.map((item) => String(item.municipio || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const modalidadesOptions = Array.from(new Set([...(Array.isArray(modalidadesDisponiveis) ? modalidadesDisponiveis : []), ...demandasList.map((item) => String(item.modalidade || '').trim()).filter(Boolean)])).filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const secretariasOptions = Array.from(new Set(demandasList.map((item) => String(item.secretaria || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const statusOptions = Array.from(new Set(demandasList.map((item) => String(item.status || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR'));

  const normalized = filters && typeof filters === 'object' ? filters : {};

  return {
    municipio: normalizePanelSelection(normalized.municipio, municipiosOptions),
    modalidade: normalizePanelSelection(normalized.modalidade, modalidadesOptions),
    secretaria: normalizePanelSelection(normalized.secretaria, secretariasOptions),
    status: normalizePanelSelection(normalized.status, statusOptions)
  };
}

function normalizePainelLayout(layout) {
  const source = layout && typeof layout === 'object' ? layout : {};
  const order = Array.isArray(source.order) ? source.order : [];
  const uniqueOrder = Array.from(new Set([...defaultPainelLayout.order, ...order].map((item) => String(item || '').trim()).filter(Boolean)));
  const spans = { ...defaultPainelLayout.spans };

  Object.keys(defaultPainelLayout.spans).forEach((key) => {
    const value = Number(source.spans?.[key]);
    spans[key] = value === 12 ? 12 : 6;
  });

  return { order: uniqueOrder, spans };
}

function getPainelDemandas() {
  return Array.isArray(state.licitacoesDemandas) ? state.licitacoesDemandas : [];
}

function getPainelFilterOptions() {
  const demandas = getPainelDemandas();
  return {
    municipio: Array.from(new Set(demandas.map((item) => String(item.municipio || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    modalidade: Array.from(new Set([...(Array.isArray(state.modalidades) ? state.modalidades : []), ...demandas.map((item) => String(item.modalidade || '').trim()).filter(Boolean)])).filter(Boolean).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    secretaria: Array.from(new Set(demandas.map((item) => String(item.secretaria || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR')),
    status: Array.from(new Set(demandas.map((item) => String(item.status || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'pt-BR'))
  };
}

function getFilteredPainelDemandas() {
  const demandas = getPainelDemandas();
  const filters = filtrosPainel;

  return demandas.filter((item) => {
    const municipio = String(item.municipio || '').trim();
    const modalidade = String(item.modalidade || '').trim();
    const secretaria = String(item.secretaria || '').trim();
    const status = String(item.status || '').trim();

    const municipioOk = !filters.municipio.length || filters.municipio.includes(municipio);
    const modalidadeOk = !filters.modalidade.length || filters.modalidade.includes(modalidade);
    const secretariaOk = !filters.secretaria.length || filters.secretaria.includes(secretaria);
    const statusOk = !filters.status.length || filters.status.includes(status);

    return municipioOk && modalidadeOk && secretariaOk && statusOk;
  });
}

function getDemandasByModalidade(demandas) {
  const totals = new Map();
  demandas.forEach((item) => {
    const modalidade = String(item.modalidade || '').trim() || 'Sem modalidade';
    const current = totals.get(modalidade) || { modalidade, quantidade: 0, valor: 0 };
    current.quantidade += 1;
    current.valor += getDemandValueNumber(item.valorEstimado);
    totals.set(modalidade, current);
  });
  return Array.from(totals.values()).sort((a, b) => b.quantidade - a.quantidade || a.modalidade.localeCompare(b.modalidade, 'pt-BR'));
}

function getDemandasByPrioridade(demandas) {
  const priorities = ['urgente', 'alta', 'média', 'baixa', '-'];
  const labels = { urgente: 'Urgente', alta: 'Alta', 'média': 'Média', baixa: 'Baixa', '-': 'Sem prioridade' };
  const counts = new Map(priorities.map((priority) => [priority, 0]));

  demandas.forEach((item) => {
    const priority = String(item.prioridade || '-').toLowerCase();
    const normalized = priorities.includes(priority) ? priority : '-';
    counts.set(normalized, (counts.get(normalized) || 0) + 1);
  });

  return priorities.map((priority) => ({ priority, label: labels[priority], quantidade: counts.get(priority) || 0 }));
}

function getUrgentDemandasByOrgao(demandas) {
  const urgent = demandas.filter((item) => String(item.prioridade || '').toLowerCase() === 'urgente');
  const byOrgao = new Map();

  urgent.forEach((item) => {
    const orgao = String(item.secretaria || '').trim() || 'Sem órgão';
    byOrgao.set(orgao, (byOrgao.get(orgao) || 0) + 1);
  });

  return Array.from(byOrgao.entries())
    .map(([orgao, quantidade]) => ({ orgao, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade || a.orgao.localeCompare(b.orgao, 'pt-BR'));
}

function getMyResponsibleDemandas(demandas) {
  const currentName = String(currentUser?.nome || '').trim().toLowerCase();
  return demandas.filter((item) => String(item.responsavel || '').trim().toLowerCase() === currentName);
}

function formatCurrencyBR(value) {
  return `R$ ${Number(value || 0).toLocaleString('pt-BR')}`;
}

function getPanelCardSpanClass(cardKey) {
  const span = Number(state.painelLayout?.spans?.[cardKey]) === 12 ? 12 : 6;
  return span === 12 ? 'span-12' : 'span-6';
}

function movePainelCard(fromKey, toKey) {
  if (currentUser?.perfil !== 'administrador') {
    return;
  }

  const from = String(fromKey || '').trim();
  const to = String(toKey || '').trim();
  if (!from || !to || from === to) {
    return;
  }

  const layout = normalizePainelLayout(state.painelLayout);
  const fromIndex = layout.order.indexOf(from);
  const toIndex = layout.order.indexOf(to);
  if (fromIndex === -1 || toIndex === -1) {
    return;
  }

  layout.order.splice(fromIndex, 1);
  const targetIndex = layout.order.indexOf(to);
  layout.order.splice(targetIndex, 0, from);
  state.painelLayout = layout;
  persistState();
  renderModuleContent('painel');
}

function togglePainelCardSpan(cardKey) {
  if (currentUser?.perfil !== 'administrador') {
    return;
  }

  const key = String(cardKey || '').trim();
  if (!key) {
    return;
  }

  const layout = normalizePainelLayout(state.painelLayout);
  layout.spans[key] = layout.spans[key] === 12 ? 6 : 12;
  state.painelLayout = layout;
  persistState();
  renderModuleContent('painel');
}

function bindPanelFilterDropdowns() {
  const dropdowns = document.querySelectorAll('[data-panel-filter-dropdown]');
  if (!dropdowns.length) {
    return;
  }

  if (!document._panelFilterDropdownListenerAdded) {
    document.addEventListener('click', () => {
      document.querySelectorAll('.dropdown-panel.open').forEach((panel) => panel.classList.remove('open'));
    });
    document._panelFilterDropdownListenerAdded = true;
  }

  dropdowns.forEach((dropdown) => {
    const key = String(dropdown.getAttribute('data-panel-filter-dropdown') || '').trim();
    const trigger = dropdown.querySelector('[data-panel-filter-trigger]');
    const panel = dropdown.querySelector('[data-panel-filter-panel]');
    const allCheckbox = dropdown.querySelector('[data-panel-filter-all]');
    const optionCheckboxes = dropdown.querySelectorAll('[data-panel-filter-option]');
    if (!key || !trigger || !panel || !allCheckbox) {
      return;
    }

    if (!dropdown.dataset.bound) {
      trigger.addEventListener('click', (event) => {
        event.stopPropagation();
        panel.classList.toggle('open');
      });

      allCheckbox.addEventListener('change', () => {
        const payload = { ...state.painelFilters };
        payload[key] = allCheckbox.checked ? getPainelFilterOptions()[key] : [];
        state.painelFilters = normalizePainelFilters(payload, getPainelDemandas(), state.modalidades);
        filtrosPainel = state.painelFilters;
        persistState();
        renderModuleContent('painel');
      });

      optionCheckboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
          const selectedValues = Array.from(panel.querySelectorAll('[data-panel-filter-option]:checked')).map((item) => item.value);
          const payload = { ...state.painelFilters, [key]: selectedValues };
          state.painelFilters = normalizePainelFilters(payload, getPainelDemandas(), state.modalidades);
          filtrosPainel = state.painelFilters;
          persistState();
          renderModuleContent('painel');
        });
      });

      dropdown.dataset.bound = '1';
    }
  });
}

function bindPanelCards() {
  const cards = document.querySelectorAll('[data-panel-card]');
  if (!cards.length) {
    return;
  }

  cards.forEach((card) => {
    const cardKey = String(card.getAttribute('data-panel-card') || '').trim();
    const dragHandle = card.querySelector('.dashboard-card-drag-handle');
    const spanToggle = card.querySelector('[data-panel-span-toggle]');

    if (spanToggle && !spanToggle.dataset.bound) {
      spanToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        togglePainelCardSpan(cardKey);
      });
      spanToggle.dataset.bound = '1';
    }

    if (currentUser?.perfil === 'administrador' && dragHandle && !dragHandle.dataset.bound) {
      dragHandle.setAttribute('draggable', 'true');
      dragHandle.addEventListener('dragstart', () => {
        document._panelDraggingCardKey = cardKey;
      });
      dragHandle.addEventListener('dragend', () => {
        document._panelDraggingCardKey = null;
      });
      dragHandle.dataset.bound = '1';
    }

    if (currentUser?.perfil === 'administrador' && !card.dataset.bound) {
      card.addEventListener('dragover', (event) => {
        if (document._panelDraggingCardKey) {
          event.preventDefault();
        }
      });

      card.addEventListener('drop', (event) => {
        if (!document._panelDraggingCardKey) {
          return;
        }
        event.preventDefault();
        movePainelCard(document._panelDraggingCardKey, cardKey);
        document._panelDraggingCardKey = null;
      });
      card.dataset.bound = '1';
    }
  });
}

function openDemandFromAlert(alertId) {
  const targetAlertId = String(alertId || '').trim();
  if (!targetAlertId) {
    return;
  }

  const alerts = normalizeAlerts(state.alerts);
  const alert = alerts.find((item) => item.id === targetAlertId);
  if (!alert) {
    window.alert('A mensagem selecionada não foi encontrada.');
    return;
  }

  const demandId = String(alert.demandId || '').trim();
  const demand = (Array.isArray(state.licitacoesDemandas) ? state.licitacoesDemandas : []).find((item) => String(item.id || '').trim() === demandId);
  if (!demand) {
    window.alert('O processo dessa mensagem não foi encontrado.');
    renderTopbarMessages();
    return;
  }

  if (!alert.readAt) {
    alert.readAt = new Date().toISOString();
    state.alerts = alerts;
    persistState();
  }

  openLicitacaoDetailsModal(demand);
  renderTopbarMessages();
}

function renderTopbarMessages() {
  const button = document.getElementById('messagesBtn');
  const badge = document.getElementById('messagesBadge');
  const list = document.getElementById('messagesPreviewList');
  if (!button || !badge || !list) {
    return;
  }

  const alerts = getCurrentUserAlerts();
  const unreadCount = alerts.filter((alert) => !alert.readAt).length;

  badge.hidden = unreadCount === 0;
  badge.textContent = String(unreadCount > 99 ? '99+' : unreadCount);

  const previews = alerts.slice(0, 8);
  if (!previews.length) {
    list.innerHTML = '<p class="messages-empty">Nenhuma mensagem no momento.</p>';
    return;
  }

  list.innerHTML = previews.map((alert) => `
    <button class="messages-preview-item ${alert.readAt ? '' : 'unread'}" type="button" data-alert-id="${escapeHtml(alert.id)}">
      <strong>${escapeHtml(alert.processNumber || 'Processo')}</strong>
      <span>${escapeHtml(alert.preview || 'Você foi marcado em um processo.')}</span>
      <small>${escapeHtml(formatDateTimePtBr(alert.createdAt))}</small>
    </button>
  `).join('');
}

function bindTopbarMessages() {
  const button = document.getElementById('messagesBtn');
  const popover = document.getElementById('messagesPopover');
  const list = document.getElementById('messagesPreviewList');
  if (!button || !popover || !list) {
    return;
  }

  if (!button.dataset.bound) {
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpening = popover.hidden;
      popover.hidden = !popover.hidden;
      button.setAttribute('aria-expanded', isOpening ? 'true' : 'false');
      if (isOpening) {
        renderTopbarMessages();
      }
    });
    button.dataset.bound = '1';
  }

  if (!popover.dataset.bound) {
    popover.addEventListener('click', (event) => {
      event.stopPropagation();
      const actionButton = event.target.closest('[data-alert-id]');
      if (!actionButton) {
        return;
      }

      openDemandFromAlert(actionButton.getAttribute('data-alert-id'));
    });
    popover.dataset.bound = '1';
  }

  if (!document.body.dataset.messagesPopoverBound) {
    document.addEventListener('click', closeMessagesPopover);
    document.body.dataset.messagesPopoverBound = '1';
  }

  renderTopbarMessages();
}

function pushDemandMentionAlert(demand, responsibleName) {
  const targetName = String(responsibleName || '').trim();
  if (!targetName || targetName === '-') {
    return;
  }

  const recipient = getAllUsers().find((user) => String(user.nome || '').trim().toLowerCase() === targetName.toLowerCase());
  if (!recipient?.id) {
    return;
  }

  const actorName = currentUser?.nome || 'Sistema';
  const alert = {
    id: crypto.randomUUID(),
    type: 'licitacao-mencao',
    userId: recipient.id,
    demandId: String(demand?.id || '').trim(),
    processNumber: String(demand?.processoNumero || '').trim(),
    preview: `${actorName} marcou você no processo ${demand?.processoNumero || '-'}.`,
    createdAt: new Date().toISOString(),
    readAt: null
  };

  const list = normalizeAlerts(state.alerts);
  state.alerts = [alert, ...list].slice(0, 200);
  persistState();
  renderTopbarMessages();
}

function normalizeSetoresDestino(setores) {
  if (!Array.isArray(setores)) {
    return [...defaultSetoresDestino];
  }

  const normalized = setores
    .map((setor) => String(setor || '').trim())
    .filter((setor) => Boolean(setor));

  if (!normalized.length) {
    return [...defaultSetoresDestino];
  }

  return Array.from(new Set(normalized));
}

function buildDefaultMunicipalStructure() {
  return municipios.map((nomeMunicipio) => ({
    nome: nomeMunicipio,
    secretarias: (orgaosPorMunicipio[nomeMunicipio] || []).map((nomeSecretaria) => ({
      nome: nomeSecretaria,
      setores: [...defaultSetoresDestino]
    }))
  }));
}

function normalizeMunicipalStructure(structure) {
  if (!Array.isArray(structure)) {
    return JSON.parse(JSON.stringify(defaultMunicipalStructure));
  }

  const seenMunicipios = new Set();
  const normalizedMunicipios = [];

  structure.forEach((municipio) => {
    const nomeMunicipio = String(municipio?.nome || '').trim();
    if (!nomeMunicipio) {
      return;
    }

    const municipioKey = nomeMunicipio.toLowerCase();
    if (seenMunicipios.has(municipioKey)) {
      return;
    }
    seenMunicipios.add(municipioKey);

    const seenSecretarias = new Set();
    const secretarias = Array.isArray(municipio?.secretarias) ? municipio.secretarias : [];
    const normalizedSecretarias = [];

    secretarias.forEach((secretaria) => {
      const nomeSecretaria = String(secretaria?.nome || '').trim();
      if (!nomeSecretaria) {
        return;
      }

      const secretariaKey = nomeSecretaria.toLowerCase();
      if (seenSecretarias.has(secretariaKey)) {
        return;
      }
      seenSecretarias.add(secretariaKey);

      const setores = Array.isArray(secretaria?.setores)
        ? secretaria.setores.map((setor) => String(setor || '').trim()).filter(Boolean)
        : [];
      const normalizedSetores = Array.from(new Set(setores));

      normalizedSecretarias.push({
        nome: nomeSecretaria,
        setores: normalizedSetores
      });
    });

    normalizedMunicipios.push({
      nome: nomeMunicipio,
      secretarias: normalizedSecretarias
    });
  });

  if (!normalizedMunicipios.length) {
    return JSON.parse(JSON.stringify(defaultMunicipalStructure));
  }

  return normalizedMunicipios;
}

function getMunicipalStructure() {
  const normalized = normalizeMunicipalStructure(state.municipalStructure);
  state.municipalStructure = normalized;
  return normalized;
}

function getMunicipiosList() {
  return getMunicipalStructure().map((municipio) => municipio.nome);
}

function getSecretariasByMunicipio(nomeMunicipio) {
  const municipalityName = String(nomeMunicipio || '').trim();
  const municipalStructure = getMunicipalStructure();
  const municipality = municipalStructure.find((item) => item.nome === municipalityName);
  return municipality ? municipality.secretarias.map((item) => item.nome) : [];
}

function getAllSetoresFromStructureData(municipalStructure) {
  const setores = [];
  municipalStructure.forEach((municipio) => {
    (municipio.secretarias || []).forEach((secretaria) => {
      (secretaria.setores || []).forEach((setor) => {
        const nome = String(setor || '').trim();
        if (nome) {
          setores.push(nome);
        }
      });
    });
  });
  return Array.from(new Set(setores));
}

function syncSetoresDestinoWithMunicipalStructure() {
  const municipalStructure = getMunicipalStructure();
  const setores = getAllSetoresFromStructureData(municipalStructure);
  state.setoresDestino = setores.length ? setores : [...defaultSetoresDestino];
}

function updateMunicipalStructureState(nextStructure) {
  state.municipalStructure = normalizeMunicipalStructure(nextStructure);
  syncSetoresDestinoWithMunicipalStructure();

  const municipiosDisponiveis = getMunicipiosList();
  if (filtrosPainel.municipio !== 'Todos' && !municipiosDisponiveis.includes(filtrosPainel.municipio)) {
    filtrosPainel.municipio = 'Todos';
  }

  persistState();
  syncProtocolMunicipioOptions();
  syncProtocolOrgaoOptions();
  syncProtocolSetorOptions();
}

function getDerivedProtocolSequence(licitacoesDemandas) {
  if (!Array.isArray(licitacoesDemandas) || !licitacoesDemandas.length) {
    return 1;
  }

  const maxFromRows = licitacoesDemandas.reduce((max, item) => {
    if (Number.isInteger(item.sequencial) && item.sequencial > max) {
      return item.sequencial;
    }

    const numero = String(item.processoNumero || '');
    const matched = numero.match(/^(\d{4})\.(\d+)\//);
    if (!matched) {
      return max;
    }

    const parsedSeq = Number(matched[2]);
    return Number.isFinite(parsedSeq) && parsedSeq > max ? parsedSeq : max;
  }, 0);

  return maxFromRows + 1;
}

function normalizeLicitacoesColumnWidths(widths) {
  const normalized = { ...defaultLicitacoesColumnWidths };
  if (!widths || typeof widths !== 'object') {
    return normalized;
  }

  licitacoesColumnOrder.forEach((key) => {
    const value = String(widths[key] || '').trim();
    if (!value) {
      return;
    }
    if (value === 'auto' || /^\d+(\.\d+)?(px|%)$/.test(value)) {
      normalized[key] = value;
    }
  });

  return normalized;
}

function normalizeStatusCatalog(statuses) {
  if (!Array.isArray(statuses)) {
    return [...defaultStatusCatalog];
  }

  const normalized = statuses
    .map((status) => String(status || '').trim())
    .filter(Boolean);

  return Array.from(new Set(normalized));
}

function normalizeModalidades(modalidades) {
  if (!Array.isArray(modalidades)) {
    return [...defaultModalidades];
  }

  const normalized = modalidades
    .map((modalidade) => String(modalidade || '').trim())
    .filter(Boolean);

  const unique = [];
  const seen = new Set();

  normalized.forEach((modalidade) => {
    const key = modalidade.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    unique.push(modalidade);
  });

  return unique.length ? unique : [...defaultModalidades];
}

function normalizeRitosPorModalidade(ritos, statusCatalog, modalidadesList = defaultModalidades) {
  const catalog = normalizeStatusCatalog(statusCatalog);
  const modalidades = normalizeModalidades(modalidadesList);
  const next = {};

  modalidades.forEach((modalidade) => {
    const incoming = Array.isArray(ritos?.[modalidade]) ? ritos[modalidade] : (defaultRitosPorModalidade[modalidade] || catalog);
    next[modalidade] = incoming
      .map((status) => String(status || '').trim())
      .filter((status, index, array) => status && array.indexOf(status) === index && catalog.includes(status));
  });

  return next;
}

function getStatusOptionsForModalidade(modalidade) {
  const catalog = normalizeStatusCatalog(state.statusCatalog);
  const modalidades = normalizeModalidades(state.modalidades);
  const ritos = normalizeRitosPorModalidade(state.ritosPorModalidade, catalog, modalidades);
  const modality = String(modalidade || '').trim();

  const options = modality ? (ritos[modality] || []) : [];
  return options.length ? options : catalog;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getPerfilLabel(perfil) {
  const labels = { administrador: 'Administrador', usuario: 'Usuário', visualizador: 'Visualizador' };
  return labels[perfil] || 'Usuário';
}

function normalizeUserSetores(setores) {
  if (Array.isArray(setores)) {
    return setores.map((setor) => String(setor || '').trim()).filter(Boolean);
  }

  return String(setores || '')
    .split(',')
    .map((setor) => setor.trim())
    .filter(Boolean);
}

function getUsuariosVinculadosAoSetor(setor) {
  const setorNormalizado = String(setor || '').trim().toLowerCase();
  if (!setorNormalizado) {
    return [];
  }

  return getAllUsers().filter((user) => normalizeUserSetores(user.setores).some((item) => item.toLowerCase() === setorNormalizado));
}

function getNextNumeroOrdemByModalidade(modalidade, currentDemandId = null) {
  const modalidadeKey = String(modalidade || '').trim().toLowerCase();
  if (!modalidadeKey || modalidadeKey === '-') {
    return '-';
  }

  const currentYear = new Date().getFullYear();
  const list = Array.isArray(state.licitacoesDemandas) ? state.licitacoesDemandas : [];

  const maxSeq = list.reduce((max, item) => {
    if (!item || item.id === currentDemandId) {
      return max;
    }

    const itemModalidadeKey = String(item.modalidade || '').trim().toLowerCase();
    if (itemModalidadeKey !== modalidadeKey) {
      return max;
    }

    const numero = String(item.numeroOrdem || '');
    const matched = numero.match(/^(\d{4})\/(\d{4})$/);
    if (!matched) {
      return max;
    }

    const seq = Number(matched[1]);
    const year = Number(matched[2]);
    if (year !== currentYear || !Number.isFinite(seq)) {
      return max;
    }

    return seq > max ? seq : max;
  }, 0);

  return `${String(maxSeq + 1).padStart(4, '0')}/${currentYear}`;
}

function addStatusToCatalog() {
  if (currentUser?.perfil !== 'administrador') {
    return;
  }

  const input = document.getElementById('newStatusCatalogInput');
  const value = String(input?.value || '').trim();
  if (!value) {
    return;
  }

  const catalog = normalizeStatusCatalog(state.statusCatalog);
  if (catalog.includes(value)) {
    window.alert('Esse status já existe no catálogo.');
    return;
  }

  catalog.push(value);
  state.statusCatalog = catalog;
  state.ritosPorModalidade = normalizeRitosPorModalidade(state.ritosPorModalidade, catalog, state.modalidades);
  persistState();
  if (input) {
    input.value = '';
  }
  renderModuleContent('ritos');
}

function removeStatusFromCatalog(statusToRemove) {
  if (currentUser?.perfil !== 'administrador') {
    return;
  }

  const status = String(statusToRemove || '').trim();
  if (!status) {
    return;
  }

  const catalog = normalizeStatusCatalog(state.statusCatalog).filter((item) => item !== status);
  if (!catalog.length) {
    window.alert('O catálogo precisa de ao menos um status.');
    return;
  }

  state.statusCatalog = catalog;
  const nextRitos = normalizeRitosPorModalidade(state.ritosPorModalidade, catalog, state.modalidades);
  state.ritosPorModalidade = nextRitos;

  const demandas = Array.isArray(state.licitacoesDemandas) ? state.licitacoesDemandas : [];
  state.licitacoesDemandas = demandas.map((item) => {
    if (item.status !== status) {
      return item;
    }
    const fallback = getStatusOptionsForModalidade(item.modalidade)[0] || catalog[0] || 'DFD';
    return { ...item, status: fallback, statusUpdatedAt: new Date().toISOString() };
  });

  persistState();
  renderModuleContent('ritos');
}

function renameStatusInCatalog(oldStatus, newStatusRaw) {
  if (currentUser?.perfil !== 'administrador') {
    return;
  }

  const from = String(oldStatus || '').trim();
  const to = String(newStatusRaw || '').trim();
  if (!from || !to || from === to) {
    return;
  }

  const catalog = normalizeStatusCatalog(state.statusCatalog);
  if (!catalog.includes(from)) {
    return;
  }
  if (catalog.includes(to)) {
    window.alert('Já existe um status com esse nome no catálogo.');
    return;
  }

  state.statusCatalog = catalog.map((item) => (item === from ? to : item));

  const mapped = normalizeRitosPorModalidade(state.ritosPorModalidade, catalog, state.modalidades);
  Object.keys(mapped).forEach((modalidade) => {
    mapped[modalidade] = mapped[modalidade].map((status) => (status === from ? to : status));
  });
  state.ritosPorModalidade = mapped;

  const demandas = Array.isArray(state.licitacoesDemandas) ? state.licitacoesDemandas : [];
  state.licitacoesDemandas = demandas.map((item) => {
    if (item.status !== from) {
      return item;
    }
    return { ...item, status: to, statusUpdatedAt: new Date().toISOString() };
  });

  persistState();
  renderModuleContent('ritos');
}

function toggleRitoStatus(modalidade, status, enabled) {
  if (currentUser?.perfil !== 'administrador') {
    return;
  }

  const catalog = normalizeStatusCatalog(state.statusCatalog);
  const next = normalizeRitosPorModalidade(state.ritosPorModalidade, catalog, state.modalidades);
  const current = Array.isArray(next[modalidade]) ? [...next[modalidade]] : [];

  if (enabled) {
    const filtered = current.filter((item) => item !== status);
    if (catalog.includes(status)) {
      // Coloca o item recém marcado após os já selecionados, de cima para baixo.
      filtered.push(status);
    }
    next[modalidade] = filtered;
  } else {
    const filtered = current.filter((item) => item !== status);
    if (!filtered.length) {
      window.alert('Cada modalidade deve ter ao menos um status habilitado.');
      return;
    }
    next[modalidade] = filtered;
  }

  state.ritosPorModalidade = next;
  persistState();
  renderModuleContent('ritos');
}

function moveStatusCatalogItem(status, targetStatus) {
  if (currentUser?.perfil !== 'administrador') {
    return;
  }

  const source = String(status || '').trim();
  const target = String(targetStatus || '').trim();
  if (!source || !target || source === target) {
    return;
  }

  const catalog = normalizeStatusCatalog(state.statusCatalog);
  const fromIndex = catalog.indexOf(source);
  const targetIndex = catalog.indexOf(target);
  if (fromIndex === -1 || targetIndex === -1) {
    return;
  }

  const [moved] = catalog.splice(fromIndex, 1);
  const nextTargetIndex = catalog.indexOf(target);
  catalog.splice(nextTargetIndex, 0, moved);

  state.statusCatalog = catalog;
  state.ritosPorModalidade = normalizeRitosPorModalidade(state.ritosPorModalidade, catalog, state.modalidades);
  persistState();
  renderModuleContent('ritos');
}

function addModalidadeToRitos() {
  if (currentUser?.perfil !== 'administrador') {
    return;
  }

  const input = document.getElementById('newModalidadeInput');
  const value = String(input?.value || '').trim();
  if (!value) {
    return;
  }

  const modalidades = normalizeModalidades(state.modalidades);
  if (modalidades.some((item) => item.toLowerCase() === value.toLowerCase())) {
    window.alert('Essa modalidade já existe.');
    return;
  }

  modalidades.push(value);
  const catalog = normalizeStatusCatalog(state.statusCatalog);

  state.modalidades = modalidades;
  state.ritosPorModalidade = normalizeRitosPorModalidade(state.ritosPorModalidade, catalog, modalidades);
  persistState();
  if (input) {
    input.value = '';
  }
  renderModuleContent('ritos');
}

function renameModalidadeInRitos(oldModalidade, newModalidadeRaw) {
  if (currentUser?.perfil !== 'administrador') {
    return;
  }

  const from = String(oldModalidade || '').trim();
  const to = String(newModalidadeRaw || '').trim();
  if (!from || !to || from === to) {
    return;
  }

  const modalidades = normalizeModalidades(state.modalidades);
  const fromIndex = modalidades.indexOf(from);
  if (fromIndex === -1) {
    return;
  }

  if (modalidades.some((item, index) => index !== fromIndex && item.toLowerCase() === to.toLowerCase())) {
    window.alert('Já existe uma modalidade com esse nome.');
    return;
  }

  const nextModalidades = [...modalidades];
  nextModalidades[fromIndex] = to;

  const catalog = normalizeStatusCatalog(state.statusCatalog);
  const baseRitos = { ...(state.ritosPorModalidade || {}) };
  if (Array.isArray(baseRitos[from])) {
    baseRitos[to] = baseRitos[from];
  }
  delete baseRitos[from];

  const nextRitos = normalizeRitosPorModalidade(baseRitos, catalog, nextModalidades);
  const targetStatusOptions = Array.isArray(nextRitos[to]) && nextRitos[to].length ? nextRitos[to] : catalog;

  const demandas = Array.isArray(state.licitacoesDemandas) ? state.licitacoesDemandas : [];
  state.licitacoesDemandas = demandas.map((item) => {
    if (item.modalidade !== from) {
      return item;
    }
    const nextStatus = targetStatusOptions.includes(item.status) ? item.status : (targetStatusOptions[0] || 'DFD');
    return {
      ...item,
      modalidade: to,
      status: nextStatus,
      statusUpdatedAt: nextStatus === item.status ? item.statusUpdatedAt : new Date().toISOString()
    };
  });

  state.modalidades = nextModalidades;
  state.ritosPorModalidade = nextRitos;
  persistState();
  renderModuleContent('ritos');
}

function removeModalidadeFromRitos(modalidadeToRemove) {
  if (currentUser?.perfil !== 'administrador') {
    return;
  }

  const modalidade = String(modalidadeToRemove || '').trim();
  if (!modalidade) {
    return;
  }

  const modalidades = normalizeModalidades(state.modalidades);
  if (!modalidades.includes(modalidade)) {
    return;
  }
  if (modalidades.length <= 1) {
    window.alert('É necessário manter ao menos uma modalidade.');
    return;
  }

  const nextModalidades = modalidades.filter((item) => item !== modalidade);
  const fallbackModalidade = nextModalidades[0];
  const catalog = normalizeStatusCatalog(state.statusCatalog);
  const baseRitos = { ...(state.ritosPorModalidade || {}) };
  delete baseRitos[modalidade];

  const nextRitos = normalizeRitosPorModalidade(baseRitos, catalog, nextModalidades);
  const fallbackStatusOptions = Array.isArray(nextRitos[fallbackModalidade]) && nextRitos[fallbackModalidade].length
    ? nextRitos[fallbackModalidade]
    : catalog;

  const demandas = Array.isArray(state.licitacoesDemandas) ? state.licitacoesDemandas : [];
  state.licitacoesDemandas = demandas.map((item) => {
    if (item.modalidade !== modalidade) {
      return item;
    }

    const nextStatus = fallbackStatusOptions.includes(item.status) ? item.status : (fallbackStatusOptions[0] || 'DFD');
    return {
      ...item,
      modalidade: fallbackModalidade,
      status: nextStatus,
      statusUpdatedAt: nextStatus === item.status ? item.statusUpdatedAt : new Date().toISOString()
    };
  });

  state.modalidades = nextModalidades;
  state.ritosPorModalidade = nextRitos;
  persistState();
  renderModuleContent('ritos');
}

function getStatusDisplayOrderByModalidade(modalidade, statusCatalog, ritosPorModalidade) {
  const enabled = Array.isArray(ritosPorModalidade?.[modalidade]) ? ritosPorModalidade[modalidade] : [];
  const enabledSet = new Set(enabled);
  const disabled = statusCatalog.filter((status) => !enabledSet.has(status));
  return [...enabled, ...disabled];
}

function normalizeCorporateEmail(email, emailIndex = 0) {
  return {
    id: String(email?.id || `email-${emailIndex + 1}`),
    toUserId: String(email?.toUserId || '').trim(),
    toEmail: String(email?.toEmail || '').trim(),
    fromName: String(email?.fromName || 'Sistema PROAD').trim(),
    fromEmail: String(email?.fromEmail || 'nao-responda@proad.local').trim(),
    subject: String(email?.subject || 'Comunicado interno').trim(),
    body: String(email?.body || '').trim(),
    sentAt: String(email?.sentAt || new Date().toISOString()),
    readBy: Array.isArray(email?.readBy) ? Array.from(new Set(email.readBy.map((item) => String(item || '').trim()).filter(Boolean))) : []
  };
}

function normalizeChatMessage(message, messageIndex = 0) {
  return {
    id: String(message?.id || `message-${messageIndex + 1}`),
    authorId: String(message?.authorId || '').trim(),
    authorName: String(message?.authorName || 'Sistema').trim(),
    body: String(message?.body || '').trim(),
    sentAt: String(message?.sentAt || new Date().toISOString()),
    mentionUserIds: Array.isArray(message?.mentionUserIds) ? Array.from(new Set(message.mentionUserIds.map((item) => String(item || '').trim()).filter(Boolean))) : [],
    seenBy: Array.isArray(message?.seenBy) ? Array.from(new Set(message.seenBy.map((item) => String(item || '').trim()).filter(Boolean))) : []
  };
}

function normalizeCommunicationRoom(room, roomIndex = 0) {
  return {
    id: String(room?.id || `room-${roomIndex + 1}`),
    name: String(room?.name || `Sala ${roomIndex + 1}`).trim(),
    createdBy: String(room?.createdBy || '').trim(),
    createdAt: String(room?.createdAt || new Date().toISOString()),
    memberIds: Array.isArray(room?.memberIds)
      ? Array.from(new Set(room.memberIds.map((item) => String(item || '').trim()).filter(Boolean)))
      : [],
    messages: Array.isArray(room?.messages) ? room.messages.map((message, index) => normalizeChatMessage(message, index)) : []
  };
}

function normalizeCommunicationsState(communications) {
  return {
    emails: Array.isArray(communications?.emails) ? communications.emails.map((email, index) => normalizeCorporateEmail(email, index)) : [],
    rooms: Array.isArray(communications?.rooms) ? communications.rooms.map((room, index) => normalizeCommunicationRoom(room, index)) : [],
    presence: Array.isArray(communications?.presence) ? communications.presence : []
  };
}

function getCorporateEmailsForCurrentUser() {
  return communicationStore.emails
    .filter((email) => email.toUserId === currentUser?.id || email.toEmail.toLowerCase() === String(currentUser?.email || '').toLowerCase())
    .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
}

function markCorporateEmailAsRead(emailId) {
  if (!emailId || !currentUser?.id) {
    return;
  }

  communicationStore.emails = communicationStore.emails.map((email) => {
    if (email.id !== emailId || email.readBy.includes(currentUser.id)) {
      return email;
    }

    return {
      ...email,
      readBy: [...email.readBy, currentUser.id]
    };
  });
}

function getOnlineUsers() {
  const onlineIds = new Set((communicationStore.presence || []).filter((entry) => entry.isOnline !== false).map((entry) => entry.userId));
  return getAllUsers()
    .filter((user) => user.id === currentUser?.id || onlineIds.has(user.id))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

function getUsersByIds(userIds) {
  const allowedIds = new Set((userIds || []).map((item) => String(item || '').trim()).filter(Boolean));
  return getAllUsers()
    .filter((user) => allowedIds.has(user.id))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}

function getAccessibleCommunicationRooms() {
  const rooms = communicationStore.rooms.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (currentUser?.perfil === 'administrador') {
    return rooms;
  }

  return rooms.filter((room) => room.memberIds.includes(currentUser?.id));
}

function countUnreadMentions(room, userId) {
  if (!room || !userId) {
    return 0;
  }

  return room.messages.filter((message) => message.authorId !== userId && message.mentionUserIds.includes(userId) && !message.seenBy.includes(userId)).length;
}

function markCommunicationRoomAsSeen(roomId) {
  if (!roomId || !currentUser?.id) {
    return;
  }

  communicationStore.rooms = communicationStore.rooms.map((room) => {
    if (room.id !== roomId) {
      return room;
    }

    return {
      ...room,
      messages: room.messages.map((message) => {
        if (message.authorId === currentUser.id || message.seenBy.includes(currentUser.id)) {
          return message;
        }

        return {
          ...message,
          seenBy: [...message.seenBy, currentUser.id]
        };
      })
    };
  });
}

function getVisibleCommunicationUsers(room) {
  const onlineUsers = getOnlineUsers();
  if (currentUser?.perfil === 'administrador') {
    return onlineUsers;
  }

  if (!room) {
    return onlineUsers.filter((user) => user.id === currentUser?.id);
  }

  const memberIds = new Set(room.memberIds);
  return onlineUsers.filter((user) => memberIds.has(user.id));
}

function buildRoomNameFromUsers(userIds) {
  const firstNames = getUsersByIds(userIds).map((user) => user.nome.split(' ')[0]);
  return firstNames.length ? `Sala ${firstNames.join(' • ')}` : 'Nova sala';
}

function createCommunicationRoom(name, memberIds) {
  return createCommunicationRoomApi(name, memberIds);
}

function extractMentionUserIds(body, participants) {
  const normalizedBody = String(body || '').toLowerCase();
  return participants
    .filter((user) => normalizedBody.includes(`@${user.nome.toLowerCase()}`))
    .map((user) => user.id)
    .filter((userId) => userId !== currentUser?.id);
}

function postCommunicationMessage(roomId, body) {
  return postCommunicationMessageApi(roomId, body);
}

function getApiHeaders() {
  return {
    'Content-Type': 'application/json'
  };
}

async function fetchCommunicationData() {
  if (!currentUser?.id) {
    return;
  }

  const params = new URLSearchParams({
    userId: currentUser.id,
    email: currentUser.email || '',
    perfil: currentUser.perfil || 'usuario'
  });

  const response = await fetch(`/api/communications?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Não foi possível carregar os dados de comunicação.');
  }

  const payload = await response.json();
  communicationStore = {
    emails: Array.isArray(payload.emails) ? payload.emails.map((email, index) => normalizeCorporateEmail(email, index)) : [],
    rooms: Array.isArray(payload.rooms) ? payload.rooms.map((room, index) => normalizeCommunicationRoom(room, index)) : [],
    presence: Array.isArray(payload.presence) ? payload.presence : []
  };
  communicationDataLoaded = true;
}

async function syncPresenceWithApi(isOnline = true) {
  if (!currentUser?.id) {
    return;
  }

  await fetch('/api/communications/presence', {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify({
      userId: currentUser.id,
      nome: currentUser.nome,
      email: currentUser.email,
      perfil: currentUser.perfil,
      setores: normalizeUserSetores(currentUser.setores),
      isOnline
    })
  });
}

async function ensureCommunicationDataLoaded() {
  if (communicationDataLoaded) {
    return;
  }

  await syncPresenceWithApi(true);
  await fetchCommunicationData();
}

async function createCommunicationRoomApi(name, memberIds) {
  if (currentUser?.perfil !== 'administrador') {
    window.alert('Somente o administrador pode criar salas.');
    return;
  }

  const normalizedMembers = Array.from(new Set([currentUser.id, ...memberIds].map((item) => String(item || '').trim()).filter(Boolean)));
  if (normalizedMembers.length < 2) {
    window.alert('Selecione ao menos mais um usuário para montar o grupo.');
    return;
  }

  const roomName = String(name || '').trim() || buildRoomNameFromUsers(normalizedMembers);
  const response = await fetch('/api/communications/rooms', {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify({
      name: roomName,
      createdBy: currentUser.id,
      memberIds: normalizedMembers
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    window.alert(error.error || 'Falha ao criar sala.');
    return;
  }

  selectedChatMemberIds.clear();
  await fetchCommunicationData();
}

async function updateCommunicationRoomApi(roomId, payload) {
  const response = await fetch(`/api/communications/rooms/${roomId}`, {
    method: 'PATCH',
    headers: getApiHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    window.alert(error.error || 'Falha ao atualizar sala.');
    return false;
  }

  await fetchCommunicationData();
  return true;
}

async function deleteCommunicationRoomApi(roomId) {
  const response = await fetch(`/api/communications/rooms/${roomId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    window.alert(error.error || 'Falha ao excluir sala.');
    return false;
  }

  if (selectedChatRoomId === roomId) {
    selectedChatRoomId = null;
  }

  await fetchCommunicationData();
  return true;
}

async function postCommunicationMessageApi(roomId, body) {
  if (!roomId || !currentUser?.id) {
    return;
  }

  const normalizedBody = String(body || '').trim();
  if (!normalizedBody) {
    window.alert('Digite uma mensagem antes de enviar.');
    return;
  }

  const room = communicationStore.rooms.find((item) => item.id === roomId);
  if (!room) {
    return;
  }

  const response = await fetch(`/api/communications/rooms/${roomId}/messages`, {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify({
      authorId: currentUser.id,
      authorName: currentUser.nome,
      body: normalizedBody,
      mentionUserIds: extractMentionUserIds(normalizedBody, getUsersByIds(room.memberIds)),
      seenBy: [currentUser.id]
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    window.alert(error.error || 'Falha ao enviar mensagem.');
    return;
  }

  await fetchCommunicationData();
}

async function sendCorporateEmailApi(payload) {
  const response = await fetch('/api/communications/emails', {
    method: 'POST',
    headers: getApiHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    window.alert(error.error || 'Falha ao enviar e-mail interno.');
    return false;
  }

  await fetchCommunicationData();
  return true;
}

async function renderComunicacaoModule(container) {
  try {
    await ensureCommunicationDataLoaded();
  } catch (error) {
    container.innerHTML = `
      <section class="panel comunicacao-panel">
        <div class="empty-state">Falha ao carregar a comunicação interna: ${escapeHtml(error.message)}</div>
      </section>
    `;
    return;
  }

  const emails = getCorporateEmailsForCurrentUser();
  const selectedEmail = emails.find((email) => email.id === selectedCorporateEmailId) || emails[0] || null;
  selectedCorporateEmailId = selectedEmail?.id || null;

  const rooms = getAccessibleCommunicationRooms();
  const selectedRoom = rooms.find((room) => room.id === selectedChatRoomId) || rooms[0] || null;
  selectedChatRoomId = selectedRoom?.id || null;

  if (currentUser?.perfil !== 'administrador') {
    selectedChatMemberIds = new Set((selectedRoom?.memberIds || []).filter((memberId) => memberId !== currentUser.id));
  }

  if (selectedRoom) {
    markCommunicationRoomAsSeen(selectedRoom.id);
  }

  const activeRoom = getAccessibleCommunicationRooms().find((room) => room.id === selectedChatRoomId) || selectedRoom;
  const onlineUsers = getVisibleCommunicationUsers(activeRoom);
  const roomParticipants = activeRoom ? getUsersByIds(activeRoom.memberIds) : [];
  const isAdmin = currentUser?.perfil === 'administrador';
  const availableRecipients = getAllUsers().filter((user) => user.id !== currentUser?.id).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

  container.innerHTML = `
    <section class="panel comunicacao-panel">
      <div class="hero-panel comunicacao-hero">
        <div>
          <p class="eyebrow">Comunicação interna</p>
          <h2>Correio corporativo e chat</h2>
          <p class="subtitle">Cada usuário vê seus próprios e-mails e participa apenas das salas liberadas para seu perfil.</p>
        </div>
      </div>

      <div class="comunicacao-top-grid">
        <div class="comunicacao-card comunicacao-inbox-card">
          <div class="comunicacao-card-head">
            <div>
              <h3>E-mails recebidos</h3>
              <p>${emails.length} item(ns) na caixa de entrada</p>
            </div>
          </div>
          <div class="comunicacao-inbox-list">
            ${emails.length ? emails.map((email) => {
              const isUnread = !email.readBy.includes(currentUser?.id);
              return `
                <button class="comunicacao-email-item ${selectedCorporateEmailId === email.id ? 'active' : ''} ${isUnread ? 'unread' : ''}" type="button" data-email-id="${escapeHtml(email.id)}">
                  <div class="comunicacao-email-item-top">
                    <strong>${escapeHtml(email.subject)}</strong>
                    ${isUnread ? '<span class="badge">Novo</span>' : ''}
                  </div>
                  <span>${escapeHtml(email.fromName)}</span>
                  <small>${escapeHtml(new Date(email.sentAt).toLocaleString('pt-BR'))}</small>
                </button>
              `;
            }).join('') : '<div class="empty-state">Nenhum e-mail corporativo disponível para este usuário.</div>'}
          </div>
        </div>

        <div class="comunicacao-card comunicacao-detail-card">
          ${selectedEmail ? `
            <div class="comunicacao-card-head">
              <div>
                <h3>${escapeHtml(selectedEmail.subject)}</h3>
                <p>${escapeHtml(selectedEmail.fromName)} • ${escapeHtml(new Date(selectedEmail.sentAt).toLocaleString('pt-BR'))}</p>
              </div>
            </div>
            <div class="comunicacao-email-body">${escapeHtml(selectedEmail.body).replace(/\n/g, '<br />')}</div>
          ` : '<div class="empty-state">Selecione um e-mail para abrir o conteúdo completo.</div>'}
          <div class="comunicacao-inline-mail-form">
            <h4>Novo e-mail interno</h4>
            <div class="usuario-form-grid">
              <div class="form-group">
                <label>Destinatário</label>
                <select id="corporateEmailRecipient">
                  <option value="">Selecione</option>
                  ${availableRecipients.map((user) => `<option value="${escapeHtml(user.id)}" data-email="${escapeHtml(user.email)}">${escapeHtml(user.nome)} (${escapeHtml(user.email)})</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Assunto</label>
                <input id="corporateEmailSubject" type="text" placeholder="Assunto do e-mail" />
              </div>
              <div class="form-group" style="grid-column: 1 / -1;">
                <label>Mensagem</label>
                <textarea id="corporateEmailBody" rows="4" placeholder="Escreva a mensagem institucional."></textarea>
              </div>
            </div>
            <div class="form-actions">
              <button id="sendCorporateEmailBtn" class="btn-save" type="button">Enviar e-mail</button>
            </div>
          </div>
        </div>
      </div>

      <div class="comunicacao-card comunicacao-chat-card">
        <div class="comunicacao-card-head comunicacao-chat-head">
          <div>
            <h3>Chat com salas administradas</h3>
            <p>${isAdmin ? 'Selecione usuários logados, monte o grupo e crie a sala.' : 'Você visualiza apenas as salas e os usuários do grupo ao qual pertence.'}</p>
          </div>
          ${isAdmin ? `
            <div class="comunicacao-room-create">
              <input id="chatRoomNameInput" type="text" placeholder="Nome da sala (opcional)" />
              <button id="createChatRoomBtn" class="btn-save" type="button">Criar sala</button>
            </div>
          ` : ''}
        </div>

        <div class="comunicacao-room-list">
          ${rooms.length ? rooms.map((room) => {
            const unreadMentions = countUnreadMentions(room, currentUser?.id);
            return `
              <button type="button" class="comunicacao-room-pill ${selectedChatRoomId === room.id ? 'active' : ''}" data-room-id="${escapeHtml(room.id)}">
                <span>${escapeHtml(room.name)}</span>
                ${unreadMentions ? `<strong>${unreadMentions} menção(ões)</strong>` : ''}
              </button>
            `;
          }).join('') : '<div class="empty-state">Nenhuma sala disponível ainda.</div>'}
        </div>

        ${isAdmin && activeRoom ? `
          <div class="comunicacao-room-admin-bar">
            <input id="editChatRoomNameInput" type="text" value="${escapeHtml(activeRoom.name)}" placeholder="Renomear sala" />
            <button id="saveChatRoomBtn" class="btn-save" type="button">Salvar sala</button>
            <button id="deleteChatRoomBtn" class="btn-table-delete" type="button">Excluir sala</button>
          </div>
        ` : ''}

        <div class="comunicacao-online-strip">
          ${onlineUsers.length ? onlineUsers.map((user) => {
            const isChecked = isAdmin ? (user.id === currentUser?.id || selectedChatMemberIds.has(user.id)) : true;
            return `
              <label class="comunicacao-user-chip ${isChecked ? 'selected' : ''} ${user.id === currentUser?.id ? 'self' : ''}">
                <input type="checkbox" data-chat-member-id="${escapeHtml(user.id)}" ${isChecked ? 'checked' : ''} ${(isAdmin && user.id !== currentUser?.id) ? '' : 'disabled'} />
                <span class="comunicacao-user-status ${user.id === currentUser?.id || user.isOnline ? 'online' : ''}"></span>
                <strong>${escapeHtml(user.nome)}</strong>
                <small>${escapeHtml(getPerfilLabel(user.perfil))}</small>
              </label>
            `;
          }).join('') : '<div class="empty-state">Nenhum usuário logado neste momento.</div>'}
        </div>

        <div class="comunicacao-chat-board">
          ${activeRoom ? `
            <div class="comunicacao-room-meta">
              <div>
                <h4>${escapeHtml(activeRoom.name)}</h4>
                <p>${roomParticipants.map((user) => escapeHtml(user.nome)).join(', ')}</p>
              </div>
            </div>
            <div class="comunicacao-mention-row">
              ${roomParticipants.length ? roomParticipants.map((user) => `
                <button type="button" class="comunicacao-mention-chip" data-mention-user="${escapeHtml(user.nome)}">@${escapeHtml(user.nome)}</button>
              `).join('') : '<span class="muted">Sem participantes disponíveis.</span>'}
            </div>
            <div class="comunicacao-message-list">
              ${activeRoom.messages.length ? activeRoom.messages.map((message) => {
                const mentionsCurrentUser = message.mentionUserIds.includes(currentUser?.id);
                return `
                  <article class="comunicacao-message ${message.authorId === currentUser?.id ? 'own' : ''}">
                    <div class="comunicacao-message-head">
                      <strong>${escapeHtml(message.authorName)}</strong>
                      <small>${escapeHtml(new Date(message.sentAt).toLocaleString('pt-BR'))}</small>
                    </div>
                    <p>${escapeHtml(message.body).replace(/\n/g, '<br />')}</p>
                    ${mentionsCurrentUser ? '<span class="badge">Você foi mencionado</span>' : ''}
                  </article>
                `;
              }).join('') : '<div class="empty-state">Ainda não há mensagens nesta sala.</div>'}
            </div>
            <div class="comunicacao-composer">
              <textarea id="chatMessageInput" rows="4" placeholder="Escreva a mensagem e use os botões acima para mencionar alguém do grupo."></textarea>
              <div class="form-actions">
                <button id="sendChatMessageBtn" class="btn-save" type="button">Enviar mensagem</button>
              </div>
            </div>
          ` : '<div class="empty-state">Selecione uma sala para abrir a conversa. Se você for administrador, monte um grupo e crie uma nova sala.</div>'}
        </div>
      </div>
    </section>
  `;

  container.querySelectorAll('[data-email-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      selectedCorporateEmailId = button.getAttribute('data-email-id');
      markCorporateEmailAsRead(selectedCorporateEmailId);
      renderModuleContent('comunicacao');
    });
  });

  container.querySelectorAll('[data-room-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      selectedChatRoomId = button.getAttribute('data-room-id');
      markCommunicationRoomAsSeen(selectedChatRoomId);
      renderModuleContent('comunicacao');
    });
  });

  container.querySelectorAll('[data-chat-member-id]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const memberId = checkbox.getAttribute('data-chat-member-id');
      if (checkbox.checked) {
        selectedChatMemberIds.add(memberId);
      } else {
        selectedChatMemberIds.delete(memberId);
      }
      renderModuleContent('comunicacao');
    });
  });

  const createRoomBtn = document.getElementById('createChatRoomBtn');
  if (createRoomBtn) {
    createRoomBtn.addEventListener('click', async () => {
      const roomNameInput = document.getElementById('chatRoomNameInput');
      await createCommunicationRoom(roomNameInput?.value || '', Array.from(selectedChatMemberIds));
      renderModuleContent('comunicacao');
    });
  }

  container.querySelectorAll('[data-mention-user]').forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.getElementById('chatMessageInput');
      if (!input) {
        return;
      }

      const token = `@${button.getAttribute('data-mention-user')} `;
      input.value = `${input.value}${input.value ? ' ' : ''}${token}`;
      input.focus();
    });
  });

  const sendChatMessageBtn = document.getElementById('sendChatMessageBtn');
  if (sendChatMessageBtn && activeRoom) {
    sendChatMessageBtn.addEventListener('click', async () => {
      const input = document.getElementById('chatMessageInput');
      await postCommunicationMessage(activeRoom.id, input?.value || '');
      renderModuleContent('comunicacao');
    });
  }

  const sendCorporateEmailBtn = document.getElementById('sendCorporateEmailBtn');
  if (sendCorporateEmailBtn) {
    sendCorporateEmailBtn.addEventListener('click', async () => {
      const recipientSelect = document.getElementById('corporateEmailRecipient');
      const subjectInput = document.getElementById('corporateEmailSubject');
      const bodyInput = document.getElementById('corporateEmailBody');
      const option = recipientSelect?.selectedOptions?.[0];
      const toUserId = String(recipientSelect?.value || '').trim();
      const toEmail = String(option?.getAttribute('data-email') || '').trim();

      const success = await sendCorporateEmailApi({
        toUserId,
        toEmail,
        subject: subjectInput?.value || '',
        body: bodyInput?.value || '',
        fromUserId: currentUser.id,
        fromName: currentUser.nome,
        fromEmail: currentUser.email
      });

      if (success) {
        if (subjectInput) subjectInput.value = '';
        if (bodyInput) bodyInput.value = '';
        if (recipientSelect) recipientSelect.value = '';
        renderModuleContent('comunicacao');
      }
    });
  }

  const saveChatRoomBtn = document.getElementById('saveChatRoomBtn');
  if (saveChatRoomBtn && activeRoom && isAdmin) {
    saveChatRoomBtn.addEventListener('click', async () => {
      const roomNameInput = document.getElementById('editChatRoomNameInput');
      const memberIds = Array.from(new Set([currentUser.id, ...Array.from(selectedChatMemberIds)]));
      const success = await updateCommunicationRoomApi(activeRoom.id, {
        name: roomNameInput?.value || activeRoom.name,
        memberIds
      });
      if (success) {
        renderModuleContent('comunicacao');
      }
    });
  }

  const deleteChatRoomBtn = document.getElementById('deleteChatRoomBtn');
  if (deleteChatRoomBtn && activeRoom && isAdmin) {
    deleteChatRoomBtn.addEventListener('click', async () => {
      if (!window.confirm(`Excluir a sala ${activeRoom.name}?`)) {
        return;
      }

      const success = await deleteCommunicationRoomApi(activeRoom.id);
      if (success) {
        renderModuleContent('comunicacao');
      }
    });
  }
}

function renderUsuariosModule(container) {
  const users = getAllUsers();
  const isAdmin = currentUser?.perfil === 'administrador';

  let editFormHTML = '';
  if (editingUserId) {
    const user = users.find(function(u) { return u.id === editingUserId; });
    if (user) {
      editFormHTML = `
        <div class="usuario-form-card">
          <h3>Editar usuário</h3>
          <div class="usuario-form-grid">
            <div class="form-group">
              <label>Nome completo</label>
              <input id="editNome" type="text" value="${escapeHtml(user.nome)}" />
            </div>
            <div class="form-group">
              <label>E-mail</label>
              <input id="editEmail" type="email" value="${escapeHtml(user.email)}" />
            </div>
            <div class="form-group">
              <label>CPF</label>
              <input id="editCPF" type="text" value="${escapeHtml(user.cpf || '')}" />
            </div>
            <div class="form-group">
              <label>Telefone</label>
              <input id="editPhone" type="tel" value="${escapeHtml(user.phone || '')}" />
            </div>
            <div class="form-group">
              <label>Nova senha <small>(deixe em branco para manter)</small></label>
              <input id="editPassword" type="password" placeholder="Nova senha" />
            </div>
            <div class="form-group">
              <label>Perfil</label>
              <select id="editPerfil">
                <option value="administrador" ${user.perfil === 'administrador' ? 'selected' : ''}>Administrador</option>
                <option value="usuario" ${user.perfil === 'usuario' ? 'selected' : ''}>Usuário</option>
                <option value="visualizador" ${user.perfil === 'visualizador' ? 'selected' : ''}>Visualizador</option>
              </select>
            </div>
            <div class="form-group">
              <label>Setores vinculados <small>(separados por vírgula)</small></label>
              <input id="editSetores" type="text" value="${escapeHtml(normalizeUserSetores(user.setores).join(', '))}" placeholder="Ex.: Setor de Compras, Setor Financeiro" />
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-save" id="saveEditUserBtn" data-user-id="${user.id}" type="button">Salvar alterações</button>
            <button class="btn-cancel" id="cancelEditUserBtn" type="button">Cancelar</button>
          </div>
        </div>`;
    }
  }

  let addFormHTML = '';
  if (showAddUserForm) {
    addFormHTML = `
      <div class="usuario-form-card">
        <h3>Adicionar usuário</h3>
        <div class="usuario-form-grid">
          <div class="form-group">
            <label>Nome completo</label>
            <input id="addNome" type="text" placeholder="Nome completo" />
          </div>
          <div class="form-group">
            <label>E-mail</label>
            <input id="addEmail" type="email" placeholder="email@exemplo.com" />
          </div>
          <div class="form-group">
            <label>CPF</label>
            <input id="addCPF" type="text" placeholder="000.000.000-00" />
          </div>
          <div class="form-group">
            <label>Telefone</label>
            <input id="addPhone" type="tel" placeholder="(11) 98765-4321" />
          </div>
          <div class="form-group">
            <label>Senha</label>
            <input id="addPassword" type="password" placeholder="Senha" />
          </div>
          <div class="form-group">
            <label>Perfil</label>
            <select id="addPerfil">
              <option value="usuario">Usuário</option>
              <option value="administrador">Administrador</option>
              <option value="visualizador">Visualizador</option>
            </select>
          </div>
          <div class="form-group">
            <label>Setores vinculados <small>(separados por vírgula)</small></label>
            <input id="addSetores" type="text" placeholder="Ex.: Setor de Compras, Setor Financeiro" />
          </div>
        </div>
        <div class="form-actions">
          <button class="btn-save" id="confirmAddUserBtn" type="button">Criar usuário</button>
          <button class="btn-cancel" id="cancelAddUserBtn" type="button">Cancelar</button>
        </div>
      </div>`;
  }

  container.innerHTML = `
    <section class="panel usuarios-panel">
      <div class="hero-panel usuarios-hero">
        <div>
          <p class="eyebrow">Gerenciamento de acesso</p>
          <h2>Permissões e Usuários</h2>
          <p class="subtitle">Controle de usuários cadastrados e seus perfis de acesso ao sistema.</p>
        </div>
        ${isAdmin ? '<button class="usuarios-add-btn" id="addUserBtn" type="button">+ Adicionar usuário</button>' : ''}
      </div>

      ${addFormHTML}
      ${editFormHTML}

      <div class="usuarios-table-wrapper">
        <table class="usuarios-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>CPF</th>
              <th>Telefone</th>
              <th>Setores</th>
              <th>Perfil</th>
              ${isAdmin ? '<th>Ações</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${users.map(function(user) {
              return `
              <tr>
                <td>${escapeHtml(user.nome)}</td>
                <td>${escapeHtml(user.email)}</td>
                <td>${escapeHtml(user.cpf || '-')}</td>
                <td>${escapeHtml(user.phone || '-')}</td>
                <td>${escapeHtml(normalizeUserSetores(user.setores).join(', ') || '-')}</td>
                <td><span class="perfil-badge perfil-${user.perfil || 'usuario'}">${getPerfilLabel(user.perfil)}</span></td>
                ${isAdmin ? `<td class="actions-cell">
                  <button class="btn-table-edit" data-user-id="${user.id}" type="button">Editar</button>
                  ${user.id !== currentUser?.id ? `<button class="btn-table-delete" data-user-id="${user.id}" type="button">Excluir</button>` : '<span class="current-user-tag">Você</span>'}
                </td>` : ''}
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;

  const addBtn = document.getElementById('addUserBtn');
  if (addBtn) {
    addBtn.addEventListener('click', function() {
      showAddUserForm = true;
      editingUserId = null;
      renderModuleContent('usuarios');
    });
  }

  const cancelAddBtn = document.getElementById('cancelAddUserBtn');
  if (cancelAddBtn) {
    cancelAddBtn.addEventListener('click', function() {
      showAddUserForm = false;
      renderModuleContent('usuarios');
    });
  }

  const confirmAddBtn = document.getElementById('confirmAddUserBtn');
  if (confirmAddBtn) {
    confirmAddBtn.addEventListener('click', function() {
      const nome = document.getElementById('addNome').value.trim();
      const email = document.getElementById('addEmail').value.trim();
      const cpf = document.getElementById('addCPF').value.trim();
      const phone = document.getElementById('addPhone').value.trim();
      const password = document.getElementById('addPassword').value;
      const perfil = document.getElementById('addPerfil').value;
      const setores = normalizeUserSetores(document.getElementById('addSetores').value);

      if (!nome || !email || !password) {
        alert('Nome, e-mail e senha são obrigatórios.');
        return;
      }

      const allUsers = getAllUsers();
      if (allUsers.some(function(u) { return u.email.toLowerCase() === email.toLowerCase(); })) {
        alert('E-mail já cadastrado.');
        return;
      }

      allUsers.push({
        id: crypto.randomUUID(),
        nome,
        cpf: cpf || '',
        email,
        phone: phone || '',
        setores,
        password,
        perfil,
        createdAt: new Date().toISOString()
      });
      saveAllUsers(allUsers);
      showAddUserForm = false;
      renderModuleContent('usuarios');
    });
  }

  const cancelEditBtn = document.getElementById('cancelEditUserBtn');
  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', function() {
      editingUserId = null;
      renderModuleContent('usuarios');
    });
  }

  const saveEditBtn = document.getElementById('saveEditUserBtn');
  if (saveEditBtn) {
    saveEditBtn.addEventListener('click', function() {
      const userId = saveEditBtn.getAttribute('data-user-id');
      const nome = document.getElementById('editNome').value.trim();
      const email = document.getElementById('editEmail').value.trim();
      const cpf = document.getElementById('editCPF').value.trim();
      const phone = document.getElementById('editPhone').value.trim();
      const password = document.getElementById('editPassword').value;
      const perfil = document.getElementById('editPerfil').value;
      const setores = normalizeUserSetores(document.getElementById('editSetores').value);

      if (!nome || !email) {
        alert('Nome e e-mail são obrigatórios.');
        return;
      }

      const allUsers = getAllUsers();
      const idx = allUsers.findIndex(function(u) { return u.id === userId; });
      if (idx === -1) return;

      if (allUsers.some(function(u) { return u.id !== userId && u.email.toLowerCase() === email.toLowerCase(); })) {
        alert('E-mail já cadastrado para outro usuário.');
        return;
      }

      allUsers[idx] = Object.assign({}, allUsers[idx], { nome, email, cpf: cpf || '', phone: phone || '', perfil, setores });
      if (password) allUsers[idx].password = password;
      saveAllUsers(allUsers);

      if (currentUser?.id === userId) {
        currentUser = buildCurrentUserSession(allUsers[idx]);
        saveCurrentUser();
      }

      editingUserId = null;
      renderModuleContent('usuarios');
    });
  }

  container.querySelectorAll('.btn-table-edit').forEach(function(btn) {
    btn.addEventListener('click', function() {
      editingUserId = btn.getAttribute('data-user-id');
      showAddUserForm = false;
      renderModuleContent('usuarios');
    });
  });

  container.querySelectorAll('.btn-table-delete').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const userId = btn.getAttribute('data-user-id');
      const user = getAllUsers().find(function(u) { return u.id === userId; });
      if (!user) return;
      if (!confirm(`Tem certeza que deseja excluir o usuário "${user.nome}"?`)) return;
      saveAllUsers(getAllUsers().filter(function(u) { return u.id !== userId; }));
      renderModuleContent('usuarios');
    });
  });
}

const ritesConfig = {
  administrativa: {
    label: 'Solicitações administrativas',
    titlePrefix: 'SA',
    steps: [
      { title: 'Pedido inicial', type: 'Petição', content: 'Solicitação apresentada para análise da unidade administrativa. Requer-se instrução inicial e registro do protocolo no sistema.' },
      { title: 'Análise preliminar', type: 'Despacho', content: 'A unidade verifica a adequação formal do pedido, os anexos e a necessidade de complementação documental.' },
      { title: 'Parecer técnico', type: 'Parecer', content: 'O setor técnico emite opinião sobre viabilidade, impacto operacional e necessidade de providências complementares.' },
      { title: 'Decisão final', type: 'Decisão', content: 'A autoridade competente decide pela aprovação, parcialidade ou arquivamento da solicitação.' }
    ]
  },
  licitacao: {
    label: 'Demandas licitatórias',
    titlePrefix: 'DL',
    steps: [
      { title: 'Requerimento de demanda', type: 'Requerimento', content: 'A área requisitante formaliza a necessidade de contratação, informando escopo, valor estimado e justificativa.' },
      { title: 'Análise de mercado', type: 'Parecer', content: 'A equipe de compras avalia fornecedores, normas aplicáveis e estratégia de contratação mais adequada.' },
      { title: 'Homologação da demanda', type: 'Despacho', content: 'A autoridade homologa a demanda e autoriza o início da fase licitatória subsequente.' },
      { title: 'Encaminhamento ao pregão', type: 'Ofício', content: 'A demanda é formalmente encaminhada para a modalidade licitatória de escolha da administração.' }
    ]
  },
  modalidade: {
    label: 'Ritos licitatórios por modalidade',
    titlePrefix: 'RM',
    steps: [
      { title: 'Edital e instruções', type: 'Edital', content: 'O processo recebe o edital, critérios de habilitação, critérios de julgamento e instruções de participação.' },
      { title: 'Recebimento de propostas', type: 'Ata', content: 'As propostas são recebidas, conferidas e organizadas para abertura e análise dos critérios definidos.' },
      { title: 'Classificação', type: 'Parecer', content: 'A comissão verifica a regularidade das propostas, classificando-as conforme o edital.' },
      { title: 'Decisão de adjudicação', type: 'Decisão', content: 'A autoridade adjudica o objeto ao proponente vencedor, encerrando a fase competitiva.' }
    ]
  },
  contratual: {
    label: 'Controle contratual',
    titlePrefix: 'CC',
    steps: [
      { title: 'Contrato firmado', type: 'Contrato', content: 'O instrumento contratual já está firmado e precisa de acompanhamento permanente da execução.' },
      { title: 'Acompanhamento da execução', type: 'Relatório', content: 'A equipe acompanha prazos, entregas, obrigações e eventuais desvios do objeto contratado.' },
      { title: 'Fiscalização', type: 'Laudo', content: 'A fiscalização avalia a conformidade, efeitos financeiros e cumprimento das cláusulas.' },
      { title: 'Encerramento', type: 'Termo', content: 'O contrato é encerrado ou prorroga-se, com registro formal das ocorrências e pendências.' }
    ]
  },
  arp: {
    label: 'ARP',
    titlePrefix: 'ARP',
    steps: [
      { title: 'Abertura de ARP', type: 'Memorando', content: 'A análise de risco processual é iniciada com levantamento documental e identificação de pontos críticos.' },
      { title: 'Apuração preliminar', type: 'Indicação', content: 'A equipe reúne evidências, verifica fatos e estrutura a cadeia dos acontecimentos.' },
      { title: 'Parecer de risco', type: 'Parecer', content: 'É elaborado o parecer com riscos, recomendações e providências de mitigação.' },
      { title: 'Encaminhamento gerencial', type: 'Decisão', content: 'A gestão decide sobre a continuidade, ajustes ou arquivamento da análise de risco.' }
    ]
  }
};

const initialState = {
  processes: [
    {
      id: crypto.randomUUID(),
      title: 'Processo 001',
      riteKey: 'administrativa',
      createdAt: new Date().toLocaleDateString('pt-BR'),
      currentStep: 0,
      selectedDocumentId: null,
      documents: []
    }
  ],
  licitacoesDemandas: [],
  municipalStructure: normalizeMunicipalStructure(defaultMunicipalStructure),
  setoresDestino: [...defaultSetoresDestino],
  protocoloSequencial: 1,
  licitacoesColumnWidths: { ...defaultLicitacoesColumnWidths },
  modalidades: [...defaultModalidades],
  statusCatalog: [...defaultStatusCatalog],
  ritosPorModalidade: { ...defaultRitosPorModalidade },
  painelFilters: normalizePainelFilters({}, []),
  painelLayout: normalizePainelLayout(),
  alerts: [],
  communications: normalizeCommunicationsState()
};

let state = loadState();
let selectedProcessId = state.processes[0]?.id || null;
filtrosPainel = normalizePainelFilters(state.painelFilters, state.licitacoesDemandas, state.modalidades);
state.painelFilters = filtrosPainel;

function loadState() {
  const saved = localStorage.getItem('proad-state');
  if (!saved) {
    return buildInitialState();
  }

  try {
    const parsed = JSON.parse(saved);
    const municipalStructure = normalizeMunicipalStructure(parsed.municipalStructure);
    const derivedSetores = getAllSetoresFromStructureData(municipalStructure);
    const parsedProcesses = Array.isArray(parsed.processes)
      ? parsed.processes.map((process) => {
        const processId = String(process?.id || '').trim() || crypto.randomUUID();
        const riteKey = ritesConfig[process?.riteKey] ? process.riteKey : 'administrativa';
        const documents = Array.isArray(process?.documents) && process.documents.length
          ? process.documents
          : buildDocuments(ritesConfig[riteKey], processId);

        return {
          ...process,
          id: processId,
          riteKey,
          documents
        };
      })
      : [];

    const safeProcesses = parsedProcesses.length
      ? parsedProcesses
      : [buildProcess('administrativa', 'Processo 001')];

    return {
      processes: safeProcesses,
      licitacoesDemandas: Array.isArray(parsed.licitacoesDemandas) ? parsed.licitacoesDemandas : [],
      municipalStructure,
      setoresDestino: derivedSetores.length ? derivedSetores : normalizeSetoresDestino(parsed.setoresDestino),
      protocoloSequencial: Number.isInteger(parsed.protocoloSequencial) && parsed.protocoloSequencial > 0
        ? parsed.protocoloSequencial
        : getDerivedProtocolSequence(parsed.licitacoesDemandas),
      licitacoesColumnWidths: normalizeLicitacoesColumnWidths(parsed.licitacoesColumnWidths),
      modalidades: normalizeModalidades(parsed.modalidades),
      statusCatalog: normalizeStatusCatalog(parsed.statusCatalog),
      ritosPorModalidade: normalizeRitosPorModalidade(parsed.ritosPorModalidade, parsed.statusCatalog, parsed.modalidades),
      painelFilters: normalizePainelFilters(parsed.painelFilters, parsed.licitacoesDemandas, parsed.modalidades),
      painelLayout: normalizePainelLayout(parsed.painelLayout),
      alerts: normalizeAlerts(parsed.alerts),
      communications: normalizeCommunicationsState(parsed.communications)
    };
  } catch (error) {
    console.error('Falha ao carregar estado salvo.', error);
    return buildInitialState();
  }
}

function buildInitialState() {
  const municipalStructure = normalizeMunicipalStructure(defaultMunicipalStructure);
  const derivedSetores = getAllSetoresFromStructureData(municipalStructure);
  return {
    processes: [buildProcess('administrativa', 'Processo 001')],
    licitacoesDemandas: [],
    municipalStructure,
    setoresDestino: derivedSetores.length ? derivedSetores : [...defaultSetoresDestino],
    protocoloSequencial: 1,
    licitacoesColumnWidths: { ...defaultLicitacoesColumnWidths },
    modalidades: [...defaultModalidades],
    statusCatalog: [...defaultStatusCatalog],
    ritosPorModalidade: { ...defaultRitosPorModalidade },
    painelFilters: normalizePainelFilters({}, []),
    painelLayout: normalizePainelLayout(),
    alerts: [],
    communications: normalizeCommunicationsState()
  };
}

function buildProcess(riteKey, title) {
  const rite = ritesConfig[riteKey];
  const processId = crypto.randomUUID();
  return {
    id: processId,
    title,
    riteKey,
    createdAt: new Date().toLocaleDateString('pt-BR'),
    currentStep: 0,
    selectedDocumentId: null,
    documents: buildDocuments(rite, processId)
  };
}

function buildDocuments(rite, processId) {
  const docs = [];
  let parentId = null;

  rite.steps.forEach((step, index) => {
    const docId = `${processId}-doc-${index + 1}`;
    docs.push({
      id: docId,
      title: step.title,
      type: step.type,
      content: step.content,
      parentId,
      status: index < 1 ? 'Pendente' : 'Pendente'
    });
    parentId = docId;
  });

  return docs;
}

function persistState() {
  localStorage.setItem('proad-state', JSON.stringify(state));
}

function init() {
  syncPresenceWithApi(true).catch(() => {});
  bindTopbarMessages();
  try {
    render();
  } catch (error) {
    recoverFromStartupFailure(error);
  }
  bindSidebar();
  bindModuleNavigation();

  const newProcessBtn = document.getElementById('newProcessBtn');
  if (newProcessBtn) {
    newProcessBtn.onclick = createProcess;
  }

  const advanceBtn = document.getElementById('advanceBtn');
  if (advanceBtn) {
    advanceBtn.addEventListener('click', advanceProcess);
  }

  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetProcess);
  }

  // Valida montagem inicial para evitar tela vazia por estado/localStorage inconsistente.
  ensureMainUiMounted();
  window.requestAnimationFrame(() => {
    ensureMainUiMounted();
  });
}

function renderSidebarNavigation() {
  const nav = document.querySelector('.sidebar-nav');
  if (!nav) {
    return;
  }

  nav.innerHTML = moduleConfig.map((module) => `
    <button class="nav-item ${module.key === activeModuleKey ? 'active' : ''}" type="button">
      <span class="nav-icon">${module.icon}</span>
      <span class="nav-label">${module.label}</span>
    </button>
  `).join('');
}

function recoverFromStartupFailure(error) {
  console.error('Falha ao inicializar a interface. Estado será recriado.', error);

  try {
    state = buildInitialState();
    selectedProcessId = state.processes[0]?.id || null;
    activeModuleKey = 'painel';
    state.painelFilters = normalizePainelFilters(state.painelFilters, state.licitacoesDemandas, state.modalidades);
    filtrosPainel = state.painelFilters;
    persistState();
    render();
  } catch (recoveryError) {
    console.error('Falha ao recuperar interface após erro de inicialização.', recoveryError);
    renderSidebarNavigation();
    const container = document.getElementById('moduleContent');
    if (container) {
      container.innerHTML = '<section class="panel"><p class="empty-state">Não foi possível carregar a tela. Recarregue a página para tentar novamente.</p></section>';
    }
  }
}

function ensureMainUiMounted() {
  const nav = document.querySelector('.sidebar-nav');
  const container = document.getElementById('moduleContent');
  const navItemsCount = nav ? nav.querySelectorAll('.nav-item').length : 0;
  const hasContainerContent = Boolean(container && container.children.length > 0);

  if (navItemsCount > 0 && hasContainerContent) {
    return;
  }

  console.warn('Interface principal não montou corretamente. Aplicando recuperação forçada.');

  try {
    state = buildInitialState();
    selectedProcessId = state.processes[0]?.id || null;
    activeModuleKey = 'painel';
    state.painelFilters = normalizePainelFilters(state.painelFilters, state.licitacoesDemandas, state.modalidades);
    filtrosPainel = state.painelFilters;
    persistState();
    render();
    bindModuleNavigation();
  } catch (error) {
    console.error('Falha na recuperação forçada da interface.', error);
    renderSidebarNavigation();
    if (container) {
      container.innerHTML = '<section class="panel"><p class="empty-state">Não foi possível carregar os módulos. Acesse novamente com ?reset=1 no final da URL.</p></section>';
    }
  }
}

function bindModuleNavigation() {
  document.querySelectorAll('.nav-item').forEach((button, index) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      activeModuleKey = moduleConfig[index].key;
      renderModuleContent(activeModuleKey);
    });
  });
}

function bindSidebar() {
  const toggleBtn = document.getElementById('toggleSidebarBtn');
  const sidebar = document.getElementById('sidebar');

  if (!toggleBtn || !sidebar) {
    return;
  }

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    toggleBtn.textContent = sidebar.classList.contains('collapsed') ? '▶' : '◀';
  });
}



function createProcess() {
  openProtocolModal();
}

function bindProtocolModalEvents() {
  const protocolForm = document.getElementById('protocolForm');
  const municipalitySelect = document.getElementById('protocolMunicipio');
  const closeProtocolBtn = document.getElementById('closeProtocolModal');
  const closeSummaryBtn = document.getElementById('closeProtocolSummaryModal');
  const closeLicitacaoDetailsBtn = document.getElementById('closeLicitacaoDetailsModal');
  const protocolModal = document.getElementById('protocolModal');
  const summaryModal = document.getElementById('protocolSummaryModal');
  const licitacaoDetailsModal = document.getElementById('licitacaoDetailsModal');

  if (closeProtocolBtn && !closeProtocolBtn.dataset.bound) {
    closeProtocolBtn.addEventListener('click', closeProtocolModal);
    closeProtocolBtn.dataset.bound = '1';
  }

  if (closeSummaryBtn && !closeSummaryBtn.dataset.bound) {
    closeSummaryBtn.addEventListener('click', closeProtocolSummaryModal);
    closeSummaryBtn.dataset.bound = '1';
  }

  if (closeLicitacaoDetailsBtn && !closeLicitacaoDetailsBtn.dataset.bound) {
    closeLicitacaoDetailsBtn.addEventListener('click', closeLicitacaoDetailsModal);
    closeLicitacaoDetailsBtn.dataset.bound = '1';
  }

  if (protocolModal && !protocolModal.dataset.bound) {
    protocolModal.addEventListener('click', (event) => {
      if (event.target === protocolModal) {
        closeProtocolModal();
      }
    });
    protocolModal.dataset.bound = '1';
  }

  if (summaryModal && !summaryModal.dataset.bound) {
    summaryModal.addEventListener('click', (event) => {
      if (event.target === summaryModal) {
        closeProtocolSummaryModal();
      }
    });
    summaryModal.dataset.bound = '1';
  }

  if (licitacaoDetailsModal && !licitacaoDetailsModal.dataset.bound) {
    licitacaoDetailsModal.addEventListener('click', (event) => {
      if (event.target === licitacaoDetailsModal) {
        closeLicitacaoDetailsModal();
      }
    });
    licitacaoDetailsModal.dataset.bound = '1';
  }

  if (municipalitySelect && !municipalitySelect.dataset.bound) {
    municipalitySelect.addEventListener('change', () => {
      syncProtocolOrgaoOptions();
      syncProtocolSetorOptions();
    });
    municipalitySelect.dataset.bound = '1';
  }

  const orgaoSelect = document.getElementById('protocolOrgao');
  if (orgaoSelect && !orgaoSelect.dataset.bound) {
    orgaoSelect.addEventListener('change', syncProtocolSetorOptions);
    orgaoSelect.dataset.bound = '1';
  }

  if (protocolForm && !protocolForm.dataset.bound) {
    protocolForm.addEventListener('submit', submitProtocolForm);
    protocolForm.dataset.bound = '1';
  }
}

function syncProtocolMunicipioOptions() {
  const municipioSelect = document.getElementById('protocolMunicipio');
  if (!municipioSelect) {
    return;
  }

  const municipiosDisponiveis = getMunicipiosList();
  if (!municipiosDisponiveis.length) {
    municipioSelect.innerHTML = '<option value="">Cadastre um município na Estrutura Municipal</option>';
    municipioSelect.value = '';
    return;
  }

  const current = municipioSelect.value;
  municipioSelect.innerHTML = municipiosDisponiveis.map((municipio) => `<option value="${escapeHtml(municipio)}">${escapeHtml(municipio)}</option>`).join('');

  if (current && municipiosDisponiveis.includes(current)) {
    municipioSelect.value = current;
  } else {
    municipioSelect.value = municipiosDisponiveis[0];
  }
}

function syncProtocolOrgaoOptions() {
  const municipioSelect = document.getElementById('protocolMunicipio');
  const orgaoSelect = document.getElementById('protocolOrgao');
  if (!municipioSelect || !orgaoSelect) {
    return;
  }

  const municipiosDisponiveis = getMunicipiosList();
  const municipality = municipioSelect.value || municipiosDisponiveis[0] || '';
  const orgaos = getSecretariasByMunicipio(municipality);
  const current = orgaoSelect.value;

  orgaoSelect.innerHTML = orgaos.map((orgao) => `<option value="${escapeHtml(orgao)}">${escapeHtml(orgao)}</option>`).join('');

  if (current && orgaos.includes(current)) {
    orgaoSelect.value = current;
  } else if (orgaos.length) {
    orgaoSelect.value = orgaos[0];
  }
}

function getSetoresByMunicipioAndSecretaria(nomeMunicipio, nomeSecretaria) {
  const municipalityName = String(nomeMunicipio || '').trim();
  const secretariaName = String(nomeSecretaria || '').trim();
  if (!municipalityName || !secretariaName) {
    return [];
  }

  const municipalStructure = getMunicipalStructure();
  const municipality = municipalStructure.find((item) => item.nome === municipalityName);
  if (!municipality) {
    return [];
  }

  const secretaria = (municipality.secretarias || []).find((item) => item.nome === secretariaName);
  if (!secretaria) {
    return [];
  }

  return Array.isArray(secretaria.setores)
    ? secretaria.setores.map((setor) => String(setor || '').trim()).filter(Boolean)
    : [];
}

function syncProtocolSetorOptions() {
  const setorSelect = document.getElementById('protocolSetor');
  const municipioSelect = document.getElementById('protocolMunicipio');
  const orgaoSelect = document.getElementById('protocolOrgao');
  if (!setorSelect) {
    return;
  }

  const current = setorSelect.value;
  const municipio = String(municipioSelect?.value || '').trim();
  const orgao = String(orgaoSelect?.value || '').trim();
  const setores = getSetoresByMunicipioAndSecretaria(municipio, orgao);
  if (!setores.length) {
    setorSelect.innerHTML = '<option value="">Cadastre setores para esta secretaria</option>';
    setorSelect.value = '';
    return;
  }

  setorSelect.innerHTML = setores
    .map((setor) => `<option value="${escapeHtml(setor)}">${escapeHtml(setor)}</option>`)
    .join('');

  if (current && setores.includes(current)) {
    setorSelect.value = current;
  } else if (setores.length) {
    setorSelect.value = setores[0];
  }
}

function openProtocolModal() {
  const modal = document.getElementById('protocolModal');
  const form = document.getElementById('protocolForm');
  if (!modal || !form) {
    return;
  }

  form.reset();
  syncProtocolMunicipioOptions();
  syncProtocolOrgaoOptions();
  syncProtocolSetorOptions();
  modal.classList.add('active');
}

function closeProtocolModal() {
  const modal = document.getElementById('protocolModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function closeProtocolSummaryModal() {
  const modal = document.getElementById('protocolSummaryModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function closeLicitacaoDetailsModal() {
  const modal = document.getElementById('licitacaoDetailsModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

function getDemandCreationDate(demand) {
  if (demand?.createdAtIso) {
    return new Date(demand.createdAtIso);
  }

  const dateParts = String(demand?.createdAt || '').split('/').map((value) => Number(value));
  if (dateParts.length === 3 && dateParts.every((part) => Number.isFinite(part) && part > 0)) {
    return new Date(dateParts[2], dateParts[1] - 1, dateParts[0]);
  }

  return new Date();
}

function formatElapsedFromIso(isoDate) {
  const base = isoDate ? new Date(isoDate) : new Date();
  const diffMs = Math.max(0, Date.now() - base.getTime());
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return `${days}d ${hours}h`;
}

function getPrioridadeClass(prioridade) {
  const key = String(prioridade || '').toLowerCase();
  if (key === 'urgente') return 'priority-urgente';
  if (key === 'alta') return 'priority-alta';
  if (key === 'média' || key === 'media') return 'priority-media';
  if (key === 'baixa') return 'priority-baixa';
  return 'priority-padrao';
}

function getPrioridadeBorderClass(prioridade) {
  const key = String(prioridade || '').toLowerCase();
  if (key === 'urgente') return 'priority-border-urgente';
  if (key === 'alta') return 'priority-border-alta';
  if (key === 'média' || key === 'media') return 'priority-border-media';
  if (key === 'baixa') return 'priority-border-baixa';
  return 'priority-border-padrao';
}

function toDateInputValue(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function saveLicitacaoDemandFromModal(demandId) {
  if (currentUser?.perfil !== 'administrador') {
    return;
  }

  const list = Array.isArray(state.licitacoesDemandas) ? state.licitacoesDemandas : [];
  const index = list.findIndex((item) => item.id === demandId);
  if (index === -1) {
    return;
  }

  const current = list[index];
  const nextStatus = String(document.getElementById('editDemandStatus')?.value || '').trim() || 'DFD';
  const createdAtRaw = String(document.getElementById('editDemandCreatedAt')?.value || '').trim();
  const createdAtDate = createdAtRaw ? new Date(`${createdAtRaw}T00:00:00`) : getDemandCreationDate(current);
  const nextModalidade = String(document.getElementById('editDemandModalidade')?.value || '').trim() || '-';
  const nextSetorResponsavel = String(document.getElementById('editDemandSetorResponsavel')?.value || '').trim() || '-';
  const nextResponsavel = String(document.getElementById('editDemandResponsavel')?.value || '').trim() || '-';

  const responsavelChanged = (String(current.responsavel || '-') !== nextResponsavel) || (String(current.setorResponsavel || current.setorDestino || '-') !== nextSetorResponsavel);
  const responsavelNomeChanged = String(current.responsavel || '-') !== nextResponsavel;
  const generatedNumeroOrdem = getNextNumeroOrdemByModalidade(nextModalidade, current.id);
  const statusOptions = getStatusOptionsForModalidade(nextModalidade);
  const normalizedStatus = statusOptions.includes(nextStatus) ? nextStatus : (statusOptions[0] || 'DFD');

  const updated = {
    ...current,
    processoNumero: String(document.getElementById('editDemandProcessoNumero')?.value || '').trim() || current.processoNumero,
    secretaria: String(document.getElementById('editDemandSecretaria')?.value || '').trim() || '-',
    objeto: String(document.getElementById('editDemandObjeto')?.value || '').trim() || '-',
    setorResponsavel: nextSetorResponsavel,
    responsavel: nextResponsavel,
    status: normalizedStatus,
    modalidade: nextModalidade,
    numeroOrdem: generatedNumeroOrdem,
    prioridade: String(document.getElementById('editDemandPrioridade')?.value || '').trim() || 'Sem prioridade',
    valorEstimado: String(document.getElementById('editDemandValorEstimado')?.value || '').trim(),
    valorContratado: String(document.getElementById('editDemandValorContratado')?.value || '').trim(),
    createdAtIso: createdAtDate.toISOString(),
    createdAt: createdAtDate.toLocaleDateString('pt-BR')
  };

  if ((current.status || 'DFD') !== normalizedStatus) {
    updated.statusUpdatedAt = new Date().toISOString();
  }

  if (responsavelChanged) {
    updated.responsavelDesignadoAt = new Date().toISOString();
  }

  if (responsavelNomeChanged && nextResponsavel !== '-') {
    pushDemandMentionAlert(updated, nextResponsavel);
  }

  list[index] = updated;
  state.licitacoesDemandas = list;
  persistState();
  closeLicitacaoDetailsModal();

  if (activeModuleKey === 'licitacoes') {
    renderModuleContent('licitacoes');
  }
}

function bindPriorityTagPicker() {
  const trigger = document.getElementById('priorityTagButton');
  const menu = document.getElementById('priorityTagMenu');
  const input = document.getElementById('editDemandPrioridade');
  if (!trigger || !menu || !input) {
    return;
  }

  trigger.addEventListener('click', (event) => {
    event.stopPropagation();
    menu.hidden = !menu.hidden;
  });

  menu.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  menu.querySelectorAll('[data-priority-value]').forEach((button) => {
    button.addEventListener('click', () => {
      const value = String(button.getAttribute('data-priority-value') || '').trim();
      if (!value) {
        return;
      }
      input.value = value;
      trigger.textContent = value;
      trigger.className = `priority-tag priority-tag-button ${getPrioridadeClass(value)}`;
      menu.hidden = true;
    });
  });

  window.requestAnimationFrame(() => {
    document.addEventListener('click', () => {
      menu.hidden = true;
    }, { once: true });
  });
}

function bindResponsavelBySetorPicker() {
  const setorSelect = document.getElementById('editDemandSetorResponsavel');
  const responsavelSelect = document.getElementById('editDemandResponsavel');
  if (!setorSelect || !responsavelSelect) {
    return;
  }

  const rebuildResponsavelOptions = () => {
    const setor = String(setorSelect.value || '').trim();
    const currentResponsavel = String(responsavelSelect.value || '').trim();
    const usersBySetor = getUsuariosVinculadosAoSetor(setor);
    const users = usersBySetor.length ? usersBySetor : getAllUsers();

    responsavelSelect.innerHTML = users.length
      ? users.map((user) => `<option value="${escapeHtml(user.nome)}">${escapeHtml(user.nome)}</option>`).join('')
      : '<option value="-">Nenhum usuário vinculado ao setor</option>';

    if (users.some((user) => user.nome === currentResponsavel)) {
      responsavelSelect.value = currentResponsavel;
    } else if (users.length) {
      responsavelSelect.value = users[0].nome;
    } else {
      responsavelSelect.value = '-';
    }
  };

  setorSelect.addEventListener('change', rebuildResponsavelOptions);
}

function bindStatusAndOrderByModalidadePicker(demandId) {
  const modalidadeSelect = document.getElementById('editDemandModalidade');
  const statusSelect = document.getElementById('editDemandStatus');
  const numeroOrdemInput = document.getElementById('editDemandNumeroOrdem');
  if (!modalidadeSelect || !statusSelect || !numeroOrdemInput) {
    return;
  }

  const update = () => {
    const modalidade = String(modalidadeSelect.value || '').trim();
    const currentStatus = String(statusSelect.value || '').trim();
    const options = getStatusOptionsForModalidade(modalidade);
    statusSelect.innerHTML = options.map((status) => `<option value="${escapeHtml(status)}">${escapeHtml(status)}</option>`).join('');
    statusSelect.value = options.includes(currentStatus) ? currentStatus : (options[0] || 'DFD');
    numeroOrdemInput.value = getNextNumeroOrdemByModalidade(modalidade, demandId);
  };

  modalidadeSelect.addEventListener('change', update);
}

function openLicitacaoDetailsModal(demand) {
  const modal = document.getElementById('licitacaoDetailsModal');
  const body = document.getElementById('licitacaoDetailsBody');
  if (!modal || !body || !demand) {
    return;
  }

  const createdDate = getDemandCreationDate(demand);
  const openedElapsed = formatElapsedFromIso(createdDate.toISOString());
  const createdAtText = demand.createdAt || createdDate.toLocaleDateString('pt-BR');
  const prioridade = demand.prioridade || 'Média';
  const prioridadeClass = getPrioridadeClass(prioridade);
  const isAdmin = currentUser?.perfil === 'administrador';
  const createdAtInputValue = toDateInputValue(createdDate);
  const readonlyAttr = isAdmin ? '' : 'disabled';
  const setorResponsavel = demand.setorResponsavel || demand.setorDestino || defaultSetoresDestino[0] || '-';
  const usuariosBySetor = getUsuariosVinculadosAoSetor(setorResponsavel);
  const responsavelOptions = usuariosBySetor.length ? usuariosBySetor : getAllUsers();
  if (demand.responsavel && !responsavelOptions.some((user) => user.nome === demand.responsavel)) {
    responsavelOptions.unshift({ id: 'current-demand-responsavel', nome: demand.responsavel });
  }
  const responsavelDesignadoElapsed = formatElapsedFromIso(demand.responsavelDesignadoAt || demand.createdAtIso);
  const prioridadeOptions = ['Urgente', 'Alta', 'Média', 'Baixa', 'Sem prioridade'];
  const modalidades = normalizeModalidades(state.modalidades);
  const modalidadeAtual = demand.modalidade && demand.modalidade !== '-' ? demand.modalidade : (modalidades[0] || defaultModalidades[0]);
  const statusOptionsByModalidade = getStatusOptionsForModalidade(modalidadeAtual);
  const statusAtual = statusOptionsByModalidade.includes(demand.status) ? demand.status : (statusOptionsByModalidade[0] || 'DFD');
  const numeroOrdemAtual = String(demand.numeroOrdem || '').trim() && String(demand.numeroOrdem || '').trim() !== '-'
    ? String(demand.numeroOrdem || '').trim()
    : getNextNumeroOrdemByModalidade(modalidadeAtual, demand.id);
  const availableSetores = getAllSetoresFromStructureData(getMunicipalStructure());
  const setorOptions = availableSetores.length ? availableSetores : normalizeSetoresDestino(state.setoresDestino);

  body.innerHTML = `
    <div class="licitacao-details-head">
      <div>
        <p class="eyebrow">Detalhes do processo</p>
        <h2>${escapeHtml(demand.processoNumero)}</h2>
      </div>
      <div class="priority-picker">
        ${isAdmin ? `
          <input id="editDemandPrioridade" type="hidden" value="${escapeHtml(prioridade)}" />
          <button id="priorityTagButton" class="priority-tag priority-tag-button ${prioridadeClass}" type="button">${escapeHtml(prioridade)}</button>
          <div id="priorityTagMenu" class="priority-menu" hidden>
            ${prioridadeOptions.map((item) => `<button type="button" data-priority-value="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join('')}
          </div>
        ` : `<span class="priority-tag ${prioridadeClass}">${escapeHtml(prioridade)}</span>`}
      </div>
    </div>

    <div class="licitacao-details-grid">
      <div class="detail-cell"><span>Processo n°</span><input id="editDemandProcessoNumero" type="text" value="${escapeHtml(demand.processoNumero || '-')}" ${readonlyAttr} /></div>
      <div class="detail-cell"><span>Secretaria</span><input id="editDemandSecretaria" type="text" value="${escapeHtml(demand.secretaria || '-')}" ${readonlyAttr} /></div>
      <div class="detail-cell detail-cell-full"><span>Objeto</span><textarea id="editDemandObjeto" rows="3" ${readonlyAttr}>${escapeHtml(demand.objeto || '-')}</textarea></div>
      <div class="detail-cell"><span>Responsável <small class="inline-muted">• designado há ${escapeHtml(responsavelDesignadoElapsed)}</small></span>
        <select id="editDemandResponsavel" ${readonlyAttr}>
          ${responsavelOptions.length
            ? responsavelOptions.map((user) => `<option value="${escapeHtml(user.nome)}" ${String(demand.responsavel || '') === String(user.nome) ? 'selected' : ''}>${escapeHtml(user.nome)}</option>`).join('')
            : '<option value="-">Nenhum usuário vinculado ao setor</option>'}
        </select>
      </div>
      <div class="detail-cell"><span>Setor responsável</span>
        <select id="editDemandSetorResponsavel" ${readonlyAttr}>
          ${setorOptions.map((setor) => `<option value="${escapeHtml(setor)}" ${setor === setorResponsavel ? 'selected' : ''}>${escapeHtml(setor)}</option>`).join('')}
        </select>
      </div>
      <div class="detail-cell detail-cell-full"><span>Status</span>
        <select id="editDemandStatus" ${readonlyAttr}>
          ${statusOptionsByModalidade.map((status) => `<option value="${escapeHtml(status)}" ${status === statusAtual ? 'selected' : ''}>${escapeHtml(status)}</option>`).join('')}
        </select>
      </div>
      <div class="detail-cell"><span>Modalidade</span>
        <select id="editDemandModalidade" ${readonlyAttr}>
          ${modalidades.map((modalidade) => `<option value="${escapeHtml(modalidade)}" ${modalidade === modalidadeAtual ? 'selected' : ''}>${escapeHtml(modalidade)}</option>`).join('')}
        </select>
      </div>
      <div class="detail-cell"><span>N° de ordem</span><input id="editDemandNumeroOrdem" type="text" value="${escapeHtml(numeroOrdemAtual)}" disabled /></div>
      <div class="detail-cell"><span>Valor estimado</span><input id="editDemandValorEstimado" type="text" value="${escapeHtml(demand.valorEstimado || '')}" placeholder="R$ 0,00" ${readonlyAttr} /></div>
      <div class="detail-cell"><span>Valor contratado</span><input id="editDemandValorContratado" type="text" value="${escapeHtml(demand.valorContratado || '')}" placeholder="R$ 0,00" ${readonlyAttr} /></div>
      <div class="detail-cell"><span>Data de criação</span><input id="editDemandCreatedAt" type="date" value="${escapeHtml(createdAtInputValue)}" ${readonlyAttr} /></div>
    </div>

    <div class="licitacao-details-foot">
      <p><strong>Criado em:</strong> ${escapeHtml(createdAtText)}</p>
      <p><strong>Aberto há:</strong> ${escapeHtml(openedElapsed)}</p>
    </div>
    ${isAdmin ? '<div class="licitacao-details-actions"><button id="saveDemandChangesBtn" type="button">Salvar alterações</button></div>' : ''}
  `;

  if (isAdmin) {
    bindPriorityTagPicker();
    bindResponsavelBySetorPicker();
    bindStatusAndOrderByModalidadePicker(demand.id);
    const saveBtn = document.getElementById('saveDemandChangesBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => saveLicitacaoDemandFromModal(demand.id));
    }
  }

  modal.classList.add('active');
}

function calculateDv(input) {
  let sum = 0;
  const weights = [3, 7, 1, 9];
  for (let i = 0; i < input.length; i += 1) {
    sum += input.charCodeAt(i) * weights[i % weights.length];
  }
  return String(sum % 97).padStart(2, '0');
}

function buildNupNumber() {
  const year = new Date().getFullYear();
  const sequencial = Number.isInteger(state.protocoloSequencial) && state.protocoloSequencial > 0 ? state.protocoloSequencial : 1;
  const sequencialPadded = String(sequencial).padStart(6, '0');
  const unidade = 'PROAD';
  const dv = calculateDv(`${year}${sequencialPadded}${unidade}`);

  return {
    numero: `${year}.${sequencialPadded}/${dv}`,
    year,
    sequencial,
    dv,
    unidade
  };
}

function submitProtocolForm(event) {
  event.preventDefault();

  const municipio = document.getElementById('protocolMunicipio')?.value?.trim() || '';
  const orgao = document.getElementById('protocolOrgao')?.value?.trim() || '';
  const objeto = document.getElementById('protocolObjeto')?.value?.trim() || '';
  const setorDestino = document.getElementById('protocolSetor')?.value?.trim() || '';
  const documentoInput = document.getElementById('protocolDocumento');
  const documento = documentoInput?.files?.[0] || null;

  if (!municipio || !orgao || !objeto || !setorDestino) {
    window.alert('Preencha município, órgão/entidade, objeto e setor de destino.');
    return;
  }

  const nup = buildNupNumber();
  const usuariosSetor = getUsuariosVinculadosAoSetor(setorDestino);
  const responsavelDefault = usuariosSetor[0]?.nome || '-';
  const modalidades = normalizeModalidades(state.modalidades);
  const modalidadeInicial = modalidades[0] || defaultModalidades[0];
  const numeroOrdemInicial = getNextNumeroOrdemByModalidade(modalidadeInicial);
  const statusInicial = getStatusOptionsForModalidade(modalidadeInicial)[0] || 'DFD';
  const demand = {
    id: crypto.randomUUID(),
    processoNumero: nup.numero,
    municipio,
    secretaria: orgao,
    objeto,
    documentoInicialNome: documento?.name || '-',
    setorDestino,
    setorResponsavel: setorDestino,
    responsavel: responsavelDefault,
    responsavelDesignadoAt: new Date().toISOString(),
    status: statusInicial,
    statusUpdatedAt: new Date().toISOString(),
    modalidade: modalidadeInicial,
    numeroOrdem: numeroOrdemInicial,
    prioridade: 'Média',
    valorEstimado: '',
    valorContratado: '',
    protocolante: currentUser?.nome || '-',
    year: nup.year,
    sequencial: nup.sequencial,
    digitoVerificador: nup.dv,
    unidade: nup.unidade,
    createdAt: new Date().toLocaleDateString('pt-BR'),
    createdAtIso: new Date().toISOString()
  };

  state.licitacoesDemandas = Array.isArray(state.licitacoesDemandas) ? state.licitacoesDemandas : [];
  state.licitacoesDemandas.unshift(demand);
  state.protocoloSequencial = nup.sequencial + 1;

  persistState();
  closeProtocolModal();
  openProtocolSummaryModal(demand);

  if (activeModuleKey === 'licitacoes') {
    renderModuleContent('licitacoes');
  }
}

function openProtocolSummaryModal(demand) {
  const modal = document.getElementById('protocolSummaryModal');
  const body = document.getElementById('protocolSummaryBody');
  if (!modal || !body) {
    return;
  }

  body.innerHTML = `
    <div class="summary-number-line">${escapeHtml(demand.processoNumero)}</div>
    <div class="summary-grid">
      <p><strong>Município:</strong> ${escapeHtml(demand.municipio)}</p>
      <p><strong>Órgão / Entidade:</strong> ${escapeHtml(demand.secretaria)}</p>
      <p><strong>Objeto:</strong> ${escapeHtml(demand.objeto)}</p>
      <p><strong>Documento inicial:</strong> ${escapeHtml(demand.documentoInicialNome || '-')}</p>
      <p><strong>Setor de destino:</strong> ${escapeHtml(demand.setorDestino)}</p>
      <p><strong>Responsável:</strong> ${escapeHtml(demand.responsavel)}</p>
      <p><strong>Protocolante:</strong> ${escapeHtml(demand.protocolante)}</p>
      <p><strong>Data:</strong> ${escapeHtml(demand.createdAt)}</p>
    </div>
  `;

  modal.classList.add('active');
}

function addSetorDestino() {
  if (currentUser?.perfil !== 'administrador') {
    window.alert('Somente administradores podem alterar setores.');
    return;
  }

  const input = document.getElementById('newSetorInput');
  const value = String(input?.value || '').trim();
  if (!value) {
    return;
  }

  const setores = normalizeSetoresDestino(state.setoresDestino);
  if (setores.some((setor) => setor.toLowerCase() === value.toLowerCase())) {
    window.alert('Esse setor já existe.');
    return;
  }

  setores.push(value);
  state.setoresDestino = setores;
  persistState();

  if (input) {
    input.value = '';
  }
  renderModuleContent('licitacoes');
}

function removeSetorDestino() {
  if (currentUser?.perfil !== 'administrador') {
    window.alert('Somente administradores podem alterar setores.');
    return;
  }

  const select = document.getElementById('removeSetorSelect');
  const value = String(select?.value || '').trim();
  if (!value) {
    return;
  }

  const setores = normalizeSetoresDestino(state.setoresDestino);
  state.setoresDestino = setores.filter((setor) => setor !== value);
  if (!state.setoresDestino.length) {
    state.setoresDestino = [...defaultSetoresDestino];
  }
  persistState();
  renderModuleContent('licitacoes');
}

function applyLicitacoesColumnWidths(table, widths) {
  const normalized = normalizeLicitacoesColumnWidths(widths);
  const colgroup = table.querySelector('colgroup');
  if (!colgroup) {
    return;
  }

  licitacoesColumnOrder.forEach((key) => {
    const col = colgroup.querySelector(`col[data-col-key="${key}"]`);
    if (!col) {
      return;
    }

    const width = normalized[key];
    if (width === 'auto') {
      col.style.removeProperty('width');
    } else {
      col.style.width = width;
    }
  });
}

function initializeLicitacoesColumnWidthsForResize(table) {
  const next = { ...normalizeLicitacoesColumnWidths(state.licitacoesColumnWidths) };
  licitacoesColumnOrder.forEach((key) => {
    const col = table.querySelector(`col[data-col-key="${key}"]`);
    if (!col) {
      return;
    }
    const measured = Math.max(90, Math.round(col.getBoundingClientRect().width));
    next[key] = `${measured}px`;
  });

  state.licitacoesColumnWidths = next;
  persistState();
  applyLicitacoesColumnWidths(table, next);
}

function setupLicitacoesColumnResize(container) {
  const table = container.querySelector('.licitacoes-table');
  if (!table) {
    return;
  }

  const isAdmin = currentUser?.perfil === 'administrador';
  if (!isAdmin) {
    return;
  }

  container.querySelectorAll('.col-resize-handle').forEach((handle) => {
    handle.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      event.stopPropagation();

      const key = handle.getAttribute('data-col-key');
      if (!key || !licitacoesColumnOrder.includes(key)) {
        return;
      }

      initializeLicitacoesColumnWidthsForResize(table);
      const widths = { ...normalizeLicitacoesColumnWidths(state.licitacoesColumnWidths) };
      const startX = event.clientX;
      const currentPx = parseFloat(String(widths[key]).replace('px', ''));
      const startWidth = Number.isFinite(currentPx) ? currentPx : (key === 'processoNumero' ? 140 : 120);
      const minWidth = key === 'processoNumero' ? 120 : 100;

      document.body.classList.add('col-resize-active');

      const onMove = (moveEvent) => {
        const deltaX = moveEvent.clientX - startX;
        const nextWidth = Math.max(minWidth, Math.round(startWidth + deltaX));
        widths[key] = `${nextWidth}px`;
        applyLicitacoesColumnWidths(table, widths);
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        document.body.classList.remove('col-resize-active');

        state.licitacoesColumnWidths = widths;
        persistState();
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
  });
}

function getSelectedProcess() {
  return state.processes.find((process) => process.id === selectedProcessId) || state.processes[0];
}

function render() {
  if (!Array.isArray(state.processes) || !state.processes.length) {
    state.processes = [buildProcess('administrativa', 'Processo 001')];
    selectedProcessId = state.processes[0].id;
    persistState();
  }

  renderSidebarNavigation();

  let process = getSelectedProcess();
  if (!process) {
    state.processes = [buildProcess('administrativa', 'Processo 001')];
    selectedProcessId = state.processes[0].id;
    persistState();
    process = getSelectedProcess();
    if (!process) {
      return;
    }
  }

  renderModuleContent(activeModuleKey);
  renderProcessList(process);
  renderTimeline(process);
  renderDocumentTree(process);
  renderDocumentDetails(process);
  updateHeader(process);
  renderTopbarMessages();
  persistState();
}

function getVinculoStatusLabel(vinculo) {
  const today = new Date();
  const termino = parseDate(vinculo.dataTermino);
  if (!termino) {
    return vinculo.status || 'Indefinido';
  }

  const diffDays = Math.ceil((termino - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) {
    return 'Encerrado';
  }
  if (diffDays <= 45) {
    return 'Vencendo';
  }
  return 'Vigente';
}

function getVinculoStatusClass(vinculo) {
  const label = getVinculoStatusLabel(vinculo);
  if (label === 'Encerrado') {
    return 'status-encerrado';
  }
  if (label === 'Vencendo') {
    return 'status-vencendo';
  }
  return 'status-vigente';
}

function parseDate(dateString) {
  if (!dateString) {
    return null;
  }

  const [day, month, year] = dateString.split('/').map((value) => Number(value));
  if (!day || !month || !year) {
    return null;
  }
  return new Date(year, month - 1, day);
}

function normalizeSupplierVinculoType(input) {
  const normalized = String(input || '').trim().toLowerCase();
  if (['contrato', 'contratos'].includes(normalized)) {
    return 'Contrato';
  }
  if (['arp', 'ata', 'registro de preços', 'registro de precos', 'atas'].includes(normalized)) {
    return 'ARP';
  }
  if (['aditivo', 'aditivos'].includes(normalized)) {
    return 'Aditivo';
  }
  if (['apostilamento', 'apostilamentos'].includes(normalized)) {
    return 'Apostilamento';
  }
  return null;
}

function createSupplierVinculo(supplier) {
  const tipo = normalizeSupplierVinculoType(window.prompt('Tipo de vínculo: Contrato, ARP, Aditivo ou Apostilamento'));
  if (!tipo) {
    window.alert('Informe um tipo válido: Contrato, ARP, Aditivo ou Apostilamento.');
    return;
  }

  const numero = window.prompt(`Número do ${tipo}:`);
  if (numero === null) {
    return;
  }

  const objeto = window.prompt(`Objeto / descrição do ${tipo}:`);
  if (objeto === null) {
    return;
  }

  const dataInicio = window.prompt('Data de início (dd/mm/aaaa):', new Date().toLocaleDateString('pt-BR'));
  if (dataInicio === null) {
    return;
  }

  const dataTermino = window.prompt('Data de término (dd/mm/aaaa):', '');
  if (dataTermino === null) {
    return;
  }

  const fundo = window.prompt('Fundo responsável:', supplier.fundo || 'Fundo da Educação');
  if (fundo === null) {
    return;
  }

  let parentId = null;
  if (tipo === 'Aditivo' || tipo === 'Apostilamento') {
    const baseLinks = (supplier.vinculos || []).filter((vinculo) => vinculo.tipo === 'Contrato' || vinculo.tipo === 'ARP');
    if (baseLinks.length) {
      const parentChoice = window.prompt(
        `Vínculo principal opcional:\n${baseLinks.map((vinculo) => `${vinculo.tipo} ${vinculo.numero}`).join('\n')}\n\nDigite o número do contrato/ARP ou deixe em branco para avulso:`,
        ''
      );
      if (parentChoice === null) {
        return;
      }

      const normalizedParent = parentChoice.trim();
      if (normalizedParent) {
        const matchedParent = baseLinks.find((vinculo) => String(vinculo.numero).toLowerCase() === normalizedParent.toLowerCase());
        parentId = matchedParent ? matchedParent.numero : normalizedParent;
      }
    }
  }

  supplier.vinculos = [
    ...(supplier.vinculos || []),
    {
      tipo,
      numero: numero.trim(),
      status: 'Vigente',
      objeto: objeto.trim(),
      fundo: fundo.trim() || supplier.fundo || '-',
      dataInicio: dataInicio.trim(),
      dataTermino: dataTermino.trim(),
      parentId
    }
  ];

  renderModuleContent('fornecedores');
}

function deleteSupplierById(supplierId) {
  const supplierIndex = fornecedoresData.findIndex((fornecedor) => fornecedor.id === supplierId);
  if (supplierIndex === -1) {
    return;
  }

  const supplier = fornecedoresData[supplierIndex];
  if (!window.confirm(`Excluir o fornecedor ${supplier.nome}?`)) {
    return;
  }

  fornecedoresData.splice(supplierIndex, 1);

  if (!fornecedoresData.length) {
    selectedSupplierId = null;
  } else if (selectedSupplierId === supplierId) {
    const nextSupplier = fornecedoresData[Math.min(supplierIndex, fornecedoresData.length - 1)];
    selectedSupplierId = nextSupplier?.id || fornecedoresData[0].id;
  }

  renderModuleContent('fornecedores');
}

function deleteLicitacaoDemandById(demandId) {
  if (currentUser?.perfil !== 'administrador') {
    return;
  }

  const demandas = Array.isArray(state.licitacoesDemandas) ? state.licitacoesDemandas : [];
  const demand = demandas.find((item) => item.id === demandId);
  if (!demand) {
    return;
  }

  if (!window.confirm(`Excluir o processo ${demand.processoNumero}?`)) {
    return;
  }

  state.licitacoesDemandas = demandas.filter((item) => item.id !== demandId);
  persistState();
  renderModuleContent('licitacoes');
}

function buildEstruturaSecretariaKey(municipioNome, secretariaNome) {
  return `${municipioNome}::${secretariaNome}`;
}

function renderEstruturaMunicipalModule(container) {
  const isAdmin = currentUser?.perfil === 'administrador';
  const municipalStructure = getMunicipalStructure();

  if (!municipalStructure.length) {
    container.innerHTML = `
      <section class="panel estrutura-panel">
        <div class="hero-panel estrutura-hero">
          <div>
            <p class="eyebrow">Estrutura municipal</p>
            <h2>Cadastro de municípios</h2>
            <p class="subtitle">Nenhum município cadastrado no momento.</p>
          </div>
        </div>
      </section>
    `;
    return;
  }

  if (!estruturaSelectedMunicipio || !municipalStructure.some((municipio) => municipio.nome === estruturaSelectedMunicipio)) {
    estruturaSelectedMunicipio = municipalStructure[0].nome;
  }

  const selectedMunicipio = municipalStructure.find((municipio) => municipio.nome === estruturaSelectedMunicipio) || municipalStructure[0];
  const secretarias = selectedMunicipio?.secretarias || [];

  if (!estruturaSelectedSecretaria || !secretarias.some((secretaria) => secretaria.nome === estruturaSelectedSecretaria)) {
    estruturaSelectedSecretaria = secretarias[0]?.nome || '';
  }

  const selectedSecretaria = secretarias.find((secretaria) => secretaria.nome === estruturaSelectedSecretaria) || null;
  const selectedSetores = selectedSecretaria?.setores || [];

  const addMunicipio = (rawName) => {
    const value = String(rawName || '').trim();
    if (!value) {
      return;
    }

    const exists = municipalStructure.some((municipio) => municipio.nome.toLowerCase() === value.toLowerCase());
    if (exists) {
      window.alert('Esse município já está cadastrado.');
      return;
    }

    updateMunicipalStructureState([
      ...municipalStructure,
      { nome: value, secretarias: [] }
    ]);

    estruturaSelectedMunicipio = value;
    estruturaSelectedSecretaria = '';
    renderModuleContent('estrutura-municipal');
  };

  const renameMunicipio = (nextNameRaw) => {
    const currentName = selectedMunicipio?.nome;
    if (!currentName) {
      return;
    }

    const normalizedName = String(nextNameRaw || '').trim();
    if (!normalizedName || normalizedName === currentName) {
      return;
    }

    const exists = municipalStructure.some((municipio) => municipio.nome.toLowerCase() === normalizedName.toLowerCase() && municipio.nome !== currentName);
    if (exists) {
      window.alert('Já existe um município com esse nome.');
      return;
    }

    const nextStructure = municipalStructure.map((municipio) => (
      municipio.nome === currentName
        ? { ...municipio, nome: normalizedName }
        : municipio
    ));

    updateMunicipalStructureState(nextStructure);

    const migratedSecretarias = Array.from(estruturaExpandedSecretarias);
    estruturaExpandedSecretarias.clear();
    migratedSecretarias.forEach((key) => {
      const [municipioNome, secretariaNome] = key.split('::');
      estruturaExpandedSecretarias.add(
        municipioNome === currentName
          ? buildEstruturaSecretariaKey(normalizedName, secretariaNome)
          : key
      );
    });

    estruturaSelectedMunicipio = normalizedName;
    renderModuleContent('estrutura-municipal');
  };

  const removeMunicipio = () => {
    if (!selectedMunicipio?.nome) {
      return;
    }

    if (!window.confirm(`Excluir o município ${selectedMunicipio.nome} e toda sua estrutura?`)) {
      return;
    }

    const nextStructure = municipalStructure.filter((municipio) => municipio.nome !== selectedMunicipio.nome);
    if (!nextStructure.length) {
      window.alert('É necessário manter ao menos um município cadastrado.');
      return;
    }

    updateMunicipalStructureState(nextStructure);
    Array.from(estruturaExpandedSecretarias).forEach((key) => {
      if (key.startsWith(`${selectedMunicipio.nome}::`)) {
        estruturaExpandedSecretarias.delete(key);
      }
    });

    estruturaSelectedMunicipio = nextStructure[0].nome;
    estruturaSelectedSecretaria = '';
    renderModuleContent('estrutura-municipal');
  };

  const addSecretaria = (rawName) => {
    if (!selectedMunicipio?.nome) {
      return;
    }

    const value = String(rawName || '').trim();
    if (!value) {
      return;
    }

    const exists = selectedMunicipio.secretarias.some((secretaria) => secretaria.nome.toLowerCase() === value.toLowerCase());
    if (exists) {
      window.alert('Essa secretaria já está cadastrada neste município.');
      return;
    }

    const nextStructure = municipalStructure.map((municipio) => {
      if (municipio.nome !== selectedMunicipio.nome) {
        return municipio;
      }
      return {
        ...municipio,
        secretarias: [...(municipio.secretarias || []), { nome: value, setores: [] }]
      };
    });

    updateMunicipalStructureState(nextStructure);
    estruturaSelectedSecretaria = value;
    renderModuleContent('estrutura-municipal');
  };

  const renameSecretaria = (nextNameRaw) => {
    if (!selectedMunicipio?.nome || !selectedSecretaria?.nome) {
      return;
    }

    const normalizedName = String(nextNameRaw || '').trim();
    if (!normalizedName || normalizedName === selectedSecretaria.nome) {
      return;
    }

    const exists = selectedMunicipio.secretarias.some((secretaria) => secretaria.nome.toLowerCase() === normalizedName.toLowerCase() && secretaria.nome !== selectedSecretaria.nome);
    if (exists) {
      window.alert('Já existe uma secretaria com esse nome neste município.');
      return;
    }

    const nextStructure = municipalStructure.map((municipio) => {
      if (municipio.nome !== selectedMunicipio.nome) {
        return municipio;
      }
      return {
        ...municipio,
        secretarias: (municipio.secretarias || []).map((secretaria) => (
          secretaria.nome === selectedSecretaria.nome
            ? { ...secretaria, nome: normalizedName }
            : secretaria
        ))
      };
    });

    updateMunicipalStructureState(nextStructure);
    const oldKey = buildEstruturaSecretariaKey(selectedMunicipio.nome, selectedSecretaria.nome);
    const newKey = buildEstruturaSecretariaKey(selectedMunicipio.nome, normalizedName);
    if (estruturaExpandedSecretarias.has(oldKey)) {
      estruturaExpandedSecretarias.delete(oldKey);
      estruturaExpandedSecretarias.add(newKey);
    }

    estruturaSelectedSecretaria = normalizedName;
    renderModuleContent('estrutura-municipal');
  };

  const removeSecretaria = () => {
    if (!selectedMunicipio?.nome || !selectedSecretaria?.nome) {
      return;
    }

    if (!window.confirm(`Excluir a secretaria ${selectedSecretaria.nome} de ${selectedMunicipio.nome}?`)) {
      return;
    }

    const nextStructure = municipalStructure.map((municipio) => {
      if (municipio.nome !== selectedMunicipio.nome) {
        return municipio;
      }
      return {
        ...municipio,
        secretarias: (municipio.secretarias || []).filter((secretaria) => secretaria.nome !== selectedSecretaria.nome)
      };
    });

    updateMunicipalStructureState(nextStructure);
    estruturaExpandedSecretarias.delete(buildEstruturaSecretariaKey(selectedMunicipio.nome, selectedSecretaria.nome));
    estruturaSelectedSecretaria = '';
    renderModuleContent('estrutura-municipal');
  };

  const addSetor = (rawName) => {
    if (!selectedMunicipio?.nome || !selectedSecretaria?.nome) {
      return;
    }

    const value = String(rawName || '').trim();
    if (!value) {
      return;
    }

    const exists = (selectedSecretaria.setores || []).some((setor) => setor.toLowerCase() === value.toLowerCase());
    if (exists) {
      window.alert('Esse setor já está cadastrado nesta secretaria.');
      return;
    }

    const nextStructure = municipalStructure.map((municipio) => {
      if (municipio.nome !== selectedMunicipio.nome) {
        return municipio;
      }
      return {
        ...municipio,
        secretarias: (municipio.secretarias || []).map((secretaria) => (
          secretaria.nome === selectedSecretaria.nome
            ? { ...secretaria, setores: [...(secretaria.setores || []), value] }
            : secretaria
        ))
      };
    });

    updateMunicipalStructureState(nextStructure);
    renderModuleContent('estrutura-municipal');
  };

  const renameSetor = (currentSetor, nextValueRaw) => {
    if (!selectedMunicipio?.nome || !selectedSecretaria?.nome) {
      return;
    }

    const normalizedValue = String(nextValueRaw || '').trim();
    if (!normalizedValue || normalizedValue === currentSetor) {
      return;
    }

    const exists = (selectedSecretaria.setores || []).some((setor) => setor.toLowerCase() === normalizedValue.toLowerCase() && setor !== currentSetor);
    if (exists) {
      window.alert('Já existe um setor com esse nome nesta secretaria.');
      return;
    }

    const nextStructure = municipalStructure.map((municipio) => {
      if (municipio.nome !== selectedMunicipio.nome) {
        return municipio;
      }
      return {
        ...municipio,
        secretarias: (municipio.secretarias || []).map((secretaria) => (
          secretaria.nome === selectedSecretaria.nome
            ? {
                ...secretaria,
                setores: (secretaria.setores || []).map((setor) => (setor === currentSetor ? normalizedValue : setor))
              }
            : secretaria
        ))
      };
    });

    updateMunicipalStructureState(nextStructure);
    renderModuleContent('estrutura-municipal');
  };

  const removeSetor = (setorName) => {
    if (!selectedMunicipio?.nome || !selectedSecretaria?.nome) {
      return;
    }

    if (!window.confirm(`Excluir o setor ${setorName}?`)) {
      return;
    }

    const nextStructure = municipalStructure.map((municipio) => {
      if (municipio.nome !== selectedMunicipio.nome) {
        return municipio;
      }
      return {
        ...municipio,
        secretarias: (municipio.secretarias || []).map((secretaria) => (
          secretaria.nome === selectedSecretaria.nome
            ? {
                ...secretaria,
                setores: (secretaria.setores || []).filter((setor) => setor !== setorName)
              }
            : secretaria
        ))
      };
    });

    updateMunicipalStructureState(nextStructure);
    renderModuleContent('estrutura-municipal');
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const secretariasCount = Math.max(1, secretarias.length);
  const allSetores = secretarias.flatMap((secretaria) => (
    (Array.isArray(secretaria.setores) ? secretaria.setores : []).map((setor) => ({
      secretariaNome: secretaria.nome,
      setor: String(setor || '').trim()
    }))
  )).filter((item) => item.setor);
  const setoresCountAll = Math.max(1, allSetores.length);

  const secretariaNodeWidth = secretariasCount > 12 ? 130 : 170;
  const setorNodeWidth = setoresCountAll > 20 ? 108 : 128;
  const minGapSecretaria = 18;
  const minGapSetor = 12;

  // Usa comprimento de circunferência para espaçamento uniforme dos nós no anel.
  const secretariaRingRadius = Math.max(220, (secretariasCount * (secretariaNodeWidth + minGapSecretaria)) / (2 * Math.PI));
  const setorRingRadius = Math.max(secretariaRingRadius + 145, (setoresCountAll * (setorNodeWidth + minGapSetor)) / (2 * Math.PI));
  const stageRadius = clamp(Math.max(setorRingRadius + 130, 420), 420, 650);
  const stageSize = Math.round(stageRadius * 2);
  const center = stageSize / 2;

  const toRadians = (angleDeg) => angleDeg * (Math.PI / 180);
  const toPoint = (angleDeg, radius) => {
    const rad = toRadians(angleDeg);
    return {
      x: center + Math.cos(rad) * radius,
      y: center + Math.sin(rad) * radius
    };
  };

  const coreRadius = 62;
  const secretariaNodeRadius = 60;
  const setorNodeRadius = 47;

  const secretariasWithPosition = secretarias.map((secretaria, index) => {
    const angle = ((360 / secretariasCount) * index) - 90;
    const point = toPoint(angle, secretariaRingRadius);
    return {
      ...secretaria,
      angle,
      x: point.x,
      y: point.y
    };
  });

  const secretariasByName = new Map(secretariasWithPosition.map((secretaria) => [secretaria.nome, secretaria]));

  const gapBySecretaria = 360 / secretariasCount;
  const setorGroups = secretariasWithPosition.map((secretaria) => {
    const secretariaSetores = allSetores.filter((item) => item.secretariaNome === secretaria.nome);
    const count = secretariaSetores.length;
    if (!count) {
      return {
        secretaria,
        items: []
      };
    }

    const maxSpan = Math.max(14, gapBySecretaria * 0.84);
    const step = count > 1 ? Math.min(13, maxSpan / Math.max(1, count - 1)) : 0;
    const start = secretaria.angle - ((count - 1) * step / 2);

    const items = secretariaSetores.map((setorItem, index) => {
      const angle = start + (index * step);
      const point = toPoint(angle, setorRingRadius);
      return {
        ...setorItem,
        angle,
        x: point.x,
        y: point.y,
        parent: secretariasByName.get(setorItem.secretariaNome) || null
      };
    });

    return {
      secretaria,
      items
    };
  });

  const setoresWithPosition = setorGroups.flatMap((group) => group.items);

  const getEdgePoint = (from, to, radius) => {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt((dx * dx) + (dy * dy)) || 1;
    return {
      x: from.x + ((dx / distance) * radius),
      y: from.y + ((dy / distance) * radius)
    };
  };

  const secretariaLinks = secretariasWithPosition.map((secretaria) => {
    const corePoint = { x: center, y: center };
    const start = getEdgePoint(corePoint, secretaria, coreRadius);
    const end = getEdgePoint(secretaria, corePoint, secretariaNodeRadius);
    return { start, end, key: `${secretaria.nome}-core` };
  });

  const quadraticPoint = (start, control, end, t) => {
    const mt = 1 - t;
    return {
      x: (mt * mt * start.x) + (2 * mt * t * control.x) + (t * t * end.x),
      y: (mt * mt * start.y) + (2 * mt * t * control.y) + (t * t * end.y)
    };
  };

  const setorBranches = [];
  const setorLinks = [];

  setorGroups.forEach((group) => {
    const parent = group.secretaria;
    const leaves = group.items.filter((item) => item.parent);
    if (!parent || !leaves.length) {
      return;
    }

    const basePoint = toPoint(parent.angle, secretariaRingRadius + ((setorRingRadius - secretariaRingRadius) * 0.4));
    const vector = {
      x: basePoint.x - center,
      y: basePoint.y - center
    };
    const vectorLen = Math.sqrt((vector.x * vector.x) + (vector.y * vector.y)) || 1;
    const unit = {
      x: vector.x / vectorLen,
      y: vector.y / vectorLen
    };
    const perp = {
      x: -unit.y,
      y: unit.x
    };

    const trunkStart = getEdgePoint(parent, basePoint, secretariaNodeRadius);
    const spineHalf = Math.max(20, Math.min(58, leaves.length * 11));
    const spineStart = {
      x: basePoint.x - (perp.x * spineHalf),
      y: basePoint.y - (perp.y * spineHalf)
    };
    const spineEnd = {
      x: basePoint.x + (perp.x * spineHalf),
      y: basePoint.y + (perp.y * spineHalf)
    };
    const curveLift = Math.min(22, 7 + (leaves.length * 1.7));
    const spineControl = {
      x: basePoint.x + (unit.x * curveLift),
      y: basePoint.y + (unit.y * curveLift)
    };

    setorBranches.push({
      key: parent.nome,
      trunkStart,
      basePoint,
      spineStart,
      spineEnd,
      spineControl
    });

    const sortedLeaves = [...leaves].sort((a, b) => a.angle - b.angle);
    const total = sortedLeaves.length;

    sortedLeaves.forEach((leaf, index) => {
      const t = total === 1 ? 0.5 : (index / (total - 1));
      const spinePoint = quadraticPoint(spineStart, spineControl, spineEnd, t);
      const branchEnd = getEdgePoint(leaf, spinePoint, setorNodeRadius);

      setorLinks.push({
        key: `${leaf.secretariaNome}-${leaf.setor}`,
        spinePoint,
        branchEnd
      });
    });
  });

  container.innerHTML = `
    <section class="panel estrutura-panel">
      <div class="hero-panel estrutura-hero">
        <div>
          <p class="eyebrow">Estrutura municipal</p>
          <h2>Municípios, secretarias e setores</h2>
          <p class="subtitle">Fluxo lateral por etapa e organograma circular estilo constelação.</p>
        </div>
      </div>

      <div class="estrutura-layout">
        <div class="estrutura-card">
          <h3>Etapas de Cadastro</h3>

          <div class="estrutura-steps-row">
            <div class="estrutura-step-card">
              <p class="estrutura-step-kicker">1. Município</p>
              <label for="estruturaMunicipioSelect">Município em ajuste</label>
              <div class="estrutura-inline-row">
                <select id="estruturaMunicipioSelect">
                  ${municipalStructure.map((municipio) => `<option value="${escapeHtml(municipio.nome)}" ${municipio.nome === selectedMunicipio.nome ? 'selected' : ''}>${escapeHtml(municipio.nome)}</option>`).join('')}
                </select>
              </div>
              ${isAdmin ? `
                <div class="estrutura-inline-row">
                  <input id="newMunicipioInput" type="text" placeholder="Adicionar novo município (ex.: Maceió/AL)" />
                  <button id="addMunicipioBtn" class="estrutura-outline-btn" type="button">+</button>
                </div>
                <div class="estrutura-inline-row estrutura-inline-actions">
                  <button id="renameMunicipioBtn" class="estrutura-ghost-btn" type="button">Editar</button>
                  <button id="removeMunicipioBtn" class="estrutura-danger-btn" type="button">Excluir</button>
                </div>
              ` : ''}
            </div>

            ${selectedMunicipio ? `
              <div class="estrutura-step-card">
                <p class="estrutura-step-kicker">2. Secretaria</p>
                <label for="estruturaSecretariaSelect">Secretaria em ajuste de ${escapeHtml(selectedMunicipio.nome)}</label>
                <div class="estrutura-inline-row">
                  <select id="estruturaSecretariaSelect" ${secretarias.length ? '' : 'disabled'}>
                    ${secretarias.length
                      ? secretarias.map((secretaria) => `<option value="${escapeHtml(secretaria.nome)}" ${secretaria.nome === estruturaSelectedSecretaria ? 'selected' : ''}>${escapeHtml(secretaria.nome)}</option>`).join('')
                      : '<option value="">Cadastre uma secretaria</option>'}
                  </select>
                </div>
                ${isAdmin ? `
                  <div class="estrutura-inline-row">
                    <input id="newSecretariaInput" type="text" placeholder="Adicionar secretaria em ${escapeHtml(selectedMunicipio.nome)}" ${selectedMunicipio ? '' : 'disabled'} />
                    <button id="addSecretariaBtn" class="estrutura-outline-btn" type="button" ${selectedMunicipio ? '' : 'disabled'}>+</button>
                  </div>
                  <div class="estrutura-inline-row estrutura-inline-actions">
                    <button id="renameSecretariaBtn" class="estrutura-ghost-btn" type="button" ${selectedSecretaria ? '' : 'disabled'}>Editar</button>
                    <button id="removeSecretariaBtn" class="estrutura-danger-btn" type="button" ${selectedSecretaria ? '' : 'disabled'}>Excluir</button>
                  </div>
                ` : ''}
              </div>
            ` : ''}

            ${selectedSecretaria ? `
              <div class="estrutura-step-card">
                <p class="estrutura-step-kicker">3. Setor</p>
                <label>Setor em ajuste de ${escapeHtml(selectedSecretaria.nome)}</label>
                <ul class="estrutura-setor-list">
                  ${selectedSetores.length
                    ? selectedSetores.map((setor) => `<li><span>${escapeHtml(setor)}</span>${isAdmin ? `<div class="estrutura-row-actions"><button class="estrutura-ghost-btn" type="button" data-rename-setor="${escapeHtml(setor)}">Editar</button><button class="estrutura-danger-btn" type="button" data-remove-setor="${escapeHtml(setor)}">Excluir</button></div>` : ''}</li>`).join('')
                    : '<li class="empty-state">Nenhum setor cadastrado.</li>'}
                </ul>
                ${isAdmin ? `
                  <div class="estrutura-inline-row">
                    <input id="newSetorEstruturaInput" type="text" placeholder="Adicionar setor em ${escapeHtml(selectedSecretaria.nome)}" ${selectedSecretaria ? '' : 'disabled'} />
                    <button id="addSetorEstruturaBtn" class="estrutura-outline-btn" type="button" ${selectedSecretaria ? '' : 'disabled'}>+</button>
                  </div>
                ` : ''}
              </div>
            ` : ''}
          </div>
        </div>

        <div class="estrutura-card">
          <h3>Organograma Circular Estrutural</h3>
          <div class="estrutura-orbit-wrapper">
            <div class="estrutura-orbit-stage" style="--stage-size:${stageSize}px;">
              <svg class="estrutura-orbit-svg" viewBox="0 0 ${stageSize} ${stageSize}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
                ${secretariaLinks.map((line) => `<line x1="${line.start.x.toFixed(2)}" y1="${line.start.y.toFixed(2)}" x2="${line.end.x.toFixed(2)}" y2="${line.end.y.toFixed(2)}" class="estrutura-link secretaria"></line>`).join('')}
                ${setorBranches.map((group) => `<line x1="${group.trunkStart.x.toFixed(2)}" y1="${group.trunkStart.y.toFixed(2)}" x2="${group.basePoint.x.toFixed(2)}" y2="${group.basePoint.y.toFixed(2)}" class="estrutura-link setor-tronco"></line>`).join('')}
                ${setorBranches.map((group) => `<path d="M ${group.spineStart.x.toFixed(2)} ${group.spineStart.y.toFixed(2)} Q ${group.spineControl.x.toFixed(2)} ${group.spineControl.y.toFixed(2)} ${group.spineEnd.x.toFixed(2)} ${group.spineEnd.y.toFixed(2)}" class="estrutura-link setor-espinha"></path>`).join('')}
                ${setorLinks.map((line) => `<line x1="${line.spinePoint.x.toFixed(2)}" y1="${line.spinePoint.y.toFixed(2)}" x2="${line.branchEnd.x.toFixed(2)}" y2="${line.branchEnd.y.toFixed(2)}" class="estrutura-link setor"></line>`).join('')}
              </svg>

              <div class="estrutura-orbit-core">
                <button class="estrutura-orbit-node is-core" type="button" data-select-municipio="${escapeHtml(selectedMunicipio.nome)}">${escapeHtml(selectedMunicipio.nome)}</button>
                ${isAdmin ? `
                  <div class="estrutura-orbit-core-actions">
                    <button class="estrutura-outline-btn" type="button" data-add-secretaria-orbit title="Adicionar secretaria ao município atual">+</button>
                    <button class="estrutura-ghost-btn" type="button" data-rename-municipio-orbit>Editar</button>
                    <button class="estrutura-danger-btn" type="button" data-remove-municipio-orbit>Excluir</button>
                  </div>
                ` : ''}
              </div>

              ${(secretarias || []).length ? `
                <div class="estrutura-orbit-ring secretarias">
                  ${secretariasWithPosition.map((secretaria) => `
                    <div class="estrutura-orbit-node-shell secretaria" style="left:${((secretaria.x / stageSize) * 100).toFixed(4)}%; top:${((secretaria.y / stageSize) * 100).toFixed(4)}%;">
                      <button class="estrutura-orbit-node is-secretaria ${secretaria.nome === estruturaSelectedSecretaria ? 'is-active' : ''}" type="button" data-select-municipio="${escapeHtml(selectedMunicipio.nome)}" data-select-secretaria="${escapeHtml(secretaria.nome)}">${escapeHtml(secretaria.nome)}</button>
                      ${isAdmin && secretaria.nome === estruturaSelectedSecretaria ? `<div class="estrutura-orbit-actions"><button class="estrutura-outline-btn" type="button" data-add-setor-orbit="${escapeHtml(secretaria.nome)}" title="Adicionar setor">+</button><button class="estrutura-ghost-btn" type="button" data-rename-secretaria-orbit="${escapeHtml(secretaria.nome)}">Editar</button><button class="estrutura-danger-btn" type="button" data-remove-secretaria-orbit="${escapeHtml(secretaria.nome)}">Excluir</button></div>` : ''}
                    </div>
                  `).join('')}
                </div>
              ` : '<p class="empty-state estrutura-empty-orbit">Adicione secretarias para formar o anel principal.</p>'}

              ${setoresWithPosition.length ? `
                <div class="estrutura-orbit-ring setores">
                  ${setoresWithPosition.map(({ secretariaNome, setor, x, y }) => `
                    <div class="estrutura-orbit-node-shell setor" style="left:${((x / stageSize) * 100).toFixed(4)}%; top:${((y / stageSize) * 100).toFixed(4)}%;" title="${escapeHtml(secretariaNome)}">
                      <div class="estrutura-orbit-node is-leaf ${secretariaNome === estruturaSelectedSecretaria ? 'is-active' : ''}">${escapeHtml(setor)}</div>
                    </div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  const municipioSelect = document.getElementById('estruturaMunicipioSelect');
  if (municipioSelect) {
    municipioSelect.addEventListener('change', () => {
      estruturaSelectedMunicipio = municipioSelect.value;
      estruturaExpandedMunicipios.add(estruturaSelectedMunicipio);
      estruturaSelectedSecretaria = '';
      renderModuleContent('estrutura-municipal');
    });
  }

  const secretariaSelect = document.getElementById('estruturaSecretariaSelect');
  if (secretariaSelect) {
    secretariaSelect.addEventListener('change', () => {
      estruturaSelectedSecretaria = secretariaSelect.value;
      if (estruturaSelectedSecretaria) {
        estruturaExpandedSecretarias.add(buildEstruturaSecretariaKey(estruturaSelectedMunicipio, estruturaSelectedSecretaria));
      }
      renderModuleContent('estrutura-municipal');
    });
  }

  container.querySelectorAll('[data-select-municipio]').forEach((button) => {
    button.addEventListener('click', () => {
      const municipioName = String(button.getAttribute('data-select-municipio') || '').trim();
      const secretariaName = String(button.getAttribute('data-select-secretaria') || '').trim();
      if (!municipioName) {
        return;
      }

      estruturaSelectedMunicipio = municipioName;
      estruturaExpandedMunicipios.add(municipioName);
      if (secretariaName) {
        estruturaSelectedSecretaria = secretariaName;
        estruturaExpandedSecretarias.add(buildEstruturaSecretariaKey(municipioName, secretariaName));
      }
      renderModuleContent('estrutura-municipal');
    });
  });

  if (!isAdmin) {
    return;
  }

  const addMunicipioBtn = document.getElementById('addMunicipioBtn');
  if (addMunicipioBtn) {
    addMunicipioBtn.addEventListener('click', () => {
      const input = document.getElementById('newMunicipioInput');
      addMunicipio(input?.value || '');
    });
  }

  const renameMunicipioBtn = document.getElementById('renameMunicipioBtn');
  if (renameMunicipioBtn) {
    renameMunicipioBtn.addEventListener('click', () => {
      const nextName = window.prompt('Renomear município:', selectedMunicipio?.nome || '');
      if (nextName !== null) {
        renameMunicipio(nextName);
      }
    });
  }

  const removeMunicipioBtn = document.getElementById('removeMunicipioBtn');
  if (removeMunicipioBtn) {
    removeMunicipioBtn.addEventListener('click', removeMunicipio);
  }

  const addSecretariaBtn = document.getElementById('addSecretariaBtn');
  if (addSecretariaBtn) {
    addSecretariaBtn.addEventListener('click', () => {
      const input = document.getElementById('newSecretariaInput');
      addSecretaria(input?.value || '');
    });
  }

  const renameSecretariaBtn = document.getElementById('renameSecretariaBtn');
  if (renameSecretariaBtn) {
    renameSecretariaBtn.addEventListener('click', () => {
      const nextName = window.prompt('Renomear secretaria:', selectedSecretaria?.nome || '');
      if (nextName !== null) {
        renameSecretaria(nextName);
      }
    });
  }

  const removeSecretariaBtn = document.getElementById('removeSecretariaBtn');
  if (removeSecretariaBtn) {
    removeSecretariaBtn.addEventListener('click', removeSecretaria);
  }

  const addSetorBtn = document.getElementById('addSetorEstruturaBtn');
  if (addSetorBtn) {
    addSetorBtn.addEventListener('click', () => {
      const input = document.getElementById('newSetorEstruturaInput');
      addSetor(input?.value || '');
    });
  }

  container.querySelectorAll('[data-rename-setor]').forEach((button) => {
    button.addEventListener('click', () => {
      const currentSetor = String(button.getAttribute('data-rename-setor') || '').trim();
      if (!currentSetor) {
        return;
      }

      const nextValue = window.prompt('Renomear setor:', currentSetor);
      if (nextValue !== null) {
        renameSetor(currentSetor, nextValue);
      }
    });
  });

  container.querySelectorAll('[data-remove-setor]').forEach((button) => {
    button.addEventListener('click', () => {
      const setorName = String(button.getAttribute('data-remove-setor') || '').trim();
      if (!setorName) {
        return;
      }
      removeSetor(setorName);
    });
  });

  const addSecretariaOrbitBtn = container.querySelector('[data-add-secretaria-orbit]');
  if (addSecretariaOrbitBtn) {
    addSecretariaOrbitBtn.addEventListener('click', () => {
      const value = window.prompt('Nova secretaria para este município:', '');
      if (value !== null) {
        addSecretaria(value);
      }
    });
  }

  const renameMunicipioOrbitBtn = container.querySelector('[data-rename-municipio-orbit]');
  if (renameMunicipioOrbitBtn) {
    renameMunicipioOrbitBtn.addEventListener('click', () => {
      const value = window.prompt('Renomear município:', selectedMunicipio?.nome || '');
      if (value !== null) {
        renameMunicipio(value);
      }
    });
  }

  const removeMunicipioOrbitBtn = container.querySelector('[data-remove-municipio-orbit]');
  if (removeMunicipioOrbitBtn) {
    removeMunicipioOrbitBtn.addEventListener('click', removeMunicipio);
  }

  container.querySelectorAll('[data-add-setor-orbit]').forEach((button) => {
    button.addEventListener('click', () => {
      const secretariaName = String(button.getAttribute('data-add-setor-orbit') || '').trim();
      if (secretariaName) {
        estruturaSelectedSecretaria = secretariaName;
      }
      const value = window.prompt('Novo setor para a secretaria selecionada:', '');
      if (value !== null) {
        addSetor(value);
      }
    });
  });

  container.querySelectorAll('[data-rename-secretaria-orbit]').forEach((button) => {
    button.addEventListener('click', () => {
      const secretariaName = String(button.getAttribute('data-rename-secretaria-orbit') || '').trim();
      if (secretariaName) {
        estruturaSelectedSecretaria = secretariaName;
      }
      const value = window.prompt('Renomear secretaria:', estruturaSelectedSecretaria || '');
      if (value !== null) {
        renameSecretaria(value);
      }
    });
  });

  container.querySelectorAll('[data-remove-secretaria-orbit]').forEach((button) => {
    button.addEventListener('click', () => {
      const secretariaName = String(button.getAttribute('data-remove-secretaria-orbit') || '').trim();
      if (secretariaName) {
        estruturaSelectedSecretaria = secretariaName;
      }
      removeSecretaria();
    });
  });
}

function renderModuleContent(moduleKey) {
  const container = document.getElementById('moduleContent');
  if (!container) {
    return;
  }

  if (moduleKey === 'estrutura-municipal') {
    renderEstruturaMunicipalModule(container);
    return;
  }

  if (moduleKey === 'licitacoes') {
    const demandas = (Array.isArray(state.licitacoesDemandas) ? state.licitacoesDemandas : []).map((item) => ({
      status: 'DFD',
      modalidade: '-',
      numeroOrdem: '-',
      prioridade: 'Média',
      valorEstimado: '',
      valorContratado: '',
      createdAtIso: null,
      statusUpdatedAt: null,
      setorResponsavel: item?.setorDestino || '-',
      responsavelDesignadoAt: item?.createdAtIso || null,
      ...item
    }));
    const setores = normalizeSetoresDestino(state.setoresDestino);
    state.setoresDestino = setores;
    const isAdmin = currentUser?.perfil === 'administrador';
    const columnWidths = normalizeLicitacoesColumnWidths(state.licitacoesColumnWidths);

    const columns = [
      { key: 'processoNumero', label: 'Processo n°' },
      { key: 'secretaria', label: 'Secretaria' },
      { key: 'objeto', label: 'Objeto' },
      { key: 'responsavel', label: 'Responsável' },
      { key: 'status', label: 'Status' },
      { key: 'modalidade', label: 'Modalidade' },
      { key: 'numeroOrdem', label: 'N° de ordem' }
    ];

    const colgroupHtml = columns.map(({ key }) => {
      const width = columnWidths[key];
      return width === 'auto'
        ? `<col data-col-key="${key}" />`
        : `<col data-col-key="${key}" style="width:${escapeHtml(width)};" />`;
    }).join('');

    container.innerHTML = `
      <section class="panel licitacoes-panel">
        <div class="hero-panel licitacoes-hero">
          <div>
            <p class="eyebrow">Módulo de licitações</p>
            <h2>Demandas protocoladas</h2>
            <p class="subtitle">Novas demandas protocoladas são registradas automaticamente nesta planilha.</p>
          </div>
        </div>

        <div class="licitacoes-table-wrapper">
          <table class="licitacoes-table">
            <colgroup>
              ${colgroupHtml}
            </colgroup>
            <thead>
              <tr>
                ${columns.map(({ key, label }) => `
                  <th class="licitacoes-th ${key === 'processoNumero' ? 'th-processo-numero' : ''} ${key === 'objeto' ? 'th-objeto' : ''}">
                    <div class="th-wrap">
                      <span>${label}</span>
                      ${isAdmin ? `
                        <span class="col-resize-handle" data-col-key="${key}" role="button" aria-label="Arrastar para redimensionar a coluna ${label}" title="Arraste para redimensionar"></span>
                      ` : ''}
                    </div>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${demandas.length ? demandas.map((item) => `
                <tr class="licitacao-row" data-demand-id="${escapeHtml(item.id)}">
                  <td class="process-number-cell ${getPrioridadeBorderClass(item.prioridade || 'Sem prioridade')}">
                    <span>${escapeHtml(item.processoNumero)}</span>
                  </td>
                  <td>${escapeHtml(item.secretaria)}</td>
                  <td>${escapeHtml(item.objeto)}</td>
                  <td>${escapeHtml(item.responsavel)}</td>
                  <td>
                    <div>${escapeHtml(item.status || 'DFD')}</div>
                    <small class="status-age">há ${escapeHtml(formatElapsedFromIso(item.statusUpdatedAt || item.createdAtIso))}</small>
                  </td>
                  <td>${escapeHtml(item.modalidade || '-')}</td>
                  <td class="licitacao-numero-ordem-cell">
                    <span>${escapeHtml(item.numeroOrdem || '-')}</span>
                    ${isAdmin ? `<button class="licitacao-row-delete" type="button" title="Excluir processo" aria-label="Excluir processo ${escapeHtml(item.processoNumero)}" data-delete-demand-id="${escapeHtml(item.id)}">🗑️</button>` : ''}
                  </td>
                </tr>
              `).join('') : '<tr><td colspan="7" class="empty-state">Nenhuma demanda protocolada até o momento.</td></tr>'}
            </tbody>
          </table>
        </div>
      </section>
    `;

    const licitacoesTable = container.querySelector('.licitacoes-table');
    if (licitacoesTable) {
      applyLicitacoesColumnWidths(licitacoesTable, state.licitacoesColumnWidths);
    }

    setupLicitacoesColumnResize(container);

    container.querySelectorAll('.licitacao-row').forEach((row) => {
      row.addEventListener('click', () => {
        const demandId = row.getAttribute('data-demand-id');
        const demand = demandas.find((item) => item.id === demandId);
        openLicitacaoDetailsModal(demand);
      });
    });

    container.querySelectorAll('[data-delete-demand-id]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        deleteLicitacaoDemandById(button.getAttribute('data-delete-demand-id'));
      });
    });

    return;
  }

  if (moduleKey === 'ritos') {
    const isAdmin = currentUser?.perfil === 'administrador';
    const modalidades = normalizeModalidades(state.modalidades);
    state.modalidades = modalidades;
    const statusCatalog = normalizeStatusCatalog(state.statusCatalog);
    state.statusCatalog = statusCatalog;
    const ritosPorModalidade = normalizeRitosPorModalidade(state.ritosPorModalidade, statusCatalog, modalidades);
    state.ritosPorModalidade = ritosPorModalidade;

    container.innerHTML = `
      <section class="panel ritos-panel">
        <div class="hero-panel ritos-hero">
          <div>
            <p class="eyebrow">Configuração de fluxo</p>
            <h2>Ritos por modalidade</h2>
            <p class="subtitle">Defina quais status podem aparecer no processo conforme a modalidade.</p>
          </div>
        </div>

        <div class="ritos-layout">
          <div class="ritos-catalog-card">
            <h3>Catálogo de status</h3>
            <ul class="ritos-status-list">
              ${statusCatalog.map((status) => `
                <li ${isAdmin ? `draggable="true" data-status-drag="${escapeHtml(status)}"` : ''}>
                  ${isAdmin ? `<button class="ritos-status-label" type="button" data-status-edit="${escapeHtml(status)}" title="Editar status">${escapeHtml(status)}</button>` : `<span>${escapeHtml(status)}</span>`}
                  ${isAdmin ? `<button class="ritos-status-remove" type="button" data-status-remove="${escapeHtml(status)}" aria-label="Excluir status ${escapeHtml(status)}" title="Excluir status">🗑️</button>` : ''}
                </li>
              `).join('')}
            </ul>
            ${isAdmin ? `
              <div class="ritos-catalog-add">
                <input id="newStatusCatalogInput" type="text" placeholder="Novo status" />
                <button id="addStatusCatalogBtn" type="button">Adicionar</button>
              </div>
            ` : ''}
          </div>

          <div class="ritos-matrix-card">
            <h3>Status por modalidade</h3>
            <div class="ritos-modalidades-grid">
              ${modalidades.map((modalidade) => `
                <div class="ritos-modalidade-block">
                  <div class="ritos-modalidade-head">
                    <h4>${escapeHtml(modalidade)}</h4>
                    ${isAdmin ? `
                      <div class="ritos-modalidade-actions">
                        <button type="button" data-modalidade-edit="${escapeHtml(modalidade)}" title="Editar modalidade">Editar</button>
                        <button type="button" class="danger" data-modalidade-remove="${escapeHtml(modalidade)}" title="Excluir modalidade">Excluir</button>
                      </div>
                    ` : ''}
                  </div>
                  <div class="ritos-status-grid">
                    ${getStatusDisplayOrderByModalidade(modalidade, statusCatalog, ritosPorModalidade).map((status) => {
                      const checked = (ritosPorModalidade[modalidade] || []).includes(status);
                      return `
                        <label>
                          <input type="checkbox" data-rito-modalidade="${escapeHtml(modalidade)}" data-rito-status="${escapeHtml(status)}" ${checked ? 'checked' : ''} ${isAdmin ? '' : 'disabled'} />
                          <span>${escapeHtml(status)}</span>
                        </label>
                      `;
                    }).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
            ${isAdmin ? `
              <div class="ritos-modalidade-add">
                <input id="newModalidadeInput" type="text" placeholder="Nova modalidade" />
                <button id="addModalidadeBtn" type="button">Adicionar modalidade</button>
              </div>
            ` : ''}
          </div>
        </div>
      </section>
    `;

    if (isAdmin) {
      container.querySelectorAll('[data-status-drag]').forEach((item) => {
        item.addEventListener('dragstart', () => {
          draggingCatalogStatus = String(item.getAttribute('data-status-drag') || '').trim();
          item.classList.add('is-dragging');
        });

        item.addEventListener('dragend', () => {
          draggingCatalogStatus = '';
          item.classList.remove('is-dragging');
        });

        item.addEventListener('dragover', (event) => {
          event.preventDefault();
          item.classList.add('is-drag-over');
        });

        item.addEventListener('dragleave', () => {
          item.classList.remove('is-drag-over');
        });

        item.addEventListener('drop', (event) => {
          event.preventDefault();
          item.classList.remove('is-drag-over');
          const targetStatus = String(item.getAttribute('data-status-drag') || '').trim();
          moveStatusCatalogItem(draggingCatalogStatus, targetStatus);
        });
      });

      const addBtn = document.getElementById('addStatusCatalogBtn');
      if (addBtn) {
        addBtn.addEventListener('click', addStatusToCatalog);
      }

      container.querySelectorAll('[data-status-remove]').forEach((button) => {
        button.addEventListener('click', () => {
          removeStatusFromCatalog(button.getAttribute('data-status-remove'));
        });
      });

      container.querySelectorAll('[data-status-edit]').forEach((button) => {
        button.addEventListener('click', () => {
          const currentStatus = button.getAttribute('data-status-edit');
          const nextStatus = window.prompt('Editar nome do status:', currentStatus || '');
          if (nextStatus === null) {
            return;
          }
          renameStatusInCatalog(currentStatus, nextStatus);
        });
      });

      const addModalidadeBtn = document.getElementById('addModalidadeBtn');
      if (addModalidadeBtn) {
        addModalidadeBtn.addEventListener('click', addModalidadeToRitos);
      }

      container.querySelectorAll('[data-modalidade-edit]').forEach((button) => {
        button.addEventListener('click', () => {
          const currentModalidade = button.getAttribute('data-modalidade-edit');
          const nextModalidade = window.prompt('Editar nome da modalidade:', currentModalidade || '');
          if (nextModalidade === null) {
            return;
          }
          renameModalidadeInRitos(currentModalidade, nextModalidade);
        });
      });

      container.querySelectorAll('[data-modalidade-remove]').forEach((button) => {
        button.addEventListener('click', () => {
          const currentModalidade = String(button.getAttribute('data-modalidade-remove') || '').trim();
          if (!currentModalidade) {
            return;
          }
          const confirmed = window.confirm(`Deseja excluir a modalidade "${currentModalidade}"?`);
          if (!confirmed) {
            return;
          }
          removeModalidadeFromRitos(currentModalidade);
        });
      });

      container.querySelectorAll('[data-rito-modalidade][data-rito-status]').forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
          const modalidade = checkbox.getAttribute('data-rito-modalidade');
          const status = checkbox.getAttribute('data-rito-status');
          toggleRitoStatus(modalidade, status, checkbox.checked);
        });
      });
    }

    return;
  }

  if (moduleKey === 'fornecedores') {
    const searchInput = document.getElementById('supplierSearch');
    const shouldRestoreSearchFocus = document.activeElement === searchInput;
    const selectionStart = shouldRestoreSearchFocus ? searchInput.selectionStart : null;
    const selectionEnd = shouldRestoreSearchFocus ? searchInput.selectionEnd : null;

    const filteredSuppliers = fornecedoresData.filter((fornecedor) => {
      const termo = filtrosFornecedores.termo.trim().toLowerCase();
      if (!termo) {
        return true;
      }
      return fornecedor.nome.toLowerCase().includes(termo) || fornecedor.objeto.toLowerCase().includes(termo);
    });

    const selectedSupplier = filteredSuppliers.find((fornecedor) => fornecedor.id === selectedSupplierId) || filteredSuppliers[0] || fornecedoresData[0];
    if (selectedSupplier) {
      selectedSupplierId = selectedSupplier.id;
    }

    container.innerHTML = `
      <section class="panel supplier-panel">
        <div class="hero-panel">
          <div>
            <p class="eyebrow">Cadastro de fornecedores</p>
            <h2>Fornecedores vinculados aos contratos públicos</h2>
            <p class="subtitle">Dados cadastrados a partir do conteúdo público extraído do Notion compartilhado.</p>
          </div>
        </div>

        <div class="supplier-toolbar">
          <label class="field search-field">
            <span>Buscar fornecedor</span>
            <input id="supplierSearch" type="search" placeholder="Digite o nome do fornecedor" value="${filtrosFornecedores.termo}" />
          </label>
          <div class="supplier-toolbar-actions">
            <button id="addSupplierVinculoBtn" class="supplier-toolbar-btn" type="button">Adicionar vínculo</button>
          </div>
        </div>

        <div class="supplier-layout">
          <div class="supplier-list-panel">
            ${filteredSuppliers.length ? filteredSuppliers.map((fornecedor) => `
              <div class="supplier-card-shell">
                <button class="supplier-card ${selectedSupplier?.id === fornecedor.id ? 'active' : ''}" type="button" data-supplier-id="${escapeHtml(fornecedor.id)}">
                  <strong>${escapeHtml(fornecedor.nome)}</strong>
                  <span>${escapeHtml(fornecedor.cnpj)}</span>
                  <small class="subtle-meta">${escapeHtml(fornecedor.vinculos?.[0]?.tipo || 'Vínculo')} ${escapeHtml(fornecedor.vinculos?.[0]?.numero || '')}</small>
                </button>
                <button class="supplier-card-delete" type="button" title="Excluir fornecedor" aria-label="Excluir fornecedor ${escapeHtml(fornecedor.nome)}" data-supplier-id="${escapeHtml(fornecedor.id)}">🗑️</button>
              </div>
            `).join('') : '<div class="empty-state">Nenhum fornecedor encontrado com este filtro.</div>'}
          </div>

          <div class="supplier-detail-panel">
            ${selectedSupplier ? `
              <div class="detail-header">
                <p class="eyebrow">Dados cadastrais</p>
                <h3>${escapeHtml(selectedSupplier.nome)}</h3>
                <p>${escapeHtml(selectedSupplier.objeto)}</p>
              </div>
              <div class="detail-section">
                <div class="detail-row full">
                  <span>CNPJ</span>
                  <strong>${escapeHtml(selectedSupplier.cnpj)}</strong>
                </div>
              </div>
              <div class="detail-section">
                <div class="detail-grid">
                  ${selectedSupplier.vinculos.map((vinculo, index) => {
                    const statusClass = getVinculoStatusClass(vinculo);
                    const parentLabel = vinculo.parentId ? `Vinculado a ${vinculo.parentId}` : 'Sem vínculo principal';
                    const parentOptions = selectedSupplier.vinculos
                      .filter((item) => item.tipo === 'Contrato' || item.tipo === 'ARP')
                      .map((item) => `<option value="${escapeHtml(item.numero)}" ${vinculo.parentId === item.numero ? 'selected' : ''}>${escapeHtml(item.tipo)} ${escapeHtml(item.numero)}</option>`)
                      .join('');
                    return `
                      <div class="vinculo-card ${statusClass}">
                        <div class="vinculo-head">
                          <span class="vinculo-type">${escapeHtml(vinculo.tipo)}</span>
                          <strong>${escapeHtml(vinculo.numero)}</strong>
                        </div>
                        <p>${escapeHtml(vinculo.objeto)}</p>
                        <div class="vinculo-dates">
                          <div><span>Data de início</span><strong>${escapeHtml(vinculo.dataInicio || '-')}</strong></div>
                          <div><span>Data de término</span><strong>${escapeHtml(vinculo.dataTermino || '-')}</strong></div>
                        </div>
                        <div class="detail-row compact">
                          <span>Fundo</span>
                          <strong>${escapeHtml(vinculo.fundo || selectedSupplier.fundo || '-')}</strong>
                        </div>
                        ${(vinculo.tipo === 'Aditivo' || vinculo.tipo === 'Apostilamento') ? `
                          <div class="parent-link-row">
                            <label for="parentSelect-${index}">Vincular a</label>
                            <select id="parentSelect-${index}" class="parent-select" data-supplier-id="${escapeHtml(selectedSupplier.id)}" data-vinculo-index="${index}">
                              <option value="">Selecione um Contrato ou ARP</option>
                              ${parentOptions}
                            </select>
                          </div>
                        ` : ''}
                        <div class="vinculo-footer">
                          <span class="status-badge ${statusClass}">${getVinculoStatusLabel(vinculo)}</span>
                          <small>${escapeHtml(parentLabel)}</small>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
              <p class="detail-source">Fonte: ${escapeHtml(selectedSupplier.fonte)}</p>
            ` : '<div class="empty-state">Selecione um fornecedor para visualizar os dados completos.</div>'}
          </div>
        </div>
      </section>
    `;

    const restoredSearchInput = document.getElementById('supplierSearch');
    if (restoredSearchInput) {
      restoredSearchInput.addEventListener('input', (event) => {
        filtrosFornecedores.termo = event.target.value;
        renderModuleContent('fornecedores');
      });

      if (shouldRestoreSearchFocus) {
        window.requestAnimationFrame(() => {
          const activeSearchInput = document.getElementById('supplierSearch');
          if (!activeSearchInput) {
            return;
          }

          activeSearchInput.focus();
          if (selectionStart !== null && selectionEnd !== null) {
            activeSearchInput.setSelectionRange(selectionStart, selectionEnd);
          }
        });
      }
    }

    const addSupplierVinculoBtn = document.getElementById('addSupplierVinculoBtn');
    if (addSupplierVinculoBtn && selectedSupplier) {
      addSupplierVinculoBtn.addEventListener('click', () => createSupplierVinculo(selectedSupplier));
    }

    container.querySelectorAll('.supplier-card').forEach((card) => {
      card.addEventListener('click', () => {
        selectedSupplierId = card.getAttribute('data-supplier-id');
        renderModuleContent('fornecedores');
      });
    });

    container.querySelectorAll('.supplier-card-delete').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        deleteSupplierById(button.getAttribute('data-supplier-id'));
      });
    });

    container.querySelectorAll('.parent-select').forEach((select) => {
      select.addEventListener('change', (event) => {
        const supplier = fornecedoresData.find((item) => item.id === event.target.dataset.supplierId);
        const vinculoIndex = Number(event.target.dataset.vinculoIndex);
        if (supplier?.vinculos?.[vinculoIndex]) {
          supplier.vinculos[vinculoIndex].parentId = event.target.value || null;
        }
        renderModuleContent('fornecedores');
      });
    });
    return;
  }

  if (moduleKey === 'comunicacao') {
    renderComunicacaoModule(container);
    return;
  }

  if (moduleKey === 'usuarios') {
    renderUsuariosModule(container);
    return;
  }

  if (moduleKey !== 'painel') {
    container.innerHTML = `
      <section class="panel hero-panel">
        <div>
          <p class="eyebrow">Módulo em desenvolvimento</p>
          <h2>${moduleConfig.find((item) => item.key === moduleKey)?.label || 'Módulo'}</h2>
          <p class="subtitle">Esta área será detalhada futuramente com telas específicas para este módulo.</p>
        </div>
      </section>
    `;
    return;
  }

  state.painelLayout = normalizePainelLayout(state.painelLayout);
  state.painelFilters = normalizePainelFilters(state.painelFilters, getPainelDemandas(), state.modalidades);
  filtrosPainel = state.painelFilters;

  const filteredData = getFilteredPainelDemandas();
  const filterOptions = getPainelFilterOptions();
  const groupedByModalidade = getDemandasByModalidade(filteredData);
  const prioritiesData = getDemandasByPrioridade(filteredData);
  const urgentByOrgao = getUrgentDemandasByOrgao(filteredData);
  const myResponsibleData = getMyResponsibleDemandas(filteredData);
  const totalDemandas = filteredData.length;
  const totalValor = groupedByModalidade.reduce((sum, item) => sum + item.valor, 0);
  const layoutCards = state.painelLayout.order.filter((cardKey) => ['panel-prioridades', 'panel-urgentes', 'panel-responsaveis', 'panel-treemap'].includes(cardKey));

  const renderFilterDropdown = (key, label, options) => {
    const selectedValues = Array.isArray(filtrosPainel[key]) ? filtrosPainel[key] : [];
    const allSelected = !options.length || selectedValues.length === options.length;
    const triggerLabel = allSelected ? 'Todos' : `${selectedValues.length}/${options.length}`;

    return `
      <div class="filter-group filter-dropdown-group">
        <label>${escapeHtml(label)}</label>
        <div class="checkbox-dropdown panel-filter-dropdown" data-panel-filter-dropdown="${escapeHtml(key)}">
          <button type="button" class="dropdown-trigger-btn" data-panel-filter-trigger>${escapeHtml(triggerLabel)} ▼</button>
          <div class="dropdown-panel" data-panel-filter-panel>
            <label class="cb-option all-option"><input type="checkbox" data-panel-filter-all ${allSelected ? 'checked' : ''}> Todos</label>
            ${options.length ? options.map((option) => `<label class="cb-option"><input type="checkbox" data-panel-filter-option value="${escapeHtml(option)}" ${selectedValues.includes(option) ? 'checked' : ''}> ${escapeHtml(option)}</label>`).join('') : '<p class="messages-empty">Sem opções disponíveis.</p>'}
          </div>
        </div>
      </div>
    `;
  };

  container.innerHTML = `
    <section class="panel chart-panel">
      <div class="chart-card chart-summary-card">
        <p class="eyebrow">Painel Geral</p>
        <h3>Resumo de licitações por modalidade</h3>
        <p>${totalDemandas} processo(s) filtrado(s), somando ${formatCurrencyBR(totalValor)} em valores estimados.</p>
      </div>

      <div class="chart-card filters-card panel-filters-card">
        ${renderFilterDropdown('municipio', 'Município', filterOptions.municipio)}
        ${renderFilterDropdown('modalidade', 'Modalidade', filterOptions.modalidade)}
        ${renderFilterDropdown('secretaria', 'Secretarias', filterOptions.secretaria)}
        ${renderFilterDropdown('status', 'Status', filterOptions.status)}
      </div>

      <div class="dashboard-grid">
        ${layoutCards.map((cardKey) => {
          if (cardKey === 'panel-prioridades') {
            const maxPriority = Math.max(...prioritiesData.map((entry) => entry.quantidade), 1);
            return `
              <section class="chart-card dashboard-card ${getPanelCardSpanClass(cardKey)}" data-panel-card="${cardKey}">
                <div class="dashboard-card-head">
                  <div>
                    <h3>Prioridades dos Processos</h3>
                    <p>Distribuição dos processos filtrados por prioridade.</p>
                  </div>
                  ${currentUser?.perfil === 'administrador' ? `
                    <div class="dashboard-card-actions">
                      <button type="button" class="dashboard-card-drag-handle" title="Arrastar">↕</button>
                      <button type="button" data-panel-span-toggle>Expandir</button>
                    </div>
                  ` : ''}
                </div>
                <div class="priority-bars">
                  ${prioritiesData.map((item) => {
                    const width = maxPriority ? (item.quantidade / maxPriority) * 100 : 0;
                    return `
                      <div class="priority-row">
                        <div class="priority-row-head"><strong>${escapeHtml(item.label)}</strong><span>${item.quantidade}</span></div>
                        <div class="priority-row-bar"><span style="width: ${width}%"></span></div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </section>
            `;
          }

          if (cardKey === 'panel-urgentes') {
            const maxUrgent = Math.max(...urgentByOrgao.map((item) => item.quantidade), 1);
            return `
              <section class="chart-card dashboard-card ${getPanelCardSpanClass(cardKey)}" data-panel-card="${cardKey}">
                <div class="dashboard-card-head">
                  <div>
                    <h3>Urgentes / Órgão</h3>
                    <p>Órgãos com processos urgentes dentro dos filtros atuais.</p>
                  </div>
                  ${currentUser?.perfil === 'administrador' ? `
                    <div class="dashboard-card-actions">
                      <button type="button" class="dashboard-card-drag-handle" title="Arrastar">↕</button>
                      <button type="button" data-panel-span-toggle>Expandir</button>
                    </div>
                  ` : ''}
                </div>
                <div class="chart-axis compact-axis">
                  <div class="chart-bars chart-bars-compact">
                    ${urgentByOrgao.length ? urgentByOrgao.map((item) => {
                      const height = (item.quantidade / maxUrgent) * 100;
                      return `
                        <div class="chart-bar" title="${escapeHtml(item.orgao)}: ${item.quantidade}">
                          <div class="bar-quantity">${item.quantidade}</div>
                          <div class="bar-fill urgent-fill" style="height: ${height}%"></div>
                        </div>
                      `;
                    }).join('') : '<div class="empty-state">Nenhum processo urgente após os filtros.</div>'}
                  </div>
                </div>
                <div class="chart-bottom-labels chart-bottom-labels-compact">
                  ${urgentByOrgao.length ? urgentByOrgao.map((item) => `<div class="bar-label">${escapeHtml(item.orgao)}</div>`).join('') : ''}
                </div>
              </section>
            `;
          }

          if (cardKey === 'panel-responsaveis') {
            return `
              <section class="chart-card dashboard-card ${getPanelCardSpanClass(cardKey)}" data-panel-card="${cardKey}">
                <div class="dashboard-card-head">
                  <div>
                    <h3>Processos sob minha responsabilidade</h3>
                    <p>Somente os processos em que o usuário logado é o responsável.</p>
                  </div>
                  ${currentUser?.perfil === 'administrador' ? `
                    <div class="dashboard-card-actions">
                      <button type="button" class="dashboard-card-drag-handle" title="Arrastar">↕</button>
                      <button type="button" data-panel-span-toggle>Expandir</button>
                    </div>
                  ` : ''}
                </div>
                <div class="responsavel-list">
                  ${myResponsibleData.length ? myResponsibleData.map((item) => `
                    <button type="button" class="responsavel-item" data-demand-id="${escapeHtml(item.id)}">
                      <strong>${escapeHtml(item.processoNumero)}</strong>
                      <span>${escapeHtml(item.modalidade || '-')} • ${escapeHtml(item.status || '-')}</span>
                      <small>${escapeHtml(item.secretaria || '-')}${item.municipio ? ` • ${escapeHtml(item.municipio)}` : ''}</small>
                    </button>
                  `).join('') : '<div class="empty-state">Nenhum processo atribuído a este usuário.</div>'}
                </div>
              </section>
            `;
          }

          if (cardKey === 'panel-treemap') {
            const maxTreemap = Math.max(...groupedByModalidade.map((item) => item.quantidade), 1);
            return `
              <section class="chart-card dashboard-card ${getPanelCardSpanClass(cardKey)}" data-panel-card="${cardKey}">
                <div class="dashboard-card-head">
                  <div>
                    <h3>Treemap por modalidade</h3>
                    <p>Quantidade de processos por modalidade dentro dos filtros aplicados.</p>
                  </div>
                  ${currentUser?.perfil === 'administrador' ? `
                    <div class="dashboard-card-actions">
                      <button type="button" class="dashboard-card-drag-handle" title="Arrastar">↕</button>
                      <button type="button" data-panel-span-toggle>Expandir</button>
                    </div>
                  ` : ''}
                </div>
                <div class="treemap-grid">
                  ${groupedByModalidade.length ? groupedByModalidade.map((item) => {
                    const flexValue = Math.max(1, (item.quantidade / maxTreemap) * 100);
                    return `
                      <div class="treemap-item" style="flex: ${flexValue};">
                        <strong>${escapeHtml(item.modalidade)}</strong>
                        <span>${item.quantidade} processo(s)</span>
                      </div>
                    `;
                  }).join('') : '<div class="empty-state">Nenhum processo encontrado com os filtros atuais.</div>'}
                </div>
              </section>
            `;
          }

          return '';
        }).join('')}
      </div>

      <div class="charts-row">
        <div class="chart-card donut-card">
          <div class="donut-header">
            <h3>Prioridades dos Processos</h3>
            <div class="checkbox-dropdown" id="donutMunicipioDropdown">
              <button type="button" class="dropdown-trigger-btn" id="donutMunicipioTrigger">Todos ▼</button>
              <div class="dropdown-panel" id="donutMunicipioPanel">
                <label class="cb-option all-option"><input type="checkbox" id="donutCbTodos" checked> Todos</label>
                ${municipios.map(function(m) { return '<label class="cb-option"><input type="checkbox" class="donut-municipio-cb" value="' + m + '" checked> ' + m + '</label>'; }).join('')}
              </div>
            </div>
          </div>
          <div class="donut-wrapper">
            <div class="donut-chart">
              <svg viewBox="0 0 240 240" class="donut-svg" id="donutSvg">
                <circle cx="120" cy="120" r="100" fill="none" stroke-width="40" stroke-dasharray="0 0" class="donut-segment" data-priority="urgente"></circle>
                <circle cx="120" cy="120" r="100" fill="none" stroke-width="40" stroke-dasharray="0 0" class="donut-segment" data-priority="alta"></circle>
                <circle cx="120" cy="120" r="100" fill="none" stroke-width="40" stroke-dasharray="0 0" class="donut-segment" data-priority="média"></circle>
                <circle cx="120" cy="120" r="100" fill="none" stroke-width="40" stroke-dasharray="0 0" class="donut-segment" data-priority="baixa"></circle>
                <circle cx="120" cy="120" r="100" fill="none" stroke-width="40" stroke-dasharray="0 0" class="donut-segment" data-priority="-"></circle>
              </svg>
              <div class="donut-center">
                <div class="donut-total" id="processesTotal">0</div>
                <div class="donut-label">Processos</div>
              </div>
            </div>
          </div>
          <div id="donutTooltip" class="donut-tooltip"></div>
        </div>

        <div class="chart-card urgent-card">
          <div class="urgent-header">
            <h3>Urgentes / Órgão</h3>
            <div class="urgent-filters">
              <div class="filter-group">
                <label>Município</label>
                <div class="checkbox-dropdown" id="urgentMunicipioDropdown">
                  <button type="button" class="dropdown-trigger-btn" id="urgentMunicipioTrigger">Todos ▼</button>
                  <div class="dropdown-panel" id="urgentMunicipioPanel">
                    <label class="cb-option all-option"><input type="checkbox" id="urgentCbMunicipiosTodos" checked> Todos</label>
                    ${municipios.map(function(m) { return '<label class="cb-option"><input type="checkbox" class="urgent-municipio-cb" value="' + m + '" checked> ' + m + '</label>'; }).join('')}
                  </div>
                </div>
              </div>
              <div class="filter-group">
                <label>Órgão</label>
                <div class="checkbox-dropdown" id="urgentOrgaoDropdown">
                  <button type="button" class="dropdown-trigger-btn" id="urgentOrgaoTrigger">Todos ▼</button>
                  <div class="dropdown-panel" id="urgentOrgaoPanel"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="chart-wrapper">
            <div class="chart-axis">
              <div class="chart-grid">
                <span data-label="15"></span>
                <span data-label="10"></span>
                <span data-label="5"></span>
                <span data-label="0"></span>
              </div>
              <div class="chart-bars" id="urgentChartBars"></div>
            </div>
          </div>
          <div class="chart-bottom-labels" id="urgentBottomLabels"></div>
        </div>
      </div>
    </section>
  `;

  bindPanelFilterDropdowns();
  bindPanelCards();
  return;
}

function initUrgentFilters() {
  var mTrigger = document.getElementById('urgentMunicipioTrigger');
  var mPanel = document.getElementById('urgentMunicipioPanel');
  var oTrigger = document.getElementById('urgentOrgaoTrigger');
  var oPanel = document.getElementById('urgentOrgaoPanel');
  if (!mTrigger) return;

  if (!document._cbDropdownListenerAdded) {
    document.addEventListener('click', function() {
      document.querySelectorAll('.dropdown-panel.open').forEach(function(p) { p.classList.remove('open'); });
    });
    document._cbDropdownListenerAdded = true;
  }

  mTrigger.addEventListener('click', function(e) {
    e.stopPropagation();
    mPanel.classList.toggle('open');
    oPanel.classList.remove('open');
    var dp = document.getElementById('donutMunicipioPanel');
    if (dp) dp.classList.remove('open');
  });

  oTrigger.addEventListener('click', function(e) {
    e.stopPropagation();
    oPanel.classList.toggle('open');
    mPanel.classList.remove('open');
    var dp = document.getElementById('donutMunicipioPanel');
    if (dp) dp.classList.remove('open');
  });

  var mTodos = document.getElementById('urgentCbMunicipiosTodos');
  if (mTodos) {
    mTodos.addEventListener('change', function(e) {
      document.querySelectorAll('.urgent-municipio-cb').forEach(function(cb) { cb.checked = e.target.checked; });
      refreshUrgentOrgaos();
    });
  }

  document.querySelectorAll('.urgent-municipio-cb').forEach(function(cb) {
    cb.addEventListener('change', function() {
      var all = Array.from(document.querySelectorAll('.urgent-municipio-cb'));
      var todosEl = document.getElementById('urgentCbMunicipiosTodos');
      if (todosEl) todosEl.checked = all.every(function(c) { return c.checked; });
      refreshUrgentOrgaos();
    });
  });

  refreshUrgentOrgaos();
}

function refreshUrgentOrgaos() {
  var selectedM = Array.from(document.querySelectorAll('.urgent-municipio-cb:checked')).map(function(cb) { return cb.value; });
  var allOrgaos = Array.from(new Set(processosData.filter(function(p) { return selectedM.includes(p.municipio); }).map(function(p) { return p.orgao; }))).sort();

  var panel = document.getElementById('urgentOrgaoPanel');
  if (!panel) return;

  panel.innerHTML = '<label class="cb-option all-option"><input type="checkbox" id="urgentCbOrgaosTodos" checked> Todos</label>' +
    allOrgaos.map(function(o) { return '<label class="cb-option"><input type="checkbox" class="urgent-orgao-cb" value="' + o + '" checked> ' + o + '</label>'; }).join('');

  var oTodos = document.getElementById('urgentCbOrgaosTodos');
  if (oTodos) {
    oTodos.addEventListener('change', function(e) {
      document.querySelectorAll('.urgent-orgao-cb').forEach(function(cb) { cb.checked = e.target.checked; });
      updateUrgentChart();
    });
  }

  document.querySelectorAll('.urgent-orgao-cb').forEach(function(cb) {
    cb.addEventListener('change', function() {
      var all = Array.from(document.querySelectorAll('.urgent-orgao-cb'));
      var todosEl = document.getElementById('urgentCbOrgaosTodos');
      if (todosEl) todosEl.checked = all.every(function(c) { return c.checked; });
      updateUrgentChart();
    });
  });

  updateUrgentChart();
}

function updateUrgentChart() {
  var selectedM = Array.from(document.querySelectorAll('.urgent-municipio-cb:checked')).map(function(cb) { return cb.value; });
  var selectedO = Array.from(document.querySelectorAll('.urgent-orgao-cb:checked')).map(function(cb) { return cb.value; });

  var byOrgao = {};
  processosData.filter(function(p) { return p.prioridade === 'urgente' && selectedM.includes(p.municipio); }).forEach(function(p) {
    byOrgao[p.orgao] = (byOrgao[p.orgao] || 0) + 1;
  });

  var filtered = Object.entries(byOrgao).filter(function(e) { return selectedO.length === 0 || selectedO.includes(e[0]); }).sort(function(a, b) { return b[1] - a[1]; });
  var maxVal = filtered.length ? Math.max.apply(null, filtered.map(function(e) { return e[1]; })) : 1;

  var barsEl = document.getElementById('urgentChartBars');
  var labelsEl = document.getElementById('urgentBottomLabels');

  if (barsEl) {
    barsEl.innerHTML = filtered.map(function(item) {
      var h = (item[1] / maxVal) * 100;
      return '<div class="chart-bar"><div class="bar-quantity">' + item[1] + '</div><div class="bar-fill" style="height: ' + h + '%; background: #dc3545;"></div></div>';
    }).join('');
  }

  if (labelsEl) {
    labelsEl.innerHTML = filtered.map(function(e) { return '<div class="bar-label">' + e[0] + '</div>'; }).join('');
  }

  // Atualizar labels dos triggers
  var mCbs = document.querySelectorAll('.urgent-municipio-cb');
  var mChecked = document.querySelectorAll('.urgent-municipio-cb:checked').length;
  var mTrigger = document.getElementById('urgentMunicipioTrigger');
  if (mTrigger) mTrigger.textContent = (mChecked === mCbs.length ? 'Todos' : mChecked + '/' + mCbs.length) + ' ▼';

  var oCbs = document.querySelectorAll('.urgent-orgao-cb');
  var oChecked = document.querySelectorAll('.urgent-orgao-cb:checked').length;
  var oTrigger = document.getElementById('urgentOrgaoTrigger');
  if (oTrigger) oTrigger.textContent = (oChecked === oCbs.length ? 'Todos' : oChecked + '/' + oCbs.length) + ' ▼';
}

/* ===== GRÁFICO DE ROSCA ===== */

function initDonutFilter() {
  const trigger = document.getElementById('donutMunicipioTrigger');
  const panel = document.getElementById('donutMunicipioPanel');
  if (!trigger || !panel) return;

  trigger.addEventListener('click', function(e) {
    e.stopPropagation();
    panel.classList.toggle('open');
    var op = document.getElementById('urgentMunicipioPanel');
    var oop = document.getElementById('urgentOrgaoPanel');
    if (op) op.classList.remove('open');
    if (oop) oop.classList.remove('open');
  });

  var todosCb = document.getElementById('donutCbTodos');
  if (todosCb) {
    todosCb.addEventListener('change', function(e) {
      document.querySelectorAll('.donut-municipio-cb').forEach(function(cb) { cb.checked = e.target.checked; });
      donutUpdateFromFilter();
    });
  }

  document.querySelectorAll('.donut-municipio-cb').forEach(function(cb) {
    cb.addEventListener('change', function() {
      var all = Array.from(document.querySelectorAll('.donut-municipio-cb'));
      var todosEl = document.getElementById('donutCbTodos');
      if (todosEl) todosEl.checked = all.every(function(c) { return c.checked; });
      donutUpdateFromFilter();
    });
  });

  donutUpdateFromFilter();
}

function donutUpdateFromFilter() {
  var cbs = document.querySelectorAll('.donut-municipio-cb');
  var selected = Array.from(cbs).filter(function(cb) { return cb.checked; }).map(function(cb) { return cb.value; });
  var filtered = processosData.filter(function(p) { return selected.length === 0 || selected.includes(p.municipio); });
  var trigger = document.getElementById('donutMunicipioTrigger');
  if (trigger) trigger.textContent = (selected.length === cbs.length ? 'Todos' : selected.length + '/' + cbs.length) + ' ▼';
  renderDonutChart(filtered);
}

function renderDonutChart(processos) {
  var svg = document.getElementById('donutSvg');
  var totalEl = document.getElementById('processesTotal');
  if (!svg || !totalEl) return;

  var total = processos.length;
  totalEl.textContent = total;
  Array.from(svg.querySelectorAll('text')).forEach(function(t) { t.remove(); });

  var colors = { urgente: '#dc3545', alta: '#fd7e14', 'média': '#ffc107', baixa: '#5b5b58', '-': '#D3D3D3' };
  var textColors = { urgente: '#ffffff', alta: '#ffffff', 'média': '#ffffff', baixa: '#000000', '-': '#000000' };
  var labels = { urgente: 'Urgente', alta: 'Alta', 'média': 'Média', baixa: 'Baixa', '-': 'Sem prioridade' };
  var order = ['urgente', 'alta', 'média', 'baixa', '-'];
  var circumference = 2 * Math.PI * 100;

  if (total === 0) {
    order.forEach(function(p) {
      var seg = svg.querySelector('.donut-segment[data-priority="' + p + '"]');
      if (seg) { seg.style.stroke = p === 'urgente' ? '#e0e0e0' : 'transparent'; seg.style.strokeDasharray = p === 'urgente' ? circumference + ' 0' : '0 0'; seg.style.strokeDashoffset = '0'; }
    });
    return;
  }

  var currentAngle = 0;
  order.forEach(function(priority) {
    var count = processos.filter(function(p) { return p.prioridade === priority; }).length;
    var percent = count / total * 100;
    var seg = svg.querySelector('.donut-segment[data-priority="' + priority + '"]');
    if (!seg) return;

    seg.style.stroke = count > 0 ? colors[priority] : 'transparent';
    seg.style.strokeDasharray = (percent / 100) * circumference + ' ' + circumference;
    seg.style.strokeDashoffset = -currentAngle * circumference / 360;

    var newSeg = seg.cloneNode(true);
    seg.parentNode.replaceChild(newSeg, seg);
    (function(p, c) {
      newSeg.addEventListener('click', function() {
        var tt = document.getElementById('donutTooltip');
        if (tt) { tt.textContent = labels[p] + ': ' + c; tt.classList.add('show'); setTimeout(function() { tt.classList.remove('show'); }, 2500); }
      });
    })(priority, count);

    if (count > 0) {
      var midAngle = currentAngle + (percent / 100) * 180;
      var rad = midAngle * Math.PI / 180;
      var x = 120 + 100 * Math.cos(rad);
      var y = 120 + 100 * Math.sin(rad);
      var textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textEl.setAttribute('x', x); textEl.setAttribute('y', y);
      textEl.setAttribute('text-anchor', 'middle'); textEl.setAttribute('dominant-baseline', 'central');
      textEl.setAttribute('font-size', '16'); textEl.setAttribute('font-weight', '700');
      textEl.setAttribute('fill', textColors[priority]); textEl.setAttribute('pointer-events', 'none');
      textEl.textContent = count;
      svg.appendChild(textEl);
    }
    currentAngle += percent / 100 * 360;
  });
}

/* ===== GRÁFICO URGENTES POR ÓRGÃO ===== */

function initUrgentFilters() {
  var mTrigger = document.getElementById('urgentMunicipioTrigger');
  var mPanel = document.getElementById('urgentMunicipioPanel');
  var oTrigger = document.getElementById('urgentOrgaoTrigger');
  var oPanel = document.getElementById('urgentOrgaoPanel');
  if (!mTrigger) return;

  if (!document._cbDropdownListenerAdded) {
    document.addEventListener('click', function() {
      document.querySelectorAll('.dropdown-panel.open').forEach(function(p) { p.classList.remove('open'); });
    });
    document._cbDropdownListenerAdded = true;
  }

  mTrigger.addEventListener('click', function(e) {
    e.stopPropagation();
    mPanel.classList.toggle('open');
    oPanel.classList.remove('open');
    var dp = document.getElementById('donutMunicipioPanel');
    if (dp) dp.classList.remove('open');
  });

  oTrigger.addEventListener('click', function(e) {
    e.stopPropagation();
    oPanel.classList.toggle('open');
    mPanel.classList.remove('open');
    var dp = document.getElementById('donutMunicipioPanel');
    if (dp) dp.classList.remove('open');
  });

  var mTodos = document.getElementById('urgentCbMunicipiosTodos');
  if (mTodos) {
    mTodos.addEventListener('change', function(e) {
      document.querySelectorAll('.urgent-municipio-cb').forEach(function(cb) { cb.checked = e.target.checked; });
      refreshUrgentOrgaos();
    });
  }

  document.querySelectorAll('.urgent-municipio-cb').forEach(function(cb) {
    cb.addEventListener('change', function() {
      var all = Array.from(document.querySelectorAll('.urgent-municipio-cb'));
      var todosEl = document.getElementById('urgentCbMunicipiosTodos');
      if (todosEl) todosEl.checked = all.every(function(c) { return c.checked; });
      refreshUrgentOrgaos();
    });
  });

  refreshUrgentOrgaos();
}

function refreshUrgentOrgaos() {
  var selectedM = Array.from(document.querySelectorAll('.urgent-municipio-cb:checked')).map(function(cb) { return cb.value; });
  var allOrgaos = Array.from(new Set(processosData.filter(function(p) { return selectedM.includes(p.municipio); }).map(function(p) { return p.orgao; }))).sort();

  var panel = document.getElementById('urgentOrgaoPanel');
  if (!panel) return;

  panel.innerHTML = '<label class="cb-option all-option"><input type="checkbox" id="urgentCbOrgaosTodos" checked> Todos</label>' +
    allOrgaos.map(function(o) { return '<label class="cb-option"><input type="checkbox" class="urgent-orgao-cb" value="' + o + '" checked> ' + o + '</label>'; }).join('');

  var oTodos = document.getElementById('urgentCbOrgaosTodos');
  if (oTodos) {
    oTodos.addEventListener('change', function(e) {
      document.querySelectorAll('.urgent-orgao-cb').forEach(function(cb) { cb.checked = e.target.checked; });
      updateUrgentChart();
    });
  }

  document.querySelectorAll('.urgent-orgao-cb').forEach(function(cb) {
    cb.addEventListener('change', function() {
      var all = Array.from(document.querySelectorAll('.urgent-orgao-cb'));
      var todosEl = document.getElementById('urgentCbOrgaosTodos');
      if (todosEl) todosEl.checked = all.every(function(c) { return c.checked; });
      updateUrgentChart();
    });
  });

  updateUrgentChart();
}

function updateUrgentChart() {
  var selectedM = Array.from(document.querySelectorAll('.urgent-municipio-cb:checked')).map(function(cb) { return cb.value; });
  var selectedO = Array.from(document.querySelectorAll('.urgent-orgao-cb:checked')).map(function(cb) { return cb.value; });

  var byOrgao = {};
  processosData.filter(function(p) { return p.prioridade === 'urgente' && selectedM.includes(p.municipio); }).forEach(function(p) {
    byOrgao[p.orgao] = (byOrgao[p.orgao] || 0) + 1;
  });

  var filtered = Object.entries(byOrgao).filter(function(e) { return selectedO.length === 0 || selectedO.includes(e[0]); }).sort(function(a, b) { return b[1] - a[1]; });
  var maxVal = filtered.length ? Math.max.apply(null, filtered.map(function(e) { return e[1]; })) : 1;

  var barsEl = document.getElementById('urgentChartBars');
  var labelsEl = document.getElementById('urgentBottomLabels');

  if (barsEl) {
    barsEl.innerHTML = filtered.map(function(item) {
      var h = (item[1] / maxVal) * 100;
      return '<div class="chart-bar"><div class="bar-quantity">' + item[1] + '</div><div class="bar-fill" style="height: ' + h + '%; background: #dc3545;"></div></div>';
    }).join('');
  }

  if (labelsEl) {
    labelsEl.innerHTML = filtered.map(function(e) { return '<div class="bar-label">' + e[0] + '</div>'; }).join('');
  }

  // Atualizar labels dos triggers
  var mCbs = document.querySelectorAll('.urgent-municipio-cb');
  var mChecked = document.querySelectorAll('.urgent-municipio-cb:checked').length;
  var mTrigger = document.getElementById('urgentMunicipioTrigger');
  if (mTrigger) mTrigger.textContent = (mChecked === mCbs.length ? 'Todos' : mChecked + '/' + mCbs.length) + ' ▼';

  var oCbs = document.querySelectorAll('.urgent-orgao-cb');
  var oChecked = document.querySelectorAll('.urgent-orgao-cb:checked').length;
  var oTrigger = document.getElementById('urgentOrgaoTrigger');
  if (oTrigger) oTrigger.textContent = (oChecked === oCbs.length ? 'Todos' : oChecked + '/' + oCbs.length) + ' ▼';
}

function renderProcessList(activeProcess) {
  const list = document.getElementById('processList');
  if (!list) {
    return;
  }
  list.innerHTML = '';

  state.processes.forEach((process) => {
    const item = document.createElement('li');
    item.className = 'process-card';
    if (process.id === activeProcess.id) {
      item.classList.add('active');
    }

    item.innerHTML = `
      <h4>${process.title}</h4>
      <p>${ritesConfig[process.riteKey].label}</p>
      <p>Etapa ${process.currentStep + 1}/${ritesConfig[process.riteKey].steps.length}</p>
    `;

    item.addEventListener('click', () => {
      selectedProcessId = process.id;
      render();
    });

    list.appendChild(item);
  });
}

function renderTimeline(process) {
  const timeline = document.getElementById('timeline');
  if (!timeline) {
    return;
  }
  const rite = ritesConfig[process.riteKey];
  timeline.innerHTML = '';

  rite.steps.forEach((step, index) => {
    const chip = document.createElement('div');
    chip.className = 'step-chip';
    if (index < process.currentStep) {
      chip.classList.add('done');
      chip.textContent = `✓ ${step.title}`;
    } else if (index === process.currentStep) {
      chip.classList.add('current');
      chip.textContent = `● ${step.title}`;
    } else {
      chip.textContent = step.title;
    }
    timeline.appendChild(chip);
  });
}

function renderDocumentTree(process) {
  const tree = document.getElementById('documentTree');
  if (!tree) {
    return;
  }
  tree.innerHTML = '';

  const root = process.documents[0];
  if (!root) {
    tree.innerHTML = '<p>Nenhum documento disponível.</p>';
    return;
  }

  const buildBranch = (documentNode) => {
    const branch = document.createElement('ul');
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = `${documentNode.title} (${documentNode.type})`;
    button.className = process.selectedDocumentId === documentNode.id ? 'active' : '';

    button.addEventListener('click', () => {
      process.selectedDocumentId = documentNode.id;
      render();
    });

    item.appendChild(button);
    branch.appendChild(item);

    const children = process.documents.filter((child) => child.parentId === documentNode.id);
    if (children.length) {
      const childList = document.createElement('ul');
      children.forEach((child) => {
        const childItem = document.createElement('li');
        const childButton = document.createElement('button');
        childButton.type = 'button';
        childButton.textContent = `${child.title} (${child.type})`;
        childButton.className = process.selectedDocumentId === child.id ? 'active' : '';
        childButton.addEventListener('click', () => {
          process.selectedDocumentId = child.id;
          render();
        });
        childItem.appendChild(childButton);
        childList.appendChild(childItem);
      });
      branch.appendChild(childList);
    }

    return branch;
  };

  tree.appendChild(buildBranch(root));
}

function renderDocumentDetails(process) {
  const selectedDoc = process.documents.find((doc) => doc.id === process.selectedDocumentId) || process.documents[process.currentStep];

  if (!selectedDoc) {
    return;
  }

  const badge = document.getElementById('documentBadge');
  const label = document.getElementById('documentLabel');
  const title = document.getElementById('documentTitle');
  const content = document.getElementById('documentContent');

  if (!badge || !label || !title || !content) {
    return;
  }

  label.textContent = 'Documento em exibição';
  title.textContent = `${selectedDoc.title}`;
  content.textContent = selectedDoc.content;
  badge.textContent = selectedDoc.status;

  if (process.currentStep >= process.documents.findIndex((doc) => doc.id === selectedDoc.id)) {
    badge.textContent = 'Em tramitação';
  }
}

function updateHeader(process) {
  const title = document.getElementById('processTitle');
  const meta = document.getElementById('processMeta');
  const tag = document.getElementById('processTag');

  if (!title || !meta || !tag) {
    return;
  }

  title.textContent = process.title;
  meta.textContent = `${ritesConfig[process.riteKey].label} • Protocolo em ${process.createdAt}`;
  tag.textContent = `Rito ${ritesConfig[process.riteKey].label.toLowerCase()}`;
}

function advanceProcess() {
  const process = getSelectedProcess();
  if (!process) {
    return;
  }

  const rite = ritesConfig[process.riteKey];
  if (process.currentStep >= rite.steps.length - 1) {
    process.currentStep = rite.steps.length - 1;
    process.selectedDocumentId = process.documents[process.currentStep]?.id || null;
    render();
    return;
  }

  process.currentStep += 1;
  const nextDoc = process.documents[process.currentStep];
  if (nextDoc) {
    process.selectedDocumentId = nextDoc.id;
  }

  render();
}

function resetProcess() {
  const process = getSelectedProcess();
  if (!process) {
    return;
  }

  process.currentStep = 0;
  process.selectedDocumentId = process.documents[0]?.id || null;
  render();
}

// Inicializar sistema de autenticação
initAuth();
