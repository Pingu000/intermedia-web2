import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    client: z.string({ required_error: 'El ID del cliente es obligatorio' }).min(1, 'El ID del cliente es obligatorio'),
    name: z.string({ required_error: 'El nombre del proyecto es obligatorio' }).min(2, 'El nombre debe tener al menos 2 caracteres'),
    projectCode: z.string({ required_error: 'El código del proyecto es obligatorio' }).min(1, 'El código es obligatorio'),
    status: z.enum(['pending', 'active', 'completed']).optional(),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    client: z.string().optional(),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
    projectCode: z.string().optional(),
    status: z.enum(['pending', 'active', 'completed']).optional(),
  }),
});
