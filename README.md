# WMS - Warehouse Management System

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