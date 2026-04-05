import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true, // index por defecto
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    nif: {
      type: String,
      trim: true
    },
    role: {
      type: String,
      enum: ['admin', 'guest'],
      default: 'admin',
      index: true // Index recomendado por el enunciado
    },
    status: {
      type: String,
      enum: ['pending', 'verified'],
      default: 'pending',
      index: true // Index recomendado para consultas frecuentes
    },
    verificationCode: String,
    verificationAttempts: {
      type: Number,
      default: 3
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      index: true // Index recomendado
    },
    address: {
      street: String,
      number: String,
      postal: String,
      city: String,
      province: String
    },
    deleted: {
      type: Boolean,
      default: false
    },
    // Array para almacenar y gestionar los refresh tokens activos y permitir invalidarlos al hacer logout
    refreshTokens: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true }, // Permite que los virtuals aparezcan en la respuesta JSON
    toObject: { virtuals: true }
  }
);

// Virtual fullName (no se guarda en DB, se calcula al vuelo como vimos en T5)
userSchema.virtual('fullName').get(function () {
  return `${this.name} ${this.lastName}`;
});

export const User = mongoose.model('User', userSchema);
