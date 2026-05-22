# Funcionalidade — Recebimento / Entrada do estoque

> Registra a **entrada de um produto no estoque**: cria o saldo (item de estoque) e a movimentação de **ENTRADA**, com rastreabilidade de quem recebeu e sob qual documento.

## O que esta funcionalidade faz

O **recebimento** é o ponto em que a mercadoria entra no armazém. A tela `recebimento.html`:

- Permite escolher um **produto ativo**, a **quantidade** recebida, o **usuário responsável** e, opcionalmente, uma **localização** e um **documento de referência** (ex.: nota fiscal).
- Ao confirmar, o backend cria um **item de estoque** (`EstoqueItem` — o saldo daquele recebimento, com sua `dataEntrada`, que é a base do FIFO na expedição) e registra uma **Movimentação do tipo ENTRADA**.
- Em seguida, exibe o **ID do item de estoque gerado** e um atalho **"Armazenar este item"**, encadeando direto para a tela de Armazenagem.

Cada recebimento gera **um item de estoque novo** (um "lote"), mesmo que o produto seja o mesmo — é assim que o sistema mantém a rastreabilidade e o FIFO.

---

## Pré-requisitos

1. **Servidor rodando.** Na raiz do projeto:

   ```bash
   npm install   # apenas na primeira vez
   npm run dev
   ```

   Disponível em `http://localhost:3333/`.

2. **Estar autenticado.** Fluxo:

   1. `http://localhost:3333/` → login (`login.html`).
   2. Login de teste do seed: **`admin`** ou **`operador`** (sem senha).
   3. Sucesso → **menu** (`menu.html`).
   4. No menu, clique em **Recebimento** → `recebimento.html`.

   **Guarda de sessão (`sessao.js`):** sem sessão (não logou ou a aba foi fechada/reaberta) a tela **redireciona para o login** (`/`). **Sair** limpa a sessão.

3. **Pelo menos um produto ativo cadastrado.** O Recebimento só lista produtos **ativos**. Se não houver nenhum, a tela exibe um aviso e **desabilita o formulário** — cadastre o produto primeiro em **Produtos** (ver `docs/produtos.md`).

---

## Como usar (passo a passo)

Ao abrir `recebimento.html`, a tela carrega os catálogos para os campos de seleção:

- **Produto** — `GET /api/produtos`, filtrando **apenas `ativo: true`**; cada opção aparece como `Nome (SKU)`.
- **Usuário responsável** — `GET /api/usuarios` (do seed: `Administrador`, `Operador de Estoque`).
- **Localização** — `GET /api/localizacoes`, com a opção padrão **"— sem localização —"** (do seed: `DOCA`, `A-01-01`, `A-01-02`).

Preencha o formulário:

| Campo | Obrigatório | Observação |
|---|---|---|
| **Produto** | Sim | Lista só produtos **ativos**. Selecione um. |
| **Quantidade** | Sim | Número **inteiro ≥ 1**. A tela bloqueia vazio, não inteiro ou < 1. |
| **Usuário responsável** | Sim | Quem está fazendo o recebimento. |
| **Localização** | Não | Se não informada, o item fica **sem localização** até a armazenagem. |
| **Documento de referência** | Não | Texto livre, ex.: `NF 12345`. |

Clique em **Dar entrada**:

- A tela valida no navegador: produto selecionado, quantidade inteira ≥ 1, usuário selecionado.
- Envia `POST /api/recebimentos`.
- **Sucesso:**
  - Mensagem verde "Entrada registrada".
  - Aparece o bloco **"Entrada registrada com sucesso"** com o campo **ID do item de estoque gerado** (somente leitura — copie este ID) e o botão **Armazenar este item**.
  - O formulário é limpo (a localização volta para "— sem localização —").
- **Erro:** mensagem vermelha com o texto vindo do backend.

### Encadeamento Recebimento → Armazenagem

Após o sucesso, o botão **Armazenar este item** leva para:

```
armazenagem.html?estoqueItemId=<id-gerado>
```

Ou seja, abre a tela de **Armazenagem** já com o **ID do item de estoque preenchido** — basta escolher a localização e o usuário e confirmar (ver `docs/armazenagem.md`). Você também pode copiar o ID manualmente e colá-lo depois na tela de Armazenagem.

> Se você informou uma **localização no recebimento**, o item já entra com essa localização. A etapa de **Armazenagem** registra uma movimentação de **ARMAZENAGEM** e (re)define a localização do item — é a etapa recomendada para rastrear o endereçamento físico no armazém.

---

## Regras de negócio e validações

Validadas no backend (`ProcessarEntrada` + entidades). Regra violada → **HTTP 422** com `{ "erro": "mensagem" }`, exibida em vermelho na tela.

- **Produto deve existir.** Se não: `Produto não encontrado.`
- **Produto deve estar ATIVO.** Produto inativo: `Produto inativo não pode receber entrada.` (A tela já filtra inativos no campo de seleção; esta regra protege o backend.)
- **Usuário deve existir.** Se não: `Usuário não encontrado.`
- **Localização (se informada) deve existir.** Se informada e inválida: `Localização não encontrada.` Se omitida (`null`), o item fica sem localização.
- **Quantidade deve ser um número maior que zero.** Caso contrário: `Quantidade deve ser um número maior que zero.` (A tela ainda exige **inteiro ≥ 1**.)

Em caso de sucesso, o backend cria o `EstoqueItem` (com `dataEntrada` = agora) e a `Movimentacao` tipo **ENTRADA** vinculada ao produto, usuário, localização de destino (se houver) e documento de referência (se houver).

---

## Endpoint da API por trás

Base: `/api`. Erros de regra: **422** `{ "erro": "..." }`.

| Ação | Método | Caminho | Corpo (JSON) | Resposta |
|---|---|---|---|---|
| Dar entrada | `POST` | `/recebimentos` | `{ "produtoId", "quantidade", "usuarioId", "localizacaoId"?, "documentoReferencia"? }` | `201` + `{ "estoqueItem", "movimentacao" }` |

Catálogos de apoio usados pela tela para montar os campos de seleção:

| Método | Caminho | Uso |
|---|---|---|
| `GET` | `/produtos` | Opções de produto (a tela filtra `ativo: true`) |
| `GET` | `/usuarios` | Opções de usuário responsável |
| `GET` | `/localizacoes` | Opções de localização (+ "— sem localização —") |

Resposta de sucesso (resumo): `estoqueItem` contém `id` (o ID usado na armazenagem), `produtoId`, `localizacaoId` (ou `null`), `quantidade`, `dataEntrada`; `movimentacao` é o registro tipo `ENTRADA`.

> `localizacaoId` e `documentoReferencia` são enviados como `null` quando deixados em branco na tela.

---

## Exemplo de uso

Pré-condição: exista o produto `Caneta Azul (CANETA-AZUL)` **ativo** (ver `docs/produtos.md`).

**Pela tela:**

1. Login com `operador` → **Menu** → **Recebimento**.
2. Preencha:
   - **Produto:** `Caneta Azul (CANETA-AZUL)`
   - **Quantidade:** `10`
   - **Usuário responsável:** `Operador de Estoque`
   - **Localização:** `DOCA — Doca de recebimento` (ou deixe "— sem localização —")
   - **Documento de referência:** `NF 12345`
3. **Dar entrada** → mensagem "Entrada registrada"; aparece o **ID do item de estoque gerado**.
4. Clique em **Armazenar este item** → segue para a Armazenagem com o ID já preenchido.

**Equivalente via API:**

```bash
# PRODUTO_ID: id do produto (GET /api/produtos);  USUARIO_ID: GET /api/usuarios
curl -s -X POST localhost:3333/api/recebimentos \
  -H 'Content-Type: application/json' \
  -d '{"produtoId":"PRODUTO_ID","quantidade":10,"usuarioId":"USUARIO_ID","documentoReferencia":"NF 12345"}'
# a resposta traz estoqueItem.id -> use na armazenagem
```

---

## Solução de problemas

| Mensagem / sintoma | Significado | O que fazer |
|---|---|---|
| Aviso "Cadastre um produto ativo antes de registrar um recebimento." (formulário desabilitado) | Não há nenhum produto **ativo** no catálogo. | Vá em **Produtos**, cadastre/ative um produto e volte. |
| `Produto inativo não pode receber entrada.` | O produto selecionado está inativo (caso o backend receba um produto inativo). | Ative o produto em **Produtos** (marque "Produto ativo") e tente de novo. |
| `Produto não encontrado.` | O `produtoId` não existe (produto removido da base ou lista desatualizada). | Recarregue a tela para atualizar o catálogo e selecione de novo. |
| `Usuário não encontrado.` | O `usuarioId` não existe. | Recarregue a tela; selecione um usuário do seed (`Administrador` / `Operador de Estoque`). |
| `Localização não encontrada.` | A localização informada não existe. | Recarregue a tela ou escolha "— sem localização —". |
| `Quantidade deve ser um número maior que zero.` | Quantidade inválida chegou ao backend. | Informe um número inteiro ≥ 1. |
| "Informe uma quantidade inteira maior ou igual a 1." | Validação do navegador (quantidade vazia, decimal ou < 1). | Corrija a quantidade. |
| "Selecione um produto." / "Selecione o usuário responsável." | Validação do navegador (campo obrigatório não selecionado). | Selecione o campo destacado. |
| A tela abriu e **voltou para o login** | Sem sessão (não logou, ou a aba foi fechada/reaberta). | Faça login novamente com `admin`/`operador`. |
| "Falha de conexão ao carregar os dados. Recarregue a página." | A API não respondeu ao montar os campos de seleção. | Confirme `npm run dev` em `http://localhost:3333/` e recarregue. |
