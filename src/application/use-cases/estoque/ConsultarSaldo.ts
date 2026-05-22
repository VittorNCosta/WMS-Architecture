import { IEstoqueRepository } from '../../../domain/repositories/IEstoqueRepository';

export interface SaldoPorLocalizacao {
  localizacaoId: string | null;
  quantidade: number;
}

export interface SaldoConsolidado {
  produtoId: string;
  quantidadeTotal: number;
  porLocalizacao: SaldoPorLocalizacao[];
}

/** Caso de uso: consultar o saldo atual de um produto (total e por localização). */
export class ConsultarSaldo {
  constructor(private readonly estoque: IEstoqueRepository) {}

  async porProduto(produtoId: string): Promise<SaldoConsolidado> {
    const itens = await this.estoque.listarPorProduto(produtoId);

    const acumulado = new Map<string, number>();
    let quantidadeTotal = 0;
    for (const item of itens) {
      quantidadeTotal += item.quantidade;
      const chave = item.localizacaoId ?? '(sem localização)';
      acumulado.set(chave, (acumulado.get(chave) ?? 0) + item.quantidade);
    }

    const porLocalizacao: SaldoPorLocalizacao[] = [...acumulado.entries()].map(
      ([chave, quantidade]) => ({
        localizacaoId: chave === '(sem localização)' ? null : chave,
        quantidade,
      }),
    );

    return { produtoId, quantidadeTotal, porLocalizacao };
  }
}
