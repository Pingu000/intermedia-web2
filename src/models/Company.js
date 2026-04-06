import mongoose from 'mongoose';

// Esquema de la compañía, tal como lo define la especificación de la práctica
const companySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    cif: {
      type: String,
      // Solo exigimos CIF si se trata de una empresa real y no un autónomo
      required: function() { return !this.isFreelance; },
      unique: true, 
      sparse: true, // Permite tener múltiples valores nulos sin solapar el unique (Requisito isFreelance)
      trim: true
    },
    address: {
      street: String,
      number: String,
      postal: String,
      city: String,
      province: String
    },
    logo: {
      type: String, // Aquí guardaremos la URL de multer
      default: null
    },
    isFreelance: {
      type: Boolean,
      default: false
    },
    deleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true // Esto añade automáticamente createdAt y updatedAt (T5)
  }
);

export const Company = mongoose.model('Company', companySchema);
