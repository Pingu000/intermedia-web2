import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateSchema } from '../middleware/validate.js';
import { uploadImageMemory } from '../middleware/upload.js';
import { createDeliveryNoteSchema } from '../validators/deliverynote.validator.js';
import {
  createDeliveryNote,
  getDeliveryNotes,
  getDeliveryNoteById,
  signDeliveryNote
} from '../controllers/deliverynote.controller.js';

const router = Router();

// Todas las rutas de albaranes requieren estar autenticado
router.use(requireAuth);

router.post('/', validateSchema(createDeliveryNoteSchema), createDeliveryNote);
router.get('/', getDeliveryNotes);
router.get('/:id', getDeliveryNoteById);
router.patch('/:id/sign', uploadImageMemory.single('signature'), signDeliveryNote);

export default router;
