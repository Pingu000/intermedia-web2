import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateSchema } from '../middleware/validate.js';
import { uploadImageMemory } from '../middleware/upload.js';
import { createDeliveryNoteSchema, updateDeliveryNoteSchema } from '../validators/deliverynote.validator.js';
import {
  createDeliveryNote,
  getDeliveryNotes,
  getDeliveryNoteById,
  signDeliveryNote,
  downloadPdf,
  deleteDeliveryNote,
  updateDeliveryNote
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

/**
 * @openapi
 * /api/deliverynote/{id}:
 *   get:
 *     tags:
 *       - Delivery Notes
 *     summary: Obtener un albarán por ID
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
 *         description: Datos del albarán completo.
 *       404:
 *         description: Albarán no encontrado.
 */
router.get('/:id', getDeliveryNoteById);

/**
 * @openapi
 * /api/deliverynote/{id}/sign:
 *   patch:
 *     tags:
 *       - Delivery Notes
 *     summary: Firmar un albarán
 *     description: Sube una imagen de firma y sella el albarán (multipart/form-data)
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Albarán firmado y guardado correctamente.
 *       400:
 *         description: Ya estaba firmado o falta la imagen.
 */
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

/**
 * @openapi
 * /api/deliverynote/{id}:
 *   delete:
 *     tags:
 *       - Delivery Notes
 *     summary: Borrar un albarán
 *     description: Solo se puede borrar si no está firmado
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
 *         description: Albarán borrado correctamente.
 *       400:
 *         description: No se puede borrar porque ya está firmado.
 *       404:
 *         description: Albarán no encontrado.
 */
router.delete('/:id', deleteDeliveryNote);

/**
 * @openapi
 * /api/deliverynote/{id}:
 *   patch:
 *     tags:
 *       - Delivery Notes
 *     summary: Actualizar un albarán (solo si no está firmado)
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
 *               description:
 *                 type: string
 *               hours:
 *                 type: number
 *               material:
 *                 type: string
 *               workdate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Albarán actualizado correctamente.
 *       409:
 *         description: No se puede editar un albarán ya firmado.
 *       404:
 *         description: Albarán no encontrado.
 */
router.patch('/:id', validateSchema(updateDeliveryNoteSchema), updateDeliveryNote);

export default router;
