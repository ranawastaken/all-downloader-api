const { igdl, ttdl, fbdown, twitter, youtube } = require('btch-downloader');

export default async function handler(req, res) {
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

        // --- 1. SPECIAL LOGIC FOR INSTAGRAM PROFILE (PFP) ---
        const isProfile = platform === 'instagram' && !url.match(/(\/p\/|\/reel\/|\/video\/)/);
        
        if (isProfile) {
            const urlObj = new URL(url);
            const path = urlObj.pathname.replace(/^\/|\/$/g, '');
            const username = path.split('/')[0];

            if (!username) return res.status(400).json({ status: false, msg: 'Invalid username' });

            // Instagram Internal API Call
            const igApiUrl = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
            
            const response = await fetch(igApiUrl, {
                headers: {
                    'X-IG-App-ID': '936619743392459', 
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
                }
            });

            if (!response.ok) {
                throw new Error('Profile private hai ya Instagram ne request block ki hai.');
            }

            const data = await response.json();
            const hdPic = data?.data?.user?.hd_profile_pic_url_info?.url || data?.data?.user?.profile_pic_url_hd;

            if (!hdPic) {
                // Agar account ki koi picture nahi hai (jaise aapka 'tuff' account)
                throw new Error('Is profile ki koi picture nahi hai ya wo private hai.');
            }

            return res.status(200).json({ 
                status: true, 
                result: [{ url: hdPic }] 
            });
        }

        // --- 2. LOGIC FOR REELS, VIDEOS, AUDIO ---
        let result = null;
        if (platform === 'instagram') result = await igdl(url);
        else if (platform === 'tiktok') result = await ttdl(url);
        else if (platform === 'facebook') result = await fbdown(url);
        else if (platform === 'twitter') result = await twitter(url);
        else if (platform === 'youtube') result = await youtube(url);
        else return res.status(400).json({ status: false, msg: 'Platform not supported' });

        if (!result || !result.data) {
            throw new Error('Media extract nahi ho payi. Link private ya invalid hai.');
        }

        return res.status(200).json({ status: true, result: result.data });

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message || 'Server Error' });
    }
}
