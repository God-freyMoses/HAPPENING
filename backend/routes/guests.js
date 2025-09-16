const express = require('express');
const Guest = require('../models/Guest');
const Event = require('../models/Event');
const auth = require('../middleware/auth');
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const router = express.Router();

// Get guests for an event
router.get('/', auth, async (req, res) => {
  try {
    const guests = await Guest.find({ eventId: req.query.eventId });
    const event = await Event.findById(req.query.eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const guestsWithLinks = guests.map(guest => {
      const rsvpUrl = `${baseUrl}/rsvp/${event._id}?phone=${guest.phone}`;
      const contributeUrl = `${baseUrl}/contribute/${event._id}?phone=${guest.phone}`;

      const message = encodeURIComponent(
        `Hi ${guest.name}! 🎉\n\n` +
        `You're invited to ${event.title}!\n` +
        `📅 Date: ${new Date(event.date).toLocaleDateString()}\n` +
        `📍 Location: ${event.location}\n\n` +
        `RSVP here: ${rsvpUrl}\n` +
        `Make a contribution: ${contributeUrl}\n\n` +
        `We hope to see you there! 🎊`
      );

      return {
        ...guest.toObject(),
        whatsappLink: `https://wa.me/${guest.phone.replace(/\D/g, '')}?text=${message}`,
        rsvpUrl: rsvpUrl
      };
    });

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

    // Send invitation email if email provided
    if (guest.email) {
      console.log('Attempting to send email to:', guest.email);
      const event = await Event.findById(guest.eventId);
      if (event) {
        console.log('Event found:', event.title);
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const rsvpUrl = `${baseUrl}/rsvp/${event._id}?phone=${guest.phone}`;
        const contributeUrl = `${baseUrl}/contribute/${event._id}?phone=${guest.phone}`;

        const message = `Hi ${guest.name}! 🎉\n\n` +
          `You're invited to ${event.title}!\n` +
          `📅 Date: ${new Date(event.date).toLocaleDateString()}\n` +
          `📍 Location: ${event.location}\n\n` +
          `RSVP here: ${rsvpUrl}\n` +
          `Make a contribution: ${contributeUrl}\n\n` +
          `We hope to see you there! 🎊`;

        const whatsappUrl = `https://wa.me/${guest.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;

        const emailMessage = {
          to: guest.email,
          from: 'noreply@happening.co.za', // Replace with your verified sender
          subject: `You're Invited to ${event.title}!`,
          text: message + `\n\nOr click this WhatsApp link: ${whatsappUrl}`,
          html: `<p>Hi ${guest.name}! 🎉</p>
                 <p>You're invited to <strong>${event.title}</strong>!</p>
                 <p>📅 Date: ${new Date(event.date).toLocaleDateString()}</p>
                 <p>📍 Location: ${event.location}</p>
                 <p><a href="${rsvpUrl}">RSVP here</a></p>
                 <p><a href="${contributeUrl}">Make a contribution</a></p>
                 <p>Or <a href="${whatsappUrl}">send via WhatsApp</a></p>
                 <p>We hope to see you there! 🎊</p>`
        };

        console.log('Email message prepared:', emailMessage);
        try {
          await sgMail.send(emailMessage);
          console.log('Invitation email sent successfully to:', guest.email);
        } catch (emailError) {
          console.error('Failed to send invitation email to', guest.email, ':', emailError.message, emailError.response?.body);
        }
      } else {
        console.log('Event not found for guest');
      }
    } else {
      console.log('No email provided for guest');
    }

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

// Send WhatsApp invites to all guests
router.post('/send-invites/:eventId', auth, async (req, res) => {
  try {
    const guests = await Guest.find({ eventId: req.params.eventId });
    const event = await Event.findById(req.params.eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const inviteResults = [];

    for (const guest of guests) {
      if (guest.phone) {
        const rsvpUrl = `${baseUrl}/rsvp/${event._id}?phone=${guest.phone}`;
        const contributeUrl = `${baseUrl}/contribute/${event._id}?phone=${guest.phone}`;

        const plainMessage = `Hi ${guest.name}! 🎉\n\n` +
          `You're invited to ${event.title}!\n` +
          `📅 Date: ${new Date(event.date).toLocaleDateString()}\n` +
          `📍 Location: ${event.location}\n\n` +
          `RSVP here: ${rsvpUrl}\n` +
          `Make a contribution: ${contributeUrl}\n\n` +
          `We hope to see you there! 🎊`;

        const encodedMessage = encodeURIComponent(plainMessage);

        const whatsappUrl = `https://wa.me/${guest.phone.replace(/\D/g, '')}?text=${encodedMessage}`;

        inviteResults.push({
          guest: guest.name,
          phone: guest.phone,
          whatsappUrl: whatsappUrl,
          status: 'ready'
        });
      }
    }

    res.json({
      message: `Generated ${inviteResults.length} WhatsApp invite links`,
      invites: inviteResults,
      event: {
        title: event.title,
        date: event.date,
        location: event.location
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public route to find guest by phone for RSVP
router.get('/public/:eventId', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number required' });
    }

    const guest = await Guest.findOne({
      eventId: req.params.eventId,
      phone: phone.replace(/\D/g, '') // Remove non-digits
    });

    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    res.json({
      _id: guest._id,
      name: guest.name,
      phone: guest.phone,
      email: guest.email,
      rsvpStatus: guest.rsvpStatus
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public route to update guest RSVP
router.put('/public/:id', async (req, res) => {
  try {
    const { rsvpStatus } = req.body;

    if (!['yes', 'maybe', 'no', 'pending'].includes(rsvpStatus)) {
      return res.status(400).json({ error: 'Invalid RSVP status' });
    }

    const guest = await Guest.findByIdAndUpdate(
      req.params.id,
      { rsvpStatus },
      { new: true }
    );

    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    res.json({
      _id: guest._id,
      name: guest.name,
      rsvpStatus: guest.rsvpStatus,
      message: 'RSVP updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;