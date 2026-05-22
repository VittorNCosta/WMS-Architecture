# Funcionalidade — Produtos (Cadastro, Atualização e Consulta)

> Mantém o **catálogo de produtos** do WMS: cria, lista, consulta e atualiza/inativa os itens que poderão ser recebidos e armazenados.

## O que esta funcionalidade faz

O **produto** é o item base de todo o sistema. Sem um produto cadastrado e **ativo** não é possível dar entrada (recebimento) nem armazenar nada. Esta tela cobre, em um único lugar (`produtos.html`):

- **Cadastro** — criar um novo produto com SKU único.
- **Consulta / listagem** — ver todos os produtos cadastrados e a situação (Ativo/Inativo) de cada um.
- **Atualização / inativação** — editar nome, descrição, unidade de medida e ligar/desligar o produto (`ativo`).

O SKU é o identificador de negócio do produto e **não pode ser alterado** depois de criado.

---

## Pré-requisitos

1. **Servidor rodando.** Na raiz do projeto:

   ```bash
   npm install   # apenas na primeira vez
   npm run dev
   ```

   A API/telas ficam em `http://localhost:3333/`.

2. **Estar autenticado.** O fluxo é:

   1. Abra `http://localhost:3333/` — cai na tela de login (`login.html`).
   2. Informe um login de teste do seed: **`admin`** ou **`operador`** (este sistema autentica só pelo login, sem senha).
   3. No sucesso você é redirecionado para o **menu** (`menu.html`).
   4. No menu, clique em **Produtos** para abrir `produtos.html`.

> **Guarda de sessão:** ao entrar, os dados públicos do usuário (`id`, `nome`, `login`, `perfil`) são gravados em `sessionStorage` (chave `wms_usuario`). Toda tela protegida chama `exigirSessao()` de `sessao.js` no carregamento. Se **não houver sessão** (ainda não logou, ou a aba foi fechada e reaberta), a tela **redireciona automaticamente para o login** (`/`). O botão **Sair** limpa a sessão e volta ao login.

---

## Como usar (passo a passo)

A tela `produtos.html` tem três seções: **Cadastrar produto**, **Atualizar produto** (oculta até você clicar em "Editar") e **Produtos cadastrados** (tabela). No topo aparece o usuário logado, um link **Menu** e o botão **Sair**.

### 1. Cadastrar um produto

Na seção **Cadastrar produto**, preencha:

| Campo | Obrigatório | Observação |
|---|---|---|
| **SKU** | Sim | Código único do produto. Não poderá ser alterado depois. |
| **Nome** | Sim | Nome do produto. |
| **Descrição** | Não | Texto livre; pode ficar vazio. |
| **Unidade de medida** | Sim | Ex.: `UN`, `CX`, `KG`. |

Clique em **Cadastrar**. O que acontece:

- A tela valida no navegador que SKU, Nome e Unidade de medida não estão vazios (mensagem de erro em vermelho se algum faltar).
- Envia `POST /api/produtos`.
- **Sucesso:** aparece uma mensagem verde "Produto cadastrado", o formulário é limpo e a **tabela é recarregada** com o novo produto (já entra como **Ativo**).
- **Erro:** aparece uma mensagem vermelha com o texto vindo do backend (ex.: SKU duplicado — ver Regras e Solução de problemas).

### 2. Consultar / listar produtos

A seção **Produtos cadastrados** carrega automaticamente ao abrir a tela (e a cada cadastro/atualização) via `GET /api/produtos`. A tabela mostra, por produto:

- **SKU**
- **Nome**
- **Un. medida**
- **Situação** — selo verde **Ativo** ou selo vermelho **Inativo**
- **Ações** — botão **Editar**

Se não houver nenhum produto, aparece a mensagem "Nenhum produto cadastrado ainda.".

### 3. Atualizar / inativar um produto

1. Na tabela, clique em **Editar** na linha do produto.
2. A seção **Atualizar produto** aparece, já preenchida com os dados atuais.
3. Campos editáveis:

   | Campo | Obrigatório | Observação |
   |---|---|---|
   | **SKU** | — | Apenas leitura (desabilitado). Não pode ser alterado. |
   | **Nome** | Sim | |
   | **Descrição** | Não | Pode ser apagada (fica vazia). |
   | **Unidade de medida** | Sim | |
   | **Produto ativo** | — | Caixa de seleção. **Desmarque para inativar** o produto. |

4. Clique em **Salvar alterações** (`PUT /api/produtos/:id`).
   - **Sucesso:** mensagem verde "Produto atualizado", o formulário de edição fecha e a tabela é recarregada (a Situação reflete o novo estado).
   - **Erro:** mensagem vermelha com o texto do backend.
5. **Cancelar** fecha a edição sem enviar nada.

> **Inativar ≠ excluir.** Não existe exclusão de produto. Para tirar um produto de circulação, **desmarque "Produto ativo"** e salve. Produtos inativos continuam na lista (selo Inativo) e no histórico, mas **não aparecem no Recebimento** e o backend recusa entrada para eles.

---

## Regras de negócio e validações

Validadas no backend (camada de domínio/aplicação). Qualquer regra violada retorna **HTTP 422** com corpo `{ "erro": "mensagem" }`, exibido na tela em vermelho.

**Cadastro (`CadastrarProduto` / entidade `Produto`):**

- **SKU** — obrigatório (texto não vazio) **e único**. Se já existir produto com o mesmo SKU: `Já existe um produto com o SKU "<sku>".`
- **Nome** — obrigatório (texto não vazio).
- **Unidade de medida** — obrigatória (texto não vazio).
- **Descrição** — opcional; vazio é tratado como "sem descrição".
- Todo produto novo nasce **ativo**.

**Atualização (`AtualizarProduto`):**

- O produto precisa **existir** (busca por `id`). Se não existir: `Produto não encontrado.`
- **Nome** e **Unidade de medida**, quando enviados, não podem ser vazios.
- **Descrição** pode ser esvaziada.
- **ativo** só muda se vier um booleano (a tela sempre envia `true`/`false` conforme a caixa de seleção).
- O **SKU não é alterável** pela atualização.

> Mensagens base dos validadores: `SKU do produto é obrigatório.`, `Nome do produto é obrigatório.`, `Unidade de medida é obrigatório.`

---

## Endpoints da API por trás

Base: `/api`. Erros de regra: **422** `{ "erro": "..." }`.

| Ação | Método | Caminho | Corpo (JSON) | Resposta |
|---|---|---|---|---|
| Cadastrar | `POST` | `/produtos` | `{ "sku", "nome", "unidadeMedida", "descricao"? }` | `201` + Produto |
| Listar | `GET` | `/produtos` | — | `200` + `Produto[]` |
| Consultar 1 | `GET` | `/produtos/:id` | — | `200` + Produto / `422` se não existir |
| Atualizar | `PUT` | `/produtos/:id` | `{ "nome"?, "descricao"?, "unidadeMedida"?, "ativo"? }` | `200` + Produto / `422` |

Forma do objeto **Produto** retornado: `id`, `sku`, `nome`, `descricao` (ou `null`), `unidadeMedida`, `ativo`, `criadoEm`, `atualizadoEm`.

> A tela usa apenas `POST /api/produtos`, `GET /api/produtos` e `PUT /api/produtos/:id`. O `GET /api/produtos/:id` existe na API para consulta técnica individual.

---

## Exemplo de uso

Valores coerentes com o seed (usuários `admin`/`operador`; localizações `DOCA`, `A-01-01`, `A-01-02`).

**Pela tela:**

1. Login com `admin` → **Menu** → **Produtos**.
2. Em **Cadastrar produto**:
   - SKU: `CANETA-AZUL`
   - Nome: `Caneta Azul`
   - Descrição: `Caneta esferográfica azul 1.0mm`
   - Unidade de medida: `UN`
3. **Cadastrar** → mensagem "Produto cadastrado"; a linha aparece na tabela como **Ativo**.
4. Clique em **Editar** nessa linha, mude o Nome para `Caneta Azul 1.0mm`, **Salvar alterações** → tabela atualizada.
5. Para tirar de circulação: **Editar** → **desmarque** "Produto ativo" → **Salvar** → selo muda para **Inativo**.

**Equivalente via API (cadastro):**

```bash
curl -s -X POST localhost:3333/api/produtos \
  -H 'Content-Type: application/json' \
  -d '{"sku":"CANETA-AZUL","nome":"Caneta Azul","unidadeMedida":"UN","descricao":"Caneta esferográfica azul 1.0mm"}'
```

---

## Solução de problemas

| Mensagem / sintoma | Significado | O que fazer |
|---|---|---|
| `Já existe um produto com o SKU "<sku>".` | O SKU informado no cadastro já pertence a outro produto (SKU é único). | Use um SKU diferente. Se quer só alterar o item existente, use **Editar** naquele produto. |
| `Produto não encontrado.` | Tentativa de atualizar um produto que não existe (id inválido/removido da base). | Recarregue a tela para atualizar a lista e edite a partir da linha correta. |
| `SKU do produto é obrigatório.` / `Nome do produto é obrigatório.` / `Unidade de medida é obrigatório.` | Campo obrigatório vazio. | Preencha o campo indicado e reenvie. A tela também bloqueia o envio com campos obrigatórios vazios. |
| "Informe o SKU do produto." / "Informe o nome do produto." / "Informe a unidade de medida." | Validação do navegador (antes de chamar a API). | Preencha o campo destacado. |
| A tela abriu e **voltou para o login** | Não havia sessão (não logou, ou a aba foi fechada/reaberta — `sessionStorage` é por aba). | Faça login novamente com `admin` ou `operador`. |
| "Nenhum produto cadastrado ainda." | A base ainda não tem produtos. | Cadastre o primeiro produto na seção **Cadastrar produto**. |
| "Falha de conexão com o servidor..." / "Não foi possível carregar a lista de produtos." | A API não respondeu. | Confirme que `npm run dev` está ativo e acessível em `http://localhost:3333/`; recarregue a página. |
| Produto não aparece no **Recebimento** | O produto está **Inativo** (o Recebimento lista só ativos). | Edite o produto e marque **Produto ativo**. |
