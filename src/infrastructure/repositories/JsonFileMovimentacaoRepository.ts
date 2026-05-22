import { Movimentacao } from '../../domain/entities/Movimentacao';
import { TipoMovimentacao } from '../../domain/enums/TipoMovimentacao';
import { IMovimentacaoRepository } from '../../domain/repositories/IMovimentacaoRepository';
import { JsonDatabase, MovimentacaoRow } from '../persistence/JsonDatabase';

/** Persistência do histórico de movimentações (rastreabilidade) em arquivo JSON. */
export class JsonFileMovimentacaoRepository implements IMovimentacaoRepository {
  constructor(private readonly db: JsonDatabase) {}

  private get linhas(): MovimentacaoRow[] {
    return this.db.tabela('movimentacoes');
  }

  private paraRow(m: Movimentacao): MovimentacaoRow {
    return {
      id: m.id,
      tipo: m.tipo,
      produtoId: m.produtoId,
      quantidade: m.quantidade,
      localizacaoOrigemId: m.localizacaoOrigemId,
      localizacaoDestinoId: m.localizacaoDestinoId,
      usuarioId: m.usuarioId,
      documentoReferencia: m.documentoReferencia,
      dataHora: m.dataHora.toISOString(),
    };
  }

  private paraEntidade(r: MovimentacaoRow): Movimentacao {
    return new Movimentacao(
      r.id,
      r.tipo as TipoMovimentacao,
      r.produtoId,
      r.quantidade,
      r.localizacaoOrigemId,
      r.localizacaoDestinoId,
      r.usuarioId,
      r.documentoReferencia,
      new Date(r.dataHora),
    );
  }

  async salvar(movimentacao: Movimentacao): Promise<void> {
    this.linhas.push(this.paraRow(movimentacao));
    this.db.salvar();
  }

  async listarTodas(): Promise<Movimentacao[]> {
    return this.linhas.map((r) => this.paraEntidade(r));
  }

  async listarPorProduto(produtoId: string): Promise<Movimentacao[]> {
    return this.linhas.filter((r) => r.produtoId === produtoId).map((r) => this.paraEntidade(r));
  }
}
