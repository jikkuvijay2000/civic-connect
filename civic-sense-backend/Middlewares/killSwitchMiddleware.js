const axios = require('axios');

const GIST_URL = process.env.KILL_SWITCH_GIST_URL; 
const POLL_INTERVAL_MS = 60 * 1000; 

let systemActive = false;
let lastChecked = null;
let pollTimer = null;

const fetchKillSwitchStatus = async () => {
    if (!GIST_URL) {
        console.warn('[KILL SWITCH] No GIST_URL found in .env! Locking down system.');
        systemActive = false;
        return;
    }

    const match = GIST_URL.match(/[a-f0-9]{32}/);
    if (!match) {
        console.warn('[KILL SWITCH] Invalid Gist URL format. Locking down system.');
        systemActive = false;
        return;
    }
    
    const gistId = match[0];
    const apiUrl = `https://api.github.com/gists/${gistId}`;

    try {
        const res = await axios.get(apiUrl, {
            timeout: 5000,
            headers: { 'Cache-Control': 'no-cache' }
        });
        
        const files = res.data?.files || {};
        const firstFile = Object.values(files)[0];
        
        if (firstFile && firstFile.content) {
            const parsed = JSON.parse(firstFile.content);
            systemActive = parsed.active !== false; // default to true if missing
        }
        
        lastChecked = new Date();
        console.log(`[KILL SWITCH] Status: ${systemActive ? '✅ ACTIVE' : '🔴 BLOCKED'} (checked at ${lastChecked.toISOString()})`);
    } catch (err) {
        console.warn('[KILL SWITCH] Could not reach gist or parse JSON – Locking down system:', err.message);
        systemActive = false; // Prevents bypass by turning off WiFi
    }
};

// Run immediately on startup, then on interval
fetchKillSwitchStatus();
pollTimer = setInterval(fetchKillSwitchStatus, POLL_INTERVAL_MS);

/**
 * Express middleware – blocks all routes if systemActive === false.
 * Attach this BEFORE all routers in index.js.
 */
const killSwitchMiddleware = (req, res, next) => {
    if (!systemActive) {
        return res.status(503).json({
            status: 'kill_switch',
            message: 'SYSTEM OFFLINE – Access has been revoked by the project owner.',
        });
    }
    next();
};

module.exports = { killSwitchMiddleware };
