const express = require('express');
const Event = require('../models/Event');
const Guest = require('../models/Guest');
const auth = require('../middleware/auth');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const router = express.Router();

// Get all events for user
router.get('/', auth, async (req, res) => {
  try {
    const events = await Event.find({ userId: req.user.id });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create event
router.post('/', auth, async (req, res) => {
  try {
    const event = new Event({ ...req.body, userId: req.user.id });
    await event.save();
    res.status(201).json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get single event
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, userId: req.user.id });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update event
router.put('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete event
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send email reminders
router.post('/:id/send-reminders', auth, async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, userId: req.user.id });
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const guests = await Guest.find({ eventId: req.params.id, email: { $ne: null } });

    const messages = guests.map(guest => ({
      to: guest.email,
      from: 'noreply@happening.com', // Replace with your verified sender
      subject: `Reminder: ${event.title}`,
      text: `Don't forget about the ${event.category} event on ${new Date(event.date).toLocaleDateString()}. Please RSVP!`,
      html: `<p>Don't forget about the ${event.category} event on ${new Date(event.date).toLocaleDateString()}. Please RSVP!</p>`
    }));

    await sgMail.send(messages);
    res.json({ message: 'Reminders sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;