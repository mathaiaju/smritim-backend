const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const OpenAI = require("openai");

require("dotenv").config();


const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/* =====================================================
   POST /api/patient/chatbot/llm
   GUARDED EDUCATIONAL ASSISTANT
===================================================== */
router.post(
  "/llm",
  auth(["patient"]),
  async (req, res) => {
    try {
      const { message, context } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message required" });
      }

      /* ---------- HARD SAFETY PROMPT ---------- */
      const systemPrompt = `
You are a patient education assistant.
STRICT RULES:
- Do NOT give medical advice.
- Do NOT prescribe or change medication.
- Do NOT say stop or start drugs.
- If symptoms seem severe or critical, advise contacting doctor immediately.
- Use only the provided context.
- Be calm, reassuring, factual.
- Use simple language.
`;

      const userPrompt = `
Patient context:
${JSON.stringify(context, null, 2)}

Patient question:
"${message}"
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      });

      res.json({
        reply: response.choices[0].message.content
      });

    } catch (err) {
      console.error("LLM error:", err);
      res.status(500).json({ error: "LLM unavailable" });
    }
  }
);

module.exports = router;
