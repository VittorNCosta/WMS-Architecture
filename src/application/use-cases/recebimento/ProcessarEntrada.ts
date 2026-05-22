import { EstoqueItem } from '../../../domain/entities/EstoqueItem';
import { Movimentacao } from '../../../domain/entities/Movimentacao';
import { TipoMovimentacao } from '../../../domain/enums/TipoMovimentacao';
import { DomainError } from '../../../domain/errors/DomainError';
import { IEstoqueRepository } from '../../../domain/repositories/IEstoqueRepository';
import { ILocalizacaoRepository } from '../../../domain/repositories/ILocalizacaoRepository';
import { IMovimentacaoRepository } from '../../../domain/repositories/IMovimentacaoRepository';
import { IProdutoRepository } from '../../../domain/repositories/IProdutoRepository';
import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository';

export interface ProcessarEntradaInput {
  produtoId: string;
  quantidade: number;
  usuarioId: string;
  localizacaoId?: string | null;
  documentoReferencia?: string | null;
}

export interface ProcessarEntradaResult {
  estoqueItem: EstoqueItem;
  movimentacao: Movimentacao;
}

/** Caso de uso: dar entrada (recebimento) de um produto no estoque. */
export class ProcessarEntrada {
  constructor(
    private readonly estoque: IEstoqueRepository,
    private readonly movimentacoes: IMovimentacaoRepository,
    private readonly produtos: IProdutoRepository,
    private readonly usuarios: IUsuarioRepository,
    private readonly localizacoes: ILocalizacaoRepository,
  ) {}

  async execute(input: ProcessarEntradaInput): Promise<ProcessarEntradaResult> {
    const produto = await this.produtos.buscarPorId(input.produtoId);
    if (!produto) throw new DomainError('Produto não encontrado.');
    if (!produto.ativo) throw new DomainError('Produto inativo não pode receber entrada.');

    const usuario = await this.usuarios.buscarPorId(input.usuarioId);
    if (!usuario) throw new DomainError('Usuário não encontrado.');

    let localizacaoId: string | null = null;
    if (input.localizacaoId) {
      const localizacao = await this.localizacoes.buscarPorId(input.localizacaoId);
      if (!localizacao) throw new DomainError('Localização não encontrada.');
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

    return { estoqueItem, movimentacao };
  }
}
