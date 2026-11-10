const { alldl } = require('rahad-all-downloader-v2');

export default async function handler(req, res) {
    // CORS Headers (Zaroori hai taake InfinityFree se connect ho sake)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ status: false, msg: 'Method not allowed' });

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) {}
        }

        const { url, platform } = body || {};
        if (!url) return res.status(400).json({ status: false, msg: 'URL required' });

        // 1. Instagram Profile Picture (PFP) ke liye direct unavatar URL
        const isProfile = platform === 'instagram' && !url.match(/(\/p\/|\/reel\/|\/video\/)/);
        
        if (isProfile) {
            const username = url.split('/').filter(Boolean).pop();
            const avatarUrl = `https://unavatar.io/instagram/${username}`;
            
            return res.status(200).json({ 
                status: true, 
                result: [{ url: avatarUrl }] 
            });
        }

        // 2. Baaki sab (Reels, Videos, Audio) ke liye rahad-all-downloader-v2
        const result = await alldl(url, { retries: 2 });

        if (!result || !result.data || !result.data.videoUrl) {
            throw new Error('Media extract nahi ho payi. Link private ya invalid hai.');
        }

        // Result ko frontend ke format mein bhejein
        return res.status(200).json({ 
            status: true, 
            result: [{ url: result.data.videoUrl }] 
        });

    } catch (error) {
        return res.status(500).json({ 
            status: false, 
            msg: error.message || 'Server Error. Link private ho sakta hai.' 
        });
    }
}
