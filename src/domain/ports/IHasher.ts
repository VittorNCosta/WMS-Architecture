/**
 * Domain port for password hashing.
 *
 * The Application layer depends on this abstraction; the concrete
 * implementation (BcryptHasher, for example) lives in Infrastructure.
 */
export interface IHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}
