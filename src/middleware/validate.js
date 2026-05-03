import { AppError } from '../utils/AppError.js';

// Middleware que recibe un esquema Zod. Con esto evitamos meter validaciones farragosas en los controllers (T6)
export const validateSchema = (schema) => (req, res, next) => {
  try {
    // Verificamos si el esquema está estructurado con { body: z.object(...) }
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
      // Formato antiguo (el esquema ES directamente el body)
      const cleanBody = schema.parse(req.body);
      req.body = cleanBody;
    }
    
    next();
  } catch (error) {
    // En Zod v4 los errores de validación están en error.issues (antes era error.errors)
    const issues = error.issues || error.errors || [];
    const validationErrors = issues.map(err => ({
      campo: err.path.join('.'),
      mensaje: err.message
    }));
    
    next(AppError.validation('Errores de validación en el cuerpo de la petición', validationErrors));
  }
};
