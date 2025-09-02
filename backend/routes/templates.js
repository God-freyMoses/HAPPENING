const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const auth = require('../middleware/auth');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const router = express.Router();

// Generate custom checklist
router.post('/generate', auth, async (req, res) => {
  try {
    const { description } = req.body;
    const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });
    const prompt = `Generate a checklist of tasks for an event described as: ${description}. Return as JSON array of strings, each being a task description.`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    // Assume text is JSON
    const tasks = JSON.parse(text);
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;