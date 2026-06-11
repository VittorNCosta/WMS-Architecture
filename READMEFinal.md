# WMS - Warehouse Management System

**TP2 - Sprint 3 | Consolidação Arquitetural**
Engenharia de Software - Arquitetura de Software

Sistema de gestão de armazém (controle de estoque e movimentações logísticas
internas) construído com Onion Architecture em TypeScript + Express. A
persistência é feita em arquivo JSON e o front-end estático é servido pelo
próprio servidor.

Obs.: o código-fonte (entidades, casos de uso, repositórios, rotas HTTP e
chaves de persistência) usa nomenclatura em inglês. As mensagens visíveis ao
usuário (validações e textos das telas) permanecem em português.

---

## Sumário

1. [Como executar](#como-executar)
2. [Arquitetura](#arquitetura)
3. [Estrutura de pastas](#estrutura-de-pastas)
4. [Autenticação e controle de acesso (RBAC)](#autenticação-e-controle-de-acesso-rbac)
5. [Funcionalidades do sistema](#funcionalidades-do-sistema)
6. [Descrição das implementações e evolução arquitetural - Sprint 3](#descrição-das-implementações-e-evolução-arquitetural---sprint-3)
7. [Testes automatizados](#testes-automatizados)

---

## Como executar

Pré-requisito: Node.js 18 ou superior.

```bash
npm install        # instala dependências
npm run dev        # sobe em modo watch (tsx) - http://localhost:3333
npm start          # sobe sem watch
npm run typecheck  # checagem de tipos (tsc --noEmit)
npm test           # suíte de testes (Vitest)
```

- O servidor sobe em `http://localhost:3333` (a porta pode ser trocada pela
  variável de ambiente `PORT`).
- A raiz `/` serve a tela de login (`public/login.html`). Depois de autenticar,
  o usuário cai no Menu com os 8 atalhos do sistema.
- A API fica sob o prefixo `/api`. O status do serviço está em `/status`.
- Na primeira execução, o seed cria usuários e localizações de exemplo e grava
  tudo em `data/wms-db.json` (arquivo não versionado, está no `.gitignore`).

---

## Arquitetura

Foi utilizada a **Onion Architecture**, separando a aplicação em camadas para
garantir organização, separação de responsabilidades e inversão de dependência
(as camadas internas não conhecem as externas).


┌─────────────────────────────────────────────┐
│ Presentation  (Express: rotas, controllers, │
│                middlewares, container DI)   │
│   ┌───────────────────────────────────────┐ │
│   │ Application (casos de uso, DTOs)      │ │
│   │   ┌─────────────────────────────────┐ │ │
│   │   │ Domain (entidades, regras,      │ │ │
│   │   │  serviços, contratos, portas)   │ │ │
│   │   └─────────────────────────────────┘ │ │
│   └───────────────────────────────────────┘ │
│ Infrastructure (repositórios JSON, bcrypt,  │
│                 session store) implementa as│
│                 portas/contratos do Domain  │
└─────────────────────────────────────────────┘


Fluxo principal:

```text
Controller -> UseCase -> Repository (contrato no Domain) -> JsonDatabase
```

O controller recebe a requisição HTTP, monta o `Actor` a partir do usuário
autenticado e delega ao caso de uso. O caso de uso aplica a regra de aplicação,
usa os serviços e entidades de domínio e acessa os dados por meio de contratos
(`I*Repository`), cuja implementação concreta fica na infraestrutura.



## Estrutura de pastas


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




## Autenticação e controle de acesso (RBAC)

Todas as rotas de `/api` (exceto `/api/login`) exigem um token Bearer válido.

### Credenciais padrão (seed)

| Login   | Senha       | Perfil           |
| ------- | ----------- | ---------------- |
| `admin` | `wyms14623` | ADMIN            |
| `lider` | `wyms14623` | LÍDER DE ESTOQUE |

As senhas são persistidas apenas como hash bcrypt (`passwordHash`); o texto
puro nunca é gravado.

### Login


POST /api/login
Content-Type: application/json

{ "login": "admin", "password": "wyms14623" }

Resposta `200 OK`:

```json
{
  "token": "<token-hex-64-caracteres>",
  "user": { "id": "...", "name": "Administrador", "login": "admin", "role": "ADMIN" }
}
```

Credenciais inválidas ou usuário inativo retornam `401` com
`{ "error": "Credenciais inválidas." }`.

### Uso do token

```http
Authorization: Bearer <token>
```

- Sem token / token inválido: `401`.
- Token válido, porém perfil sem permissão para a operação: `403`.

### Matriz de perfis x processos

| Perfil                                | Processos permitidos                                                                          |
| ------------------------------------- | --------------------------------------------------------------------------------------------- |
| **RECEBIMENTO** (`RECEIVING`)         | Recebimento (`POST /api/receipts`)                                                            |
| **EXPEDIÇÃO** (`SHIPPING`)            | Armazenagem (`POST /api/putaways`) e Expedição (`POST /api/shipments`)                        |
| **LÍDER DE ESTOQUE** (`STOCK_LEADER`) | Recebimento, Armazenagem, Transferência (`POST /api/transfers`) e cadastro de Produtos/Locais |
| **ADMIN**                             | Todos os processos + gestão de usuários e auditoria                                            |

Regras adicionais:

- Escrita de Produtos (`POST`/`PUT /api/products`) e de Localizações
  (`POST`/`PUT`/`PATCH /api/locations`): apenas `STOCK_LEADER` e `ADMIN`.
- Usuários (escrita) e Auditoria (`GET /api/audit`): apenas `ADMIN`.
- As rotas de consulta (`GET`) aceitam qualquer perfil autenticado e ativo.
- Qualquer tentativa fora dessas regras retorna `403`.

---

## Funcionalidades do sistema

O menu principal expõe 8 telas. A tabela abaixo resume cada funcionalidade,
sua rota e o caso de uso principal. As implementações novas da Sprint 3 estão
detalhadas na seção "Descrição das implementações e evolução arquitetural -
Sprint 3"; as demais funcionalidades estão detalhadas logo abaixo, na
subseção "Detalhamento das demais funcionalidades".

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

- cadastro / atualização / consulta de produtos;
- recebimento (entrada) de itens no estoque;
- armazenagem (putaway) de itens recebidos em localizações;
- movimentações internas (transferência entre localizações);
- expedição (saída) de itens do estoque;
- consulta consolidada de estoque e saldo por produto;
- rastreabilidade completa das movimentações;
- gerenciamento de usuários e de localizações;
- autenticação por senha e autorização por perfil (RBAC);
- trilha de auditoria operacional;
- persistência em arquivo JSON.

### Regras de negócio por entidade (resumo)

- Produto: `sku`, `name` e `unitOfMeasure` obrigatórios; `description` opcional.
- Recebimento/Expedição/Transferência: o consumo de saldo segue FIFO
  (lotes mais antigos primeiro), encapsulado em `FifoPolicy`.
- Transferência: origem e destino devem ser diferentes.
- Usuário: `login` único e imutável; `role` deve ser um perfil válido;
  não é possível inativar/rebaixar o último ADMIN ativo (`LastActiveAdminPolicy`).
- Localização: `code` único; não pode ser inativada com estoque vinculado.

### Detalhamento das demais funcionalidades

As quatro implementações novas da Sprint 3 (Autenticação/RBAC, Expedição e
Movimentações, Auditoria e Consolidação do estoque) estão na seção da Sprint 3.
As funcionalidades abaixo completam o escopo do sistema.

Em todos os exemplos é preciso enviar o header `Authorization: Bearer <token>`.
Violações de regra de negócio retornam `422` com `{ "error": "<mensagem>" }`
(`DomainError` traduzido pelo `errorHandler`); buscar uma entidade que não
existe também resulta em `DomainError`.

#### Produtos (cadastro, atualização e consulta)

**Fluxo:**
`ProductsController -> CreateProduct / UpdateProduct / GetProduct -> IProductRepository -> JsonDatabase`

**Regra de negócio:** `sku`, `name` e `unitOfMeasure` são obrigatórios e o SKU
é único (tentativa duplicada retorna `422`); `description` é opcional. O `PUT`
altera `name`, `description`, `unitOfMeasure` e `active` (o `sku` é imutável).
A escrita é restrita a `STOCK_LEADER`/`ADMIN` e gera entrada na auditoria.

**Persistência:** coleção `products` de `data/wms-db.json` (`JsonFileProductRepository`).

**Exemplos de entrada e saída:**

```http
POST /api/products
Authorization: Bearer <token>
{ "sku": "CANETA-AZUL", "name": "Caneta Azul", "unitOfMeasure": "UN", "description": "Caneta esferográfica azul" }
```
```json
201 Created
{ "id": "3002...", "sku": "CANETA-AZUL", "name": "Caneta Azul",
  "description": "Caneta esferográfica azul", "unitOfMeasure": "UN", "active": true }
```

SKU repetido: `422` com `{ "error": "Já existe um produto com o SKU \"CANETA-AZUL\"." }`.
Consulta: `GET /api/products` devolve `200` com a lista e `GET /api/products/:id`
devolve `200` com o produto.

#### Recebimento (entrada de itens no estoque)

**Fluxo:**
```text
ReceivingController.receive -> ProcessInbound
  -> IProductRepository / IUserRepository / ILocationRepository (validações)
  -> IStockRepository (cria lote) + IMovementRepository (movimento INBOUND)
  -> JsonDatabase -> registerAuditSafely
```

**Regra de negócio:** o produto deve existir e estar ativo; o usuário deve
existir; `quantity` deve ser positiva; `locationId` é opcional (o item pode
entrar "sem localização" e ser endereçado depois na armazenagem). Cada
recebimento cria um lote (`StockItem` com `entryDate`) - é esse lote que
alimenta a FIFO nas saídas - e um movimento `INBOUND` para rastreabilidade.

**Persistência:** coleções `stock` (lote) e `movements` (histórico) de `data/wms-db.json`.

**Exemplos de entrada e saída:**

```http
POST /api/receipts
Authorization: Bearer <token>
{ "productId": "3002...", "quantity": 100, "userId": "5d0f...", "referenceDocument": "NF-123" }
```
```json
201 Created
{
  "stockItem": { "id": "7a9b...", "productId": "3002...", "locationId": null,
                 "quantity": 100, "entryDate": "2026-06-09T22:00:00.000Z" },
  "movement":  { "id": "1f2e...", "type": "INBOUND", "productId": "3002...", "quantity": 100,
                 "sourceLocationId": null, "destinationLocationId": null, "userId": "5d0f...",
                 "referenceDocument": "NF-123", "timestamp": "2026-06-09T22:00:00.000Z" }
}
```

Produto inativo: `422` com `{ "error": "Produto inativo não pode receber entrada." }`.

#### Armazenagem / putaway (endereçamento do item recebido)

**Fluxo:**
```text
ReceivingController.store -> StoreItem
  -> IStockRepository / ILocationRepository / IUserRepository (validações)
  -> item.storeAt(location) + IMovementRepository (movimento PUTAWAY)
  -> JsonDatabase -> registerAuditSafely
```

**Regra de negócio:** o item de estoque, a localização e o usuário devem
existir. O item recebe a localização de destino preservando o lote e a
`entryDate` (a FIFO não é quebrada pelo endereçamento). Gera movimento
`PUTAWAY` com a origem anterior (pode ser `null`, se o item veio direto do
recebimento) e o destino.

**Persistência:** atualiza a coleção `stock` e grava em `movements`.

**Exemplos de entrada e saída:**

```http
POST /api/putaways
Authorization: Bearer <token>
{ "stockItemId": "7a9b...", "locationId": "d8f1...", "userId": "5d0f..." }
```
```json
201 Created
{ "id": "2c3d...", "type": "PUTAWAY", "productId": "3002...", "quantity": 100,
  "sourceLocationId": null, "destinationLocationId": "d8f1...", "userId": "5d0f...",
  "referenceDocument": null, "timestamp": "2026-06-09T22:05:00.000Z" }
```

#### Estoque (saldo por produto)

**Fluxo:**
`StockController.balanceByProduct -> GetBalance -> IStockRepository -> JsonDatabase`

**Regra de negócio:** soma todos os lotes do produto e agrupa o saldo por
localização; lotes ainda não endereçados aparecem com `locationId: null`.
A visão consolidada de todo o estoque (`GET /api/stock`) está descrita na
Funcionalidade 4 da seção da Sprint 3.

**Persistência:** leitura da coleção `stock` de `data/wms-db.json`.

**Exemplos de entrada e saída:**

```http
GET /api/stock/3002...
Authorization: Bearer <token>
```
```json
200 OK
{ "productId": "3002...", "totalQuantity": 150,
  "byLocation": [ { "locationId": "d8f1...", "quantity": 100 },
                  { "locationId": null, "quantity": 50 } ] }
```

#### Rastreabilidade (histórico de movimentações)

**Fluxo:**
`TraceabilityController -> TraceMovements -> IMovementRepository -> JsonDatabase`

**Regra de negócio:** lista todas as movimentações (`INBOUND`, `PUTAWAY`,
`TRANSFER`, `OUTBOUND`) da mais recente para a mais antiga; aceita o filtro
opcional `?productId=` para rastrear um único produto. É somente leitura, o
histórico nunca é alterado.

**Persistência:** leitura da coleção `movements` de `data/wms-db.json`.

**Exemplos de entrada e saída:**

```http
GET /api/movements?productId=3002...
Authorization: Bearer <token>
```
```json
200 OK
[
  { "id": "a1b2...", "type": "OUTBOUND", "productId": "3002...", "quantity": 50,
    "sourceLocationId": null, "destinationLocationId": null, "userId": "5d0f...",
    "referenceDocument": "NF-77", "timestamp": "2026-06-09T22:30:00.000Z" },
  { "id": "1f2e...", "type": "INBOUND", "productId": "3002...", "quantity": 100,
    "sourceLocationId": null, "destinationLocationId": null, "userId": "5d0f...",
    "referenceDocument": "NF-123", "timestamp": "2026-06-09T22:00:00.000Z" }
]
```

#### Usuários (gestão de contas e perfis - ADMIN)

**Fluxo:**
```text
UsersController -> CreateUser / UpdateUser / ChangeUserStatus / GetUser
  -> PasswordPolicy + IHasher (BcryptHasher) -> IUserRepository -> JsonDatabase
  -> registerAuditSafely
```

**Regra de negócio:** `login` único (case-insensitive) e imutável; `role` deve
ser um perfil válido (`RECEIVING`, `SHIPPING`, `STOCK_LEADER`, `ADMIN`); a
senha tem mínimo de 6 caracteres (`PasswordPolicy`) e é gravada apenas como
hash bcrypt; a resposta nunca expõe o `passwordHash` (DTO). A
`LastActiveAdminPolicy` impede inativar ou rebaixar o último ADMIN ativo.
Escrita restrita a `ADMIN`; leitura liberada para qualquer autenticado.

**Persistência:** coleção `users` de `data/wms-db.json` (`JsonFileUserRepository`).

**Exemplos de entrada e saída:**

```http
POST /api/users
Authorization: Bearer <token-admin>
{ "name": "Maria Recebimento", "login": "maria", "role": "RECEIVING", "password": "Senha@123" }
```
```json
201 Created
{ "id": "9e8d...", "name": "Maria Recebimento", "login": "maria", "role": "RECEIVING", "active": true }
```

```http
PATCH /api/users/9e8d.../status
Authorization: Bearer <token-admin>
{ "active": false }
```
```json
200 OK
{ "id": "9e8d...", "name": "Maria Recebimento", "login": "maria", "role": "RECEIVING", "active": false }
```

Tentar inativar o último ADMIN ativo retorna `422`; usuário não-ADMIN chamando
qualquer escrita de usuários recebe `403`.

#### Localizações (endereços do armazém)

**Fluxo:**
```text
LocationsController -> CreateLocation / UpdateLocation / ChangeLocationStatus / GetLocation
  -> ILocationRepository (+ IStockRepository na inativação) -> JsonDatabase
  -> registerAuditSafely
```

**Regra de negócio:** `code` único (case-insensitive); `description` opcional.
Não pode ser inativada com estoque vinculado (saldo maior que zero em algum
lote na localização). Escrita restrita a `STOCK_LEADER`/`ADMIN`.

**Persistência:** coleção `locations` de `data/wms-db.json` (`JsonFileLocationRepository`).

**Exemplos de entrada e saída:**

```http
POST /api/locations
Authorization: Bearer <token>
{ "code": "A-01-02", "description": "Rua A, prateleira 1, nível 2" }
```
```json
201 Created
{ "id": "f4a5...", "code": "A-01-02", "description": "Rua A, prateleira 1, nível 2", "active": true }
```

Inativação com saldo vinculado:

```http
PATCH /api/locations/d8f1.../status
Authorization: Bearer <token>
{ "active": false }
```
```json
422 Unprocessable Entity
{ "error": "Não é possível inativar uma localização com estoque vinculado." }
```

### Relação com o escopo do documentacao.md

Mapeamento entre o escopo definido no item 4 do `documentacao.md` e o que foi
implementado:

| Escopo (documentacao.md, item 4)            | Implementação                                            |
| ------------------------------------------- | -------------------------------------------------------- |
| Cadastro/Atualização de produtos            | `POST`/`PUT /api/products` (`CreateProduct`/`UpdateProduct`) |
| Consulta de produtos                        | `GET /api/products[/:id]` (`GetProduct`)                  |
| Recebimento/Entrada do estoque              | `POST /api/receipts` (`ProcessInbound`)                   |
| Armazenagem dos itens recebidos             | `POST /api/putaways` (`StoreItem`)                        |
| Movimentações e transferências do estoque   | `POST /api/transfers` (`TransferStock`)                   |
| Expedição/Saída do estoque                  | `POST /api/shipments` (`ProcessOutbound`)                 |
| Rastreabilidade de movimentações            | `GET /api/movements` (`TraceMovements`)                   |
| Regras de negócio (FIFO)                    | `FifoPolicy` (domínio), usada em expedição e transferência |

Os usuários previstos no item 1 do `documentacao.md` (operadores de estoque,
responsáveis pela expedição, responsáveis pelo recebimento e administradores)
correspondem aos perfis `STOCK_LEADER`, `SHIPPING`, `RECEIVING` e `ADMIN`.
As funcionalidades além do escopo original (autenticação/RBAC, gestão de
usuários e localizações e trilha de auditoria) atendem aos requisitos
arquiteturais de Segurança ("controle de usuários e permissões") e
Confiabilidade ("rastreabilidade das operações") do item 9 do mesmo documento.

---

## Descrição das implementações e evolução arquitetural - Sprint 3

A Sprint 3 consolida a arquitetura e entrega novas funcionalidades que passam
por todas as camadas da Onion. Esta seção descreve, para cada implementação:
a funcionalidade, o fluxo arquitetural, os componentes envolvidos, a regra de
negócio, o mecanismo de persistência/integração, exemplos de entrada e saída
e as melhorias em relação à Sprint 2.

### O que foi implementado na Sprint 3 (visão geral)

1. Autenticação por senha + sessão (login real, bcrypt, token Bearer).
2. Controle de acesso por perfil (RBAC): autorização por processo via
   middleware, e renomeação do perfil `OPERATOR` para `STOCK_LEADER` (Líder de Estoque).
3. Telas e processos de Expedição e Movimentações: `POST /api/shipments` e
   `POST /api/transfers` agora possuem interface no front (totalizando 8 telas).
4. Trilha de auditoria operacional: registro automático de quem fez o quê.
5. Consolidação do estoque: extração do `StockOverviewConsolidator`.

---

### Funcionalidade 1 - Autenticação e controle de acesso (RBAC)

**Funcionalidade implementada:** login com senha e autorização por perfil.
Substitui o login frágil da Sprint 2 (que só validava o `login`, sem senha e
sem proteger rotas). Cada perfil só executa os processos que lhe cabem; o
restante retorna `403`.

**Fluxo arquitetural:**

```text
# Login
AuthController -> AuthenticateUser -> IHasher (compara senha) + ISessionStore (abre sessão) + IUserRepository

# Demais rotas
Request -> authenticationMiddleware (anexa req.user)
        -> requireRoles(...) / adminAuthorizationMiddleware (autoriza por perfil)
        -> Controller -> UseCase
```

**Componentes envolvidos:**

- Presentation: `AuthController`, `authenticationMiddleware`,
  `adminAuthorizationMiddleware`, `requireRoles` (fábrica de middleware de
  autorização por perfil), `routes.ts`, `container.ts`.
- Application: `AuthenticateUser`, `Actor` + `actorFromRequest`.
- Domain: `User`, `UserRole`, `PasswordPolicy`, portas `IHasher` e `ISessionStore`.
- Infrastructure: `BcryptHasher`, `InMemorySessionStore`, `JsonFileUserRepository`.

**Regra de negócio implementada:**

- A senha é comparada contra o hash bcrypt; o usuário precisa estar ativo.
- A força mínima de senha é regra de domínio (`PasswordPolicy`).
- A autorização por perfil segue a matriz de perfis x processos (seção de
  autenticação); `requireRoles(...roles)` reutiliza `User.hasRole()` e
  responde `401` (sem usuário) ou `403` (perfil sem permissão).
- O perfil `OPERATOR` foi renomeado para `STOCK_LEADER` (Líder de Estoque),
  que executa recebimento + armazenagem + transferência + cadastros.

**Mecanismo de persistência / integração:**

- Usuários em `data/wms-db.json` (coleção `users`) via `JsonFileUserRepository`.
- Sessões em memória (`InMemorySessionStore`); o token mapeia para o `userId`.

**Exemplos de entrada e saída:**

```http
POST /api/login
{ "login": "lider", "password": "wyms14623" }
```
```json
200 OK
{ "token": "9f3c...", "user": { "id": "d86c...", "name": "Líder de Estoque", "login": "lider", "role": "STOCK_LEADER" } }
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

**Melhorias em relação à Sprint 2:**

- O login agora valida senha (bcrypt), não só o `login`.
- Todas as rotas passam por `authenticationMiddleware`; as operações sensíveis
  por `requireRoles`/`adminAuthorizationMiddleware`.
- Autorização centralizada num middleware reutilizável (antes não havia).

---

### Funcionalidade 2 - Expedição e Movimentações (novos processos com interface)

**Funcionalidade implementada:** duas telas novas que ativam, no front,
processos que antes só existiam no backend: Expedição (saída de estoque,
retira saldo) e Movimentações (transferência de saldo entre localizações).
O menu passou de 6 para 8 botões.

**Fluxo arquitetural:**

```text
Tela (shipping.html / transfers.html)
  -> fetch autenticado (apiFetch)
  -> requireRoles(...)                      # autorização por perfil
  -> ShippingController / MovementController
  -> ProcessOutbound / TransferStock        # aplica FIFO, atualiza saldo
  -> IStockRepository / IMovementRepository
  -> JsonDatabase
  -> registerAuditSafely -> IAuditTrailRepository
```

**Componentes envolvidos:**

- Presentation: telas `shipping.html` e `transfers.html`; `ShippingController`,
  `MovementController`; `requireRoles` nas rotas `/shipments` e `/transfers`.
- Application: `ProcessOutbound`, `TransferStock`.
- Domain: `Movement`, `StockItem`, `MovementType`, `FifoPolicy`, `EntityFinder`.
- Infrastructure: `JsonFileStockRepository`, `JsonFileMovementRepository`.

**Regra de negócio implementada:**

- Expedição (`OUTBOUND`): consome o estoque do produto pela FIFO
  (lotes mais antigos primeiro); lotes zerados são removidos.
- Transferência (`TRANSFER`): origem e destino devem ser diferentes; consome a
  origem por FIFO e recria o saldo no destino preservando a data de entrada
  (não quebra a FIFO).
- Autorização: Expedição para `SHIPPING`/`STOCK_LEADER`/`ADMIN`;
  Transferência para `STOCK_LEADER`/`ADMIN`.

**Mecanismo de persistência / integração:**

- Saldo na coleção `stock` e histórico na coleção `movements` de `data/wms-db.json`.

**Exemplos de entrada e saída:**

```http
POST /api/shipments
Authorization: Bearer <token>
{ "productId": "3002...", "quantity": 50, "userId": "5d0f...", "referenceDocument": "NF-77" }
```
```json
201 Created
{ "id": "a1b2...", "type": "OUTBOUND", "productId": "3002...", "quantity": 50,
  "sourceLocationId": null, "destinationLocationId": null, "userId": "5d0f...",
  "referenceDocument": "NF-77", "timestamp": "2026-06-09T22:30:00.000Z" }
```

```http
POST /api/transfers
Authorization: Bearer <token>
{ "productId": "3002...", "sourceLocationId": "996e...", "destinationLocationId": "d8f1...", "quantity": 100, "userId": "d86c..." }
```
```json
201 Created
{ "id": "c3d4...", "type": "TRANSFER", "productId": "3002...", "quantity": 100,
  "sourceLocationId": "996e...", "destinationLocationId": "d8f1...", "userId": "d86c...",
  "referenceDocument": null, "timestamp": "2026-06-09T22:31:00.000Z" }
```

**Melhorias em relação à Sprint 2:**

- Os processos de saída e transferência ganharam interface de usuário e
  autorização por perfil (antes ficavam inacessíveis pelo front e sem RBAC).
- Reuso da mesma `FifoPolicy` de domínio em recebimento, expedição e
  transferência: regra única, testável, sem duplicação.

---

### Funcionalidade 3 - Trilha de auditoria operacional

**Funcionalidade implementada:** registro automático e imutável de quem fez o
quê: cada operação relevante (login, criação, atualização, mudança de status e
movimentação de estoque) gera uma entrada com o ator, a operação, a entidade
afetada e um resumo legível. Há uma rota de consulta (somente leitura, ADMIN).

**Fluxo arquitetural:**

```text
Controller -> (Actor a partir do req.user) -> UseCase
  -> registerAuditSafely -> IAuditTrailRepository -> JsonDatabase

# Consulta
AuditController -> ListAuditTrail -> IAuditTrailRepository
```

**Componentes envolvidos:** `AuditController`, `actorFromRequest`, `Actor`,
`ListAuditTrail`, `registerAuditSafely`, `AuditTrailEntry`, `AuditOperation`,
`IAuditTrailRepository`, `JsonFileAuditTrailRepository`.

**Regra de negócio implementada:**

- Toda operação de escrita registra uma entrada com o ator real.
- A gravação da auditoria nunca propaga exceção ao caso de uso chamador
  (efeito colateral tolerante a falhas; a operação de negócio vem antes).
- Consulta restrita a ADMIN; as entradas voltam da mais recente para a mais antiga.

**Mecanismo de persistência / integração:** coleção `audit` em `data/wms-db.json`
(mesmo padrão `JsonFile*Repository` das demais entidades).

**Exemplos de entrada e saída:**

```http
GET /api/audit?entityType=Product
Authorization: Bearer <token-admin>
```
```json
200 OK
[
  { "id": "5b67...", "occurredAt": "2026-05-31T16:57:36.563Z", "actorUserId": "5cd8...",
    "actorLogin": "admin", "operation": "CREATE", "entityType": "Product",
    "entityId": "76e3...", "summary": "Produto \"SKU-1\" cadastrado." }
]
```

Qualquer perfil não-ADMIN recebe `403 Forbidden`.

**Melhorias em relação à Sprint 2:** não havia rastro de operações
administrativas; agora há uma trilha auditável, desacoplada do fluxo principal
e sem vazar dados sensíveis.

---

### Funcionalidade 4 - Consolidação do estoque (refatoração estrutural)

**Funcionalidade implementada:** a visão consolidada do estoque
(`GET /api/stock`) deixou de ser um método "faz-tudo": `GetStockOverview`
orquestra a I/O e delega a agregação/enriquecimento/ordenação ao serviço de
aplicação `StockOverviewConsolidator`.

**Fluxo arquitetural:**
```text
StockController -> GetStockOverview -> IStockRepository/IProductRepository/ILocationRepository
              -> StockOverviewConsolidator (agrega + enriquece + ordena)
```

**Componentes envolvidos:** `StockController`, `GetStockOverview`,
`StockOverviewConsolidator`, contratos `IStockRepository`, `IProductRepository`,
`ILocationRepository`; DTOs `StockRow`/`StockOverviewResult`.

**Regra de negócio implementada:** soma de saldo por produto x localização,
enriquecimento com SKU/nome/código e totais (`totalQuantity`, `totalRecords`).

**Mecanismo de persistência / integração:** leitura das coleções `stock`,
`products` e `locations` de `data/wms-db.json`.

**Exemplos de entrada e saída:**

```http
GET /api/stock
Authorization: Bearer <token>
```
```json
200 OK
{
  "items": [
    { "productId": "3002...", "productSku": "CANETA-AZUL", "productName": "Caneta Azul",
      "locationId": "d8f1...", "locationCode": "A-01-01", "locationDescription": "Rua A...", "quantity": 100 }
  ],
  "totalQuantity": 100,
  "totalRecords": 1
}
```

**Melhorias em relação à Sprint 2:** resolve a observação de "método faz-tudo /
baixa coesão": a responsabilidade de agregação ficou isolada e testável.

---

### Pontos da arquitetura que foram melhorados (Sprint 2 -> Sprint 3)

| Ponto apontado na Sprint 2 | Correção aplicada na Sprint 3 |
| --- | --- |
| "o login só valida o login, sem senha" | Autenticação por senha com bcrypt (`AuthenticateUser` + `IHasher`/`BcryptHasher` + `PasswordPolicy`). |
| "as rotas da API não parecem protegidas por middleware" | `authenticationMiddleware` em todas as rotas; `requireRoles`/`adminAuthorizationMiddleware` nas restritas. |
| "a regra do último ADMIN aparece espalhada em mais de um caso de uso" | Centralizada em `LastActiveAdminPolicy`, reutilizada por `UpdateUser` e `ChangeUserStatus`. |
| "`listar()` virou um método faz-tudo / baixa coesão" | `GetStockOverview` orquestra I/O e delega a agregação ao `StockOverviewConsolidator`. |
| ".claude / node_modules na entrega" | Ambos no `.gitignore`, fora do versionamento. |

Melhorias estruturais adicionais:

- Portas de domínio (`IHasher`, `ISessionStore`) com implementações na
  infraestrutura, reforçando a inversão de dependência.
- DTOs de aplicação isolando a serialização HTTP do modelo de domínio
  (campos sensíveis como `passwordHash` nunca vazam).
- Auditoria como efeito colateral tolerante a falhas (`registerAuditSafely`).
- Autorização por perfil reutilizável (`requireRoles`) aplicada por processo.
- Padronização de nomenclatura em inglês em todas as camadas; mensagens ao
  usuário permanecem em português.

### Decisões arquiteturais mantidas ou ajustadas

Mantidas:

- Onion Architecture e o fluxo `Controller -> UseCase -> Repository -> JsonDatabase`.
- Persistência em arquivo JSON (`JsonDatabase` + `JsonFile*Repository`).
- Inversão de dependência por contratos no domínio (`I*Repository`, portas).
- DTOs na borda HTTP e `DomainError` traduzido pelo `errorHandler`
  (`DomainError` vira `422`; demais erros, `500`; autorização, `401`/`403`).

Ajustadas/estendidas:

- O `Actor` (identidade do usuário autenticado) passou a fluir do controller
  para os casos de uso, alimentando a auditoria.
- A autorização evoluiu de "somente ADMIN" para RBAC por processo via
  `requireRoles`, sem acoplar regra de autorização aos casos de uso.
- Perfil `OPERATOR` renomeado para `STOCK_LEADER` (com migração do dado de seed).

---

## Testes automatizados

A suíte (`npm test`, Vitest) cobre domínio, serviços e funcionalidades de
aplicação/apresentação:

- Domínio: `User`, `Location`, `FifoPolicy`, `AuditTrailEntry`,
  `LastActiveAdminPolicy`.
- Aplicação: `AuthenticateUser`, `ListAuditTrail`, `registerAuditSafely`,
  `StockOverviewConsolidator`, `ChangeUserStatus`, `ChangeLocationStatus`.
- Apresentação: `requireRoles` (autorização por perfil: libera perfil
  permitido, `403` para não permitido, `401` sem usuário).

Para rodar:

```bash
npm run typecheck   # sem erros de tipo
npm test            # todos os testes verdes
```
