import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
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
      index: true
    },
    status: {
      type: String,
      enum: ['pending', 'verified'],
      default: 'pending',
      index: true
    },
    verificationCode: String,
    verificationAttempts: {
      type: Number,
      default: 3
    },
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      index: true
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
    refreshTokens: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

userSchema.virtual('fullName').get(function () {
  return `${this.name} ${this.lastName}`;
});

export const User = mongoose.model('User', userSchema);
