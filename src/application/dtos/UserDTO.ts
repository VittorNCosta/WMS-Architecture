import { User } from '../../domain/entities/User';

/**
 * User output DTO (public representation, safe to serialize as JSON).
 *
 * NOTE: `passwordHash` is deliberately omitted — security (Ch. 6 of
 * documentacao.md): no sensitive data may leak through the presentation layer.
 */
export interface UserDTO {
  id: string;
  name: string;
  login: string;
  role: string;
  active: boolean;
}

export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    name: user.name,
    login: user.login,
    role: user.role,
    active: user.active,
  };
}
