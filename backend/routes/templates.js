const express = require('express');
const Template = require('../models/Template');
const auth = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const router = express.Router();

// Get all templates for user
router.get('/', auth, async (req, res) => {
  try {
    const templates = await Template.find({ userId: req.user.id });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get default templates
router.get('/defaults', async (req, res) => {
  try {
    const defaultTemplates = [
      {
        name: 'Birthday Party Template',
        type: 'birthday',
        description: 'Complete birthday party planning template',
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
        ],
        isDefault: true
      },
      {
        name: 'Funeral Service Template',
        type: 'funeral',
        description: 'Comprehensive funeral service planning template',
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
        ],
        isDefault: true
      }
    ];
    res.json(defaultTemplates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create custom template
router.post('/', auth, async (req, res) => {
  try {
    const template = new Template({
      ...req.body,
      userId: req.user.id,
      type: 'custom'
    });
    await template.save();
    res.status(201).json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generate custom template using AI
router.post('/generate', auth, async (req, res) => {
  try {
    const { name, description, eventType } = req.body;

    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Create a comprehensive event planning template for: ${name}

Description: ${description}
Event Type: ${eventType}

Generate a JSON object with the following structure:
{
  "name": "${name}",
  "type": "custom",
  "description": "${description}",
  "tasks": [
    {
      "description": "Detailed task description",
      "status": "todo"
    }
  ]
}

Create 15-25 specific, actionable tasks that cover all aspects of planning this event. Make tasks detailed and immediately actionable.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response as JSON');
    }

    const templateData = JSON.parse(jsonMatch[0]);

    // Save the template
    const template = new Template({
      ...templateData,
      userId: req.user.id
    });
    await template.save();

    res.status(201).json(template);
  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ error: 'Failed to generate template' });
  }
});

// Update template
router.put('/:id', auth, async (req, res) => {
  try {
    const template = await Template.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      req.body,
      { new: true }
    );
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json(template);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete template
router.delete('/:id', auth, async (req, res) => {
  try {
    const template = await Template.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id
    });
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json({ message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;