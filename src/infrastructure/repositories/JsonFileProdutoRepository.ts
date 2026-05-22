import { Produto } from '../../domain/entities/Produto';
import { IProdutoRepository } from '../../domain/repositories/IProdutoRepository';
import { JsonDatabase, ProdutoRow } from '../persistence/JsonDatabase';

/**
 * Persistência de produtos em arquivo JSON.
 * Implementa a mesma interface (`IProdutoRepository`) que o resto da aplicação usa —
 * trocar isto por um banco real não afeta Domain, Application nem Presentation.
 */
export class JsonFileProdutoRepository implements IProdutoRepository {
  constructor(private readonly db: JsonDatabase) {}

  private get linhas(): ProdutoRow[] {
    return this.db.tabela('produtos');
  }

  private paraRow(p: Produto): ProdutoRow {
    return {
      id: p.id,
      sku: p.sku,
      nome: p.nome,
      descricao: p.descricao,
      unidadeMedida: p.unidadeMedida,
      ativo: p.ativo,
      criadoEm: p.criadoEm.toISOString(),
      atualizadoEm: p.atualizadoEm.toISOString(),
    };
  }

  private paraEntidade(r: ProdutoRow): Produto {
    return new Produto(
      r.id,
      r.sku,
      r.nome,
      r.descricao,
      r.unidadeMedida,
      r.ativo,
      new Date(r.criadoEm),
      new Date(r.atualizadoEm),
    );
  }

  private gravar(produto: Produto): void {
    const i = this.linhas.findIndex((l) => l.id === produto.id);
    const row = this.paraRow(produto);
    if (i >= 0) this.linhas[i] = row;
    else this.linhas.push(row);
    this.db.salvar();
  }

  async salvar(produto: Produto): Promise<void> {
    this.gravar(produto);
  }

  async atualizar(produto: Produto): Promise<void> {
    this.gravar(produto);
  }

  async buscarPorId(id: string): Promise<Produto | null> {
    const r = this.linhas.find((l) => l.id === id);
    return r ? this.paraEntidade(r) : null;
  }

  async buscarPorSku(sku: string): Promise<Produto | null> {
    const alvo = sku.trim().toLowerCase();
    const r = this.linhas.find((l) => l.sku.toLowerCase() === alvo);
    return r ? this.paraEntidade(r) : null;
  }

  async listarTodos(): Promise<Produto[]> {
    return this.linhas.map((r) => this.paraEntidade(r));
  }
}
