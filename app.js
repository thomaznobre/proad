/* ===== SISTEMA DE AUTENTICAÇÃO ===== */

// Usuário logado atualmente
let currentUser = null;

// Carregar usuário do localStorage se existir
function loadCurrentUser() {
  const saved = localStorage.getItem('proad-current-user');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    }
  }
}

// Salvar usuário no localStorage
function saveCurrentUser() {
  if (currentUser) {
    localStorage.setItem('proad-current-user', JSON.stringify(currentUser));
  } else {
    localStorage.removeItem('proad-current-user');
  }
}

// Obter todos os usuários
function getAllUsers() {
  const saved = localStorage.getItem('proad-users');
  return saved ? JSON.parse(saved) : [];
}

// Salvar usuários
function saveAllUsers(users) {
  localStorage.setItem('proad-users', JSON.stringify(users));
}

// Validações
function validateCPF(cpf) {
  // Remove caracteres especiais
  const cleanCPF = cpf.replace(/\D/g, '');
  
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Calcula o primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let remainder = sum % 11;
  let digit1 = remainder < 2 ? 0 : 11 - remainder;
  
  if (digit1 !== parseInt(cleanCPF[9])) return false;
  
  // Calcula o segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  remainder = sum % 11;
  let digit2 = remainder < 2 ? 0 : 11 - remainder;
  
  if (digit2 !== parseInt(cleanCPF[10])) return false;
  
  return true;
}

function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validatePhone(phone) {
  // Remove caracteres especiais
  const cleanPhone = phone.replace(/\D/g, '');
  // Deve ter entre 10 e 11 dígitos
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
    const cleanCPF = u.cpf.replace(/\D/g, '');
    const inputCPF = input.replace(/\D/g, '');
    return (cleanCPF === inputCPF || u.email.toLowerCase() === input.toLowerCase()) && u.password === password;
  });
  
  if (!user) {
    loginMessage.textContent = 'CPF/E-mail ou senha inválidos';
    loginMessage.classList.add('error');
    return;
  }
  
  // Login bem-sucedido
  currentUser = { id: user.id, nome: user.nome, email: user.email, cpf: user.cpf };
  saveCurrentUser();
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
    currentUser = null;
    saveCurrentUser();
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
    if (users.some(u => u.cpf.replace(/\D/g, '') === cleanCPF)) {
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

function initAuth() {
  // Carregar usuário salvo
  loadCurrentUser();
  
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
  
  // Monitorar mudanças na senha para atualizar requisitos
  const signupPassword = document.getElementById('signupPassword');
  if (signupPassword) {
    signupPassword.addEventListener('input', updatePasswordRequirements);
  }
  
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
  
  // Inicializar app se usuário estiver logado
  if (currentUser) {
    init();
  }
}

// ===== FIM SISTEMA DE AUTENTICAÇÃO =====

const moduleConfig = [
  { key: 'painel', label: 'Painel Geral', icon: '▣', description: 'Visualização diferenciada por perfil do usuário.' },
  { key: 'licitacoes', label: 'Licitações', icon: '⚖', description: 'Fluxo de compras e procedimentos licitatórios.' },
  { key: 'contratos', label: 'Gestão de Contratos / ARPs', icon: '📄', description: 'Acompanhamento de contratos e análise de riscos.' },
  { key: 'fornecedores', label: 'Fornecedores', icon: '🏢', description: 'Planilha com cadastro e dados dos fornecedores.' },
  { key: 'usuarios', label: 'Permissões e Usuários', icon: '🔐', description: 'Controle de acesso e perfis.' }
];


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

const modalidades = ['Todas', ...Array.from(new Set(chartData.map((item) => item.modalidade)))];
let activeChartBar = null;
let filtrosPainel = { municipio: 'Todos', modalidade: 'Todas' };
let filtrosFornecedores = { termo: '' };
let activeModuleKey = 'painel';
let selectedSupplierId = fornecedoresData[0]?.id || null;

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
  ]
};

let state = loadState();
let selectedProcessId = state.processes[0]?.id || null;

function loadState() {
  const saved = localStorage.getItem('proad-state');
  if (!saved) {
    return buildInitialState();
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      processes: parsed.processes?.map((process) => ({ ...process, documents: process.documents || buildDocuments(ritesConfig[process.riteKey], process.id) })) || []
    };
  } catch (error) {
    console.error('Falha ao carregar estado salvo.', error);
    return buildInitialState();
  }
}

function buildInitialState() {
  return {
    processes: [buildProcess('administrativa', 'Processo 001')]
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
  populateRiteOptions();
  render();
  bindSidebar();
  bindModuleNavigation();

  const newProcessBtn = document.getElementById('newProcessBtn');
  if (newProcessBtn) {
    newProcessBtn.addEventListener('click', createProcess);
  }

  const advanceBtn = document.getElementById('advanceBtn');
  if (advanceBtn) {
    advanceBtn.addEventListener('click', advanceProcess);
  }

  const resetBtn = document.getElementById('resetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetProcess);
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

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
  });
}

function populateRiteOptions() {
  const select = document.getElementById('riteSelect');
  select.innerHTML = '';

  Object.entries(ritesConfig).forEach(([key, rite]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = rite.label;
    select.appendChild(option);
  });

  select.value = 'administrativa';
}

function createProcess() {
  const select = document.getElementById('riteSelect');
  const riteKey = select.value;
  const processNumber = String(state.processes.length + 1).padStart(3, '0');
  const process = buildProcess(riteKey, `Processo ${processNumber}`);
  state.processes.unshift(process);
  selectedProcessId = process.id;
  persistState();
  render();
}

function getSelectedProcess() {
  return state.processes.find((process) => process.id === selectedProcessId) || state.processes[0];
}

function render() {
  if (!state.processes.length) {
    return;
  }

  const process = getSelectedProcess();
  if (!process) {
    return;
  }

  renderModuleContent(activeModuleKey);
  renderProcessList(process);
  renderTimeline(process);
  renderDocumentTree(process);
  renderDocumentDetails(process);
  updateHeader(process);
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

function renderModuleContent(moduleKey) {
  const container = document.getElementById('moduleContent');
  if (!container) {
    return;
  }

  if (moduleKey === 'fornecedores') {
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
        </div>

        <div class="supplier-layout">
          <div class="supplier-list-panel">
            ${filteredSuppliers.length ? filteredSuppliers.map((fornecedor) => `
              <button class="supplier-card ${selectedSupplier?.id === fornecedor.id ? 'active' : ''}" type="button" data-supplier-id="${fornecedor.id}">
                <strong>${fornecedor.nome}</strong>
                <span>${fornecedor.cnpj}</span>
                <small class="subtle-meta">${fornecedor.vinculos?.[0]?.tipo || 'Vínculo'} ${fornecedor.vinculos?.[0]?.numero || ''}</small>
              </button>
            `).join('') : '<div class="empty-state">Nenhum fornecedor encontrado com este filtro.</div>'}
          </div>

          <div class="supplier-detail-panel">
            ${selectedSupplier ? `
              <div class="detail-header">
                <p class="eyebrow">Dados cadastrais</p>
                <h3>${selectedSupplier.nome}</h3>
                <p>${selectedSupplier.objeto}</p>
              </div>
              <div class="detail-section">
                <div class="detail-row full">
                  <span>CNPJ</span>
                  <strong>${selectedSupplier.cnpj}</strong>
                </div>
              </div>
              <div class="detail-section">
                <div class="detail-grid">
                  ${selectedSupplier.vinculos.map((vinculo, index) => {
                    const statusClass = getVinculoStatusClass(vinculo);
                    const parentLabel = vinculo.parentId ? `Vinculado a ${vinculo.parentId}` : 'Sem vínculo principal';
                    const parentOptions = selectedSupplier.vinculos
                      .filter((item) => item.tipo === 'Contrato' || item.tipo === 'ARP')
                      .map((item) => `<option value="${item.numero}" ${vinculo.parentId === item.numero ? 'selected' : ''}>${item.tipo} ${item.numero}</option>`)
                      .join('');
                    return `
                      <div class="vinculo-card ${statusClass}">
                        <div class="vinculo-head">
                          <span class="vinculo-type">${vinculo.tipo}</span>
                          <strong>${vinculo.numero}</strong>
                        </div>
                        <p>${vinculo.objeto}</p>
                        <div class="vinculo-dates">
                          <div><span>Data de início</span><strong>${vinculo.dataInicio || '-'}</strong></div>
                          <div><span>Data de término</span><strong>${vinculo.dataTermino || '-'}</strong></div>
                        </div>
                        <div class="detail-row compact">
                          <span>Fundo</span>
                          <strong>${vinculo.fundo || selectedSupplier.fundo || '-'}</strong>
                        </div>
                        ${vinculo.tipo === 'Aditivo' ? `
                          <div class="parent-link-row">
                            <label for="parentSelect-${index}">Vincular a</label>
                            <select id="parentSelect-${index}" class="parent-select" data-supplier-id="${selectedSupplier.id}" data-vinculo-index="${index}">
                              <option value="">Selecione um Contrato ou ARP</option>
                              ${parentOptions}
                            </select>
                          </div>
                        ` : ''}
                        <div class="vinculo-footer">
                          <span class="status-badge ${statusClass}">${getVinculoStatusLabel(vinculo)}</span>
                          <small>${parentLabel}</small>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
              <p class="detail-source">Fonte: ${selectedSupplier.fonte}</p>
            ` : '<div class="empty-state">Selecione um fornecedor para visualizar os dados completos.</div>'}
          </div>
        </div>
      </section>
    `;

    const searchInput = document.getElementById('supplierSearch');
    if (searchInput) {
      searchInput.addEventListener('input', (event) => {
        filtrosFornecedores.termo = event.target.value;
        renderModuleContent('fornecedores');
      });
    }

    container.querySelectorAll('.supplier-card').forEach((card) => {
      card.addEventListener('click', () => {
        selectedSupplierId = card.getAttribute('data-supplier-id');
        renderModuleContent('fornecedores');
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

  const filteredData = chartData.filter((item) => {
    const municipioOk = filtrosPainel.municipio === 'Todos' || filtrosPainel.municipio === 'Todos os municípios';
    const modalidadeOk = filtrosPainel.modalidade === 'Todas' || item.modalidade === filtrosPainel.modalidade;
    return municipioOk && modalidadeOk;
  });

  const maxValue = filteredData.length ? Math.max(...filteredData.map((item) => item.valor)) : 1;
  container.innerHTML = `
    <section class="panel chart-panel">
      <div class="chart-card">
        <p class="eyebrow">Painel Geral</p>
        <h3>Resumo de licitações por modalidade</h3>
        <p>Valores somados em reais e quantidade de licitações registradas por modalidade.</p>
      </div>

      <div class="chart-card filters-card">
        <div class="filter-group">
          <label for="municipioFilter">Município</label>
          <select id="municipioFilter"></select>
        </div>
        <div class="filter-group">
          <label for="modalidadeFilter">Modalidade</label>
          <select id="modalidadeFilter"></select>
        </div>
      </div>

      <div class="chart-card">
        <div class="chart-wrapper">
          <div class="chart-axis">
            <div class="chart-grid">
              <span data-label="R$ 1.000.000"></span>
              <span data-label="R$ 750.000"></span>
              <span data-label="R$ 500.000"></span>
              <span data-label="R$ 250.000"></span>
              <span data-label="R$ 0"></span>
            </div>
            <div class="chart-bars">
              ${filteredData.map((item) => {
                const height = (item.valor / maxValue) * 100;
                return `
                  <div class="chart-bar" data-name="${item.modalidade}" data-valor="R$ ${item.valor.toLocaleString('pt-BR')}" data-quantidade="${item.quantidade} licitações">
                    <div class="chart-tooltip">${item.modalidade}<br/>${item.quantidade} licitações<br/>R$ ${item.valor.toLocaleString('pt-BR')}</div>
                    <div class="bar-fill" style="height: ${height}%"></div>
                    <div class="bar-label">${item.modalidade}</div>
                    <div class="bar-value">${item.quantidade} licitações</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;

  const municipioFilter = document.getElementById('municipioFilter');
  const modalidadeFilter = document.getElementById('modalidadeFilter');

  if (municipioFilter) {
    municipioFilter.innerHTML = ['Todos', ...municipios].map((municipio) => `<option value="${municipio}" ${filtrosPainel.municipio === municipio ? 'selected' : ''}>${municipio}</option>`).join('');
    municipioFilter.addEventListener('change', (event) => {
      filtrosPainel.municipio = event.target.value;
      renderModuleContent('painel');
    });
  }

  if (modalidadeFilter) {
    modalidadeFilter.innerHTML = modalidades.map((modalidade) => `<option value="${modalidade}" ${filtrosPainel.modalidade === modalidade ? 'selected' : ''}>${modalidade}</option>`).join('');
    modalidadeFilter.addEventListener('change', (event) => {
      filtrosPainel.modalidade = event.target.value;
      renderModuleContent('painel');
    });
  }

  container.querySelectorAll('.chart-bar').forEach((bar) => {
    bar.addEventListener('mouseenter', () => {
      activeChartBar = bar;
      updateActiveBar(bar);
    });
    bar.addEventListener('click', () => {
      activeChartBar = bar;
      updateActiveBar(bar);
    });
    bar.addEventListener('mouseleave', () => {
      if (activeChartBar === bar) {
        activeChartBar = null;
      }
      bar.classList.remove('active');
      bar.querySelector('.chart-tooltip').style.opacity = '0';
    });
  });
}

function updateActiveBar(bar) {
  document.querySelectorAll('.chart-bar').forEach((item) => item.classList.remove('active'));
  bar.classList.add('active');
  const tooltip = bar.querySelector('.chart-tooltip');
  tooltip.style.opacity = '1';
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
