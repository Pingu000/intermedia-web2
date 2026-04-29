import { z } from 'zod';

export const createClientSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'El nombre es obligatorio' }).min(2, 'El nombre debe tener al menos 2 caracteres'),
    cif: z.string({ required_error: 'El CIF/NIF es obligatorio' }).min(5, 'El CIF/NIF no es válido'),
    email: z.string().email('Email no válido').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z
      .object({
        street: z.string().optional(),
        number: z.string().optional(),
        postal: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional(),
      })
      .optional(),
  }),
});

export const updateClientSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
    cif: z.string().min(5, 'El CIF/NIF no es válido').optional(),
    email: z.string().email('Email no válido').optional().or(z.literal('')),
    phone: z.string().optional(),
    address: z
      .object({
        street: z.string().optional(),
        number: z.string().optional(),
        postal: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional(),
      })
      .optional(),
  }),
});
