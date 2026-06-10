/**
 * Identity of the user performing an audited operation.
 *
 * On HTTP routes, it is built from `req.user` (attached by the
 * authenticationMiddleware). For LOGIN, the freshly authenticated user is
 * the actor.
 */
export interface Actor {
  userId: string;
  login: string;
}
