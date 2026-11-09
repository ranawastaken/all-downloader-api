const { igdl, ttdl, fbdown, twitter, youtube } = require('btch-downloader');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ status: false, msg: 'Method not allowed' });
    }

    const { url, platform } = req.body;

    if (!url) {
        return res.status(400).json({ status: false, msg: 'URL is required' });
    }

    try {
        let result;
        
        if (platform === 'instagram') result = await igdl(url);
        else if (platform === 'tiktok') result = await ttdl(url);
        else if (platform === 'facebook') result = await fbdown(url);
        else if (platform === 'twitter') result = await twitter(url);
        else if (platform === 'youtube') result = await youtube(url);
        else {
            return res.status(400).json({ status: false, msg: 'Unsupported platform' });
        }

        return res.status(200).json({ status: true, result: result });

    } catch (error) {
        return res.status(500).json({ status: false, msg: 'Server error. Please try again.' });
    }
}
