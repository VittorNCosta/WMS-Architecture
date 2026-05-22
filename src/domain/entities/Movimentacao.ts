import { randomUUID } from 'node:crypto';
import { TipoMovimentacao } from '../enums/TipoMovimentacao';
import { quantidadePositiva, textoObrigatorio } from '../validacao';

/**
 * Registro imutável de uma movimentação de estoque.
 * É a base da rastreabilidade: toda entrada, armazenagem, transferência e saída gera um.
 */
export class Movimentacao {
  constructor(
    public readonly id: string,
    public readonly tipo: TipoMovimentacao,
    public readonly produtoId: string,
    public readonly quantidade: number,
    public readonly localizacaoOrigemId: string | null,
    public readonly localizacaoDestinoId: string | null,
    public readonly usuarioId: string,
    public readonly documentoReferencia: string | null,
    public readonly dataHora: Date,
  ) {}

  static criar(props: {
    tipo: TipoMovimentacao;
    produtoId: string;
    quantidade: number;
    usuarioId: string;
    localizacaoOrigemId?: string | null;
    localizacaoDestinoId?: string | null;
    documentoReferencia?: string | null;
  }): Movimentacao {
    return new Movimentacao(
      randomUUID(),
      props.tipo,
      textoObrigatorio(props.produtoId, 'Produto'),
      quantidadePositiva(props.quantidade),
      props.localizacaoOrigemId ?? null,
      props.localizacaoDestinoId ?? null,
      textoObrigatorio(props.usuarioId, 'Usuário responsável'),
      props.documentoReferencia ? String(props.documentoReferencia) : null,
      new Date(),
    );
  }
}
