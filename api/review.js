// Optional private AI proxy. Configure both secrets in the deployment environment.
const { timingSafeEqual } = require('node:crypto');
const MODELS = new Set(['gemini-3.5-flash-lite', 'gemini-3.8-flash']);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'AI 요청은 POST로 보내 주세요.' });
  }
  const key = process.env.GEMINI_API_KEY;
  const token = process.env.AI_PROXY_TOKEN;
  if (!key || !token || token.length < 24) {
    return res.status(503).json({ error: '앱 서버의 AI 연결이 준비되지 않았어요. 개인 API 키를 연결하거나 기본 학습을 이용해 주세요.' });
  }
  const supplied = Buffer.from(String(req.headers?.authorization || ''));
  const expected = Buffer.from('Bearer ' + token);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return res.status(401).json({ error: '연결 코드가 맞지 않아요. AI 설정에서 확인해 주세요.' });
  }
  let body = req.body;
  if (typeof body === 'string') {
    if (Buffer.byteLength(body) > 128 * 1024) return res.status(413).json({ error: '요청이 너무 커요. 코드와 질문을 줄여 주세요.' });
    try { body = JSON.parse(body); } catch (_) { return res.status(400).json({ error: '요청의 형식을 읽을 수 없어요.' }); }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body) || typeof body.user !== 'string' || (body.system !== undefined && typeof body.system !== 'string')) {
    return res.status(400).json({ error: '질문과 코드를 글로 보내 주세요.' });
  }
  const model = body.model || 'gemini-3.5-flash-lite';
  if (!MODELS.has(model)) return res.status(400).json({ error: '지원하는 AI 모델을 골라 주세요.' });
  const system = body.system || '';
  const user = body.user;
  if (system.length > 8000 || user.length > 24000) return res.status(413).json({ error: '요청이 너무 커요. 코드와 질문을 줄여 주세요.' });
  if (!user.trim()) return res.status(400).json({ error: 'AI에게 물어볼 내용을 적어 주세요.' });
  const requestedTokens = Number(body.maxTokens);
  const maxTokens = Number.isFinite(requestedTokens) ? Math.min(Math.max(Math.floor(requestedTokens), 64), 4096) : 1400;
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      signal: AbortSignal.timeout(20000),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: user }] }],
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    });
    if (!response.ok) return res.status(502).json({ error: 'AI가 지금 답하지 못했어요. 연결 설정과 사용 한도를 확인한 뒤 다시 시도해 주세요.' });
    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];
    const text = parts.filter(part => !part.thought && typeof part.text === 'string').map(part => part.text).join('').trim();
    if (!text) return res.status(502).json({ error: 'AI의 답변이 비어 있어요. 질문을 조금 바꿔 다시 시도해 주세요.' });
    return res.status(200).json({ text });
  } catch (error) {
    const timeout = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    return res.status(timeout ? 504 : 502).json({ error: timeout ? 'AI 응답을 기다리다 시간이 지났어요. 잠시 후 다시 시도해 주세요.' : 'AI에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.' });
  }
};
