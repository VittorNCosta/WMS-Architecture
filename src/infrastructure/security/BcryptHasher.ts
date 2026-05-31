import bcrypt from 'bcryptjs';
import { IHasher } from '../../domain/ports/IHasher';

/** Implementação de IHasher usando bcryptjs (puro JS, sem dependências nativas). */
export class BcryptHasher implements IHasher {
  constructor(private readonly rounds: number = 10) {}

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
