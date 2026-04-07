import { AppError } from '../utils/AppError.js';

// Middleware que recibe un esquema Zod. Con esto evitamos meter validaciones farragosas en los controllers (T6)
export const validateSchema = (schema) => (req, res, next) => {
  try {
    // La funcion parse de Zod limpiará y validará nuestro body. Lanza error si algo no cuadra.
    const cleanBody = schema.parse(req.body);
    
    
    req.body = cleanBody;
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
