import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let { statusCode, message } = err;

  if (!err.isOperational) {
    // Unexpected error (DB/driver/programmer error) — never leak internals.
    // eslint-disable-next-line no-console
    console.error(err);
    statusCode = 500;
    message = 'Something went wrong';
  }

  statusCode = statusCode || 500;
  message = message || 'Something went wrong';

  res.status(statusCode).json({ error: message });
}
