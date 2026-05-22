import { Usuario } from '../entities/Usuario';

/** Contrato de persistência de usuários. */
export interface IUsuarioRepository {
  salvar(usuario: Usuario): Promise<void>;
  buscarPorId(id: string): Promise<Usuario | null>;
  buscarPorLogin(login: string): Promise<Usuario | null>;
  listarTodos(): Promise<Usuario[]>;
}
