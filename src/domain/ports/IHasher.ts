/**
 * Porta de domínio para hashing de senhas.
 *
 * A camada Application depende desta abstração; a implementação concreta
 * (BcryptHasher, por exemplo) vive em Infrastructure.
 */
export interface IHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}
