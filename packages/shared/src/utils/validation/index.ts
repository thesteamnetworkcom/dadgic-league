// ============================================================================
// Validation Utilities
// ============================================================================

export interface ValidationResult {
	isValid: boolean
	errors: { field: string; message: string }[]
}

export class Validator {
	private errors: { field: string; message: string }[] = []

	required(value: any, field: string): this {
		if (value === undefined || value === null || value === '') {
			this.errors.push({ field, message: `${field} is required` })
		}
		return this
	}

	string(value: any, field: string): this {
		if (value !== undefined && value !== null && typeof value !== 'string') {
			this.errors.push({ field, message: `${field} must be a string` })
		}
		return this
	}

	minLength(value: any, length: number, field: string): this {
		if (typeof value === 'string' && value.length < length) {
			this.errors.push({
				field,
				message: `${field} must be at least ${length} characters`
			})
		}
		return this
	}

	getResult(): ValidationResult {
		return {
			isValid: this.errors.length === 0,
			errors: this.errors
		}
	}
}

export function validate(callback: (v: Validator) => void): ValidationResult {
	const validator = new Validator()
	callback(validator)
	return validator.getResult()
}

export function validateAIParseRequest(data: any): ValidationResult {
	return validate(v => {
		v.required(data.text, 'text')
			.string(data.text, 'text')
			.minLength(data.text, 10, 'text')
	})
}

export * from './pod'
export * from './auth'
export * from './league'
export * from './player'
