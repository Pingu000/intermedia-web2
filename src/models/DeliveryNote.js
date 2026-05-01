import mongoose from 'mongoose';

const deliveryNoteSchema = new mongoose.Schema(
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
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    format: {
      type: String,
      enum: ['hours', 'material'],
      required: true, // Indica si el albarán es por horas de trabajo o por entrega de materiales
    },
    material: {
      type: String,
      trim: true,
    },
    hours: {
      type: Number,
      min: 0,
    },
    description: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      trim: true,
    },
    workdate: {
      type: Date,
      required: [true, 'La fecha de trabajo es obligatoria'],
    },
    status: {
      type: String,
      enum: ['pending', 'signed'],
      default: 'pending', // Cuando el cliente firma, pasará a 'signed'
    },
    signature: {
      type: String, // Aquí guardaremos la URL de la firma subida a Cloudinary
    },
    pdfUrl: {
      type: String, // Aquí guardaremos la URL del PDF final
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const DeliveryNote = mongoose.model('DeliveryNote', deliveryNoteSchema);
