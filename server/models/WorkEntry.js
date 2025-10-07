import mongoose from 'mongoose';

const workEntrySchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true,
  },
  userId: {
    type: String,
    ref: 'User',
    required: true,
  },
  startDate: {
    type: String, // Format: YYYY-MM-DD
    required: true,
  },
  startTime: {
    type: String, // Format: HH:mm
    required: true,
  },
  endDate: {
    type: String, // Format: YYYY-MM-DD
    required: true,
  },
  endTime: {
    type: String, // Format: HH:mm
    required: true,
  },
  hasBreak: {
    type: Boolean,
    default: false,
  },
  breakStartHour: {
    type: String,
    default: null,
  },
  breakStartMin: {
    type: String,
    default: null,
  },
  breakEndHour: {
    type: String,
    default: null,
  },
  breakEndMin: {
    type: String,
    default: null,
  },
  category: {
    type: String,
    default: null,
  },
  hourlyRate: {
    type: Number,
    default: null,
  },
  location: {
    city: {
      type: String,
      default: null,
    },
    address: {
      type: String,
      default: null,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
  },
  employerId: {
    type: String,
    default: null,
  },
  projectName: {
    type: String,
    default: null,
  },
  clientId: {
    type: String,
    default: null,
  },
  clientName: {
    type: String,
    default: null,
  },
  comment: {
    type: String,
    default: null,
  },
}, {
  timestamps: true, // Ajoute automatiquement createdAt et updatedAt
  collection: 'work_entries',
});

// Index pour recherche rapide par userId et date
workEntrySchema.index({ userId: 1, startDate: -1 });
workEntrySchema.index({ startDate: 1 });

const WorkEntry = mongoose.model('WorkEntry', workEntrySchema);

export default WorkEntry;

