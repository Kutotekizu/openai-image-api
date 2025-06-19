export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Only POST allowed' });
    return;
  }

  let prompt;
  let parsed = null;

  // First, try to read req.body directly (for Vercel/Next.js functions)
  if (req.body && typeof req.body === 'object') {
    prompt = req.body.prompt;
    console.log('Parsed prompt (from object):', prompt);
  } else {
    // Otherwise, parse the raw body
    let body = '';
    await new Promise((resolve) => {
      req.on('data', (chunk) => { body += chunk; });
      req.on('end', resolve);
    });
    try {
      parsed = JSON.parse(body);
      prompt = parsed.prompt;
      console.log('Parsed prompt (from raw):', prompt);
    } catch (e) {
      console.log('Body parse error:', e, 'Body:', body);
      prompt = undefined;
    }
  }

  console.log('Prompt to OpenAI:', prompt, '| Type:', typeof prompt, '| Length:', prompt ? prompt.length : 'null');

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    res.status(400).json({ error: 'Prompt missing or invalid.' });
    return;
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    res.status(500).json({ error: 'Server misconfigured: no API key.' });
    return;
  }

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'dall-e-3', // Try dall-e-2 first!
        prompt,
        n: 1,
        size: "1024x1024"
      })
    });

    const data = await openaiRes.json();
    console.log('OpenAI response:', data);

    if (data && data.data && data.data[0] && data.data[0].url) {
      res.status(200).json({ image_url: data.data[0].url });
    } else {
      res.status(500).json({ error: 'Failed to generate image', openai: data });
    }
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
}
