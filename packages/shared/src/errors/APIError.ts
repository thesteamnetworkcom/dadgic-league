// ============================================================================
// API Error Handling
// ============================================================================

export class APIError extends Error {
	public readonly code: string
	public readonly statusCode: number
	public readonly details?: Record<string, any>
	public readonly timestamp: string

	constructor(
		message: string,
		code: string = 'UNKNOWN_ERROR',
		statusCode: number = 500,
		details?: Record<string, any>
	) {
		super(message)
		this.name = 'APIError'
		this.code = code
		this.statusCode = statusCode
		this.details = details
		this.timestamp = new Date().toISOString()
	}

	toJSON() {
		return {
			success: false,
			error: this.message,
			code: this.code,
			details: this.details,
			timestamp: this.timestamp
		}
	}
}

export class ValidationError extends APIError {
	public readonly fieldErrors: { field: string; message: string }[]

	constructor(message: string, fieldErrors: { field: string; message: string }[]) {
		super(message, 'VALIDATION_ERROR', 400)
		this.fieldErrors = fieldErrors
	}
}

export function handleAPIError(error: unknown): APIError {
	if (error instanceof APIError) {
		return error
	}

	if (error instanceof Error) {
		if (error.message.includes('GEMINI_API_KEY')) {
			return new APIError(
				'AI service unavailable - configuration error',
				'AI_SERVICE_ERROR',
				503
			)
		}
		return new APIError(error.message, 'INTERNAL_ERROR', 500)
	}

	return new APIError('An unknown error occurred', 'UNKNOWN_ERROR', 500)
}
