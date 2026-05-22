import { Movimentacao } from '../../../domain/entities/Movimentacao';
import { TipoMovimentacao } from '../../../domain/enums/TipoMovimentacao';
import { DomainError } from '../../../domain/errors/DomainError';
import { IEstoqueRepository } from '../../../domain/repositories/IEstoqueRepository';
import { IMovimentacaoRepository } from '../../../domain/repositories/IMovimentacaoRepository';
import { IProdutoRepository } from '../../../domain/repositories/IProdutoRepository';
import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository';
import { PoliticaFifo } from '../../../domain/services/PoliticaFifo';

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
  ) {}

  async execute(input: ProcessarSaidaInput): Promise<Movimentacao> {
    const produto = await this.produtos.buscarPorId(input.produtoId);
    if (!produto) throw new DomainError('Produto não encontrado.');

    const usuario = await this.usuarios.buscarPorId(input.usuarioId);
    if (!usuario) throw new DomainError('Usuário não encontrado.');

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

    return movimentacao;
  }
}
