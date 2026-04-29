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

router.post('/', validateSchema(createClientSchema), createClient);
router.get('/', getClients);
router.get('/:id', getClientById);
router.put('/:id', validateSchema(updateClientSchema), updateClient);
router.delete('/:id', deleteClient); // /api/client/:id?hard=true (para borrado físico)
router.patch('/:id/restore', restoreClient);

export default router;
