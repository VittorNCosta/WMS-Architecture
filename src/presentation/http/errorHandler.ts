import { ErrorRequestHandler } from 'express';
import { DomainError } from '../../domain/errors/DomainError';

/** Translates errors to HTTP responses. Violated business rules -> 422. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof DomainError) {
    res.status(422).json({ error: err.message });
    return;
  }

  // Malformed JSON in the request body.
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Corpo da requisição não é um JSON válido.' });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Erro interno do servidor.' });
};
