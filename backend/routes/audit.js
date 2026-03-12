const express = require('express');
const router = express.Router();
const SystemService = require('../services/SystemService');

// GET /api/audit — Full system security audit
router.get('/', async (req, res, next) => {
  try {
    const audit = await SystemService.getFullAudit();
    res.json(audit);
  } catch (err) {
    next(err);
  }
});

// POST /api/audit/assist — AI explanation & remediation for a risk flag
router.post('/assist', async (req, res, next) => {
  try {
    const { level, message } = req.body || {};
    if (!level || !message) {
      return res.status(400).json({ error: true, message: 'level and message are required' });
    }

    const apiKey = process.env.AI_ASSIST_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(501).json({
        error: true,
        message: 'AI assistance is not configured. Set AI_ASSIST_API_KEY in .env to enable this feature.',
      });
    }

    const prompt = `
You are a cybersecurity assistant. A system audit reported the following issue:

Severity: ${level}
Finding: ${message}

1) Briefly explain why this is a risk in clear, non-technical language.
2) Explain the technical risk for an advanced user.
3) List concrete step-by-step actions the user can take on Windows to reduce or eliminate the risk.
Use short bullet points for the remediation steps.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful cybersecurity assistant.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(500).json({ error: true, message: `AI provider error: ${errorText}` });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    res.json({
      level,
      message,
      aiExplanation: content,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
