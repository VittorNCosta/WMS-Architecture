import { RequestHandler } from 'express';

/** Encaminha erros de handlers assíncronos para o middleware de erro do Express 4. */
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
