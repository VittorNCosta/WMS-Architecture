import { describe, it, expect } from 'vitest';
import { EstoqueItem } from '../../../src/domain/entities/EstoqueItem';
import { Localizacao } from '../../../src/domain/entities/Localizacao';
import { Produto } from '../../../src/domain/entities/Produto';
import { StockOverviewConsolidator } from '../../../src/application/use-cases/estoque/StockOverviewConsolidator';

describe('StockOverviewConsolidator (application service)', () => {
  const consolidator = new StockOverviewConsolidator();

  it('agrega itens do mesmo produto+localização e soma quantidades', () => {
    const p1 = Produto.criar({ sku: 'S1', nome: 'Banana', unidadeMedida: 'UN' });
    const l1 = Localizacao.criar({ codigo: 'A-01' });

    const r = consolidator.consolidate(
      [
        EstoqueItem.criar({ produtoId: p1.id, quantidade: 10, localizacaoId: l1.id }),
        EstoqueItem.criar({ produtoId: p1.id, quantidade: 5, localizacaoId: l1.id }),
      ],
      [p1],
      [l1],
    );

    expect(r.totalRegistros).toBe(1);
    expect(r.itens[0].quantidade).toBe(15);
    expect(r.quantidadeTotalGeral).toBe(15);
  });

  it('enriquece com SKU/nome do produto e código/descrição da localização', () => {
    const p1 = Produto.criar({ sku: 'S1', nome: 'Banana', unidadeMedida: 'UN' });
    const l1 = Localizacao.criar({ codigo: 'A-01', descricao: 'Rua A' });

    const r = consolidator.consolidate(
      [EstoqueItem.criar({ produtoId: p1.id, quantidade: 4, localizacaoId: l1.id })],
      [p1],
      [l1],
    );

    const linha = r.itens[0];
    expect(linha.produtoSku).toBe('S1');
    expect(linha.produtoNome).toBe('Banana');
    expect(linha.localizacaoCodigo).toBe('A-01');
    expect(linha.localizacaoDescricao).toBe('Rua A');
  });

  it('trata item sem localização (localizacaoId nulo)', () => {
    const p1 = Produto.criar({ sku: 'S1', nome: 'Banana', unidadeMedida: 'UN' });

    const r = consolidator.consolidate(
      [EstoqueItem.criar({ produtoId: p1.id, quantidade: 7, localizacaoId: null })],
      [p1],
      [],
    );

    expect(r.itens[0].localizacaoId).toBeNull();
    expect(r.itens[0].localizacaoCodigo).toBeNull();
  });

  it('mantém SKU/nome nulos quando o produto referenciado não existe', () => {
    const r = consolidator.consolidate(
      [EstoqueItem.criar({ produtoId: 'fantasma', quantidade: 2, localizacaoId: null })],
      [],
      [],
    );

    expect(r.itens[0].produtoSku).toBeNull();
    expect(r.itens[0].produtoNome).toBeNull();
  });

  it('calcula totais e ordena por localização e depois por nome do produto', () => {
    const banana = Produto.criar({ sku: 'S1', nome: 'Banana', unidadeMedida: 'UN' });
    const abacaxi = Produto.criar({ sku: 'S2', nome: 'Abacaxi', unidadeMedida: 'UN' });
    const a01 = Localizacao.criar({ codigo: 'A-01' });
    const b02 = Localizacao.criar({ codigo: 'B-02' });

    const r = consolidator.consolidate(
      [
        EstoqueItem.criar({ produtoId: banana.id, quantidade: 10, localizacaoId: a01.id }),
        EstoqueItem.criar({ produtoId: abacaxi.id, quantidade: 3, localizacaoId: b02.id }),
        EstoqueItem.criar({ produtoId: banana.id, quantidade: 7, localizacaoId: null }),
      ],
      [banana, abacaxi],
      [a01, b02],
    );

    expect(r.quantidadeTotalGeral).toBe(20);
    expect(r.totalRegistros).toBe(3);
    // sem localização (código nulo -> "") vem antes de A-01 e B-02
    expect(r.itens.map((i) => i.localizacaoCodigo)).toEqual([null, 'A-01', 'B-02']);
  });
});
