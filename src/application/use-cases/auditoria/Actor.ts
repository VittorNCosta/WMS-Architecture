/**
 * Identidade do usuário que está executando uma operação auditada.
 *
 * Em rotas HTTP, é construído a partir de `req.user` (anexado pelo
 * authenticationMiddleware). Para LOGIN, o próprio usuário recém-autenticado
 * é o ator.
 */
export interface Actor {
  userId: string;
  login: string;
}
