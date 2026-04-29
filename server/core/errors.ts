export type ErrorCode =
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "DB_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly httpStatus: number,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }

  static notFound(resource: string): AppError {
    return new AppError("NOT_FOUND", 404, `${resource} not found`);
  }

  static forbidden(reason?: string): AppError {
    return new AppError("FORBIDDEN", 403, reason ?? "Access denied");
  }

  static conflict(reason: string): AppError {
    return new AppError("CONFLICT", 409, reason);
  }

  static internal(message = "An unexpected error occurred"): AppError {
    return new AppError("INTERNAL_ERROR", 500, message);
  }

  toResponse() {
    return {
      success: false,
      error: this.message,
      code: this.code,
      ...(this.details ? { details: this.details } : {}),
    };
  }
}
