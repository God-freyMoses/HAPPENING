const express = require('express');
const Guest = require('../models/Guest');
const auth = require('../middleware/auth');

const router = express.Router();

// Get guests for an event
router.get('/', auth, async (req, res) => {
  try {
    const guests = await Guest.find({ eventId: req.query.eventId });
    const guestsWithLinks = guests.map(guest => ({
      ...guest.toObject(),
      whatsappLink: `https://wa.me/${guest.phone}?text=You're%20invited%20to%20my%20event!%20RSVP%20here:%20[link]`
    }));
    res.json(guestsWithLinks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create guest
router.post('/', auth, async (req, res) => {
  try {
    const guest = new Guest(req.body);
    await guest.save();
    res.status(201).json(guest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update guest
router.put('/:id', auth, async (req, res) => {
  try {
    const guest = await Guest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!guest) return res.status(404).json({ error: 'Guest not found' });
    res.json(guest);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete guest
router.delete('/:id', auth, async (req, res) => {
  try {
    const guest = await Guest.findByIdAndDelete(req.params.id);
    if (!guest) return res.status(404).json({ error: 'Guest not found' });
    res.json({ message: 'Guest deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;