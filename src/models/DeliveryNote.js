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
      required: true,
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
      default: 'pending',
    },
    signature: {
      type: String,
    },
    pdfUrl: {
      type: String,
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
