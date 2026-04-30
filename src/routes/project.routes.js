import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateSchema } from '../middleware/validate.js';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator.js';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  archiveProject
} from '../controllers/project.controller.js';

const router = Router();

// Todas las rutas de proyectos requieren estar autenticado
router.use(requireAuth);

router.post('/', validateSchema(createProjectSchema), createProject);
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', validateSchema(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);
router.patch('/:id/archive', archiveProject);

export default router;
