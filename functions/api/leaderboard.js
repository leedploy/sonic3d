// Cloudflare Pages Functions - Global Leaderboard API
// Handles GET /api/leaderboard and POST /api/leaderboard
// Supports Cloudflare KV (binding: LEADERBOARD_KV) with memory/default fallback

const DEFAULT_SCORES = [
    { name: 'SONIC', score: 165000, time: '3:12:45', timeSec: 192.45, rings: 120, date: 'GLOBAL' },
    { name: 'SHADOW', score: 148000, time: '3:25:80', timeSec: 205.80, rings: 95, date: 'GLOBAL' },
    { name: 'TAILS', score: 124000, time: '3:42:10', timeSec: 222.10, rings: 80, date: 'GLOBAL' },
    { name: 'KNUCKLES', score: 105000, time: '3:58:30', timeSec: 238.30, rings: 65, date: 'GLOBAL' },
    { name: 'AMY', score: 88000, time: '4:15:90', timeSec: 255.90, rings: 50, date: 'GLOBAL' }
];

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json; charset=utf-8'
};

// Global in-memory fallback cache (persists within warm Worker instance)
let memoryScores = [...DEFAULT_SCORES];

export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
    });
}

export async function onRequestGet(context) {
    try {
        const kv = context.env ? context.env.LEADERBOARD_KV : null;
        let scores = null;
        let storageSource = 'memory_fallback';

        if (kv) {
            try {
                const kvData = await kv.get('sonic3d_leaderboard_top10', 'json');
                if (Array.isArray(kvData) && kvData.length > 0) {
                    scores = kvData;
                    storageSource = 'cloudflare_kv';
                }
            } catch (kvErr) {
                console.warn('Error reading from Cloudflare KV:', kvErr);
            }
        }

        if (!scores) {
            scores = memoryScores && memoryScores.length > 0 ? memoryScores : [...DEFAULT_SCORES];
        }

        return new Response(JSON.stringify({
            success: true,
            storage: storageSource,
            scores: scores
        }), {
            status: 200,
            headers: CORS_HEADERS
        });
    } catch (err) {
        return new Response(JSON.stringify({
            success: false,
            error: err.message,
            scores: DEFAULT_SCORES
        }), {
            status: 500,
            headers: CORS_HEADERS
        });
    }
}

export async function onRequestPost(context) {
    try {
        let payload;
        try {
            payload = await context.request.json();
        } catch (e) {
            return new Response(JSON.stringify({ success: false, error: 'Invalid JSON payload' }), {
                status: 400,
                headers: CORS_HEADERS
            });
        }

        const { name, score, timeSec, time, rings } = payload || {};

        // Validation & Sanitization
        const cleanName = (typeof name === 'string' ? name.trim().replace(/[^a-zA-Z0-9 _-]/g, '') : 'SONIC').toUpperCase().substring(0, 10) || 'SONIC';
        const numScore = Math.min(Math.max(0, parseInt(score, 10) || 0), 9999999);
        const numTimeSec = Math.min(Math.max(1, parseFloat(timeSec) || 60), 7200);
        const numRings = Math.min(Math.max(0, parseInt(rings, 10) || 0), 999);
        
        let displayTime = typeof time === 'string' && time.trim() ? time.trim() : null;
        if (!displayTime) {
            const m = Math.floor(numTimeSec / 60);
            const s = Math.floor(numTimeSec % 60);
            const ms = Math.floor((numTimeSec * 100) % 100);
            displayTime = `${m}:${s < 10 ? '0' : ''}${s}:${ms < 10 ? '0' : ''}${ms}`;
        }

        const now = new Date();
        const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

        const newEntry = {
            name: cleanName,
            score: numScore,
            time: displayTime,
            timeSec: numTimeSec,
            rings: numRings,
            date: dateStr
        };

        const kv = context.env ? context.env.LEADERBOARD_KV : null;
        let scores = null;
        let storageSource = 'memory_fallback';

        if (kv) {
            try {
                const kvData = await kv.get('sonic3d_leaderboard_top10', 'json');
                if (Array.isArray(kvData) && kvData.length > 0) {
                    scores = kvData;
                }
            } catch (e) {}
        }

        if (!scores) {
            scores = memoryScores && memoryScores.length > 0 ? [...memoryScores] : [...DEFAULT_SCORES];
        }

        // Add & Sort: Primary Score DESC, Secondary Time ASC
        scores.push(newEntry);
        scores.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return (a.timeSec || 9999) - (b.timeSec || 9999);
        });

        // Trim to top 10
        scores = scores.slice(0, 10);
        memoryScores = [...scores];

        // Save to KV if available
        if (kv) {
            try {
                await kv.put('sonic3d_leaderboard_top10', JSON.stringify(scores));
                storageSource = 'cloudflare_kv';
            } catch (kvErr) {
                console.warn('Error writing to Cloudflare KV:', kvErr);
            }
        }

        const rankedIndex = scores.findIndex(s => s.name === newEntry.name && s.score === newEntry.score && s.timeSec === newEntry.timeSec);

        return new Response(JSON.stringify({
            success: true,
            rank: rankedIndex,
            storage: storageSource,
            scores: scores
        }), {
            status: 200,
            headers: CORS_HEADERS
        });
    } catch (err) {
        return new Response(JSON.stringify({
            success: false,
            error: err.message
        }), {
            status: 500,
            headers: CORS_HEADERS
        });
    }
}
