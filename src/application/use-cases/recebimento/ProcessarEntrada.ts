import { EstoqueItem } from '../../../domain/entities/EstoqueItem';
import { Movimentacao } from '../../../domain/entities/Movimentacao';
import { AuditOperation } from '../../../domain/enums/AuditOperation';
import { TipoMovimentacao } from '../../../domain/enums/TipoMovimentacao';
import { DomainError } from '../../../domain/errors/DomainError';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { IEstoqueRepository } from '../../../domain/repositories/IEstoqueRepository';
import { ILocalizacaoRepository } from '../../../domain/repositories/ILocalizacaoRepository';
import { IMovimentacaoRepository } from '../../../domain/repositories/IMovimentacaoRepository';
import { IProdutoRepository } from '../../../domain/repositories/IProdutoRepository';
import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository';
import { EntityFinder } from '../../../domain/services/EntityFinder';
import { EstoqueItemDTO, toEstoqueItemDTO } from '../../dtos/EstoqueItemDTO';
import { MovimentacaoDTO, toMovimentacaoDTO } from '../../dtos/MovimentacaoDTO';
import { Actor } from '../auditoria/Actor';
import { registerAuditSafely } from '../auditoria/registerAuditSafely';

export interface ProcessarEntradaInput {
  produtoId: string;
  quantidade: number;
  usuarioId: string;
  localizacaoId?: string | null;
  documentoReferencia?: string | null;
}

export interface ProcessarEntradaResult {
  estoqueItem: EstoqueItemDTO;
  movimentacao: MovimentacaoDTO;
}

/** Caso de uso: dar entrada (recebimento) de um produto no estoque. */
export class ProcessarEntrada {
  constructor(
    private readonly estoque: IEstoqueRepository,
    private readonly movimentacoes: IMovimentacaoRepository,
    private readonly produtos: IProdutoRepository,
    private readonly usuarios: IUsuarioRepository,
    private readonly localizacoes: ILocalizacaoRepository,
    private readonly auditoria: IAuditTrailRepository,
  ) {}

  async execute(input: ProcessarEntradaInput, actor: Actor): Promise<ProcessarEntradaResult> {
    const produto = await EntityFinder.findOrThrow(
      (id) => this.produtos.buscarPorId(id),
      input.produtoId,
      'Produto',
    );
    if (!produto.ativo) throw new DomainError('Produto inativo não pode receber entrada.');

    const usuario = await EntityFinder.findOrThrow(
      (id) => this.usuarios.buscarPorId(id),
      input.usuarioId,
      'Usuário',
    );

    let localizacaoId: string | null = null;
    if (input.localizacaoId) {
      const localizacao = await EntityFinder.findOrThrow(
        (id) => this.localizacoes.buscarPorId(id),
        input.localizacaoId,
        'Localização',
      );
      localizacaoId = localizacao.id;
    }

    const estoqueItem = EstoqueItem.criar({
      produtoId: produto.id,
      quantidade: input.quantidade,
      localizacaoId,
    });
    await this.estoque.salvar(estoqueItem);

    const movimentacao = Movimentacao.criar({
      tipo: TipoMovimentacao.ENTRADA,
      produtoId: produto.id,
      quantidade: estoqueItem.quantidade,
      usuarioId: usuario.id,
      localizacaoDestinoId: localizacaoId,
      documentoReferencia: input.documentoReferencia ?? null,
    });
    await this.movimentacoes.salvar(movimentacao);

    await registerAuditSafely(this.auditoria, {
      actorUserId: actor.userId,
      actorLogin: actor.login,
      operation: AuditOperation.STOCK_MOVE,
      entityType: 'Estoque',
      entityId: estoqueItem.id,
      summary: `Entrada de ${estoqueItem.quantidade} un. do produto ${produto.sku}.`,
    });

    return {
      estoqueItem: toEstoqueItemDTO(estoqueItem),
      movimentacao: toMovimentacaoDTO(movimentacao),
    };
  }
}
