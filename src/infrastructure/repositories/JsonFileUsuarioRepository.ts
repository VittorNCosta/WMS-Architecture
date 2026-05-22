import { Usuario } from '../../domain/entities/Usuario';
import { PerfilUsuario } from '../../domain/enums/PerfilUsuario';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository';
import { JsonDatabase, UsuarioRow } from '../persistence/JsonDatabase';

/** Persistência de usuários em arquivo JSON. */
export class JsonFileUsuarioRepository implements IUsuarioRepository {
  constructor(private readonly db: JsonDatabase) {}

  private get linhas(): UsuarioRow[] {
    return this.db.tabela('usuarios');
  }

  private paraRow(u: Usuario): UsuarioRow {
    return { id: u.id, nome: u.nome, login: u.login, perfil: u.perfil, ativo: u.ativo };
  }

  private paraEntidade(r: UsuarioRow): Usuario {
    return new Usuario(r.id, r.nome, r.login, r.perfil as PerfilUsuario, r.ativo);
  }

  async salvar(usuario: Usuario): Promise<void> {
    const i = this.linhas.findIndex((l) => l.id === usuario.id);
    const row = this.paraRow(usuario);
    if (i >= 0) this.linhas[i] = row;
    else this.linhas.push(row);
    this.db.salvar();
  }

  async buscarPorId(id: string): Promise<Usuario | null> {
    const r = this.linhas.find((l) => l.id === id);
    return r ? this.paraEntidade(r) : null;
  }

  async buscarPorLogin(login: string): Promise<Usuario | null> {
    const alvo = login.trim().toLowerCase();
    const r = this.linhas.find((l) => l.login.toLowerCase() === alvo);
    return r ? this.paraEntidade(r) : null;
  }

  async listarTodos(): Promise<Usuario[]> {
    return this.linhas.map((r) => this.paraEntidade(r));
  }
}
