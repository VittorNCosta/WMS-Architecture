/**
 * Tipos de operação registrados na trilha de auditoria operacional.
 *
 * Atenção: auditoria != rastreabilidade. Rastreabilidade de estoque é tratada
 * por `Movimentacao` (saldo por produto). Aqui registra-se QUEM fez QUAL
 * operação em QUAL recurso — inclusive cadastros, atualizações e mudanças de
 * status que não mexem em saldo.
 */
export enum AuditOperation {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  STOCK_MOVE = 'STOCK_MOVE',
  LOGIN = 'LOGIN',
}
