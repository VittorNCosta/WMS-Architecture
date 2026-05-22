import { EstoqueItem } from '../../domain/entities/EstoqueItem';
import { IEstoqueRepository } from '../../domain/repositories/IEstoqueRepository';
import { EstoqueItemRow, JsonDatabase } from '../persistence/JsonDatabase';

/** Persistência do saldo de estoque em arquivo JSON. */
export class JsonFileEstoqueRepository implements IEstoqueRepository {
  constructor(private readonly db: JsonDatabase) {}

  private get linhas(): EstoqueItemRow[] {
    return this.db.tabela('estoque');
  }

  private paraRow(item: EstoqueItem): EstoqueItemRow {
    return {
      id: item.id,
      produtoId: item.produtoId,
      localizacaoId: item.localizacaoId,
      quantidade: item.quantidade,
      dataEntrada: item.dataEntrada.toISOString(),
    };
  }

  private paraEntidade(r: EstoqueItemRow): EstoqueItem {
    return new EstoqueItem(r.id, r.produtoId, r.localizacaoId, r.quantidade, new Date(r.dataEntrada));
  }

  private gravar(item: EstoqueItem): void {
    const i = this.linhas.findIndex((l) => l.id === item.id);
    const row = this.paraRow(item);
    if (i >= 0) this.linhas[i] = row;
    else this.linhas.push(row);
    this.db.salvar();
  }

  async salvar(item: EstoqueItem): Promise<void> {
    this.gravar(item);
  }

  async atualizar(item: EstoqueItem): Promise<void> {
    this.gravar(item);
  }

  async remover(id: string): Promise<void> {
    const i = this.linhas.findIndex((l) => l.id === id);
    if (i >= 0) {
      this.linhas.splice(i, 1);
      this.db.salvar();
    }
  }

  async buscarPorId(id: string): Promise<EstoqueItem | null> {
    const r = this.linhas.find((l) => l.id === id);
    return r ? this.paraEntidade(r) : null;
  }

  async listarPorProduto(produtoId: string): Promise<EstoqueItem[]> {
    return this.linhas.filter((r) => r.produtoId === produtoId).map((r) => this.paraEntidade(r));
  }

  async listarPorLocalizacao(localizacaoId: string): Promise<EstoqueItem[]> {
    return this.linhas
      .filter((r) => r.localizacaoId === localizacaoId)
      .map((r) => this.paraEntidade(r));
  }

  async listarTodos(): Promise<EstoqueItem[]> {
    return this.linhas.map((r) => this.paraEntidade(r));
  }
}
