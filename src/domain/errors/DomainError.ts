/**
 * Business-rule error raised by the domain.
 * The Presentation layer translates it to HTTP 422.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
