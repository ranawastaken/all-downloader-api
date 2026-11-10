const { igdl, ttdl, fbdown, twitter, youtube } = require('btch-downloader');

export default async function handler(req, res) {
    // 1. CORS Headers (InfinityFree se connect hone ke liye zaroori)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    // 2. OPTIONS request handle karein
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 3. Sirf POST allow karein
    if (req.method !== 'POST') {
        return res.status(405).json({ status: false, msg: 'Method not allowed' });
    }

    try {
        // 4. Body parse karein (text/plain aur application/json dono handle karein)
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) {}
        }

        const { url, platform } = body || {};

        if (!url) {
            return res.status(400).json({ status: false, msg: 'URL is required' });
        }

        // 5. Platform ke hisaab se function call karein
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

        // 6. Result validate karein
        if (!result || !result.data) {
            return res.status(400).json({ status: false, msg: 'Could not extract media from this link.' });
        }

        // 7. Success response bhejein
        return res.status(200).json({ status: true, result: result.data });

    } catch (error) {
        // 8. Agar function crash ho, to JSON error bhejein (HTML nahi)
        console.error("Vercel API Error:", error);
        return res.status(500).json({ 
            status: false, 
            msg: error.message || 'Internal server error. The link might be private or invalid.' 
        });
    }
}
