import { Usuario } from '../../domain/entities/Usuario';

/**
 * DTO de saída do usuário (representação pública, segura para serializar em JSON).
 *
 * OBSERVAÇÃO: `passwordHash` é propositadamente omitido — segurança (Cap. 6 do
 * documentacao.md): nenhum dado sensível pode vazar pela camada de apresentação.
 */
export interface UsuarioDTO {
  id: string;
  nome: string;
  login: string;
  perfil: string;
  ativo: boolean;
}

export function toUsuarioDTO(usuario: Usuario): UsuarioDTO {
  return {
    id: usuario.id,
    nome: usuario.nome,
    login: usuario.login,
    perfil: usuario.perfil,
    ativo: usuario.ativo,
  };
}
