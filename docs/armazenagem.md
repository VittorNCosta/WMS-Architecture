# Funcionalidade — Armazenagem dos itens recebidos

> Define **onde** um item já recebido fica guardado no armazém: associa o item de estoque a uma **localização** e registra a movimentação de **PUTAWAY**.

## O que esta funcionalidade faz

Depois do **Recebimento**, o item existe no estoque mas ainda precisa ser **endereçado** a um local físico do armazém. A tela `putaway.html`:

- Recebe o **ID do item de estoque** (gerado no recebimento), uma **localização** de destino e o **usuário responsável**.
- Ao confirmar, o backend (re)define a `locationId` daquele `StockItem` e registra uma **Movimentação do tipo PUTAWAY** (guardando a localização de origem anterior — se houver — e a de destino), preservando a rastreabilidade.

É a etapa que conclui o ciclo **Recebimento → Armazenagem**, deixando o saldo localizado e pronto para transferências/expedição.

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
   4. No menu, clique em **Armazenagem** → `putaway.html`.

   **Guarda de sessão (`session.js`):** sem sessão (não logou ou a aba foi fechada/reaberta) a tela **redireciona para o login** (`/`). **Sair** limpa a sessão.

3. **Um item de estoque já recebido.** Você precisa do **ID do item de estoque** (`stockItemId`), que é **gerado na tela de Recebimento** (ver `docs/recebimento.md`). Sem dar entrada antes, não há item para armazenar.

---

## Como usar (passo a passo)

Ao abrir `putaway.html`, a tela carrega os campos de seleção:

- **Localização** — `GET /api/locations` (do seed: `DOCA`, `A-01-01`, `A-01-02`); cada opção aparece como `CÓDIGO — descrição`.
- **Usuário responsável** — `GET /api/users` (do seed: `Administrador`, `Operador de Estoque`).

Preencha o formulário:

| Campo | Obrigatório | De onde vem |
|---|---|---|
| **ID do item de estoque** | Sim | Gerado no **Recebimento**. Vem **pré-preenchido** se você chegou pelo botão "Armazenar este item" (querystring `?stockItemId=...`). Senão, cole o ID manualmente. |
| **Localização** | Sim | Endereço de destino no armazém. Selecione uma das localizações. |
| **Usuário responsável** | Sim | Quem está fazendo a armazenagem. |

> **Origem do `stockItemId`:** ao concluir um recebimento em `receiving.html`, o botão **"Armazenar este item"** abre esta tela como `putaway.html?stockItemId=<id>`, e o campo já vem preenchido com esse ID. Você também pode copiar o "ID do item de estoque gerado" exibido no recebimento e colá-lo aqui.

Clique em **Armazenar item**:

- A tela valida no navegador: ID do item informado, localização selecionada, usuário selecionado.
- Envia `POST /api/putaways`.
- **Sucesso:** mensagem verde "Item armazenado" (com o ID da movimentação registrada, quando disponível). O formulário é limpo.
- **Erro:** mensagem vermelha com o texto vindo do backend.

---

## Regras de negócio e validações

Validadas no backend (`StoreItem`). Regra violada → **HTTP 422** com `{ "error": "mensagem" }`, exibida em vermelho na tela.

- **Item de estoque deve existir.** Se o `stockItemId` não corresponder a nenhum item: `Item de estoque não encontrado.`
- **Localização deve existir.** Se não: `Localização não encontrada.` (A localização é **obrigatória** nesta tela.)
- **Usuário deve existir.** Se não: `Usuário não encontrado.`

Em caso de sucesso, o backend atualiza a `locationId` do `StockItem` e cria a `Movement` tipo **PUTAWAY**, registrando a localização de **origem** (a que o item tinha antes — pode ser nula se entrou sem localização) e a de **destino** (a selecionada), além de produto, quantidade e usuário.

---

## Endpoint da API por trás

Base: `/api`. Erros de regra: **422** `{ "error": "..." }`.

| Ação | Método | Caminho | Corpo (JSON) | Resposta |
|---|---|---|---|---|
| Armazenar | `POST` | `/putaways` | `{ "stockItemId", "locationId", "userId" }` | `201` + Movement (tipo `PUTAWAY`) |

Catálogos de apoio usados pela tela para montar os campos de seleção:

| Método | Caminho | Uso |
|---|---|---|
| `GET` | `/locations` | Opções de localização de destino |
| `GET` | `/users` | Opções de usuário responsável |

A `Movement` retornada inclui `id`, `type` (`PUTAWAY`), `productId`, `quantity`, `sourceLocationId` (ou `null`), `destinationLocationId`, `userId` e `timestamp`.

---

## Exemplo de uso

Pré-condição: ter feito um recebimento e ter o `stockItemId` (ver `docs/recebimento.md`).

**Pela tela (caminho encadeado, recomendado):**

1. Na tela de **Recebimento**, após "Entrada registrada", clique em **Armazenar este item**.
2. A Armazenagem abre com o **ID do item de estoque já preenchido**.
3. Selecione:
   - **Localização:** `A-01-01 — Rua A, prateleira 01, posição 01`
   - **Usuário responsável:** `Operador de Estoque`
4. **Armazenar item** → mensagem "Item armazenado".

**Pela tela (caminho manual):**

1. Login com `admin` → **Menu** → **Armazenagem**.
2. Cole no campo **ID do item de estoque** o ID copiado do recebimento.
3. Escolha a **Localização** e o **Usuário responsável**.
4. **Armazenar item**.

**Equivalente via API:**

```bash
# STOCK_ITEM_ID = stockItem.id retornado por POST /api/receipts
# LOCATION_ID  = GET /api/locations ;  USER_ID = GET /api/users
curl -s -X POST localhost:3333/api/putaways \
  -H 'Content-Type: application/json' \
  -d '{"stockItemId":"STOCK_ITEM_ID","locationId":"LOCATION_ID","userId":"USER_ID"}'
```

---

## Solução de problemas

| Mensagem / sintoma | Significado | O que fazer |
|---|---|---|
| `Item de estoque não encontrado.` | O `stockItemId` informado não existe (ID errado, item de outra base, ou recebimento não concluído). | Confira o ID no resultado do **Recebimento**; refaça o recebimento se necessário e use o botão "Armazenar este item". |
| `Localização não encontrada.` | A localização selecionada não existe na base. | Recarregue a tela e selecione uma localização válida (`DOCA`, `A-01-01`, `A-01-02` no seed). |
| `Usuário não encontrado.` | O usuário selecionado não existe. | Recarregue a tela e selecione um usuário do seed (`Administrador` / `Operador de Estoque`). |
| "Informe o ID do item de estoque." | Validação do navegador: campo do ID vazio. | Cole o ID gerado no recebimento (ou venha pelo botão "Armazenar este item"). |
| "Selecione a localização de destino." / "Selecione o usuário responsável." | Validação do navegador: campo obrigatório não selecionado. | Selecione o campo destacado. |
| "Nenhuma localização disponível" no campo de seleção | A base não tem localizações cadastradas. | Verifique o seed do sistema (localizações `DOCA`/`A-01-01`/`A-01-02` são criadas na primeira execução). |
| A tela abriu e **voltou para o login** | Sem sessão (não logou, ou a aba foi fechada/reaberta). | Faça login novamente com `admin`/`operador`. |
| "Falha de conexão ao carregar os dados. Recarregue a página." / "Falha de conexão com o servidor..." | A API não respondeu. | Confirme `npm run dev` em `http://localhost:3333/` e recarregue. |
