import { Router } from 'express';
import { register, validateEmail, login, refresh, logout } from '../controllers/auth.controller.js';
import { validateSchema } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { registerSchema, validationCodeSchema, loginSchema } from '../validators/user.validator.js';

const router = Router();

// ============================================
// Rutas Públicas
// ============================================

router.post('/register', validateSchema(registerSchema), register);
router.post('/login', validateSchema(loginSchema), login);
router.post('/refresh', refresh); // No lleva validateSchema complex porque solo espera "refreshToken"

// ============================================
// Rutas Privadas (Requieren Token JWT)
// ============================================

router.put('/validation', requireAuth, validateSchema(validationCodeSchema), validateEmail);
router.post('/logout', requireAuth, logout);

export default router;
