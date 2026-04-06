import { Router } from 'express';
import { register, validateEmail, login, refresh, logout } from '../controllers/auth.controller.js';
import { getUser } from '../controllers/user.controller.js';
import { validateSchema } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { registerSchema, validationCodeSchema, loginSchema } from '../validators/user.validator.js';

const router = Router();

// RUTAS PÚBLICAS

router.post('/register', validateSchema(registerSchema), register);
router.post('/login', validateSchema(loginSchema), login);
router.post('/refresh', refresh); // No lleva validateSchema complex porque solo espera "refreshToken"

// RUTAS PRIVADAS (REQUIEREN TOKEN JWT)

import { changePassword, deleteUser, updatePersonalData, inviteUsers } from '../controllers/user.controller.js';
import { changePasswordSchema, updatePersonalDataSchema } from '../validators/user.validator.js';
import { restrictTo } from '../middleware/role.middleware.js';

router.get('/', requireAuth, getUser);
router.delete('/', requireAuth, deleteUser); // El propio frontend es quien pasa el ?soft=true
router.put('/register', requireAuth, validateSchema(updatePersonalDataSchema), updatePersonalData);
router.post('/invite', requireAuth, restrictTo('admin'), inviteUsers);
router.put('/password', requireAuth, validateSchema(changePasswordSchema), changePassword);
router.put('/validation', requireAuth, validateSchema(validationCodeSchema), validateEmail);
router.post('/logout', requireAuth, logout);

export default router;
