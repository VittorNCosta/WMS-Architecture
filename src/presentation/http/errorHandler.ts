import { ErrorRequestHandler } from 'express';
import { DomainError } from '../../domain/errors/DomainError';

/** Traduz erros para respostas HTTP. Regras de negócio violadas -> 422. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof DomainError) {
    res.status(422).json({ erro: err.message });
    return;
  }

  // JSON malformado no corpo da requisição.
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ erro: 'Corpo da requisição não é um JSON válido.' });
    return;
  }

  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
};
