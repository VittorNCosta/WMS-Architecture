/**
 * Operation types recorded in the operational audit trail.
 *
 * Note: audit != traceability. Stock traceability is handled by `Movement`
 * (balance per product). Here we record WHO did WHICH operation on WHICH
 * resource — including creations, updates and status changes that do not
 * affect balance.
 */
export enum AuditOperation {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  STOCK_MOVE = 'STOCK_MOVE',
  LOGIN = 'LOGIN',
}
