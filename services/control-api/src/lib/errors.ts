export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: string = "request_error"
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function asPublicError(error: unknown): {
  statusCode: number;
  body: { error: string; code: string };
} {
  if (error instanceof HttpError) {
    return {
      statusCode: error.statusCode,
      body: { error: error.message, code: error.code }
    };
  }

  return {
    statusCode: 500,
    body: { error: "Internal server error", code: "internal_error" }
  };
}
