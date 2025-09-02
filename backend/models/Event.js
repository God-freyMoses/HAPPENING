const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  date: { type: Date, required: true },
  budgetGoal: { type: Number, required: true },
  location: { type: String, required: true },
  category: { type: String, enum: ['Birthday', 'Funeral', 'Custom'], required: true },
  status: { type: String, enum: ['active', 'completed', 'cancelled'], default: 'active' },
  fundingProgress: { type: Number, default: 0, min: 0, max: 100 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);