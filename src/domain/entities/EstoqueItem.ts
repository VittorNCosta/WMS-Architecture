import { randomUUID } from 'node:crypto';
import { DomainError } from '../errors/DomainError';
import { quantidadePositiva, textoObrigatorio } from '../validacao';

/**
 * Saldo de um produto, em uma localização, originado de um recebimento.
 * `dataEntrada` é a chave da regra FIFO: a saída consome os itens mais antigos primeiro.
 */
export class EstoqueItem {
  constructor(
    public readonly id: string,
    public readonly produtoId: string,
    public localizacaoId: string | null,
    public quantidade: number,
    public readonly dataEntrada: Date,
  ) {}

  static criar(props: {
    produtoId: string;
    quantidade: unknown;
    localizacaoId?: string | null;
    dataEntrada?: Date;
  }): EstoqueItem {
    return new EstoqueItem(
      randomUUID(),
      textoObrigatorio(props.produtoId, 'Produto'),
      props.localizacaoId ?? null,
      quantidadePositiva(props.quantidade),
      props.dataEntrada ?? new Date(),
    );
  }

  /** Baixa parte (ou todo) o saldo deste item. */
  baixar(quantidade: number): void {
    const qtd = quantidadePositiva(quantidade, 'Quantidade a baixar');
    if (qtd > this.quantidade) {
      throw new DomainError(
        `Quantidade insuficiente neste item de estoque (disponível: ${this.quantidade}).`,
      );
    }
    this.quantidade -= qtd;
  }

  /** Define/atualiza a localização (usado na armazenagem). */
  armazenarEm(localizacaoId: string): void {
    this.localizacaoId = textoObrigatorio(localizacaoId, 'Localização');
  }
}
