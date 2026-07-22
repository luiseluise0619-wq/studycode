// Vercel serverless function — server-side proxy for the AI code mentor.
// Reads GEMINI_API_KEY from the environment so the key never reaches the browser.
// The client POSTs { system, user, model?, maxTokens? } and gets back { text } | { error }.
//
// NOTE: this endpoint is public — anyone who can reach the deployed site can call it
// and consume your Gemini quota. Guards below cap abuse (POST-only, gemini models only,
// bounded token/input sizes), but they are not authentication. Keep it on a project
// whose free-tier limits you're comfortable exposing, or add auth/rate-limiting later.

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    res.status(500).json({ error: "GEMINI_API_KEY is not set on the server." });
    return;
  }
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (_) { body = {}; } }
  body = body || {};

  const model = String(body.model || "gemini-2.0-flash");
  if (!/^gemini-[a-z0-9.\-]+$/i.test(model)) {
    res.status(400).json({ error: "model not allowed" });
    return;
  }
  const maxTokens = Math.min(Math.max(parseInt(body.maxTokens, 10) || 1400, 64), 4096);
  const system = String(body.system || "").slice(0, 8000);
  const user = String(body.user || "").slice(0, 24000);
  if (!user.trim()) {
    res.status(400).json({ error: "empty request" });
    return;
  }

  try {
    const r = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/" +
        encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(key),
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: "user", parts: [{ text: user }] }],
          generationConfig: { maxOutputTokens: maxTokens },
        }),
      }
    );
    const j = await r.json();
    if (j.error) {
      res.status(502).json({ error: j.error.message || "gemini error" });
      return;
    }
    const cand = j.candidates && j.candidates[0];
    const text = ((cand && cand.content && cand.content.parts) || [])
      .map((p) => p.text || "").join("").trim();
    res.status(200).json({ text });
  } catch (e) {
    res.status(502).json({ error: String((e && e.message) || e) });
  }
};
