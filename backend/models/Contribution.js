const mongoose = require('mongoose');

const contributionSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  contributorName: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentId: { type: String },
  status: { type: String, enum: ['pending', 'completed', 'refunded'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contribution', contributionSchema);