import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateSchema } from '../middleware/validate.js';
import { uploadImageMemory } from '../middleware/upload.js';
import { createDeliveryNoteSchema } from '../validators/deliverynote.validator.js';
import {
  createDeliveryNote,
  getDeliveryNotes,
  getDeliveryNoteById,
  signDeliveryNote,
  downloadPdf,
  deleteDeliveryNote
} from '../controllers/deliverynote.controller.js';

const router = Router();

// Todas las rutas de albaranes requieren estar autenticado
router.use(requireAuth);

/**
 * @openapi
 * /api/deliverynote:
 *   post:
 *     tags:
 *       - Delivery Notes
 *     summary: Crear un nuevo albarán
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - client
 *               - project
 *               - format
 *               - description
 *               - workdate
 *             properties:
 *               client:
 *                 type: string
 *               project:
 *                 type: string
 *               format:
 *                 type: string
 *                 enum: [hours, material]
 *               hours:
 *                 type: number
 *               material:
 *                 type: string
 *               description:
 *                 type: string
 *               workdate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Albarán creado.
 *       400:
 *         description: Error de validación.
 */
router.post('/', validateSchema(createDeliveryNoteSchema), createDeliveryNote);

/**
 * @openapi
 * /api/deliverynote:
 *   get:
 *     tags:
 *       - Delivery Notes
 *     summary: Listar albaranes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de albaranes.
 *       401:
 *         description: No autorizado.
 */
router.get('/', getDeliveryNotes);
router.get('/:id', getDeliveryNoteById);
router.patch('/:id/sign', uploadImageMemory.single('signature'), signDeliveryNote);
/**
 * @openapi
 * /api/deliverynote/{id}/pdf:
 *   get:
 *     tags:
 *       - Delivery Notes
 *     summary: Descargar albarán en PDF
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
 *         description: Archivo PDF generado.
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Albarán no encontrado.
 */
router.get('/:id/pdf', downloadPdf);
router.delete('/:id', deleteDeliveryNote);

export default router;
