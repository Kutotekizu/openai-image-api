module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Or your domain
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

  const { prompt } = req.body;
  if (!prompt) {
    res.status(400).json({ error: 'Missing prompt' });
    return;
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: "1024x1024"
      })
    });

    const data = await openaiRes.json();
    if (data && data.data && data.data[0] && data.data[0].url) {
      res.status(200).json({ image_url: data.data[0].url });
    } else {
      res.status(500).json({ error: 'Failed to generate image', openai: data });
    }
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
};
