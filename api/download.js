const { igdl, ttdl, fbdown, twitter, youtube } = require('btch-downloader');

export default async function handler(req, res) {
    // 1. CORS Headers (InfinityFree se connect hone ke liye zaroori)
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
        // Body parse karein
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch (e) {}
        }

        const { url, platform } = body || {};

        if (!url) {
            return res.status(400).json({ status: false, msg: 'URL is required' });
        }

        // 2. Check karein ke URL profile ka hai ya post/reel ka
        const isProfile = platform === 'instagram' && !url.match(/(\/p\/|\/reel\/|\/video\/)/);

        if (isProfile) {
            // 3. Instagram PFP ke liye direct internal API use karein
            const urlObj = new URL(url);
            const path = urlObj.pathname.replace(/^\/|\/$/g, '');
            const username = path.split('/')[0];

            if (!username) {
                return res.status(400).json({ status: false, msg: 'Invalid username' });
            }

            // Instagram Web API Call
            const igApiUrl = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
            
            const response = await fetch(igApiUrl, {
                headers: {
                    'X-IG-App-ID': '936619743392459', // Zaroori header
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
                }
            });

            if (!response.ok) {
                throw new Error('Instagram blocked the request or profile is private.');
            }

            const data = await response.json();
            
            // HD Profile Pic URL extract karein
            const hdPic = data?.data?.user?.hd_profile_pic_url_info?.url || data?.data?.user?.profile_pic_url_hd;

            if (!hdPic) {
                throw new Error('Could not find profile picture for this username.');
            }

            return res.status(200).json({ 
                status: true, 
                result: [{ url: hdPic, type: 'image' }] 
            });

        } else {
            // 4. Baaki platforms (Reels, Videos) ke liye btch-downloader use karein
            let result = null;
            if (platform === 'instagram') result = await igdl(url);
            else if (platform === 'tiktok') result = await ttdl(url);
            else if (platform === 'facebook') result = await fbdown(url);
            else if (platform === 'twitter') result = await twitter(url);
            else if (platform === 'youtube') result = await youtube(url);
            else {
                return res.status(400).json({ status: false, msg: 'Platform not supported' });
            }

            if (!result || !result.data) {
                return res.status(400).json({ status: false, msg: 'Could not extract media. Link may be private.' });
            }

            return res.status(200).json({ status: true, result: result.data });
        }

    } catch (error) {
        console.error("Vercel API Error:", error);
        return res.status(500).json({ 
            status: false, 
            msg: error.message || 'Internal server error. The link might be private or invalid.' 
        });
    }
}
