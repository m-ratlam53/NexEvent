import { AppError } from '../utils/AppError.js';

export function notFoundHandler(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let { statusCode, message, isOperational } = err;

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join('; ');
    isOperational = true;
  } else if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    statusCode = 409;
    message = `This ${field} is already in use`;
    isOperational = true;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid identifier';
    isOperational = true;
  }

  if (!isOperational) {
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
