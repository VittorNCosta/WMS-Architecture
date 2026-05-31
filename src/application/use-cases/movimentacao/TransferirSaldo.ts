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
import { PoliticaFifo } from '../../../domain/services/PoliticaFifo';
import { MovimentacaoDTO, toMovimentacaoDTO } from '../../dtos/MovimentacaoDTO';
import { Actor } from '../auditoria/Actor';
import { registerAuditSafely } from '../auditoria/registerAuditSafely';

export interface TransferirSaldoInput {
  produtoId: string;
  localizacaoOrigemId: string;
  localizacaoDestinoId: string;
  quantidade: number;
  usuarioId: string;
}

/** Caso de uso: transferir saldo de um produto entre duas localizações (consome a origem por FIFO). */
export class TransferirSaldo {
  constructor(
    private readonly estoque: IEstoqueRepository,
    private readonly movimentacoes: IMovimentacaoRepository,
    private readonly produtos: IProdutoRepository,
    private readonly localizacoes: ILocalizacaoRepository,
    private readonly usuarios: IUsuarioRepository,
    private readonly auditoria: IAuditTrailRepository,
  ) {}

  async execute(input: TransferirSaldoInput, actor: Actor): Promise<MovimentacaoDTO> {
    if (input.localizacaoOrigemId === input.localizacaoDestinoId) {
      throw new DomainError('A localização de origem e a de destino devem ser diferentes.');
    }

    const produto = await EntityFinder.findOrThrow(
      (id) => this.produtos.buscarPorId(id),
      input.produtoId,
      'Produto',
    );

    const origem = await EntityFinder.findOrThrow(
      (id) => this.localizacoes.buscarPorId(id),
      input.localizacaoOrigemId,
      'Localização de origem',
    );

    const destino = await EntityFinder.findOrThrow(
      (id) => this.localizacoes.buscarPorId(id),
      input.localizacaoDestinoId,
      'Localização de destino',
    );

    const usuario = await EntityFinder.findOrThrow(
      (id) => this.usuarios.buscarPorId(id),
      input.usuarioId,
      'Usuário',
    );

    const itensNaOrigem = (await this.estoque.listarPorProduto(produto.id)).filter(
      (item) => item.localizacaoId === origem.id,
    );

    // FIFO: consome os lotes mais antigos da origem primeiro.
    const alocacoes = PoliticaFifo.selecionarConsumo(itensNaOrigem, input.quantidade);

    for (const alocacao of alocacoes) {
      alocacao.item.baixar(alocacao.quantidade);
      if (alocacao.item.quantidade === 0) {
        await this.estoque.remover(alocacao.item.id);
      } else {
        await this.estoque.atualizar(alocacao.item);
      }

      // Preserva a data de entrada original no destino para não furar o FIFO.
      const itemNoDestino = EstoqueItem.criar({
        produtoId: produto.id,
        quantidade: alocacao.quantidade,
        localizacaoId: destino.id,
        dataEntrada: alocacao.item.dataEntrada,
      });
      await this.estoque.salvar(itemNoDestino);
    }

    const movimentacao = Movimentacao.criar({
      tipo: TipoMovimentacao.TRANSFERENCIA,
      produtoId: produto.id,
      quantidade: input.quantidade,
      usuarioId: usuario.id,
      localizacaoOrigemId: origem.id,
      localizacaoDestinoId: destino.id,
    });
    await this.movimentacoes.salvar(movimentacao);

    await registerAuditSafely(this.auditoria, {
      actorUserId: actor.userId,
      actorLogin: actor.login,
      operation: AuditOperation.STOCK_MOVE,
      entityType: 'Estoque',
      entityId: movimentacao.id,
      summary: `Transferência de ${input.quantidade} un. de ${origem.codigo} para ${destino.codigo}.`,
    });

    return toMovimentacaoDTO(movimentacao);
  }
}
