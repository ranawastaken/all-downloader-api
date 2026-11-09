const { igdl, ttdl, fbdown, twitter, youtube } = require('btch-downloader');

export default async function handler(req, res) {
    // 1. CORS Headers set karein (zaroori hai InfinityFree se connect hone ke liye)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST, GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    // 2. Browser jab check karne aaye (OPTIONS) to usko 200 bhejein
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 3. Sirf POST request allow karein
    if (req.method !== 'POST') {
        return res.status(405).json({ status: false, msg: 'Method not allowed' });
    }

    try {
        // 4. Body ko handle karein (agar text/plain aaye to parse karein)
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) {}
        }

        const { url, platform } = body || {};

        if (!url) {
            return res.status(400).json({ status: false, msg: 'URL is required' });
        }

        let result = null;

        // 5. Platform ke hisaab se scraper call karein
        if (platform === 'instagram') result = await igdl(url);
        else if (platform === 'tiktok') result = await ttdl(url);
        else if (platform === 'facebook') result = await fbdown(url);
        else if (platform === 'twitter') result = await twitter(url);
        else if (platform === 'youtube') result = await youtube(url);
        else {
            return res.status(400).json({ status: false, msg: 'Platform not supported' });
        }

        if (!result) {
            return res.status(400).json({ status: false, msg: 'Extraction failed from API' });
        }

        // 6. Result wapas bhejein
        return res.status(200).json({ status: true, result: result });

    } catch (error) {
        console.error("Vercel Error:", error);
        return res.status(500).json({ status: false, msg: error.message || 'Server error' });
    }
}
