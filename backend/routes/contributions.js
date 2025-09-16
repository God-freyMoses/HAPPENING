const express = require('express');
const Contribution = require('../models/Contribution');
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

// Create payment intent
router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, eventId, contributorName } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // amount in cents
      currency: 'usd',
      metadata: { eventId, contributorName }
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get contributions for an event
router.get('/', auth, async (req, res) => {
  try {
    const contributions = await Contribution.find({ eventId: req.query.eventId });
    res.json(contributions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create contribution (after payment)
router.post('/', async (req, res) => {
  try {
    const contribution = new Contribution(req.body);
    await contribution.save();

    // Update event funding progress
    const event = await Event.findById(req.body.eventId);
    if (event) {
      const totalContributions = await Contribution.find({ eventId: req.body.eventId, status: 'completed' });
      const totalAmount = totalContributions.reduce((sum, c) => sum + c.amount, 0) + req.body.amount;
      event.fundingProgress = Math.min((totalAmount / event.budgetGoal) * 100, 100);
      await event.save();
    }

    res.status(201).json(contribution);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update contribution
router.put('/:id', auth, async (req, res) => {
  try {
    const contribution = await Contribution.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!contribution) return res.status(404).json({ error: 'Contribution not found' });
    res.json(contribution);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete contribution
router.delete('/:id', auth, async (req, res) => {
  try {
    const contribution = await Contribution.findByIdAndDelete(req.params.id);
    if (!contribution) return res.status(404).json({ error: 'Contribution not found' });
    res.json({ message: 'Contribution deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;