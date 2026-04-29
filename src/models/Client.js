import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'El nombre del cliente es obligatorio'],
      trim: true,
    },
    cif: {
      type: String,
      required: [true, 'El CIF/NIF del cliente es obligatorio'],
      trim: true,
      uppercase: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      street: { type: String, trim: true },
      number: { type: String, trim: true },
      postal: { type: String, trim: true },
      city: { type: String, trim: true },
      province: { type: String, trim: true },
    },
    deleted: {
      type: Boolean,
      default: false, // Para el borrado lógico (soft delete)
    },
  },
  {
    timestamps: true, // Crea automáticamente createdAt y updatedAt
  }
);

export const Client = mongoose.model('Client', clientSchema);
