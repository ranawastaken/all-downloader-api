const { igdl, ttdl, fbdown, twitter, youtube } = require('btch-downloader');

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ status: false, msg: 'Method not allowed' });
    }

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) {}
        }

        const { url, platform } = body || {};

        if (!url) {
            return res.status(400).json({ status: false, msg: 'URL is required' });
        }

        let result = null;

        if (platform === 'instagram') {
            result = await igdl(url);
        } else if (platform === 'tiktok') {
            result = await ttdl(url);
        } else if (platform === 'facebook') {
            result = await fbdown(url);
        } else if (platform === 'twitter') {
            result = await twitter(url);
        } else if (platform === 'youtube') {
            result = await youtube(url);
        } else {
            return res.status(400).json({ status: false, msg: 'Platform not supported' });
        }

        if (!result || !result.data) {
            return res.status(400).json({ status: false, msg: 'Extraction failed. Link private ho sakta hai.' });
        }

        return res.status(200).json({ status: true, result: result.data });

    } catch (error) {
        console.error("Vercel Error:", error);
        return res.status(500).json({ status: false, msg: error.message || 'Internal server error' });
    }
}
