// ============================================================================
// ERROR TYPES AND UTILITIES
// ============================================================================

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class ValidationError extends APIError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class DatabaseError extends APIError {
  constructor(message: string) {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

export function handleAPIError(error: any): APIError {
  if (error instanceof APIError) {
    return error;
  }
  
  return new APIError(error.message || 'Unknown error', 500);
}
