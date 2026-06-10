# WMS - Warehouse Management System

## Autenticação

A partir desta versão, todas as rotas de `/api` (exceto `/api/login`) exigem um token Bearer válido.

### Credenciais padrão (seed)

| Login   | Senha       | Perfil           |
| ------- | ----------- | ---------------- |
| `admin` | `wyms14623` | ADMIN            |
| `lider` | `wyms14623` | LÍDER DE ESTOQUE |

Essas credenciais são criadas automaticamente na primeira execução pelo `seed` (o arquivo `data/wms-db.json` **não** é versionado — fica no `.gitignore` e é gerado localmente). As senhas ficam armazenadas como hash bcrypt (`passwordHash`) — o texto puro nunca é persistido.

### Como fazer login

```http
POST /api/login
Content-Type: application/json

{
  "login": "admin",
  "password": "wyms14623"
}
```

Resposta de sucesso (`200 OK`):

```json
{
  "token": "<token-hex-64-caracteres>",
  "user": {
    "id": "...",
    "name": "Administrador",
    "login": "admin",
    "role": "ADMIN"
  }
}
```

Em caso de credenciais incorretas ou usuário inativo, a resposta é `401 Unauthorized` com `{ "error": "Credenciais inválidas." }`.

### Como usar o token nas demais rotas

Inclua o header `Authorization` em toda requisição autenticada:

```http
Authorization: Bearer <token>
```

- Sem token / token inválido → `401`.
- Token válido mas perfil insuficiente (ex.: RECEBIMENTO tentando armazenar, ou qualquer perfil não-ADMIN tentando criar usuário) → `403`.

### Controle de acesso por perfil

Os perfis e os processos que cada um pode executar:

| Perfil                          | Processos permitidos                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| **RECEBIMENTO** (`RECEIVING`)   | Recebimento (`POST /api/receipts`)                                                   |
| **EXPEDIÇÃO** (`SHIPPING`)      | Armazenagem (`POST /api/putaways`) e Expedição (`POST /api/shipments`)               |
| **LÍDER DE ESTOQUE** (`STOCK_LEADER`) | Recebimento, Armazenagem, Transferência (`POST /api/transfers`) e cadastro de Produtos/Localizações |
| **ADMIN**                       | Todos os processos + gestão de usuários                                              |

Regras adicionais:

- Escrita de **Produtos** (`POST`/`PUT /api/products`) e **Localizações** (`POST`/`PUT`/`PATCH /api/locations`): apenas `STOCK_LEADER` e `ADMIN`.
- **Usuários** (`POST /api/users`, `PUT /api/users/:id`, `PATCH /api/users/:id/status`) e **Auditoria** (`GET /api/audit`): apenas `ADMIN`.
- As rotas de **consulta** (`GET`) aceitam qualquer perfil autenticado e ativo.
- Qualquer tentativa fora dessas regras retorna `403`.

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

> **Nota sobre o idioma:** todo o código-fonte (entidades, casos de uso, repositórios, rotas HTTP e chaves de persistência) usa **nomenclatura em inglês**. As **mensagens visíveis ao usuário** (validações e textos das telas) permanecem em **português**.

---

# Descrição das implementações e fluxo arquitetural

# Funcionalidade 1 - Cadastro de Produtos

## Nome da funcionalidade

Cadastro de produtos.

---

## Onde o fluxo começa

O fluxo começa nas rotas de produtos.

```text
/api/products
```

---

## Quais componentes participam

```text
Controller -> UseCase -> Repository -> Persistência
```

Componentes envolvidos:

- ProductsController
- CreateProduct
- IProductRepository
- JsonFileProductRepository

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

na coleção `products`.

---

## Como executar ou testar

Executar a rota:

- POST `/api/products`

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

- `/api/receipts`
- `/api/shipments`
- `/api/movements`

---

## Quais componentes participam

```text
Controller -> UseCase -> Repository -> Persistência
```

Componentes envolvidos:

- ReceivingController
- ShippingController
- ProcessInbound
- ProcessOutbound
- TransferStock
- IMovementRepository
- JsonFileMovementRepository

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

nas coleções `stock` e `movements`.

---

## Como executar ou testar

Executar as rotas:

- POST `/api/receipts`
- POST `/api/shipments`
- GET `/api/movements`

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
/api/users
```

---

## Quais componentes participam

```text
Controller -> UseCase -> Repository -> Persistência
```

Componentes envolvidos:

- UsersController
- CreateUser
- UpdateUser
- ChangeUserStatus
- GetUser
- IUserRepository
- JsonFileUserRepository

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

na coleção `users`.

---

## Como executar ou testar

Executar as rotas:

- POST `/api/users`
- GET `/api/users`
- PUT `/api/users/:id`
- PATCH `/api/users/:id/status`

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
/api/locations
```

---

## Quais componentes participam

```text
Controller -> UseCase -> Repository -> Persistência
```

Componentes envolvidos:

- LocationsController
- CreateLocation
- UpdateLocation
- ChangeLocationStatus
- GetLocation
- ILocationRepository
- JsonFileLocationRepository

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

na coleção `locations`.

---

## Como executar ou testar

Executar as rotas:

- POST `/api/locations`
- GET `/api/locations`
- PUT `/api/locations/:id`
- PATCH `/api/locations/:id/status`

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

## Visão geral

A Sprint 3 entrega **duas novas funcionalidades de domínio**, ambas atravessando
todas as camadas da Onion, além de melhorias arquiteturais que respondem
diretamente à avaliação da Sprint 2:

1. **Autenticação e controle de acesso (RBAC)** — login com senha (bcrypt),
   token de sessão e proteção das rotas por middleware.
2. **Trilha de auditoria operacional** — registro automático de quem fez o quê,
   com rota de consulta filtrável restrita a ADMIN.

---

## Funcionalidade 1 — Autenticação e controle de acesso (RBAC)

Substitui o login frágil da Sprint 2 (que validava apenas o login, sem senha e
sem proteger as rotas). Agora há autenticação real por senha e autorização por
perfil. Detalhes de uso (request/response) na seção **Autenticação** no topo
deste README.

- **Entrada verificável**: `POST /api/login` com `login` + `password`.
- **Processamento / regra de negócio**: `AuthenticateUser` valida login, compara
  a senha contra o hash (`IHasher`/`BcryptHasher`), exige usuário ativo e abre a
  sessão (`ISessionStore`). A força mínima da senha é regra de domínio
  (`PasswordPolicy`).
- **Acesso a dados**: `IUserRepository` (busca por login) + `ISessionStore`.
- **Saída observável**: `200` com `{ token, user }` (sem `passwordHash`); `401`
  para credenciais inválidas/conta inativa; `403` quando um perfil não-ADMIN
  tenta uma rota restrita.
- **Componentes**: `AuthController` → `AuthenticateUser` →
  `IHasher`/`ISessionStore`/`IUserRepository`; nas demais rotas,
  `authenticationMiddleware` e `adminAuthorizationMiddleware`.

---

## Funcionalidade 2 — Trilha de Auditoria operacional

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
- A consulta segue: `AuditController -> ListAuditTrail -> IAuditTrailRepository`.

---

## Componentes envolvidos

- `AuditController` (presentation)
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

Os dados são gravados no arquivo `data/wms-db.json`, na coleção `audit`,
seguindo o mesmo padrão `JsonFile*Repository` das demais entidades.

---

## Como executar e testar

- `GET /api/audit` (header `Authorization: Bearer <token>` de um ADMIN)
- Filtros opcionais por query string: `from`, `to` (ISO 8601), `entityType`, `entityId`

Exemplo de entrada:

```http
GET /api/audit?entityType=Product
Authorization: Bearer <token-admin>
```

Exemplo de saída (`200 OK`):

```json
[
  {
    "id": "5b676976-...",
    "occurredAt": "2026-05-31T16:57:36.563Z",
    "actorUserId": "5cd824d9-...",
    "actorLogin": "admin",
    "operation": "CREATE",
    "entityType": "Product",
    "entityId": "76e3de86-...",
    "summary": "Produto \"SKU-1\" cadastrado."
  }
]
```

Qualquer perfil não-ADMIN autenticado recebe `403 Forbidden` ao acessar a rota.

---

## Melhorias arquiteturais em relação à Sprint 2

Cada melhoria abaixo responde a um ponto levantado na **avaliação da Sprint 2**:

| Ponto apontado na Sprint 2 | Correção aplicada na Sprint 3 |
| --- | --- |
| "o login só valida o login, sem senha" | Autenticação por senha com hash bcrypt (`AuthenticateUser` + `IHasher`/`BcryptHasher` + `PasswordPolicy`). |
| "as rotas da API não parecem protegidas por middleware" | `authenticationMiddleware` (Bearer) em todas as rotas e `adminAuthorizationMiddleware` nas operações restritas. |
| "a regra do último ADMIN aparece espalhada em mais de um caso de uso" | Regra centralizada no serviço de domínio `LastActiveAdminPolicy`, reutilizado por `UpdateUser` e `ChangeUserStatus`. |
| "`listar()` virou um método faz-tudo / baixa coesão" | `GetStockOverview` agora orquestra a I/O e delega a agregação/enriquecimento/ordenação ao `StockOverviewConsolidator`. |
| ".claude / node_modules na entrega" | Ambos no `.gitignore` e fora do versionamento. |

Melhorias estruturais adicionais:

- **Portas de domínio** (`IHasher`, `ISessionStore` em `domain/ports`) com
  implementações concretas na infraestrutura — reforçando a inversão de dependência.
- **DTOs de aplicação** (`application/dtos`) isolando o que é serializado na borda
  HTTP do modelo de domínio (campos sensíveis como `passwordHash` nunca vazam).
- **Auditoria como efeito colateral tolerante a falhas** (`registerAuditSafely`),
  sem acoplar o caso de uso principal à persistência da trilha.
- **Padronização de nomenclatura em inglês** em todas as camadas (entidades,
  casos de uso, serviços, repositórios, rotas HTTP e chaves de persistência),
  eliminando duplicidades e ambiguidade entre camadas. As mensagens visíveis ao
  usuário permanecem em português.

---

## Testes automatizados

A suíte (`npm test`, Vitest) cobre o domínio, os serviços extraídos e as duas
novas funcionalidades:

- **Domínio**: `User`, `Location`, `FifoPolicy`, `AuditTrailEntry`,
  `LastActiveAdminPolicy`.
- **Aplicação**: `AuthenticateUser` (login/RBAC), `ListAuditTrail` e
  `registerAuditSafely` (auditoria), `StockOverviewConsolidator`,
  `ChangeUserStatus`, `ChangeLocationStatus`.
