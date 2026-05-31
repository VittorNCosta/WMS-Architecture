import { Movimentacao } from '../../../domain/entities/Movimentacao';
import { AuditOperation } from '../../../domain/enums/AuditOperation';
import { TipoMovimentacao } from '../../../domain/enums/TipoMovimentacao';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { IEstoqueRepository } from '../../../domain/repositories/IEstoqueRepository';
import { IMovimentacaoRepository } from '../../../domain/repositories/IMovimentacaoRepository';
import { IProdutoRepository } from '../../../domain/repositories/IProdutoRepository';
import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository';
import { EntityFinder } from '../../../domain/services/EntityFinder';
import { PoliticaFifo } from '../../../domain/services/PoliticaFifo';
import { MovimentacaoDTO, toMovimentacaoDTO } from '../../dtos/MovimentacaoDTO';
import { Actor } from '../auditoria/Actor';
import { registerAuditSafely } from '../auditoria/registerAuditSafely';

export interface ProcessarSaidaInput {
  produtoId: string;
  quantidade: number;
  usuarioId: string;
  documentoReferencia?: string | null;
}

/** Caso de uso: dar saída (expedição) de um produto — consome o estoque mais antigo (FIFO). */
export class ProcessarSaida {
  constructor(
    private readonly estoque: IEstoqueRepository,
    private readonly movimentacoes: IMovimentacaoRepository,
    private readonly produtos: IProdutoRepository,
    private readonly usuarios: IUsuarioRepository,
    private readonly auditoria: IAuditTrailRepository,
  ) {}

  async execute(input: ProcessarSaidaInput, actor: Actor): Promise<MovimentacaoDTO> {
    const produto = await EntityFinder.findOrThrow(
      (id) => this.produtos.buscarPorId(id),
      input.produtoId,
      'Produto',
    );

    const usuario = await EntityFinder.findOrThrow(
      (id) => this.usuarios.buscarPorId(id),
      input.usuarioId,
      'Usuário',
    );

    const itens = await this.estoque.listarPorProduto(produto.id);

    // FIFO: a saída consome sempre os lotes mais antigos primeiro.
    const alocacoes = PoliticaFifo.selecionarConsumo(itens, input.quantidade);

    for (const alocacao of alocacoes) {
      alocacao.item.baixar(alocacao.quantidade);
      if (alocacao.item.quantidade === 0) {
        await this.estoque.remover(alocacao.item.id);
      } else {
        await this.estoque.atualizar(alocacao.item);
      }
    }

    const movimentacao = Movimentacao.criar({
      tipo: TipoMovimentacao.SAIDA,
      produtoId: produto.id,
      quantidade: input.quantidade,
      usuarioId: usuario.id,
      documentoReferencia: input.documentoReferencia ?? null,
    });
    await this.movimentacoes.salvar(movimentacao);

    await registerAuditSafely(this.auditoria, {
      actorUserId: actor.userId,
      actorLogin: actor.login,
      operation: AuditOperation.STOCK_MOVE,
      entityType: 'Estoque',
      entityId: movimentacao.id,
      summary: `Saída de ${input.quantidade} un. do produto ${produto.sku}.`,
    });

    return toMovimentacaoDTO(movimentacao);
  }
}
