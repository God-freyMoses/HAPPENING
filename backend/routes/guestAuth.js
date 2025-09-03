const express = require('express');
const GuestUser = require('../models/GuestUser');
const Guest = require('../models/Guest');
const Event = require('../models/Event');
const sgMail = require('@sendgrid/mail');
const jwt = require('jsonwebtoken');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const router = express.Router();

// Guest registration
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, eventId } = req.body;

    // Check if event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if guest exists for this event
    const existingGuest = await Guest.findOne({
      eventId,
      $or: [{ email }, { phone: phone.replace(/\D/g, '') }]
    });

    if (!existingGuest) {
      return res.status(400).json({
        error: 'You are not on the guest list for this event. Please contact the event organizer.'
      });
    }

    // Check if guest user already exists
    const existingGuestUser = await GuestUser.findOne({ email, eventId });
    if (existingGuestUser) {
      return res.status(400).json({ error: 'Account already exists for this event' });
    }

    // Create guest user
    const guestUser = new GuestUser({
      name,
      email,
      phone: phone.replace(/\D/g, ''),
      password,
      eventId,
      guestId: existingGuest._id
    });

    await guestUser.save();

    // Generate token
    const token = guestUser.generateAuthToken();

    res.status(201).json({
      token,
      user: {
        _id: guestUser._id,
        name: guestUser.name,
        email: guestUser.email,
        eventId: guestUser.eventId
      },
      message: 'Registration successful!'
    });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Email already registered for this event' });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// Guest login
router.post('/login', async (req, res) => {
  try {
    const { email, password, eventId } = req.body;

    // Find guest user
    const guestUser = await GuestUser.findOne({ email, eventId });
    if (!guestUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await guestUser.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = guestUser.generateAuthToken();

    res.json({
      token,
      user: {
        _id: guestUser._id,
        name: guestUser.name,
        email: guestUser.email,
        eventId: guestUser.eventId
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get guest profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const guestUser = await GuestUser.findById(decoded._id).populate('eventId');

    if (!guestUser) {
      return res.status(404).json({ error: 'Guest user not found' });
    }

    res.json({
      _id: guestUser._id,
      name: guestUser.name,
      email: guestUser.email,
      phone: guestUser.phone,
      event: guestUser.eventId,
      guestId: guestUser.guestId
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Send verification email
router.post('/send-verification', async (req, res) => {
  try {
    const { email, eventId } = req.body;

    const guestUser = await GuestUser.findOne({ email, eventId });
    if (!guestUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate verification token
    const verificationToken = jwt.sign(
      { _id: guestUser._id, type: 'verification' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    guestUser.verificationToken = verificationToken;
    await guestUser.save();

    // Send verification email
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/guest/verify/${verificationToken}`;

    const msg = {
      to: email,
      from: 'noreply@happening.com',
      subject: 'Verify your guest account',
      html: `
        <h2>Welcome to Happening!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Verify Email</a>
        <p>This link will expire in 24 hours.</p>
      `
    };

    await sgMail.send(msg);

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify email
router.post('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.type !== 'verification') {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const guestUser = await GuestUser.findById(decoded._id);
    if (!guestUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    guestUser.isVerified = true;
    guestUser.verificationToken = undefined;
    await guestUser.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;