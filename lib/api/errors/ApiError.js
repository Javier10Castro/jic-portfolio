class ApiError extends Error {
  constructor(message, statusCode = 500, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    this.isApiError = true;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.name,
      message: this.message,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

module.exports = ApiError;
