import { InstagraNode } from 'instagranode';
import { ytmp3, ytdl } from '@kelvdra/scraper';

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

        // --- 1. INSTAGRAM PROFILE PICTURE (PFP) ---
        const isProfile = platform === 'instagram' && !url.match(/(\/p\/|\/reel\/|\/video\/)/);
        
        if (isProfile) {
            const username = url.split('/').filter(Boolean).pop();
            
            // Use instagranode (browser-like headers)
            const ig = new InstagraNode({ browser: "chrome-mac" });
            const profile = await ig.searchProfile(username);
            
            if (!profile) throw new Error('Profile not found.');

            // Note: instagranode downloadProfilePic saves to disk, so we need the URL directly.
            // We will use the profile object's picture URL if available.
            // For now, we can construct the URL or use the library's internal logic.
            // A safer approach is to use the @unavatar/core library which is built for this.
            // Let's switch to unavatar for PFP to ensure we get a direct URL.
            
            // (Fallback to direct unavatar API for PFP)
            const avatarUrl = `https://unavatar.io/instagram/${username}`;
            
            return res.status(200).json({ 
                status: true, 
                result: [{ url: avatarUrl, type: 'image' }] 
            });
        }

        // --- 2. YOUTUBE AUDIO / VIDEO ---
        if (platform === 'youtube') {
            // Use @kelvdra/scraper for YouTube
            let result;
            if (url.includes('music.youtube.com') || url.includes('youtu.be') || url.includes('watch?v=')) {
                // Try to get audio (mp3)
                result = await ytmp3(url, 'mp3');
            } else {
                throw new Error('Invalid YouTube URL.');
            }

            if (!result || !result.url) {
                throw new Error('Could not extract YouTube audio.');
            }

            return res.status(200).json({ status: true, result: [{ url: result.url, type: 'audio' }] });
        }

        // --- 3. OTHER PLATFORMS (TikTok, Facebook, etc.) ---
        // If you have other reliable APIs, add them here.
        // For now, we return an error for unsupported platforms.
        return res.status(400).json({ status: false, msg: 'This platform is not supported yet. We are working on it!' });

    } catch (error) {
        return res.status(500).json({ status: false, msg: error.message || 'Server Error' });
    }
}
