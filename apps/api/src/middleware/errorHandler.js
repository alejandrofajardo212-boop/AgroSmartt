export function errorHandler(error, _req, res, _next) {
  const validationError = error.name === 'ZodError';
  const status = validationError ? 400 : Number.isInteger(error.status) ? error.status : 500;

  if (status >= 500) {
    console.error(error);
  }

  res.status(status).json({
    error: validationError
      ? 'Los datos enviados no son válidos.'
      : status >= 500
        ? 'Ocurrió un error interno. Intenta nuevamente.'
        : error.message
  });
}
