const mongoose = require('mongoose');

const guestSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  rsvpStatus: { type: String, enum: ['yes', 'maybe', 'no', 'pending'], default: 'pending' },
  invitedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Guest', guestSchema);