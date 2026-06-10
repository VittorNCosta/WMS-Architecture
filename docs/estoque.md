# Funcionalidade — Estoque (visão consolidada)

> Mostra o **saldo de todo o armazém** numa única tela: para cada **localização** e cada **produto**, a **quantidade somada** de todos os lotes recebidos/armazenados.

## O que esta funcionalidade faz

O **Estoque** é a visão de consulta do WMS — não cria nem move nada, apenas **consolida e exibe** o saldo atual. A tela `stock.html`:

- Lista, agrupado por **localização**, cada **produto** com a **quantidade total** disponível ali (somando todos os recebimentos/lotes daquele produto naquele local).
- Mostra um **subtotal por localização** e um **Total geral** do armazém no rodapé da tabela.
- Tem um **campo de busca** que filtra a tabela por produto ou localização (sem chamar o servidor de novo) e um botão **Atualizar** que recarrega os dados.
- Exibe um **contador de registros** e estados vazios claros quando não há estoque ou nada corresponde ao filtro.

É a tela que responde "o que eu tenho, e onde?" — o resultado das operações de **Recebimento** e **Armazenagem** (e das baixas de **Expedição**/transferências) aparece aqui consolidado.

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
   2. Login de teste do seed: **`admin`** ou **`operador`** (senha **`wyms14623`**).
   3. Sucesso → **menu** (`menu.html`).
   4. No menu, clique no card **Estoque** → `stock.html`.

   **Guarda de sessão (`session.js`):** sem sessão (não logou ou a aba foi fechada/reaberta) a tela **redireciona para o login** (`/`). **Sair** limpa a sessão.

> Esta tela é **somente leitura**: não exige produto, localização ou usuário selecionado. Se ainda não houve nenhum recebimento, ela abre normalmente e mostra o estado vazio.

---

## Como usar (passo a passo)

Ao abrir `stock.html`, a tela já chama `GET /api/stock` e monta a tabela **Estoque consolidado**. No topo aparece o usuário logado, um link **Menu** e o botão **Sair**.

### 1. Ler a tabela

A tabela tem três colunas:

| Coluna | Conteúdo | Formato |
|---|---|---|
| **Localização** | Onde o saldo está | `CÓDIGO — descrição` (ex.: `A-01-01 — Rua A, prateleira 01, posição 01`). Itens ainda não endereçados aparecem como **`(sem localização)`**. |
| **Produto** | Qual item | `SKU — nome` (ex.: `CANETA-AZUL — Caneta Azul`). |
| **Quantidade** | Saldo somado | Soma de **todos os lotes** daquele produto naquela localização. |

As linhas vêm ordenadas por **localização** (código) e, dentro de cada localização, por **nome do produto**.

### 2. Subtotais e total geral

- A cada mudança de localização, a tabela insere uma linha **`Subtotal — <localização>`** com a soma das quantidades daquele grupo.
- No fim, uma linha **`Total geral`** mostra a soma de **todo o estoque** do armazém.
- Logo abaixo da tabela, o **contador de registros** indica quantas linhas consolidadas existem (ex.: `Registros: 4`).

### 3. Buscar / filtrar

No campo **Buscar por produto ou localização**, digite parte de um SKU, nome de produto ou código/descrição de localização. O filtro:

- Roda **no navegador** (não recarrega a página) e é **case-insensitive**.
- Considera **produto** (`SKU — nome`) **e** localização (`CÓDIGO — descrição`).
- Recalcula subtotais e total **sobre o que está visível**; o contador passa a mostrar `Registros: X de Y` (visíveis de total).
- Se nada corresponder, aparece **"Nenhum item corresponde ao filtro informado."**.

Apague o texto do campo para voltar à lista completa.

### 4. Atualizar

O botão **Atualizar** refaz `GET /api/stock` (mostra "Atualizando..." enquanto carrega). Use depois de registrar recebimentos/armazenagens em outra aba para ver o saldo novo.

### 5. Estado vazio

Se não houver **nenhum** item em estoque, a tabela some e aparece **"Nenhum item em estoque."** (sem subtotais nem contador).

---

## Regra de negócio / como o número é calculado

A consolidação é feita no backend pelo caso de uso **`GetStockOverview`** (`application/use-cases/stock`):

- Lê **todos os `StockItem`** (cada recebimento gera um `StockItem`/lote — ver `docs/recebimento.md`).
- **Agrupa e soma** todos os lotes que tenham o **mesmo produto + a mesma localização**. Vários recebimentos do mesmo produto na mesma localização viram **uma única linha**, com a quantidade somada.
- Itens **recebidos e ainda não armazenados** (sem `locationId`) são agrupados sob **`(sem localização)`** — eles existem no estoque, só não têm endereço físico ainda (resolve-se na tela **Armazenagem**, ver `docs/armazenagem.md`).
- Cada linha é **enriquecida** com `SKU`/`nome` do produto e `código`/`descrição` da localização. Se o produto ou a localização **não tiver cadastro correspondente**, a linha **não quebra**: os campos faltantes vêm como `null` (a tela mostra só o que tem, ou `(sem localização)` / `(desconhecido)`), e **a quantidade continua somando no Total geral**.
- O **Total geral** (`totalQuantity`) é a soma das quantidades de **todos os lotes**, independentemente de o produto/localização estar cadastrado.

O saldo reflete **entradas** (Recebimento) e **armazenagens** já realizadas, e é reduzido por **saídas** (Expedição com FIFO) e **transferências** entre localizações. Não há arredondamento nem filtro de "ativo" aqui — é o retrato fiel do que está em `StockItem`.

---

## Endpoint da API por trás

Base: `/api`. Esta tela usa apenas **`GET /api/stock`** (consulta; sem corpo).

| Ação | Método | Caminho | Corpo | Resposta |
|---|---|---|---|---|
| Estoque consolidado (geral) | `GET` | `/stock` | — | `200` + `StockOverviewResult` |
| Saldo de **um** produto (correlato) | `GET` | `/stock/:productId` | — | `200` + `ConsolidatedBalance` |

Forma da resposta de **`GET /api/stock`**:

```json
{
  "items": [
    {
      "productId": "…",
      "productSku": "CANETA-AZUL",
      "productName": "Caneta Azul",
      "locationId": "…",
      "locationCode": "A-01-01",
      "locationDescription": "Rua A, prateleira 01, posição 01",
      "quantity": 12
    }
  ],
  "totalQuantity": 12,
  "totalRecords": 1
}
```

- `productSku`, `productName`, `locationId`, `locationCode`, `locationDescription` podem vir **`null`** (produto/localização sem cadastro, ou item sem localização). `productId` e `quantity` sempre vêm.
- `totalQuantity` = soma de **todos** os lotes; `totalRecords` = número de linhas consolidadas (= `items.length`).

> **Funcionalidade correlata — `GET /api/stock/:productId`:** devolve o saldo de **um produto específico** no formato `{ "productId", "totalQuantity", "byLocation": [ { "locationId", "quantity" } ] }` (`locationId` é `null` para o saldo "sem localização"). A tela de Estoque **não** usa essa rota — ela existe para consulta técnica individual.

---

## Exemplo de uso

Valores coerentes com o seed (usuários `admin`/`operador`; localizações `DOCA`, `A-01-01`, `A-01-02`) e com um produto cadastrado pela tela de **Produtos** (ex.: `Caneta Azul (CANETA-AZUL)`, ver `docs/produtos.md`).

**Cenário: dois recebimentos do mesmo produto no mesmo local consolidam em uma linha.**

1. Em **Recebimento**, dê entrada de **5** un. de `Caneta Azul` e **armazene** em `A-01-01` (ver `docs/recebimento.md` / `docs/armazenagem.md`).
2. Faça um **segundo** recebimento de **+7** un. do mesmo `Caneta Azul`, também armazenado em `A-01-01`.
3. Abra **Menu → Estoque** (ou clique em **Atualizar**). A tabela mostra **uma única linha**:

   | Localização | Produto | Quantidade |
   |---|---|---|
   | `A-01-01 — Rua A, prateleira 01, posição 01` | `CANETA-AZUL — Caneta Azul` | **12** |

   Com **Subtotal — A-01-01 = 12** e **Total geral = 12** (os dois lotes de 5 e 7 foram somados).

4. Se o segundo recebimento **não** tivesse sido armazenado, ele apareceria numa linha separada sob **`(sem localização)`** com quantidade `7`, e a linha de `A-01-01` mostraria `5` — o **Total geral** continuaria `12`.

**Equivalente via API:**

```bash
curl -s localhost:3333/api/stock
# -> { "items": [ ... ], "totalQuantity": 12, "totalRecords": 1 }

# saldo de um produto específico (rota correlata):
curl -s localhost:3333/api/stock/PRODUTO_ID   # PRODUTO_ID: GET /api/products
```

---

## Solução de problemas

| Mensagem / sintoma | Significado | O que fazer |
|---|---|---|
| "Nenhum item em estoque." | Não há nenhum `StockItem` — nenhum recebimento foi feito ainda. | Faça um recebimento em **Recebimento** (ver `docs/recebimento.md`) e clique em **Atualizar**. |
| Produto aparece em **`(sem localização)`** | O item foi **recebido mas não armazenado** (sem `locationId`). | Endereçe o item na tela **Armazenagem** (ver `docs/armazenagem.md`); depois clique em **Atualizar**. |
| "Nenhum item corresponde ao filtro informado." | O texto do campo de busca não bate com nenhum produto/localização. | Limpe ou ajuste o termo (a busca é case-insensitive e considera SKU, nome e código/descrição). |
| A quantidade não bate com o esperado | Recebimento **sem armazenagem** fica em `(sem localização)` (não some com o saldo do local); **saídas/expedição** e **transferências** reduzem/movem o saldo. | Some `(sem localização)` + as localizações; confira movimentações em **Rastreabilidade**; lembre que a Expedição aplica FIFO e baixa o estoque. |
| Linha com produto/localização "em branco" ou `(desconhecido)` | O produto ou a localização do item não tem cadastro correspondente. | É exibição resiliente (não quebra) — o saldo ainda conta no **Total geral**; verifique o cadastro em **Produtos**/seed de localizações. |
| A tela abriu e **voltou para o login** | Sem sessão (não logou, ou a aba foi fechada/reaberta — `sessionStorage` é por aba). | Faça login novamente com `admin`/`operador`. |
| "Falha de conexão ao carregar o estoque." / "Não foi possível carregar o estoque." | A API não respondeu (ou respondeu erro) em `GET /api/stock`. | Confirme `npm run dev` em `http://localhost:3333/` e clique em **Atualizar**. |
