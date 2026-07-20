/*
  Estrutura de Permissões para o módulo "Permissões e Usuários"
  Inclui: modelos de DB, árvore hierárquica de permissões no frontend,
  middleware de validação e exemplo prático de interface.
*/

// ----- 1. Modelos de Banco de Dados -----

// SQL de exemplo para PostgreSQL / MySQL
const sqlSchema = `
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(64) UNIQUE NOT NULL,
  label VARCHAR(128) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module VARCHAR(100) NOT NULL,
  action VARCHAR(100) NOT NULL,
  field_name VARCHAR(100),
  description VARCHAR(255),
  UNIQUE(module, action, field_name)
);

CREATE TABLE role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY(role_id, permission_id)
);

CREATE TABLE user_roles (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY(user_id, role_id)
);
`;

// Exemplo de permissões base
const permissionRows = [
  { module: 'licitacao', action: 'visualizar', field_name: null, description: 'Ver lista e detalhes de licitações' },
  { module: 'licitacao', action: 'editar', field_name: null, description: 'Editar dados da licitação' },
  { module: 'licitacao', action: 'excluir', field_name: null, description: 'Excluir licitação' },
  { module: 'licitacao', action: 'visualizar', field_name: 'valor', description: 'Ver campo valor da licitação' },
  { module: 'usuario', action: 'visualizar', field_name: null, description: 'Ver usuários cadastrados' },
  { module: 'usuario', action: 'editar', field_name: null, description: 'Editar usuário' },
  { module: 'usuario', action: 'excluir', field_name: null, description: 'Excluir usuário' },
  { module: 'fornecedor', action: 'visualizar', field_name: null, description: 'Ver fornecedores' },
  { module: 'fornecedor', action: 'cadastrar', field_name: null, description: 'Cadastrar novo fornecedor' }
];

// ----- 2. Sistema de Caixas de Seleção (Frontend) -----

const permissionsTree = [
  {
    module: 'licitacao',
    label: 'Licitação',
    children: [
      { action: 'visualizar', label: 'Visualizar', field_name: null },
      { action: 'editar', label: 'Editar', field_name: null },
      { action: 'excluir', label: 'Excluir', field_name: null },
      {
        action: 'campos',
        label: 'Campos',
        children: [
          { action: 'visualizar', field_name: 'valor', label: 'Valor' },
          { action: 'visualizar', field_name: 'prazos', label: 'Prazos' },
          { action: 'visualizar', field_name: 'fornecedor', label: 'Fornecedor' }
        ]
      }
    ]
  },
  {
    module: 'fornecedor',
    label: 'Fornecedor',
    children: [
      { action: 'visualizar', label: 'Visualizar' },
      { action: 'cadastrar', label: 'Cadastrar' },
      { action: 'editar', label: 'Editar' },
      { action: 'excluir', label: 'Excluir' }
    ]
  },
  {
    module: 'usuario',
    label: 'Usuários',
    children: [
      { action: 'visualizar', label: 'Visualizar' },
      { action: 'editar', label: 'Editar' },
      { action: 'excluir', label: 'Excluir' }
    ]
  }
];

function renderPermissionsTree(tree, container) {
  const html = tree.map((node) => `
    <div class="permission-group">
      <label>
        <input type="checkbox" data-module="${node.module}" data-action="${node.action || ''}" data-field="${node.field_name || ''}" class="permission-checkbox" />
        <span class="permission-title">${node.label}</span>
      </label>
      ${node.children ? `
        <div class="permission-children">
          ${renderPermissionsTree(node.children, container)}
        </div>
      ` : ''}
    </div>
  `).join('');

  if (container) container.innerHTML = html;
  return html;
}

function syncParentChildCheckboxes(rootElement) {
  const checkboxes = Array.from(rootElement.querySelectorAll('.permission-checkbox'));

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      const module = checkbox.dataset.module;
      const action = checkbox.dataset.action;
      const field = checkbox.dataset.field;

      const childSelector = `[data-module="${module}"][data-action="${action}"][data-field]:not([data-field=""])`;
      const children = Array.from(rootElement.querySelectorAll(childSelector));

      // Checa/descheca filhos do mesmo módulo/ação
      if (children.length) {
        children.forEach((child) => {
          child.checked = checkbox.checked;
          child.indeterminate = false;
        });
      }

      // Atualiza pai se houver
      const parentCheckbox = checkbox.closest('.permission-group')?.parentElement?.closest('.permission-group')?.querySelector('.permission-checkbox');
      if (parentCheckbox) {
        const siblingCheckboxes = Array.from(parentCheckbox.closest('.permission-group').querySelectorAll('.permission-children .permission-checkbox'));
        const allChecked = siblingCheckboxes.every((item) => item.checked);
        const noneChecked = siblingCheckboxes.every((item) => !item.checked);
        parentCheckbox.checked = allChecked;
        parentCheckbox.indeterminate = !allChecked && !noneChecked;
      }
    });
  });
}

// ----- 3. Middleware de Segurança Backend -----

const express = require('express');

function loadUserPermissions(req, res, next) {
  // Exemplo: carregar do banco de dados e anexar ao req.user
  // req.user = { id, nome, email, roles: [...], permissions: [...] }
  next();
}

function hasPermission(user, module, action, field = null) {
  if (!user || !Array.isArray(user.permissions)) return false;
  return user.permissions.some((perm) => {
    return perm.module === module && perm.action === action && (perm.field_name === field || perm.field_name === null);
  });
}

function authorize(module, action, field = null) {
  return (req, res, next) => {
    if (hasPermission(req.user, module, action, field)) {
      return next();
    }
    return res.status(403).json({ message: 'Acesso negado' });
  };
}

function authorizeField(module, action, field) {
  return (req, res, next) => {
    if (hasPermission(req.user, module, action, field) || hasPermission(req.user, module, action, null)) {
      return next();
    }
    return res.status(403).json({ message: 'Campo não autorizado' });
  };
}

// Uso no Express
// app.get('/api/licitacoes', authorize('licitacao', 'visualizar'), handler);
// app.post('/api/licitacoes/:id', authorize('licitacao', 'editar'), handler);
// app.get('/api/licitacoes/:id/valor', authorizeField('licitacao', 'visualizar', 'valor'), handler);

// ----- 4. Exemplo prático do comportamento para usuário X -----

const exampleUserX = {
  id: 'user-x',
  nome: 'Usuário X',
  email: 'x@exemplo.com',
  permissions: [
    { module: 'licitacao', action: 'visualizar', field_name: null, description: 'Ver licitações' }
  ]
};

function renderLicitacaoInterface(user) {
  const canView = hasPermission(user, 'licitacao', 'visualizar');
  const canEdit = hasPermission(user, 'licitacao', 'editar');
  const canDelete = hasPermission(user, 'licitacao', 'excluir');
  const canViewValor = hasPermission(user, 'licitacao', 'visualizar', 'valor');

  return {
    showList: canView,
    showEditButton: canEdit,
    showDeleteButton: canDelete,
    fields: {
      valor: canViewValor ? 'visible' : 'hidden',
      prazo: 'visible'
    }
  };
}

const interfaceForUserX = renderLicitacaoInterface(exampleUserX);

module.exports = {
  sqlSchema,
  permissionRows,
  permissionsTree,
  renderPermissionsTree,
  syncParentChildCheckboxes,
  loadUserPermissions,
  authorize,
  authorizeField,
  exampleUserX,
  interfaceForUserX
};
