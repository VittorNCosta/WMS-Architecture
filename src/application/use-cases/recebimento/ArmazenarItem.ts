import { Movimentacao } from '../../../domain/entities/Movimentacao';
import { AuditOperation } from '../../../domain/enums/AuditOperation';
import { TipoMovimentacao } from '../../../domain/enums/TipoMovimentacao';
import { IAuditTrailRepository } from '../../../domain/repositories/IAuditTrailRepository';
import { IEstoqueRepository } from '../../../domain/repositories/IEstoqueRepository';
import { ILocalizacaoRepository } from '../../../domain/repositories/ILocalizacaoRepository';
import { IMovimentacaoRepository } from '../../../domain/repositories/IMovimentacaoRepository';
import { IProdutoRepository } from '../../../domain/repositories/IProdutoRepository';
import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository';
import { EntityFinder } from '../../../domain/services/EntityFinder';
import { MovimentacaoDTO, toMovimentacaoDTO } from '../../dtos/MovimentacaoDTO';
import { Actor } from '../auditoria/Actor';
import { registerAuditSafely } from '../auditoria/registerAuditSafely';

export interface ArmazenarItemInput {
  estoqueItemId: string;
  localizacaoId: string;
  usuarioId: string;
}

/** Caso de uso: armazenar um item recebido em uma localização do armazém. */
export class ArmazenarItem {
  constructor(
    private readonly estoque: IEstoqueRepository,
    private readonly movimentacoes: IMovimentacaoRepository,
    private readonly localizacoes: ILocalizacaoRepository,
    private readonly usuarios: IUsuarioRepository,
    private readonly produtos: IProdutoRepository,
    private readonly auditoria: IAuditTrailRepository,
  ) {}

  async execute(input: ArmazenarItemInput, actor: Actor): Promise<MovimentacaoDTO> {
    const item = await EntityFinder.findOrThrow(
      (id) => this.estoque.buscarPorId(id),
      input.estoqueItemId,
      'Item de estoque',
    );

    const localizacao = await EntityFinder.findOrThrow(
      (id) => this.localizacoes.buscarPorId(id),
      input.localizacaoId,
      'Localização',
    );

    const usuario = await EntityFinder.findOrThrow(
      (id) => this.usuarios.buscarPorId(id),
      input.usuarioId,
      'Usuário',
    );

    const localizacaoOrigemId = item.localizacaoId;
    const quantidadeArmazenada = item.quantidade;
    item.armazenarEm(localizacao.id);
    await this.estoque.atualizar(item);

    const movimentacao = Movimentacao.criar({
      tipo: TipoMovimentacao.ARMAZENAGEM,
      produtoId: item.produtoId,
      quantidade: quantidadeArmazenada,
      usuarioId: usuario.id,
      localizacaoOrigemId,
      localizacaoDestinoId: localizacao.id,
    });
    await this.movimentacoes.salvar(movimentacao);

    // Para o summary humano, buscamos o SKU do produto. Se a leitura falhar,
    // caímos no produtoId — registerAuditSafely engole erros sem derrubar.
    const produto = await this.produtos.buscarPorId(item.produtoId);
    const skuLabel = produto?.sku ?? item.produtoId;

    await registerAuditSafely(this.auditoria, {
      actorUserId: actor.userId,
      actorLogin: actor.login,
      operation: AuditOperation.STOCK_MOVE,
      entityType: 'Estoque',
      entityId: item.id,
      summary: `Armazenagem de ${quantidadeArmazenada} un. do produto ${skuLabel} em ${localizacao.codigo}.`,
    });

    return toMovimentacaoDTO(movimentacao);
  }
}
