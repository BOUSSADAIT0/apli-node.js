import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    default: null,
  },
  password: {
    type: String,
    required: true,
  },
  avatarUrl: {
    type: String,
    default: null,
  },
}, {
  timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  collection: 'users',
});

// Index pour recherche rapide par email
userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);

export default User;

