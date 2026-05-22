import { DomainError } from './errors/DomainError';

/**
 * Pequenos validadores reutilizados pelas entidades do domínio.
 * Mantêm as regras básicas de consistência num único lugar.
 */

export function textoObrigatorio(valor: unknown, campo: string): string {
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw new DomainError(`${campo} é obrigatório.`);
  }
  return valor.trim();
}

export function textoOpcional(valor: unknown): string | null {
  if (typeof valor !== 'string') return null;
  const limpo = valor.trim();
  return limpo === '' ? null : limpo;
}

export function quantidadePositiva(valor: unknown, campo = 'Quantidade'): number {
  if (typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
    throw new DomainError(`${campo} deve ser um número maior que zero.`);
  }
  return valor;
}
