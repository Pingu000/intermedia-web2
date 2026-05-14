import { z } from 'zod';

export const createDeliveryNoteSchema = z.object({
  body: z.object({
    client: z.string({ required_error: 'El ID del cliente es obligatorio' }),
    project: z.string({ required_error: 'El ID del proyecto es obligatorio' }),
    format: z.enum(['hours', 'material'], { required_error: 'El formato (hours o material) es obligatorio' }),
    material: z.string().optional(),
    hours: z.number().min(0, 'Las horas no pueden ser negativas').optional(),
    description: z.string({ required_error: 'La descripción es obligatoria' }).min(5, 'La descripción debe tener al menos 5 caracteres'),
    workdate: z.string({ required_error: 'La fecha de trabajo es obligatoria' }),
  }),
});

export const updateDeliveryNoteSchema = z.object({
  body: z.object({
    description: z.string().min(5, 'La descripción debe tener al menos 5 caracteres').optional(),
    hours: z.number().min(0, 'Las horas no pueden ser negativas').optional(),
    material: z.string().optional(),
    workdate: z.string().optional(),
  }),
});
