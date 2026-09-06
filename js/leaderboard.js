// Arcade Leaderboard & High Score Manager
// Handles persistent rankings, default champion rivals, and HTML table rendering.

class LeaderboardManager {
    constructor() {
        this.storageKey = 'sonic3d_leaderboard_v1';
        this.maxEntries = 10;
        this.defaultScores = [
            { name: 'SONIC', score: 165000, time: '3:12:45', timeSec: 192.45, rings: 120, date: '06/09/2026' },
            { name: 'SHADOW', score: 148000, time: '3:25:80', timeSec: 205.80, rings: 95, date: '06/09/2026' },
            { name: 'TAILS', score: 124000, time: '3:42:10', timeSec: 222.10, rings: 80, date: '06/09/2026' },
            { name: 'KNUCKLES', score: 105000, time: '3:58:30', timeSec: 238.30, rings: 65, date: '06/09/2026' },
            { name: 'AMY', score: 88000, time: '4:15:90', timeSec: 255.90, rings: 50, date: '06/09/2026' }
        ];
    }

    getScores() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) {
                this.saveScores(this.defaultScores);
                return [...this.defaultScores];
            }
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed) || parsed.length === 0) {
                this.saveScores(this.defaultScores);
                return [...this.defaultScores];
            }
            return parsed;
        } catch (e) {
            console.warn('Could not read leaderboard from localStorage, using defaults:', e);
            return [...this.defaultScores];
        }
    }

    saveScores(scores) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(scores));
        } catch (e) {
            console.warn('Could not write leaderboard to localStorage:', e);
        }
    }

    reset() {
        this.saveScores(this.defaultScores);
        return [...this.defaultScores];
    }

    formatTime(sec) {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        const ms = Math.floor((sec * 100) % 100);
        return `${m}:${s < 10 ? '0' : ''}${s}:${ms < 10 ? '0' : ''}${ms}`;
    }

    addScore(name, score, timeSec, rings) {
        const scores = this.getScores();
        const cleanName = (name || 'SONIC').trim().toUpperCase().substring(0, 10) || 'SONIC';
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

        scores.push(newEntry);

        // Sort: Primary by Score Descending, Secondary by Time Ascending (faster is better)
        scores.sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            return (a.timeSec || 9999) - (b.timeSec || 9999);
        });

        // Find index of the newly added entry
        const rankedIndex = scores.indexOf(newEntry);

        // Trim to top 10
        const trimmed = scores.slice(0, this.maxEntries);
        this.saveScores(trimmed);

        if (rankedIndex < this.maxEntries) {
            return rankedIndex; // 0-indexed rank in top 10
        }
        return -1; // Didn't make top 10
    }

    renderTable(containerEl, highlightIndex = -1) {
        if (!containerEl) return;
        const scores = this.getScores();

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

            const isHighlight = (idx === highlightIndex);
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

        containerEl.innerHTML = `
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

if (typeof window !== 'undefined') {
    window.LeaderboardManager = LeaderboardManager;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LeaderboardManager;
}
