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

/**
 * @openapi
 * /api/client/{id}:
 *   get:
 *     tags:
 *       - Clients
 *     summary: Obtener un cliente por ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Datos del cliente.
 *       404:
 *         description: Cliente no encontrado.
 */
router.get('/:id', getClientById);

/**
 * @openapi
 * /api/client/{id}:
 *   put:
 *     tags:
 *       - Clients
 *     summary: Actualizar un cliente existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               cif:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cliente actualizado correctamente.
 *       400:
 *         description: Error de validación.
 *       404:
 *         description: Cliente no encontrado.
 */
router.put('/:id', validateSchema(updateClientSchema), updateClient);

/**
 * @openapi
 * /api/client/{id}:
 *   delete:
 *     tags:
 *       - Clients
 *     summary: Borrar un cliente (o archivar con soft=true)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: soft
 *         in: query
 *         required: false
 *         schema:
 *           type: boolean
 *         description: Si es true, hace borrado lógico en lugar de físico.
 *     responses:
 *       200:
 *         description: Cliente borrado/archivado correctamente.
 *       404:
 *         description: Cliente no encontrado.
 */
router.delete('/:id', deleteClient); // /api/client/:id?hard=true (para borrado físico)
router.patch('/:id/restore', restoreClient);

export default router;
