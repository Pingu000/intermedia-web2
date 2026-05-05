import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateSchema } from '../middleware/validate.js';
import { createClientSchema, updateClientSchema } from '../validators/client.validator.js';
import {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  restoreClient
} from '../controllers/client.controller.js';

const router = Router();

// Todas las rutas de clientes requieren estar autenticado
router.use(requireAuth);

/**
 * @openapi
 * /api/client:
 *   post:
 *     tags:
 *       - Clients
 *     summary: Crear un nuevo cliente
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - cif
 *             properties:
 *               name:
 *                 type: string
 *               cif:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *     responses:
 *       201:
 *         description: Cliente creado exitosamente.
 *       400:
 *         description: Error de validación.
 *       401:
 *         description: No autorizado.
 */
router.post('/', validateSchema(createClientSchema), createClient);

/**
 * @openapi
 * /api/client:
 *   get:
 *     tags:
 *       - Clients
 *     summary: Listar todos los clientes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de clientes de la empresa.
 *       401:
 *         description: No autorizado.
 */
router.get('/', getClients);
router.get('/:id', getClientById);
router.put('/:id', validateSchema(updateClientSchema), updateClient);
router.delete('/:id', deleteClient); // /api/client/:id?hard=true (para borrado físico)
router.patch('/:id/restore', restoreClient);

export default router;
