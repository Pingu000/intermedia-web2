import { Router } from 'express';
import { register, validateEmail } from '../controllers/auth.controller.js';
import { validateSchema } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { registerSchema, validationCodeSchema } from '../validators/user.validator.js';

const router = Router();

// ============================================
// Rutas Públicas
// ============================================

router.post('/register', validateSchema(registerSchema), register);

// ============================================
// Rutas Privadas (Requieren Token JWT)
// ============================================

router.put('/validation', requireAuth, validateSchema(validationCodeSchema), validateEmail);

export default router;
