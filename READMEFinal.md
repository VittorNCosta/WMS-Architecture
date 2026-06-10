# WMS — Warehouse Management System

**TP2 — Sprint 3 | Consolidação Arquitetural**
Engenharia de Software — Arquitetura de Software

Sistema compacto de gestão de armazém (controle de estoque e movimentações
logísticas internas) construído com **Onion Architecture** em TypeScript +
Express, com persistência em arquivo JSON e front-end estático servido pelo
próprio servidor.

> **Idioma:** todo o código-fonte (entidades, casos de uso, repositórios, rotas
> HTTP e chaves de persistência) usa **nomenclatura em inglês**. As **mensagens
> visíveis ao usuário** (validações e textos das telas) permanecem em **português**.

---

## Sumário

1. [Como executar](#como-executar)
2. [Arquitetura](#arquitetura)
3. [Estrutura de pastas](#estrutura-de-pastas)
4. [Autenticação e controle de acesso (RBAC)](#autenticação-e-controle-de-acesso-rbac)
5. [Funcionalidades do sistema](#funcionalidades-do-sistema)
6. [Descrição das implementações e evolução arquitetural — Sprint 3](#descrição-das-implementações-e-evolução-arquitetural--sprint-3)
7. [Testes automatizados](#testes-automatizados)

---

## Como executar

Pré-requisitos: **Node.js >= 18**.

```bash
npm install        # instala dependências
npm run dev        # sobe em modo watch (tsx) — http://localhost:3333
npm start          # sobe sem watch
npm run typecheck  # checagem de tipos (tsc --noEmit)
npm test           # suíte de testes (Vitest)
```

- O servidor sobe em `http://localhost:3333` (configurável via variável `PORT`).
- A raiz `/` serve a tela de **login** (`public/login.html`); após autenticar,
  o usuário chega ao **Menu** com os 8 atalhos do sistema.
- A API fica sob o prefixo `/api`. O status do serviço está em `/status`.
- Na primeira execução, o `seed` cria usuários e localizações de exemplo e grava
  em `data/wms-db.json` (arquivo **não versionado** — fica no `.gitignore`).

---

## Arquitetura

Foi utilizada a **Onion Architecture**, separando a aplicação em camadas para
garantir organização, separação de responsabilidades e **inversão de dependência**
(as camadas internas não conhecem as externas).

```text
┌─────────────────────────────────────────────┐
│ Presentation  (Express: rotas, controllers,  │
│                middlewares, container DI)     │
│   ┌───────────────────────────────────────┐  │
│   │ Application (casos de uso, DTOs)      │  │
│   │   ┌─────────────────────────────────┐ │  │
│   │   │ Domain (entidades, regras,      │ │  │
│   │   │  serviços, contratos, portas)   │ │  │
│   │   └─────────────────────────────────┘ │  │
│   └───────────────────────────────────────┘  │
│ Infrastructure (repositórios JSON, bcrypt,    │
│                 session store) implementa as  │
│                 portas/contratos do Domain    │
└─────────────────────────────────────────────┘
```

**Fluxo principal:**

```text
Controller → UseCase → Repository (contrato no Domain) → JsonDatabase
```

O controller recebe a requisição HTTP, monta o `Actor` a partir do usuário
autenticado, e delega ao caso de uso. O caso de uso aplica a regra de aplicação,
usa serviços/entidades de domínio e acessa os dados por meio de **contratos**
(`I*Repository`), cuja implementação concreta vive na infraestrutura.

---

## Estrutura de pastas

```text
src/
├── domain/                 # Camada central (não depende de ninguém)
│   ├── entities/           # Product, User, Movement, Location, StockItem, AuditTrailEntry
│   ├── enums/              # UserRole, MovementType, AuditOperation
│   ├── services/           # FifoPolicy, LastActiveAdminPolicy, PasswordPolicy, EntityFinder
│   ├── repositories/       # Contratos I*Repository
│   ├── ports/              # IHasher, ISessionStore (inversão de dependência)
│   └── errors/             # DomainError
├── application/            # Casos de uso + DTOs
│   ├── use-cases/          # products, receiving, movement, shipping, stock,
│   │                       #   traceability, authentication, users, locations, audit
│   └── dtos/               # Representações públicas (sem dados sensíveis)
├── infrastructure/         # Implementações concretas
│   ├── persistence/        # JsonDatabase
│   ├── repositories/       # JsonFile*Repository
│   └── security/           # BcryptHasher, InMemorySessionStore
└── presentation/           # Borda HTTP
    ├── http/controllers/   # Um controller por recurso
    ├── http/middlewares/   # authentication, adminAuthorization, requireRoles
    ├── http/routes.ts      # Mapa de rotas + autorização
    ├── container.ts        # Composition root (injeção de dependências)
    └── server.ts           # Bootstrap do Express

public/                     # Front-end estático (8 telas)
└── login, menu, products, receiving, putaway, transfers,
    shipping, stock, traceability, users  (+ session.js)

tests/                      # Vitest (domínio, aplicação, apresentação)
data/wms-db.json            # "Banco" em JSON (gerado em runtime, não versionado)
```

---

## Autenticação e controle de acesso (RBAC)

Todas as rotas de `/api` (exceto `/api/login`) exigem um **token Bearer** válido.

### Credenciais padrão (seed)

| Login   | Senha       | Perfil           |
| ------- | ----------- | ---------------- |
| `admin` | `wyms14623` | ADMIN            |
| `lider` | `wyms14623` | LÍDER DE ESTOQUE |

As senhas são persistidas apenas como **hash bcrypt** (`passwordHash`); o texto
puro nunca é gravado.

### Login

```http
POST /api/login
Content-Type: application/json

{ "login": "admin", "password": "wyms14623" }
```

Resposta `200 OK`:

```json
{
  "token": "<token-hex-64-caracteres>",
  "user": { "id": "...", "name": "Administrador", "login": "admin", "role": "ADMIN" }
}
```

Credenciais inválidas ou usuário inativo → `401` com `{ "error": "Credenciais inválidas." }`.

### Uso do token

```http
Authorization: Bearer <token>
```

- Sem token / token inválido → `401`.
- Token válido, porém **perfil sem permissão** para a operação → `403`.

### Matriz de perfis × processos

| Perfil                                | Processos permitidos                                                                          |
| ------------------------------------- | --------------------------------------------------------------------------------------------- |
| **RECEBIMENTO** (`RECEIVING`)         | Recebimento (`POST /api/receipts`)                                                            |
| **EXPEDIÇÃO** (`SHIPPING`)            | Armazenagem (`POST /api/putaways`) e Expedição (`POST /api/shipments`)                        |
| **LÍDER DE ESTOQUE** (`STOCK_LEADER`) | Recebimento, Armazenagem, Transferência (`POST /api/transfers`) e cadastro de Produtos/Locais |
| **ADMIN**                             | Todos os processos + gestão de usuários e auditoria                                            |

Regras adicionais:

- Escrita de **Produtos** (`POST`/`PUT /api/products`) e **Localizações**
  (`POST`/`PUT`/`PATCH /api/locations`): apenas `STOCK_LEADER` e `ADMIN`.
- **Usuários** (escrita) e **Auditoria** (`GET /api/audit`): apenas `ADMIN`.
- As rotas de **consulta** (`GET`) aceitam qualquer perfil autenticado e ativo.
- Qualquer tentativa fora dessas regras retorna `403`.

---

## Funcionalidades do sistema

O menu principal expõe **8 telas**. A tabela resume cada funcionalidade, sua rota
e o(s) componente(s) principal(is). Os detalhes arquiteturais e os exemplos de
entrada/saída estão na [seção da Sprint 3](#descrição-das-implementações-e-evolução-arquitetural--sprint-3).

| # | Funcionalidade (tela) | Rota(s) principal(is)                          | Caso de uso                         |
|---|-----------------------|------------------------------------------------|-------------------------------------|
| 1 | Produtos              | `POST`/`GET`/`PUT /api/products`               | `CreateProduct`/`GetProduct`/`UpdateProduct` |
| 2 | Recebimento           | `POST /api/receipts`                           | `ProcessInbound`                    |
| 3 | Armazenagem           | `POST /api/putaways`                           | `StoreItem`                         |
| 4 | Movimentações         | `POST /api/transfers`                          | `TransferStock`                     |
| 5 | Expedição             | `POST /api/shipments`                          | `ProcessOutbound`                   |
| 6 | Estoque               | `GET /api/stock`, `GET /api/stock/:productId`  | `GetStockOverview`/`GetBalance`     |
| 7 | Rastreabilidade       | `GET /api/movements`                           | `TraceMovements`                    |
| 8 | Usuários              | `POST`/`GET`/`PUT /api/users`, `PATCH .../status` | `CreateUser`/`UpdateUser`/`ChangeUserStatus`/`GetUser` |
|   | Localizações          | `POST`/`GET`/`PUT /api/locations`, `PATCH .../status` | `CreateLocation`/`UpdateLocation`/`ChangeLocationStatus`/`GetLocation` |
|   | Auditoria (ADMIN)     | `GET /api/audit`                               | `ListAuditTrail`                    |

Capacidades atuais do sistema:

- cadastro / atualização / consulta de **produtos**;
- **recebimento** (entrada) de itens no estoque;
- **armazenagem** (putaway) de itens recebidos em localizações;
- **movimentações** internas (transferência entre localizações);
- **expedição** (saída) de itens do estoque;
- **consulta consolidada** de estoque e saldo por produto;
- **rastreabilidade** completa das movimentações;
- **gerenciamento de usuários** e **de localizações**;
- **autenticação** por senha e **autorização por perfil** (RBAC);
- **trilha de auditoria** operacional;
- **persistência** em arquivo JSON.

### Regras de negócio por entidade (resumo)

- **Produto:** `sku`, `name` e `unitOfMeasure` obrigatórios; `description` opcional.
- **Recebimento/Expedição/Transferência:** consumo de saldo segue **FIFO**
  (lotes mais antigos primeiro), encapsulado em `FifoPolicy`.
- **Transferência:** origem e destino devem ser **diferentes**.
- **Usuário:** `login` único e imutável; `role` deve ser um perfil válido;
  não é possível **inativar/rebaixar o último ADMIN ativo** (`LastActiveAdminPolicy`).
- **Localização:** `code` único; não pode ser inativada com **estoque vinculado**.

---

## Descrição das implementações e evolução arquitetural — Sprint 3

A Sprint 3 consolida a arquitetura e entrega novas funcionalidades que
**atravessam todas as camadas da Onion**. Esta seção descreve, para cada
implementação: a funcionalidade, o fluxo arquitetural, os componentes
envolvidos, a regra de negócio, o mecanismo de persistência/integração,
exemplos de entrada e saída e as melhorias em relação à Sprint 2.

### O que foi implementado na Sprint 3 (visão geral)

1. **Autenticação por senha + sessão** (login real, bcrypt, token Bearer).
2. **Controle de acesso por perfil (RBAC)** — autorização por processo via
   middleware, e renomeação do perfil `OPERATOR` → `STOCK_LEADER` (Líder de Estoque).
3. **Telas e processos de Expedição e Movimentações** — `POST /api/shipments` e
   `POST /api/transfers` agora possuem interface no front (totalizando 8 telas).
4. **Trilha de auditoria operacional** — registro automático de quem fez o quê.
5. **Consolidação do estoque** — extração do `StockOverviewConsolidator`.

---

### Funcionalidade 1 — Autenticação e controle de acesso (RBAC)

**Funcionalidade implementada.** Login com senha e autorização por perfil.
Substitui o login frágil da Sprint 2 (que só validava o `login`, sem senha e sem
proteger rotas). Cada perfil só executa os processos que lhe cabem; o restante
retorna `403`.

**Fluxo arquitetural.**

```text
# Login
AuthController → AuthenticateUser → IHasher (compara senha) + ISessionStore (abre sessão) + IUserRepository

# Demais rotas
Request → authenticationMiddleware (anexa req.user)
        → requireRoles(...) / adminAuthorizationMiddleware (autoriza por perfil)
        → Controller → UseCase
```

**Componentes envolvidos.**

- Presentation: `AuthController`, `authenticationMiddleware`,
  `adminAuthorizationMiddleware`, **`requireRoles`** (fábrica de middleware de
  autorização por perfil), `routes.ts`, `container.ts`.
- Application: `AuthenticateUser`, `Actor` + `actorFromRequest`.
- Domain: `User`, `UserRole`, `PasswordPolicy`, portas `IHasher` e `ISessionStore`.
- Infrastructure: `BcryptHasher`, `InMemorySessionStore`, `JsonFileUserRepository`.

**Regra de negócio implementada.**

- A senha é comparada contra o **hash bcrypt**; o usuário precisa estar **ativo**.
- A **força mínima de senha** é regra de domínio (`PasswordPolicy`).
- Autorização por perfil segue a [matriz](#matriz-de-perfis--processos);
  `requireRoles(...roles)` reutiliza `User.hasRole()` e responde `401` (sem
  usuário) ou `403` (perfil sem permissão).
- O perfil `OPERATOR` foi **renomeado** para `STOCK_LEADER` (Líder de Estoque),
  que executa recebimento + armazenagem + transferência + cadastros.

**Mecanismo de persistência / integração.**

- Usuários em `data/wms-db.json` (coleção `users`) via `JsonFileUserRepository`.
- Sessões em memória (`InMemorySessionStore`) — o token mapeia para o `userId`.

**Exemplos de entrada e saída.**

```http
POST /api/login
{ "login": "lider", "password": "wyms14623" }
```
```json
200 OK
{ "token": "9f3c…", "user": { "id": "d86c…", "name": "Líder de Estoque", "login": "lider", "role": "STOCK_LEADER" } }
```

Tentativa de processo não permitido (perfil RECEBIMENTO chamando armazenagem):

```http
POST /api/putaways
Authorization: Bearer <token-recebimento>
```
```json
403 Forbidden
{ "error": "Seu perfil não tem permissão para executar esta operação." }
```

**Melhorias em relação à Sprint 2.**

- Login agora valida **senha** (bcrypt), não só o `login`.
- **Todas** as rotas passam por `authenticationMiddleware`; operações sensíveis
  por `requireRoles`/`adminAuthorizationMiddleware`.
- Autorização **centralizada** num middleware reutilizável (antes não havia).

---

### Funcionalidade 2 — Expedição e Movimentações (novos processos com interface)

**Funcionalidade implementada.** Duas telas novas que ativam, no front, processos
que antes só existiam no backend: **Expedição** (saída de estoque, retira saldo)
e **Movimentações** (transferência de saldo entre localizações). O menu passou de
6 para **8 botões**.

**Fluxo arquitetural.**

```text
Tela (shipping.html / transfers.html)
  → fetch autenticado (apiFetch)
  → requireRoles(...)                      # autorização por perfil
  → ShippingController / MovementController
  → ProcessOutbound / TransferStock        # aplica FIFO, atualiza saldo
  → IStockRepository / IMovementRepository
  → JsonDatabase
  → registerAuditSafely → IAuditTrailRepository
```

**Componentes envolvidos.**

- Presentation: telas `shipping.html` e `transfers.html`; `ShippingController`,
  `MovementController`; `requireRoles` nas rotas `/shipments` e `/transfers`.
- Application: `ProcessOutbound`, `TransferStock`.
- Domain: `Movement`, `StockItem`, `MovementType`, **`FifoPolicy`**, `EntityFinder`.
- Infrastructure: `JsonFileStockRepository`, `JsonFileMovementRepository`.

**Regra de negócio implementada.**

- **Expedição (`OUTBOUND`)**: consome o estoque do produto pela **FIFO**
  (lotes mais antigos primeiro); lotes zerados são removidos.
- **Transferência (`TRANSFER`)**: origem ≠ destino; consome a origem por FIFO e
  recria o saldo no destino **preservando a data de entrada** (não quebra a FIFO).
- Autorização: Expedição → `SHIPPING`/`STOCK_LEADER`/`ADMIN`;
  Transferência → `STOCK_LEADER`/`ADMIN`.

**Mecanismo de persistência / integração.**

- Saldo na coleção `stock` e histórico na coleção `movements` de `data/wms-db.json`.

**Exemplos de entrada e saída.**

```http
POST /api/shipments
Authorization: Bearer <token>
{ "productId": "3002…", "quantity": 50, "userId": "5d0f…", "referenceDocument": "NF-77" }
```
```json
201 Created
{ "id": "a1b2…", "type": "OUTBOUND", "productId": "3002…", "quantity": 50,
  "sourceLocationId": null, "destinationLocationId": null, "userId": "5d0f…",
  "referenceDocument": "NF-77", "timestamp": "2026-06-09T22:30:00.000Z" }
```

```http
POST /api/transfers
Authorization: Bearer <token>
{ "productId": "3002…", "sourceLocationId": "996e…", "destinationLocationId": "d8f1…", "quantity": 100, "userId": "d86c…" }
```
```json
201 Created
{ "id": "c3d4…", "type": "TRANSFER", "productId": "3002…", "quantity": 100,
  "sourceLocationId": "996e…", "destinationLocationId": "d8f1…", "userId": "d86c…",
  "referenceDocument": null, "timestamp": "2026-06-09T22:31:00.000Z" }
```

**Melhorias em relação à Sprint 2.**

- Processos de saída e transferência ganharam **interface de usuário** e
  **autorização por perfil** (antes inacessíveis pelo front e sem RBAC).
- Reuso da **mesma `FifoPolicy`** de domínio em recebimento, expedição e
  transferência — regra única, testável, sem duplicação.

---

### Funcionalidade 3 — Trilha de auditoria operacional

**Funcionalidade implementada.** Registro automático e imutável de **quem fez o
quê**: cada operação relevante (login, criação, atualização, mudança de status e
movimentação de estoque) gera uma entrada com o ator, a operação, a entidade
afetada e um resumo legível. Há uma rota de consulta (somente leitura, ADMIN).

**Fluxo arquitetural.**

```text
Controller → (Actor a partir do req.user) → UseCase
  → registerAuditSafely → IAuditTrailRepository → JsonDatabase

# Consulta
AuditController → ListAuditTrail → IAuditTrailRepository
```

**Componentes envolvidos.** `AuditController`, `actorFromRequest`, `Actor`,
`ListAuditTrail`, `registerAuditSafely`, `AuditTrailEntry`, `AuditOperation`,
`IAuditTrailRepository`, `JsonFileAuditTrailRepository`.

**Regra de negócio implementada.**

- Toda operação de escrita registra uma entrada com o **ator real**.
- A gravação da auditoria **nunca propaga exceção** ao caso de uso chamador
  (efeito colateral tolerante a falhas — confiabilidade do negócio vem antes).
- Consulta **restrita a ADMIN**; entradas devolvidas da mais recente para a mais antiga.

**Mecanismo de persistência / integração.** Coleção `audit` em `data/wms-db.json`
(mesmo padrão `JsonFile*Repository` das demais entidades).

**Exemplos de entrada e saída.**

```http
GET /api/audit?entityType=Product
Authorization: Bearer <token-admin>
```
```json
200 OK
[
  { "id": "5b67…", "occurredAt": "2026-05-31T16:57:36.563Z", "actorUserId": "5cd8…",
    "actorLogin": "admin", "operation": "CREATE", "entityType": "Product",
    "entityId": "76e3…", "summary": "Produto \"SKU-1\" cadastrado." }
]
```

Qualquer perfil não-ADMIN recebe `403 Forbidden`.

**Melhorias em relação à Sprint 2.** Não havia rastro de operações administrativas;
agora há trilha auditável, desacoplada do fluxo principal e sem vazar dados sensíveis.

---

### Funcionalidade 4 — Consolidação do estoque (refatoração estrutural)

**Funcionalidade implementada.** A visão consolidada do estoque
(`GET /api/stock`) deixou de ser um método "faz-tudo": `GetStockOverview` orquestra
a I/O e **delega a agregação/enriquecimento/ordenação** ao serviço de aplicação
`StockOverviewConsolidator`.

**Fluxo arquitetural.**
```text
StockController → GetStockOverview → IStockRepository/IProductRepository/ILocationRepository
              → StockOverviewConsolidator (agrega + enriquece + ordena)
```

**Componentes envolvidos.** `StockController`, `GetStockOverview`,
`StockOverviewConsolidator`, contratos `IStockRepository`, `IProductRepository`,
`ILocationRepository`; DTOs `StockRow`/`StockOverviewResult`.

**Regra de negócio implementada.** Soma de saldo por produto×localização,
enriquecimento com SKU/nome/código e totais (`totalQuantity`, `totalRecords`).

**Mecanismo de persistência / integração.** Leitura das coleções `stock`,
`products` e `locations` de `data/wms-db.json`.

**Exemplo de saída (`GET /api/stock`).**
```json
{
  "items": [
    { "productId": "3002…", "productSku": "CANETA-AZUL", "productName": "Caneta Azul",
      "locationId": "d8f1…", "locationCode": "A-01-01", "locationDescription": "Rua A…", "quantity": 100 }
  ],
  "totalQuantity": 100,
  "totalRecords": 1
}
```

**Melhorias em relação à Sprint 2.** Resolve a observação de "método faz-tudo /
baixa coesão": responsabilidade de agregação isolada e testável.

---

### Pontos da arquitetura que foram melhorados (Sprint 2 → Sprint 3)

| Ponto apontado na Sprint 2 | Correção aplicada na Sprint 3 |
| --- | --- |
| "o login só valida o login, sem senha" | Autenticação por senha com bcrypt (`AuthenticateUser` + `IHasher`/`BcryptHasher` + `PasswordPolicy`). |
| "as rotas da API não parecem protegidas por middleware" | `authenticationMiddleware` em todas as rotas; `requireRoles`/`adminAuthorizationMiddleware` nas restritas. |
| "a regra do último ADMIN aparece espalhada em mais de um caso de uso" | Centralizada em `LastActiveAdminPolicy`, reutilizada por `UpdateUser` e `ChangeUserStatus`. |
| "`listar()` virou um método faz-tudo / baixa coesão" | `GetStockOverview` orquestra I/O e delega a agregação ao `StockOverviewConsolidator`. |
| ".claude / node_modules na entrega" | Ambos no `.gitignore`, fora do versionamento. |

Melhorias estruturais adicionais:

- **Portas de domínio** (`IHasher`, `ISessionStore`) com implementações na
  infraestrutura — reforço da inversão de dependência.
- **DTOs de aplicação** isolando a serialização HTTP do modelo de domínio
  (campos sensíveis como `passwordHash` nunca vazam).
- **Auditoria como efeito colateral tolerante a falhas** (`registerAuditSafely`).
- **Autorização por perfil reutilizável** (`requireRoles`) aplicada por processo.
- **Padronização de nomenclatura em inglês** em todas as camadas; mensagens ao
  usuário permanecem em português.

### Decisões arquiteturais mantidas ou ajustadas

**Mantidas:**

- Onion Architecture e o fluxo `Controller → UseCase → Repository → JsonDatabase`.
- Persistência em **arquivo JSON** (`JsonDatabase` + `JsonFile*Repository`).
- Inversão de dependência por **contratos** no domínio (`I*Repository`, portas).
- DTOs na borda HTTP e `DomainError` traduzido pelo `errorHandler`
  (`DomainError` → `422`; demais → `500`; autorização → `401`/`403`).

**Ajustadas/estendidas:**

- O `Actor` (identidade do usuário autenticado) passou a fluir do controller
  para os casos de uso, alimentando a auditoria.
- Autorização evoluiu de "somente ADMIN" para **RBAC por processo** via
  `requireRoles`, sem acoplar regra de autorização aos casos de uso.
- Perfil `OPERATOR` renomeado para `STOCK_LEADER` (com migração do dado de seed).

---

## Testes automatizados

A suíte (`npm test`, Vitest) cobre domínio, serviços e funcionalidades de
aplicação/apresentação:

- **Domínio:** `User`, `Location`, `FifoPolicy`, `AuditTrailEntry`,
  `LastActiveAdminPolicy`.
- **Aplicação:** `AuthenticateUser`, `ListAuditTrail`, `registerAuditSafely`,
  `StockOverviewConsolidator`, `ChangeUserStatus`, `ChangeLocationStatus`.
- **Apresentação:** `requireRoles` (autorização por perfil: libera perfil
  permitido, `403` para não permitido, `401` sem usuário).

Execute:

```bash
npm run typecheck   # sem erros de tipo
npm test            # todos os testes verdes
```
