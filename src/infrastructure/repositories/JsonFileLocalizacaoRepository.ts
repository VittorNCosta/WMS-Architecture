import { Localizacao } from '../../domain/entities/Localizacao';
import { ILocalizacaoRepository } from '../../domain/repositories/ILocalizacaoRepository';
import { JsonDatabase, LocalizacaoRow } from '../persistence/JsonDatabase';

/** Persistência de localizações em arquivo JSON. */
export class JsonFileLocalizacaoRepository implements ILocalizacaoRepository {
  constructor(private readonly db: JsonDatabase) {}

  private get linhas(): LocalizacaoRow[] {
    return this.db.tabela('localizacoes');
  }

  private paraRow(l: Localizacao): LocalizacaoRow {
    return { id: l.id, codigo: l.codigo, descricao: l.descricao, ativo: l.ativo };
  }

  private paraEntidade(r: LocalizacaoRow): Localizacao {
    // Migração leve: JSON antigo pode não ter `ativo` — assume true.
    return new Localizacao(r.id, r.codigo, r.descricao, r.ativo ?? true);
  }

  async salvar(localizacao: Localizacao): Promise<void> {
    const i = this.linhas.findIndex((l) => l.id === localizacao.id);
    const row = this.paraRow(localizacao);
    if (i >= 0) this.linhas[i] = row;
    else this.linhas.push(row);
    this.db.salvar();
  }

  async buscarPorId(id: string): Promise<Localizacao | null> {
    const r = this.linhas.find((l) => l.id === id);
    return r ? this.paraEntidade(r) : null;
  }

  async buscarPorCodigo(codigo: string): Promise<Localizacao | null> {
    const alvo = codigo.trim().toLowerCase();
    const r = this.linhas.find((l) => l.codigo.toLowerCase() === alvo);
    return r ? this.paraEntidade(r) : null;
  }

  async listarTodas(): Promise<Localizacao[]> {
    return this.linhas.map((r) => this.paraEntidade(r));
  }
}
