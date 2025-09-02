const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['todo', 'done'], default: 'todo' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Task', taskSchema);