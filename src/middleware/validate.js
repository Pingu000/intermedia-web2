import { AppError } from '../utils/AppError.js';

export const validateSchema = (schema) => (req, res, next) => {
  try {
    if (schema.shape && (schema.shape.body || schema.shape.query || schema.shape.params)) {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      if (parsed.params) req.params = parsed.params;
    } else {
      const cleanBody = schema.parse(req.body);
      req.body = cleanBody;
    }

    next();
  } catch (error) {
    const issues = error.issues || error.errors || [];
    const validationErrors = issues.map(err => ({
      campo: err.path.join('.'),
      mensaje: err.message
    }));

    next(AppError.validation('Errores de validación en el cuerpo de la petición', validationErrors));
  }
};
