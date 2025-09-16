export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(status: number, message: string, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function jsonOk<T>(data: T, init?: ResponseInit): Response {
  return Response.json(data, { status: 200, ...init });
}

export function jsonCreated<T>(data: T): Response {
  return Response.json(data, { status: 201 });
}

export function jsonError(error: unknown, fallbackStatus = 500): Response {
  if (error instanceof ApiError) {
    return Response.json(
      { error: { message: error.message, code: error.code, details: error.details } },
      { status: error.status }
    );
  }
  const message = error instanceof Error ? error.message : "Internal Server Error";
  return Response.json({ error: { message } }, { status: fallbackStatus });
}

export function assert(condition: unknown, status: number, message: string, code?: string): asserts condition {
  if (!condition) {
    throw new ApiError(status, message, code);
  }
}


