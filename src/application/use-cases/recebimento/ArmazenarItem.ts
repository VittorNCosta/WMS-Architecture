import { Movimentacao } from '../../../domain/entities/Movimentacao';
import { TipoMovimentacao } from '../../../domain/enums/TipoMovimentacao';
import { DomainError } from '../../../domain/errors/DomainError';
import { IEstoqueRepository } from '../../../domain/repositories/IEstoqueRepository';
import { ILocalizacaoRepository } from '../../../domain/repositories/ILocalizacaoRepository';
import { IMovimentacaoRepository } from '../../../domain/repositories/IMovimentacaoRepository';
import { IUsuarioRepository } from '../../../domain/repositories/IUsuarioRepository';

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
  ) {}

  async execute(input: ArmazenarItemInput): Promise<Movimentacao> {
    const item = await this.estoque.buscarPorId(input.estoqueItemId);
    if (!item) throw new DomainError('Item de estoque não encontrado.');

    const localizacao = await this.localizacoes.buscarPorId(input.localizacaoId);
    if (!localizacao) throw new DomainError('Localização não encontrada.');

    const usuario = await this.usuarios.buscarPorId(input.usuarioId);
    if (!usuario) throw new DomainError('Usuário não encontrado.');

    const localizacaoOrigemId = item.localizacaoId;
    item.armazenarEm(localizacao.id);
    await this.estoque.atualizar(item);

    const movimentacao = Movimentacao.criar({
      tipo: TipoMovimentacao.ARMAZENAGEM,
      produtoId: item.produtoId,
      quantidade: item.quantidade,
      usuarioId: usuario.id,
      localizacaoOrigemId,
      localizacaoDestinoId: localizacao.id,
    });
    await this.movimentacoes.salvar(movimentacao);

    return movimentacao;
  }
}
