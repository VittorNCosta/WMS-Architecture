import { RequestHandler } from 'express';

/** Forwards errors from async handlers to the Express 4 error middleware. */
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
