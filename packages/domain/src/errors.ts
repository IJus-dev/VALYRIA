export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND";
  readonly httpStatus = 404;

  constructor(entity: string, id?: string) {
    super(id ? `${entity} "${id}" not found.` : `${entity} not found.`);
  }
}

export class ValidationError extends DomainError {
  readonly code = "VALIDATION_ERROR";
  readonly httpStatus = 422;
}

export class AuthorizationError extends DomainError {
  readonly code = "AUTHORIZATION_ERROR";
  readonly httpStatus = 403;
}

export class ConflictError extends DomainError {
  readonly code = "CONFLICT";
  readonly httpStatus = 409;
}

export class InsufficientFundsError extends DomainError {
  readonly code = "INSUFFICIENT_FUNDS";
  readonly httpStatus = 422;

  constructor(
    public readonly available: number,
    public readonly required: number,
    message?: string
  ) {
    super(
      message ??
        `Insufficient funds: ${available} available, ${required} required.`
    );
  }
}

export class InvalidStateTransitionError extends DomainError {
  readonly code = "INVALID_STATE_TRANSITION";
  readonly httpStatus = 422;

  constructor(
    public readonly entity: string,
    public readonly currentState: string,
    public readonly event: string
  ) {
    super(
      `${entity} transition "${event}" is invalid from "${currentState}".`
    );
  }
}

export class XrplSubmissionError extends DomainError {
  readonly code = "XRPL_SUBMISSION_ERROR";
  readonly httpStatus = 502;

  constructor(
    public readonly transactionResult?: string,
    message?: string
  ) {
    super(
      message ??
        `XRPL submission failed. TransactionResult=${transactionResult ?? "undefined"}`
    );
  }
}
