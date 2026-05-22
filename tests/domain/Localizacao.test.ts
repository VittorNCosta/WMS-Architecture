import { describe, it, expect } from 'vitest';
import { Localizacao } from '../../src/domain/entities/Localizacao';
import { DomainError } from '../../src/domain/errors/DomainError';

describe('Localizacao (entidade)', () => {
  it('criar retorna ativo === true', () => {
    const l = Localizacao.criar({ codigo: 'A-01-01', descricao: 'Prateleira A1' });
    expect(l.ativo).toBe(true);
    expect(l.codigo).toBe('A-01-01');
    expect(l.descricao).toBe('Prateleira A1');
  });

  it('criar rejeita código em branco', () => {
    expect(() => Localizacao.criar({ codigo: '   ' })).toThrow(DomainError);
  });

  it('descricao opcional vira null quando ausente', () => {
    const l = Localizacao.criar({ codigo: 'B-01' });
    expect(l.descricao).toBeNull();
  });

  it('atualizar muda codigo e descricao', () => {
    const l = Localizacao.criar({ codigo: 'B-01', descricao: 'antiga' });
    l.atualizar({ codigo: 'B-02', descricao: 'nova' });
    expect(l.codigo).toBe('B-02');
    expect(l.descricao).toBe('nova');
  });

  it('atualizar rejeita codigo vazio', () => {
    const l = Localizacao.criar({ codigo: 'B-01' });
    expect(() => l.atualizar({ codigo: '   ' })).toThrow(DomainError);
  });

  it('ativar e inativar alternam o flag', () => {
    const l = Localizacao.criar({ codigo: 'B-01' });
    l.inativar();
    expect(l.ativo).toBe(false);
    l.ativar();
    expect(l.ativo).toBe(true);
  });
});
