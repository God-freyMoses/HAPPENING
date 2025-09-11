const express = require('express');
const Event = require('../models/Event');
const Guest = require('../models/Guest');
const Task = require('../models/Task');
const Template = require('../models/Template');
const auth = require('../middleware/auth');
const sgMail = require('@sendgrid/mail');
const { GoogleGenerativeAI } = require('@google/generative-ai');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const router = express.Router();

// Function to generate tasks using Gemini AI
async function generateEventTasks(eventData) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Generate a comprehensive list of tasks for planning a ${eventData.category} event called "${eventData.title}".

Event Details:
- Date: ${new Date(eventData.date).toLocaleDateString()}
- Budget Goal: R${eventData.budgetGoal}
- Location: ${eventData.location}
- Expected guests: 20-50 people

Please provide a JSON array of tasks with the following structure:
[
  {
    "description": "Detailed task description",
    "status": "todo"
  }
]

Focus on practical, actionable tasks that cover:
- Venue and logistics
- Guest management
- Catering and supplies
- Decorations and setup
- Timeline and coordination
- Budget tracking
- Safety and contingencies

Generate 15-25 specific, actionable tasks. Make them detailed enough to be immediately actionable.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response as JSON');
    }

    const tasks = JSON.parse(jsonMatch[0]);
    return tasks;
  } catch (error) {
    console.error('Error generating tasks with AI:', error);
    // Return default tasks if AI fails
    return [
      { description: 'Book venue and confirm availability', status: 'todo' },
      { description: 'Create guest list and send invitations', status: 'todo' },
      { description: 'Plan menu and arrange catering', status: 'todo' },
      { description: 'Purchase decorations and party supplies', status: 'todo' },
      { description: 'Arrange entertainment and activities', status: 'todo' },
      { description: 'Set up payment collection for contributions', status: 'todo' }
    ];
  }
}

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
    const { templateId, ...eventData } = req.body;
    // Convert budgetGoal to number
    const processedEventData = {
      ...eventData,
      budgetGoal: parseFloat(eventData.budgetGoal)
    };
    const event = new Event({ ...processedEventData, userId: req.user.id });
    await event.save();

    let tasksToSave = [];

    if (templateId && templateId !== 'undefined') {
      // Use template tasks
      const template = await Template.findById(templateId);
      if (template) {
        tasksToSave = template.tasks.map(task => ({
          ...task,
          eventId: event._id,
          userId: req.user.id
        }));
      } else {
        // If template not found in database, it might be a default template
        // Use hardcoded default templates
        const defaultTemplates = [
          {
            name: 'Birthday Party Template',
            type: 'birthday',
            tasks: [
              { description: 'Book venue and confirm availability', status: 'todo' },
              { description: 'Create guest list and send invitations', status: 'todo' },
              { description: 'Order birthday cake and desserts', status: 'todo' },
              { description: 'Purchase decorations and party supplies', status: 'todo' },
              { description: 'Arrange entertainment and games', status: 'todo' },
              { description: 'Plan menu and arrange catering', status: 'todo' },
              { description: 'Set up music and sound system', status: 'todo' },
              { description: 'Arrange transportation for guests if needed', status: 'todo' },
              { description: 'Purchase birthday gifts and party favors', status: 'todo' },
              { description: 'Plan cleanup and post-party activities', status: 'todo' }
            ]
          },
          {
            name: 'Funeral Service Template',
            type: 'funeral',
            tasks: [
              { description: 'Contact funeral home and make arrangements', status: 'todo' },
              { description: 'Notify family members and close relatives', status: 'todo' },
              { description: 'Arrange transportation for the deceased', status: 'todo' },
              { description: 'Plan memorial service details', status: 'todo' },
              { description: 'Arrange catering for after-service gathering', status: 'todo' },
              { description: 'Prepare obituary and death notices', status: 'todo' },
              { description: 'Coordinate with religious leader if applicable', status: 'todo' },
              { description: 'Arrange flowers and decorations', status: 'todo' },
              { description: 'Plan burial or cremation arrangements', status: 'todo' },
              { description: 'Handle legal paperwork and certificates', status: 'todo' }
            ]
          }
        ];

        const defaultTemplate = defaultTemplates.find(t => t.name.toLowerCase().includes(eventData.category.toLowerCase()));

        if (defaultTemplate) {
          tasksToSave = defaultTemplate.tasks.map(task => ({
            ...task,
            eventId: event._id,
            userId: req.user.id
          }));
        }
      }
    }

    if (tasksToSave.length === 0) {
      // Generate tasks using AI if no template tasks found
      const generatedTasks = await generateEventTasks(eventData);
      tasksToSave = generatedTasks.map(task => ({
        ...task,
        eventId: event._id,
        userId: req.user.id
      }));
    }

    if (tasksToSave.length > 0) {
      await Task.insertMany(tasksToSave);
    }

    // Return event with tasks
    const eventWithTasks = await Event.findById(event._id);
    const tasks = await Task.find({ eventId: event._id });

    const message = templateId ?
      'Event created successfully with template tasks' :
      'Event created successfully with auto-generated tasks';

    res.status(201).json({
      event: eventWithTasks,
      tasks: tasks,
      message: message
    });
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

// Public route to get event details for RSVP
router.get('/public/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id).select(
      'title date location category budgetGoal fundingProgress'
    );

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;