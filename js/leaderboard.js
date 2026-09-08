// Arcade Leaderboard & High Score Manager
// Supports Cloudflare Pages Global Leaderboard + LocalStorage Fallback (Hybrid Mode)

class LeaderboardManager {
    constructor() {
        this.storageKey = 'sonic3d_leaderboard_v1';
        this.apiUrl = '/api/leaderboard';
        this.maxEntries = 10;
        this.currentMode = 'global'; // 'global' or 'local'
        this.isOnline = false;
        this.isLoading = false;
        this.globalScores = null;
        this.defaultScores = [
            { name: 'SONIC', score: 165000, time: '3:12:45', timeSec: 192.45, rings: 120, date: '06/09/2026' },
            { name: 'SHADOW', score: 148000, time: '3:25:80', timeSec: 205.80, rings: 95, date: '06/09/2026' },
            { name: 'TAILS', score: 124000, time: '3:42:10', timeSec: 222.10, rings: 80, date: '06/09/2026' },
            { name: 'KNUCKLES', score: 105000, time: '3:58:30', timeSec: 238.30, rings: 65, date: '06/09/2026' },
            { name: 'AMY', score: 88000, time: '4:15:90', timeSec: 255.90, rings: 50, date: '06/09/2026' }
        ];

        // Background probe to check if Cloudflare API is reachable
        this.probeApi();
    }

    async probeApi() {
        try {
            await this.fetchGlobalScores(2500);
        } catch (e) {
            // Quietly fallback
        }
    }

    getLocalScores() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) {
                this.saveLocalScores(this.defaultScores);
                return [...this.defaultScores];
            }
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed) || parsed.length === 0) {
                this.saveLocalScores(this.defaultScores);
                return [...this.defaultScores];
            }
            return parsed;
        } catch (e) {
            console.warn('Could not read leaderboard from localStorage, using defaults:', e);
            return [...this.defaultScores];
        }
    }

    saveLocalScores(scores) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(scores));
        } catch (e) {
            console.warn('Could not write leaderboard to localStorage:', e);
        }
    }

    getScores() {
        if (this.currentMode === 'global' && this.isOnline && Array.isArray(this.globalScores) && this.globalScores.length > 0) {
            return this.globalScores;
        }
        return this.getLocalScores();
    }

    reset() {
        this.saveLocalScores(this.defaultScores);
        return [...this.defaultScores];
    }

    formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        const ms = Math.floor((sec * 100) % 100);
        return `${m}:${s < 10 ? '0' : ''}${s}:${ms < 10 ? '0' : ''}${ms}`;
    }

    async fetchGlobalScores(timeoutMs = 3500) {
        this.isLoading = true;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const res = await fetch(this.apiUrl, {
                method: 'GET',
                signal: controller.signal,
                headers: { 'Accept': 'application/json' }
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data && data.success && Array.isArray(data.scores)) {
                    this.globalScores = data.scores;
                    this.isOnline = true;
                    this.isLoading = false;
                    return this.globalScores;
                }
            }
            throw new Error('API returned invalid response');
        } catch (err) {
            clearTimeout(timeoutId);
            this.isOnline = false;
            this.isLoading = false;
            return this.getLocalScores();
        }
    }

    addScore(name, score, timeSec, rings) {
        // 1. Synchronously add to Local Storage first (Zero delay for game flow)
        const rawName = (name || 'SONIC').trim();
        const sanitized = rawName.replace(/[^a-zA-Z0-9\u0E00-\u0E7F _-]/g, '');
        const cleanName = sanitized.substring(0, 12).trim() || 'SONIC';
        const formattedTime = this.formatTime(timeSec);
        
        const now = new Date();
        const dateStr = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;

        const newEntry = {
            name: cleanName,
            score: Math.floor(score),
            time: formattedTime,
            timeSec: timeSec,
            rings: Math.floor(rings),
            date: dateStr
        };

        this.lastSubmittedEntry = newEntry;

        // 1. Update Local Storage with deduplication
        let localScores = this.getLocalScores();
        const localDupIdx = localScores.findIndex(s => s.name === newEntry.name && s.score === newEntry.score && Math.abs((s.timeSec || 0) - (newEntry.timeSec || 0)) < 2.0);
        if (localDupIdx !== -1) {
            localScores[localDupIdx] = newEntry;
        } else {
            localScores.push(newEntry);
        }

        // Clean any historical duplicates
        const uniqueLocal = [];
        const seenLocal = new Set();
        for (const s of localScores) {
            const key = `${s.name}_${s.score}`;
            if (!seenLocal.has(key)) {
                seenLocal.add(key);
                uniqueLocal.push(s);
            }
        }
        localScores = uniqueLocal;

        localScores.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return (a.timeSec || 9999) - (b.timeSec || 9999);
        });

        const localRankIndex = localScores.indexOf(newEntry);
        const trimmedLocal = localScores.slice(0, this.maxEntries);
        this.saveLocalScores(trimmedLocal);

        // 2. Optimistically update in-memory globalScores with deduplication!
        if (!this.globalScores || !Array.isArray(this.globalScores) || this.globalScores.length === 0) {
            this.globalScores = [...this.defaultScores];
        }
        const existingGlobalIdx = this.globalScores.findIndex(s => s.name === newEntry.name && s.score === newEntry.score && Math.abs((s.timeSec || 0) - (newEntry.timeSec || 0)) < 2.0);
        if (existingGlobalIdx !== -1) {
            this.globalScores[existingGlobalIdx] = newEntry;
        } else {
            this.globalScores.push(newEntry);
        }

        // Clean duplicates from globalScores
        const uniqueGlobal = [];
        const seenGlobal = new Set();
        for (const s of this.globalScores) {
            const key = `${s.name}_${s.score}`;
            if (!seenGlobal.has(key)) {
                seenGlobal.add(key);
                uniqueGlobal.push(s);
            }
        }
        this.globalScores = uniqueGlobal;

        this.globalScores.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            return (a.timeSec || 9999) - (b.timeSec || 9999);
        });
        this.globalScores = this.globalScores.slice(0, this.maxEntries);
        const globalRankIndex = this.globalScores.indexOf(newEntry);

        // 3. Asynchronously broadcast score to Cloudflare Global API
        this.submitGlobalScore(newEntry).catch(e => {
            console.log('Global score submission fallback to local:', e.message);
        });

        const activeRank = (this.currentMode === 'global') ? globalRankIndex : localRankIndex;
        this.lastHighlightIndex = (activeRank >= 0 && activeRank < this.maxEntries) ? activeRank : -1;

        return this.lastHighlightIndex;
    }

    async submitGlobalScore(entry) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4500);

            const res = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(entry),
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (res.ok) {
                const data = await res.json();
                if (data && data.success && Array.isArray(data.scores)) {
                    this.globalScores = data.scores;
                    this.isOnline = true;
                    // Trigger custom event so any open tables can auto-refresh
                    window.dispatchEvent(new CustomEvent('leaderboard-updated', { detail: data }));
                    return data.rank;
                }
            }
        } catch (e) {
            // Offline or API endpoint unavailable
        }
        return -1;
    }

    setMode(mode, containerEl, highlightIndex = -1) {
        this.currentMode = mode;
        if (mode === 'global' && !this.globalScores) {
            this.fetchGlobalScores().then(() => {
                this.renderTable(containerEl, highlightIndex);
            });
        }
        this.renderTable(containerEl, highlightIndex);
    }

    renderTable(containerEl, highlightIndex = -1) {
        if (!containerEl) return;

        if (highlightIndex >= 0) {
            this.lastHighlightIndex = highlightIndex;
        }
        const activeHighlight = (highlightIndex >= 0) ? highlightIndex : (this.lastHighlightIndex ?? -1);

        const scores = this.getScores();
        const isGlobal = (this.currentMode === 'global');
        const statusBadge = this.isOnline 
            ? `<span class="lb-status-online" title="เชื่อมต่อ Cloudflare Pages สำเร็จ">🟢 GLOBAL ONLINE</span>`
            : `<span class="lb-status-local" title="ทำงานในโหมดเครื่องผู้เล่น">💾 LOCAL STORAGE</span>`;

        // Hide Reset Defaults button when in GLOBAL mode
        const resetBtn = document.getElementById('reset-leaderboard-btn');
        if (resetBtn) {
            resetBtn.style.display = isGlobal ? 'none' : 'inline-block';
        }

        let rowsHtml = '';
        scores.forEach((entry, idx) => {
            const rank = idx + 1;
            let rankBadge = `${rank}`;
            let rankClass = '';
            
            if (rank === 1) {
                rankBadge = '🥇 1ST';
                rankClass = 'rank-gold';
            } else if (rank === 2) {
                rankBadge = '🥈 2ND';
                rankClass = 'rank-silver';
            } else if (rank === 3) {
                rankBadge = '🥉 3RD';
                rankClass = 'rank-bronze';
            }

            // Highlight ONLY the row belonging to the user's submitted name
            const isPlayerEntry = Boolean(this.lastSubmittedEntry && entry.name === this.lastSubmittedEntry.name && (
                (entry.score === this.lastSubmittedEntry.score && entry.timeSec === this.lastSubmittedEntry.timeSec) ||
                (idx === activeHighlight)
            ));
            const isHighlight = isPlayerEntry;
            const rowClass = isHighlight ? 'leaderboard-row highlight-player-row' : 'leaderboard-row';

            rowsHtml += `
                <tr class="${rowClass}">
                    <td class="col-rank ${rankClass}">${rankBadge}</td>
                    <td class="col-name">${escapeHtml(entry.name)}${isHighlight ? ' <span class="badge-you">YOU!</span>' : ''}</td>
                    <td class="col-score">${entry.score.toLocaleString()}</td>
                    <td class="col-time">${entry.time}</td>
                    <td class="col-rings">🟡 ${entry.rings}</td>
                </tr>
            `;
        });

        // Unique ID for container scoping
        const containerId = containerEl.id || `lb-wrap-${Math.floor(Math.random()*1000)}`;
        containerEl.id = containerId;

        containerEl.innerHTML = `
            <div class="lb-toolbar">
                <div class="lb-mode-toggle">
                    <button type="button" class="lb-mode-btn ${isGlobal ? 'active' : ''}" onclick="window.setLeaderboardMode('${containerId}', 'global', ${highlightIndex})">
                        🌐 GLOBAL (คะแนนรวมโลก)
                    </button>
                    <button type="button" class="lb-mode-btn ${!isGlobal ? 'active' : ''}" onclick="window.setLeaderboardMode('${containerId}', 'local', ${highlightIndex})">
                        💾 LOCAL (เครื่องนี้)
                    </button>
                </div>
                <div class="lb-status-wrap">
                    ${statusBadge}
                    <button type="button" class="lb-refresh-btn" onclick="window.refreshLeaderboard('${containerId}', ${highlightIndex})" title="รีเฟรชคะแนนล่าสุด">🔄</button>
                </div>
            </div>
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th class="col-rank">RANK</th>
                        <th class="col-name">NAME</th>
                        <th class="col-score">SCORE</th>
                        <th class="col-time">TIME</th>
                        <th class="col-rings">RINGS</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        `;
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Global UI Helper handlers
window.setLeaderboardMode = (containerId, mode, highlightIndex = -1) => {
    const el = document.getElementById(containerId);
    if (window.game && window.game.leaderboard && el) {
        window.game.leaderboard.setMode(mode, el, highlightIndex);
    }
};

window.refreshLeaderboard = async (containerId, highlightIndex = -1) => {
    const el = document.getElementById(containerId);
    if (window.game && window.game.leaderboard && el) {
        const btn = el.querySelector('.lb-refresh-btn');
        if (btn) btn.classList.add('spinning');
        await window.game.leaderboard.fetchGlobalScores();
        window.game.leaderboard.renderTable(el, highlightIndex);
    }
};

// Listen to automatic leaderboard updates from backend
window.addEventListener('leaderboard-updated', () => {
    const standaloneWrap = document.getElementById('standalone-leaderboard-table-wrap');
    const clearWrap = document.getElementById('clear-leaderboard-table-wrap');
    const gameoverWrap = document.getElementById('gameover-leaderboard-table-wrap');

    if (window.game && window.game.leaderboard) {
        const highlight = window.game.leaderboard.lastHighlightIndex ?? -1;
        if (standaloneWrap && standaloneWrap.offsetParent !== null) {
            window.game.leaderboard.renderTable(standaloneWrap, highlight);
        }
        if (clearWrap && clearWrap.offsetParent !== null) {
            window.game.leaderboard.renderTable(clearWrap, highlight);
        }
        if (gameoverWrap && gameoverWrap.offsetParent !== null) {
            window.game.leaderboard.renderTable(gameoverWrap, highlight);
        }
    }
});

if (typeof window !== 'undefined') {
    window.LeaderboardManager = LeaderboardManager;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeaderboardManager;
}
