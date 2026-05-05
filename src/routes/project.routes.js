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

/**
 * @openapi
 * /api/project:
 *   post:
 *     tags:
 *       - Projects
 *     summary: Crear un nuevo proyecto
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
 *               - projectCode
 *               - client
 *             properties:
 *               name:
 *                 type: string
 *               projectCode:
 *                 type: string
 *               client:
 *                 type: string
 *                 description: ID del cliente (MongoDB ObjectId)
 *     responses:
 *       201:
 *         description: Proyecto creado.
 *       400:
 *         description: Error de validación.
 */
router.post('/', validateSchema(createProjectSchema), createProject);

/**
 * @openapi
 * /api/project:
 *   get:
 *     tags:
 *       - Projects
 *     summary: Listar proyectos
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de proyectos de la empresa.
 *       401:
 *         description: No autorizado.
 */
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.put('/:id', validateSchema(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);
router.patch('/:id/archive', archiveProject);

export default router;
