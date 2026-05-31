# WMS - Warehouse Management System

## Autenticação

A partir desta versão, todas as rotas de `/api` (exceto `/api/login`) exigem um token Bearer válido.

### Credenciais padrão (seed)

| Login      | Senha       | Perfil   |
| ---------- | ----------- | -------- |
| `admin`    | `trocar123` | ADMIN    |
| `operador` | `trocar123` | OPERADOR |

Essas credenciais são criadas automaticamente na primeira execução, ou já estão presentes no `data/wms-db.json` versionado. As senhas ficam armazenadas como hash bcrypt (`passwordHash`) — o texto puro nunca é persistido.

### Como fazer login

```http
POST /api/login
Content-Type: application/json

{
  "login": "admin",
  "password": "trocar123"
}
```

Resposta de sucesso (`200 OK`):

```json
{
  "token": "<token-hex-64-caracteres>",
  "user": {
    "id": "...",
    "nome": "Administrador",
    "login": "admin",
    "perfil": "ADMIN"
  }
}
```

Em caso de credenciais incorretas ou usuário inativo, a resposta é `401 Unauthorized` com `{ "erro": "Credenciais inválidas." }`.

### Como usar o token nas demais rotas

Inclua o header `Authorization` em toda requisição autenticada:

```http
Authorization: Bearer <token>
```

- Sem token / token inválido → `401`.
- Token válido mas perfil insuficiente (ex.: OPERADOR tentando criar usuário) → `403`.

### Quais rotas exigem ADMIN

- `POST /api/usuarios`
- `PUT /api/usuarios/:id`
- `PATCH /api/usuarios/:id/status`

Todas as demais rotas autenticadas aceitam qualquer perfil ativo.

---

## Arquitetura escolhida!

Foi utilizada a Onion Architecture.

A aplicação foi separada em camadas para manter organização, separação de responsabilidades e desacoplamento entre domínio, aplicação, interface e persistência.

Camadas utilizadas:

- Presentation
- Application
- Domain
- Infrastructure

---

# Fluxo iniciado!

O fluxo principal da aplicação segue o padrão:

```text
Controller -> UseCase -> Repository -> JsonDatabase
```

O controller recebe a requisição, o caso de uso executa a regra da aplicação, o repositório acessa os dados e a persistência realiza armazenamento ou consulta.

---

# Principais pastas do projeto!

## presentation

Responsável pelas rotas HTTP e controllers.

---

## application

Responsável pelos casos de uso e fluxo operacional da aplicação.

---

## domain

Camada central da aplicação.

Contém:
- entidades
- regras de negócio
- contratos de repositórios
- política FIFO

---

## infrastructure

Responsável pela persistência e implementação dos repositórios.

---

# Está funcionando!

Atualmente o sistema possui:

- cadastro de produtos
- atualização de produtos
- consulta de produtos
- entrada de estoque
- saída de estoque
- movimentações internas
- transferências de estoque
- rastreabilidade das movimentações
- gerenciamento de usuários
- gerenciamento de localizações
- persistência em arquivos JSON

---

# Descrição das implementações e fluxo arquitetural

# Funcionalidade 1 - Cadastro de Produtos

## Nome da funcionalidade

Cadastro de produtos.

---

## Onde o fluxo começa

O fluxo começa nas rotas de produtos.

```text
/api/produtos
```

---

## Quais componentes participam

```text
Controller -> UseCase -> Repository -> Persistência
```

Componentes envolvidos:

- ProdutosController
- CadastrarProduto
- IProdutoRepository
- JsonFileProdutoRepository

---

## Onde fica a regra de negócio

As regras ficam nas camadas Domain e Application.

Principais regras:
- validação dos dados do produto
- cadastro do produto
- controle da entidade

---

## Onde os dados são armazenados ou consultados

Os dados são armazenados no arquivo:

```text
data/wms-db.json
```

na coleção de produtos.

---

## Como executar ou testar

Executar a rota:

- POST `/api/produtos`

---

## Resultado esperado

O sistema deve cadastrar e armazenar corretamente o produto.

---

# Funcionalidade 2 - Movimentação de Estoque

## Nome da funcionalidade

Movimentação de estoque.

---

## Onde o fluxo começa

O fluxo começa nas rotas:

- `/api/recebimentos`
- `/api/expedicoes`
- `/api/movimentacoes`

---

## Quais componentes participam

```text
Controller -> UseCase -> Repository -> Persistência
```

Componentes envolvidos:

- RecebimentoController
- ExpedicaoController
- ProcessarEntrada
- ProcessarSaida
- TransferirSaldo
- IMovimentacaoRepository
- JsonFileMovimentacaoRepository

---

## Onde fica a regra de negócio

As regras ficam nas camadas Domain e Application.

Principais regras:

- controle de saldo
- rastreabilidade
- movimentação interna
- política FIFO

---

## Onde os dados são armazenados ou consultados

Os dados são armazenados no arquivo:

```text
data/wms-db.json
```

nas coleções de estoque e movimentações.

---

## Como executar ou testar

Executar as rotas:

- POST `/api/recebimentos`
- POST `/api/expedicoes`
- GET `/api/movimentacoes`

---

## Resultado esperado

O sistema deve atualizar o saldo do estoque e registrar corretamente as movimentações.

---

# Funcionalidade 3 - Gerenciamento de Usuários

## Nome da funcionalidade

Gerenciamento de usuários.

---

## Onde o fluxo começa

O fluxo começa nas rotas:

```text
/api/usuarios
```

---

## Quais componentes participam

```text
Controller -> UseCase -> Repository -> Persistência
```

Componentes envolvidos:

- UsuariosController
- CadastrarUsuario
- AtualizarUsuario
- AlterarStatusUsuario
- ConsultarUsuario
- IUsuarioRepository
- JsonFileUsuarioRepository

---

## Onde fica a regra de negócio

As regras ficam nas camadas Domain e Application.

Principais regras:

- login obrigatório
- login único
- validação de perfil
- impedir inativar o último administrador ativo

---

## Onde os dados são armazenados ou consultados

Os dados são armazenados no arquivo:

```text
data/wms-db.json
```

na coleção de usuários.

---

## Como executar ou testar

Executar as rotas:

- POST `/api/usuarios`
- GET `/api/usuarios`
- PUT `/api/usuarios/:id`
- PATCH `/api/usuarios/:id/status`

---

## Resultado esperado

O sistema deve:

- cadastrar usuários
- consultar usuários
- atualizar usuários
- alterar status do usuário
- validar regras de administrador

---

# Funcionalidade 4 - Gerenciamento de Localizações

## Nome da funcionalidade

Gerenciamento de localizações.

---

## Onde o fluxo começa

O fluxo começa nas rotas:

```text
/api/localizacoes
```

---

## Quais componentes participam

```text
Controller -> UseCase -> Repository -> Persistência
```

Componentes envolvidos:

- LocalizacoesController
- CadastrarLocalizacao
- AtualizarLocalizacao
- AlterarStatusLocalizacao
- ConsultarLocalizacao
- ILocalizacaoRepository
- JsonFileLocalizacaoRepository

---

## Onde fica a regra de negócio

As regras ficam nas camadas Domain e Application.

Principais regras:

- código obrigatório
- código único
- impedir inativar localização com estoque vinculado

---

## Onde os dados são armazenados ou consultados

Os dados são armazenados no arquivo:

```text
data/wms-db.json
```

na coleção de localizações.

---

## Como executar ou testar

Executar as rotas:

- POST `/api/localizacoes`
- GET `/api/localizacoes`
- PUT `/api/localizacoes/:id`
- PATCH `/api/localizacoes/:id/status`

---

## Resultado esperado

O sistema deve:

- cadastrar localizações
- consultar localizações
- atualizar localizações
- alterar status
- validar estoque vinculado antes da inativação

---

# Descrição das implementações e evolução arquitetural - Sprint 3

## Funcionalidade implementada — Trilha de Auditoria operacional

A Sprint 3 adiciona uma **trilha de auditoria** que registra automaticamente
quem fez o quê no sistema: cada operação relevante (login, cadastro, atualização,
mudança de status e movimentação de estoque) gera uma entrada imutável com o
**ator** (usuário autenticado), a operação, a entidade afetada e um resumo legível.

Uma rota de consulta (somente leitura, restrita a ADMIN) permite listar e filtrar
essas entradas.

---

## Fluxo arquitetural

```text
Controller -> (Actor a partir do req.user) -> UseCase -> registerAuditSafely -> IAuditTrailRepository -> JsonDatabase
```

- O **authenticationMiddleware** anexa `req.user`.
- O **controller** monta o `Actor` (`actorFromRequest`) e o repassa ao caso de uso.
- O **caso de uso** executa sua regra principal e, ao final, chama
  `registerAuditSafely`, que grava a entrada **sem nunca derrubar a operação
  principal** (auditoria é efeito colateral — confiabilidade vem antes).
- A consulta segue: `AuditoriaController -> ListAuditTrail -> IAuditTrailRepository`.

---

## Componentes envolvidos

- `AuditoriaController` (presentation)
- `actorFromRequest` (presentation) + `Actor` (application)
- `ListAuditTrail` (application — consulta com filtros)
- `registerAuditSafely` (application — gravação tolerante a falhas)
- `AuditTrailEntry` (domain — entidade imutável) e `AuditOperation` (domain — enum)
- `IAuditTrailRepository` (domain — contrato)
- `JsonFileAuditTrailRepository` (infrastructure — persistência)

---

## Regra de negócio implementada

- Toda operação de escrita registra uma entrada de auditoria com o ator real.
- A gravação da auditoria **nunca propaga exceção** para o caso de uso chamador
  (falha de auditoria é logada, não interrompe o negócio).
- A consulta da trilha é **restrita a ADMIN** (dado sensível).
- As entradas são sempre devolvidas da mais recente para a mais antiga.

---

## Mecanismo de persistência

Os dados são gravados no arquivo `data/wms-db.json`, na coleção `auditoria`,
seguindo o mesmo padrão `JsonFile*Repository` das demais entidades.

---

## Como executar e testar

- `GET /api/auditoria` (header `Authorization: Bearer <token>` de um ADMIN)
- Filtros opcionais por query string: `de`, `ate` (ISO 8601), `entityType`, `entityId`

Exemplo de entrada:

```http
GET /api/auditoria?entityType=Produto
Authorization: Bearer <token-admin>
```

Exemplo de saída (`200 OK`):

```json
[
  {
    "id": "5b676976-...",
    "ocorridoEm": "2026-05-31T16:57:36.563Z",
    "atorUserId": "5cd824d9-...",
    "atorLogin": "admin",
    "operacao": "CREATE",
    "tipoEntidade": "Produto",
    "entidadeId": "76e3de86-...",
    "resumo": "Produto \"SKU-1\" cadastrado."
  }
]
```

Um OPERADOR autenticado recebe `403 Forbidden` ao acessar a rota.

---

## Melhorias arquiteturais em relação à Sprint 2

- **Portas de domínio**: segurança passou a depender de abstrações
  (`IHasher`, `ISessionStore`) em `domain/ports`, com implementações concretas
  (`BcryptHasher`, `InMemorySessionStore`) na infraestrutura — reforçando a
  inversão de dependência.
- **Serviços de domínio dedicados** para regras que estavam dispersas:
  `LastActiveAdminPolicy`, `PasswordPolicy` e `EntityFinder`, aumentando a coesão.
- **DTOs de aplicação** (`application/dtos`) isolando o que é serializado na borda
  HTTP do modelo de domínio (campos sensíveis como `passwordHash` nunca vazam).
- **Auditoria como efeito colateral tolerante a falhas**, sem acoplar o caso de
  uso principal à persistência da trilha.
- **Padronização de nomenclatura** do domínio em português (remoção das entidades
  e validadores duplicados em inglês), eliminando ambiguidade entre camadas.