import { describe, it, expect, beforeEach } from 'vitest';
import { AlterarStatusLocalizacao } from '../../../src/application/use-cases/localizacoes/AlterarStatusLocalizacao';
import { EstoqueItem } from '../../../src/domain/entities/EstoqueItem';
import { Localizacao } from '../../../src/domain/entities/Localizacao';
import { DomainError } from '../../../src/domain/errors/DomainError';
import { IEstoqueRepository } from '../../../src/domain/repositories/IEstoqueRepository';
import { ILocalizacaoRepository } from '../../../src/domain/repositories/ILocalizacaoRepository';

class LocalizacaoRepoMemoria implements ILocalizacaoRepository {
  private dados = new Map<string, Localizacao>();
  inserir(l: Localizacao): void {
    this.dados.set(l.id, l);
  }
  async salvar(l: Localizacao): Promise<void> {
    this.dados.set(l.id, l);
  }
  async buscarPorId(id: string): Promise<Localizacao | null> {
    return this.dados.get(id) ?? null;
  }
  async buscarPorCodigo(codigo: string): Promise<Localizacao | null> {
    const alvo = codigo.toLowerCase();
    for (const l of this.dados.values()) if (l.codigo.toLowerCase() === alvo) return l;
    return null;
  }
  async listarTodas(): Promise<Localizacao[]> {
    return [...this.dados.values()];
  }
}

class EstoqueRepoMemoria implements IEstoqueRepository {
  private itens: EstoqueItem[] = [];
  inserir(i: EstoqueItem): void {
    this.itens.push(i);
  }
  async salvar(i: EstoqueItem): Promise<void> {
    this.itens.push(i);
  }
  async atualizar(i: EstoqueItem): Promise<void> {
    const idx = this.itens.findIndex((x) => x.id === i.id);
    if (idx >= 0) this.itens[idx] = i;
  }
  async remover(id: string): Promise<void> {
    this.itens = this.itens.filter((x) => x.id !== id);
  }
  async buscarPorId(id: string): Promise<EstoqueItem | null> {
    return this.itens.find((x) => x.id === id) ?? null;
  }
  async listarPorProduto(produtoId: string): Promise<EstoqueItem[]> {
    return this.itens.filter((x) => x.produtoId === produtoId);
  }
  async listarPorLocalizacao(localizacaoId: string): Promise<EstoqueItem[]> {
    return this.itens.filter((x) => x.localizacaoId === localizacaoId);
  }
  async listarTodos(): Promise<EstoqueItem[]> {
    return [...this.itens];
  }
}

describe('AlterarStatusLocalizacao (caso de uso)', () => {
  let locRepo: LocalizacaoRepoMemoria;
  let estRepo: EstoqueRepoMemoria;
  let caso: AlterarStatusLocalizacao;

  beforeEach(() => {
    locRepo = new LocalizacaoRepoMemoria();
    estRepo = new EstoqueRepoMemoria();
    caso = new AlterarStatusLocalizacao(locRepo, estRepo);
  });

  it('inativa localização sem estoque', async () => {
    const l = Localizacao.criar({ codigo: 'A-01' });
    locRepo.inserir(l);

    const r = await caso.execute(l.id, { ativo: false });
    expect(r.ativo).toBe(false);
  });

  it('rejeita inativar com estoque vinculado (quantidade > 0)', async () => {
    const l = Localizacao.criar({ codigo: 'A-01' });
    locRepo.inserir(l);
    estRepo.inserir(EstoqueItem.criar({ produtoId: 'p1', quantidade: 5, localizacaoId: l.id }));

    await expect(caso.execute(l.id, { ativo: false })).rejects.toThrow(
      'Não é possível inativar uma localização com estoque vinculado.',
    );
  });

  it('reativa localização inativa', async () => {
    const l = Localizacao.criar({ codigo: 'A-01' });
    l.inativar();
    locRepo.inserir(l);

    const r = await caso.execute(l.id, { ativo: true });
    expect(r.ativo).toBe(true);
  });

  it('rejeita id inexistente', async () => {
    await expect(caso.execute('inexistente', { ativo: false })).rejects.toThrow(
      'Localização não encontrada.',
    );
  });

  it('rejeita "ativo" não-booleano', async () => {
    const l = Localizacao.criar({ codigo: 'A-01' });
    locRepo.inserir(l);
    await expect(caso.execute(l.id, { ativo: 1 as unknown })).rejects.toThrow(DomainError);
  });
});
