import { z } from 'zod';

// Zod es brutal porque a parte de checkear el tipo te deja usar "transform" como requería el enunciado
export const registerSchema = z.object({
  email: z.string().email("El formato de email no es válido.")
    .transform(e => e.toLowerCase().trim()),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  name: z.string().min(1, "El nombre es un campo obligatorio").trim(),
  lastName: z.string().min(1, "Los apellidos son obligatorios").trim()
});

export const loginSchema = z.object({
  email: z.string().email("El formato de email no es válido.")
    .transform(e => e.toLowerCase().trim()),
  password: z.string().min(1, "La contraseña es obligatoria")
});

export const validationCodeSchema = z.object({
  // El enunciado pedía que el código fuese de 6 dígitos.
  code: z.string().length(6, "El código de validación debe tener exactamente 6 caracteres numéricos")
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es obligatoria").trim(),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres").trim()
});

export const updatePersonalDataSchema = z.object({
  name: z.string().min(1, "El nombre es un campo obligatorio").trim(),
  lastName: z.string().min(1, "Los apellidos son obligatorios").trim()
});

export const companyOnboardingSchema = z.object({
  name: z.string().trim().optional(), // Puede ser opcional si es freelance o si se va a unir a una existente
  cif: z.string().trim().optional(),
  isFreelance: z.boolean({ required_error: "Debe indicar si es freelance o no" }),
  address: z.object({
    street: z.string().optional(),
    number: z.string().optional(),
    postal: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional()
  }).optional()
});
