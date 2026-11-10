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

        // 1. Instagram PFP
        const isProfile = platform === 'instagram' && !url.match(/(\/p\/|\/reel\/|\/video\/)/);
        if (isProfile) {
            const username = url.split('/').filter(Boolean).pop();
            return res.status(200).json({ 
                status: true, 
                result: [{ url: `https://unavatar.io/instagram/${username}` }] 
            });
        }

        // 2. YouTube Audio/Video (Using public API)
        if (platform === 'youtube') {
            const response = await fetch(`https://api.vevioz.com/api/button/mp3/${encodeURIComponent(url)}`);
            const data = await response.json();
            
            if (!data || !data.url) throw new Error('YouTube link private ya invalid hai.');
            
            let mediaUrl = Array.isArray(data.url) ? data.url[0].url : data.url;
            return res.status(200).json({ status: true, result: [{ url: mediaUrl }] });
        }

        // 3. Baaki platforms (TikTok, FB, etc. - using a generic public scraper)
        const response = await fetch(`https://api.vevioz.com/api/button/mp4/${encodeURIComponent(url)}`);
        const data = await response.json();

        if (data && data.url) {
            let mediaUrl = Array.isArray(data.url) ? data.url[0].url : data.url;
            return res.status(200).json({ status: true, result: [{ url: mediaUrl }] });
        }

        throw new Error('Media extract nahi ho payi. Link private ya invalid hai.');

    } catch (error) {
        return res.status(500).json({ 
            status: false, 
            msg: error.message || 'Server Error' 
        });
    }
};
