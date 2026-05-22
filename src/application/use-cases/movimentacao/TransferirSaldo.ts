import { EstoqueItem } from '../../../domain/entities/EstoqueItem';
import { Movimentacao } from '../../../domain/entities/Movimentacao';
import { TipoMovimentacao } from '../../../domain/enums/TipoMovimentacao';
import { DomainError } from '../../../domain/errors/DomainError';
import { IEstoqueRepository } from '../../../domain/repositories/IEstoqueRepository';
import { ILocalizacaoRepository } from '../../../domain/repositories/ILocalizacaoRepository';
import { IMovimentacaoRepository } from '../../../domain/repositories/IMovimentacaoRepository';
import { IProdutoRepository } from '../../../domain/repositories/IProdutoRepository';
import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository';
import { PoliticaFifo } from '../../../domain/services/PoliticaFifo';

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
  ) {}

  async execute(input: TransferirSaldoInput): Promise<Movimentacao> {
    if (input.localizacaoOrigemId === input.localizacaoDestinoId) {
      throw new DomainError('A localização de origem e a de destino devem ser diferentes.');
    }

    const produto = await this.produtos.buscarPorId(input.produtoId);
    if (!produto) throw new DomainError('Produto não encontrado.');

    const origem = await this.localizacoes.buscarPorId(input.localizacaoOrigemId);
    if (!origem) throw new DomainError('Localização de origem não encontrada.');

    const destino = await this.localizacoes.buscarPorId(input.localizacaoDestinoId);
    if (!destino) throw new DomainError('Localização de destino não encontrada.');

    const usuario = await this.usuarios.buscarPorId(input.usuarioId);
    if (!usuario) throw new DomainError('Usuário não encontrado.');

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

    return movimentacao;
  }
}
