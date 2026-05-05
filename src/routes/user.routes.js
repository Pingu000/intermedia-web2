import { Router } from 'express';
import { register, validateEmail, login, refresh, logout } from '../controllers/auth.controller.js';
import { getUser } from '../controllers/user.controller.js';
import { validateSchema } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { registerSchema, validationCodeSchema, loginSchema } from '../validators/user.validator.js';

const router = Router();

// RUTAS PÚBLICAS

/**
 * @openapi
 * /api/user/register:
 *   post:
 *     tags:
 *       - Users
 *     summary: Registrar un nuevo usuario
 *     description: Crea una cuenta con name, lastName, email y password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente (esperando validación de email).
 *       400:
 *         description: Error de validación o email ya existe.
 */

router.post('/register', validateSchema(registerSchema), register);

/**
 * @openapi
 * /api/user/login:
 *   post:
 *     tags:
 *       - Users
 *     summary: Iniciar sesión
 *     description: Retorna un accessToken y un refreshToken si las credenciales son válidas.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login exitoso, devuelve tokens.
 *       401:
 *         description: Credenciales inválidas.
 */
router.post('/login', validateSchema(loginSchema), login);
router.post('/refresh', refresh); // No lleva validateSchema complex porque solo espera "refreshToken"

// RUTAS PRIVADAS (REQUIEREN TOKEN JWT)

import { changePassword, deleteUser, updatePersonalData, inviteUsers, setupCompany, updateCompanyLogo } from '../controllers/user.controller.js';
import { changePasswordSchema, updatePersonalDataSchema, companyOnboardingSchema } from '../validators/user.validator.js';
import { restrictTo } from '../middleware/role.middleware.js';
import { uploadLogo } from '../middleware/upload.js'; // Importamos el multer nativo

/**
 * @openapi
 * /api/user:
 *   get:
 *     tags:
 *       - Users
 *     summary: Obtener el perfil del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Devuelve los datos del usuario logueado.
 *       401:
 *         description: No autorizado (Token inválido o ausente).
 */
router.get('/', requireAuth, getUser);
router.delete('/', requireAuth, deleteUser); // El propio frontend es quien pasa el ?soft=true
router.put('/register', requireAuth, validateSchema(updatePersonalDataSchema), updatePersonalData);
router.patch('/company', requireAuth, validateSchema(companyOnboardingSchema), setupCompany);
router.patch('/logo', requireAuth, uploadLogo.single('logo'), updateCompanyLogo); // Procesado de multipart/form-data
router.post('/invite', requireAuth, restrictTo('admin'), inviteUsers);
router.put('/password', requireAuth, validateSchema(changePasswordSchema), changePassword);
router.put('/validation', requireAuth, validateSchema(validationCodeSchema), validateEmail);
router.post('/logout', requireAuth, logout);

export default router;
