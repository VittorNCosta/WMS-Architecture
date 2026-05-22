import { describe, it, expect } from 'vitest';
import { EstoqueItem } from '../../src/domain/entities/EstoqueItem';
import { PoliticaFifo } from '../../src/domain/services/PoliticaFifo';
import { DomainError } from '../../src/domain/errors/DomainError';

/** Cria um item de estoque "de mentira" só com o que o FIFO precisa. */
const item = (quantidade: number, dataEntrada: string) =>
  EstoqueItem.criar({ produtoId: 'produto-1', quantidade, dataEntrada: new Date(dataEntrada) });

describe('PoliticaFifo (regra de negócio FIFO)', () => {
  it('consome primeiro o lote mais antigo', () => {
    const lotes = [
      item(10, '2026-03-10'),
      item(5, '2026-01-05'), // mais antigo
      item(7, '2026-02-01'),
    ];

    const alocacoes = PoliticaFifo.selecionarConsumo(lotes, 8);

    expect(alocacoes).toHaveLength(2);
    expect(alocacoes[0].item.dataEntrada).toEqual(new Date('2026-01-05'));
    expect(alocacoes[0].quantidade).toBe(5);
    expect(alocacoes[1].item.dataEntrada).toEqual(new Date('2026-02-01'));
    expect(alocacoes[1].quantidade).toBe(3);
  });

  it('consome um único lote quando a quantidade casa exatamente', () => {
    const lotes = [item(4, '2026-01-01'), item(6, '2026-01-02')];

    const alocacoes = PoliticaFifo.selecionarConsumo(lotes, 4);

    expect(alocacoes).toHaveLength(1);
    expect(alocacoes[0].quantidade).toBe(4);
  });

  it('rejeita quando o saldo total é insuficiente', () => {
    const lotes = [item(2, '2026-01-01'), item(3, '2026-01-02')];

    expect(() => PoliticaFifo.selecionarConsumo(lotes, 10)).toThrow(DomainError);
  });

  it('rejeita quantidade zero ou negativa', () => {
    expect(() => PoliticaFifo.selecionarConsumo([item(5, '2026-01-01')], 0)).toThrow(DomainError);
    expect(() => PoliticaFifo.selecionarConsumo([item(5, '2026-01-01')], -1)).toThrow(DomainError);
  });

  it('rejeita quando não há estoque algum', () => {
    expect(() => PoliticaFifo.selecionarConsumo([], 1)).toThrow(DomainError);
  });
});
