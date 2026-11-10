const { alldl } = require('rahad-all-downloader-v2');

module.exports = async (req, res) => {
    // CORS Headers
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

        // 1. Instagram Profile Picture (PFP)
        const isProfile = platform === 'instagram' && !url.match(/(\/p\/|\/reel\/|\/video\/)/);
        
        if (isProfile) {
            const username = url.split('/').filter(Boolean).pop();
            return res.status(200).json({ 
                status: true, 
                result: [{ url: `https://unavatar.io/instagram/${username}` }] 
            });
        }

        // 2. Baaki sab media (Reels, Videos, Audio)
        const result = await alldl(url);

        if (!result || !result.data || !result.data.videoUrl) {
            throw new Error('Media extract nahi ho payi. Link private ya invalid hai.');
        }

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
};
