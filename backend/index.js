require("dotenv").config();
const express = require("express");
const cors = require("cors");
const pdfParse = require("pdf-parse");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const { createClient } = require("@supabase/supabase-js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");

const app = express();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.use(express.json());
app.use(express.static("public"));
app.use(cors({ origin: "http://localhost:5173", methods: ["GET", "POST"], credentials: true }));



async function callGroq(prompt, model, maxTokens = 600) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxTokens
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || `${model} failed`);
  return data.choices[0].message.content;
}

async function callGemini(prompt) {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

function extractJson(text) {
  let cleaned = text.replace(/```json|```/g, "").trim();

  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  let start = -1;
  if (firstBrace === -1) start = firstBracket;
  else if (firstBracket === -1) start = firstBrace;
  else start = Math.min(firstBrace, firstBracket);

  if (start > 0) cleaned = cleaned.slice(start);

  const lastBrace = cleaned.lastIndexOf("}");
  const lastBracket = cleaned.lastIndexOf("]");
  const end = Math.max(lastBrace, lastBracket);
  if (end !== -1 && end < cleaned.length - 1) cleaned = cleaned.slice(0, end + 1);

  cleaned = cleaned
    .replace(/,(\s*[}\]])/g, "$1")
    .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":');

  return cleaned.trim();
}

async function generateEval(prompt) {
  try { return await callGroq(prompt, "llama-3.3-70b-versatile", 350); }
  catch (err) { console.error("Eval primary failed:", err.message); }

  try { return await callGroq(prompt, "llama-3.1-8b-instant", 350); }
  catch (err) { console.error("Eval fallback 1 failed:", err.message); }

  try { return await callGemini(prompt); }
  catch (err) { console.error("Eval fallback 2 failed:", err.message); return null; }
}

async function generateWithFallback(prompt) {
  try { return await callGroq(prompt, "openai/gpt-oss-120b", 450); }
  catch (err) { console.error("Primary failed:", err.message); }

  try { return await callGemini(prompt); }
  catch (err) { console.error("Fallback 1 failed:", err.message); }

  try { return await callGroq(prompt, "llama-3.3-70b-versatile", 450); }
  catch (err) { console.error("Fallback 2 failed:", err.message); return null; }
}


function normaliseConfig(cfg) {
  const toArray = (v) => {
    if (!v) return [];
    if (Array.isArray(v)) return v;
    return v.split(',').map(s => s.trim()).filter(Boolean);
  };

  return {
    subject:            cfg.subject            || 'General',
    level:              cfg.level              || 'Intermediate',
    source:             cfg.source             || 'manual',
    topics:             toArray(cfg.topics),
    concepts:           toArray(cfg.concepts),
    detailed_breakdown: Array.isArray(cfg.detailed_breakdown) ? cfg.detailed_breakdown : toArray(cfg.concepts),
    includes_coding:    cfg.includes_coding    || false,
    notes:              cfg.notes              || '',
  };
}



app.post("/summarize", async (req, res) => {
  const { subject, topics, concepts, notes, level } = req.body;

  const prompt = `
You are an interview prep specialist. Analyze the user's study notes.

Return ONLY a JSON object with:
- subject: string
- topics: array of main topics
- concepts: array of specific concepts
- detailed_breakdown: array of strings (expand each topic into subtopics, algorithms, techniques)
- includes_coding: boolean (true only if DSA/coding/algorithms present)

User input:
Subject: ${subject}
Topics: ${topics}
Concepts: ${concepts}
Notes: ${notes}
Level: ${level}

Return ONLY valid JSON. No markdown, no explanation.
`;

  const text = await generateEval(prompt);
  if (!text) return res.status(503).json({ error: "Service is busy, please try again in a few minutes." });

  try {
    const cleaned = extractJson(text);
    const summary = JSON.parse(cleaned);
    console.log("📤 /summarize response:", summary);
    res.json(summary);
  } catch (err) {
    console.error("Parse error:", err.message, "Raw text:", text.slice(0, 300));
    res.status(500).json({ error: "Failed to parse AI response" });
  }
});

app.post("/summarize-resume", upload.single("resume"), async (req, res) => {
  const { level } = req.body;

  try {
    const result = await pdfParse(req.file.buffer);
    console.log("📄 PDF parsed, text length:", result.text?.length);  // ADD THIS
    const resumeText = result.text;

    const prompt = `
You are an interview prep specialist. Analyze the candidate's resume text below.

Return ONLY a JSON object with:
- subject: string (candidate's primary field/role, inferred from resume)
- topics: array of main topics (include named projects as distinct topics)
- concepts: array of specific concepts/skills
- detailed_breakdown: array of strings (expand each topic/project into subtopics, technologies, techniques used)
- includes_coding: boolean (true only if DSA/coding/algorithms/software projects present)

Resume text:
${resumeText}

Level: ${level}

Return ONLY valid JSON. No markdown, no explanation.
`;

    const text = await generateEval(prompt);
    if (!text) return res.status(503).json({ error: "Service is busy, please try again in a few minutes." });

    const cleaned = extractJson(text);
    const summary = JSON.parse(cleaned);
    console.log("📤 /summarize-resume response:", summary);
    res.json(summary);
  } catch (err) {
    console.error("Resume parse/summarize error FULL:", err);
    res.status(500).json({ error: "Failed to process resume", detail: err.message, stack: err.stack?.split('\n')[1] });
  }
});

app.post("/chat", async (req, res) => {
  const { messages, sessionConfig: rawConfig, offTopicCount = 0, isLastQuestion = false } = req.body;
  console.log("📥 /chat —", messages?.length, "msgs, offTopic:", offTopicCount, "lastQ:", isLastQuestion);

  const cfg = normaliseConfig(rawConfig || {});
  const history = messages || [];
  const lastUser = [...history].reverse().find(m => m.role === 'user')?.content || '';

  const transcriptLines = history
    .slice(0, -1)
    .map(m => `${m.role === 'user' ? 'Candidate' : 'Samarth'}: ${m.content}`)
    .join('\n');

  const projectsLine = cfg.source === 'resume'
    ? 'Cover all technical topics first; ask about projects/experience only at the very end.'
    : 'Never ask about projects, personal work, or portfolio.';

  const prompt = `You are Samarth, a senior expert in ${cfg.subject}, conducting a live interview. You are a real person, never break character.

Rules:
- The candidate's first message will literally be the text [INTERVIEW_START] — this is a trigger only, never repeat, quote, or mention this tag in your reply. Just greet briefly, introduce yourself, and open with a warm background question. No technical questions yet.
- Ask exactly ONE question per reply. Concise, natural, spoken dialogue only — no asterisks/stage directions.
- Candidate level: ${cfg.level}. Adjust depth accordingly.
- Coding Round=${cfg.includes_coding}: if true, ask only for intuition/approach, never request actual code.
- Never explain/teach/coach unless explicitly asked for a hint.
- ${projectsLine}
- Off-topic/abusive strikes so far: ${offTopicCount}/4 (counted across the whole interview, not just consecutive). If this candidate reply is off-topic or abusive, that makes it strike ${offTopicCount + 1}: start your reply with the exact tag [OFF_TOPIC] (nothing before it), then redirect calmly (strike 1 or 2) or give a firm final warning (strike 3). If this new strike is number 4, do not ask another question — say a brief warm closing line instead and end your reply with [INTERVIEW_END].
- When all topics are thoroughly covered, close warmly and end your reply with [INTERVIEW_END].
${isLastQuestion ? '- IMPORTANT: This is the final allowed exchange. Do NOT ask a new question. Wrap up warmly now in this reply and end with [INTERVIEW_END].' : ''}
${cfg.notes ? `- Candidate context: ${cfg.notes}` : ''}

Session: ${cfg.subject} | ${cfg.level} | Topics: ${JSON.stringify(cfg.topics)} | Concepts: ${JSON.stringify(cfg.concepts)} | Breakdown: ${JSON.stringify(cfg.detailed_breakdown)}

Transcript:
${transcriptLines || '(just started)'}

Candidate: ${lastUser}

Reply as Samarth.`;

  const reply = await generateWithFallback(prompt);
  if (!reply) return res.status(503).json({ error: "Service is busy, please try again." });

  console.log("📤 /chat reply:", reply.slice(0, 120));
  res.json({ reply });
});

app.post("/evaluate", async (req, res) => {
  const { sessionConfig: rawConfig, userMessage, aiReply, currentReport } = req.body;
  const cfg = normaliseConfig(rawConfig || {});

  const prompt = `You are a strict technical interview evaluator. Based on the candidate's answer and interviewer's question, update the report.

Subject: ${cfg.subject} | Topics: ${JSON.stringify(cfg.topics)}
Current Report: ${JSON.stringify(currentReport)}
Interviewer: ${aiReply}
Candidate: ${userMessage}

Return ONLY a JSON object with:
- covered_topics: array of topics covered so far
- scores: object {topic: score 0-100}
- weak_concepts: array of specific weak concepts

Rules: be harsh/strict; scores must reflect technical accuracy and communication clarity; only add to weak_concepts if genuinely poor; no duplicate weak_concepts; ONLY valid JSON, no markdown.`;

  const text = await generateEval(prompt);
  if (!text) return res.status(503).json({ error: "Service is busy, please try again." });

  try {
    const cleaned = extractJson(text);
    const updatedReport = JSON.parse(cleaned);
    res.json(updatedReport);
  } catch (err) {
    console.error("Parse error:", err.message, "Raw text:", text.slice(0, 300));
    res.status(500).json({ error: "Failed to parse evaluation response" });
  }
});

app.post("/transcribe", upload.single("audio"), async (req, res) => {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const file = req.file;

    const transcription = await groq.audio.transcriptions.create({
      file: new File([file.buffer], "audio.webm", { type: file.mimetype }),
      model: "whisper-large-v3",
      language: "en",
    });

    console.log("📤 /transcribe result:", transcription.text?.slice(0, 80));
    res.json({ text: transcription.text });
  } catch (err) {
    console.error("Transcribe error:", err.message);
    res.status(500).json({ error: "Transcription failed" });
  }
});

app.listen(3000, () => {
  console.log("Server running");
});