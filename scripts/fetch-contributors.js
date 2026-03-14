const fs = require('fs');
const path = require('path');
const https = require('https');

function get(url, token) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Node.js Script',
        ...(token ? { 'Authorization': `token ${token}` } : {})
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Status ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

async function fetchContributors() {
  const repo = 'Mr-S-U-D-O/javascriptProjectBasedLearning';
  const token = process.env.GITHUB_TOKEN;

  console.log(`Starting contributor fetch for ${repo}...`);

  try {
    // 1. Fetch contributors
    const contributors = await get(`https://api.github.com/repos/${repo}/contributors`, token);

    // 2. Fetch today's commits
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysCommits = await get(`https://api.github.com/repos/${repo}/commits?since=${today.toISOString()}`, token).catch(() => []);

    // 3. Fetch week's commits
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const weekCommits = await get(`https://api.github.com/repos/${repo}/commits?since=${weekAgo.toISOString()}&per_page=100`, token).catch(() => []);

    // Tally commits
    const todayTally = {};
    if (Array.isArray(todaysCommits)) {
      todaysCommits.forEach(c => {
        const login = c.author?.login || 'Unknown';
        todayTally[login] = (todayTally[login] || 0) + 1;
      });
    }

    const weekTally = {};
    if (Array.isArray(weekCommits)) {
      weekCommits.forEach(c => {
        const login = c.author?.login || 'Unknown';
        weekTally[login] = (weekTally[login] || 0) + 1;
      });
    }

    // AI Heuristic: Assign titles based on contribution patterns
    const getAiTitle = (contribs, weekly) => {
      if (weekly >= 10) return "🔥 HYPER-ACTIVE";
      if (contribs >= 50) return "🏛️ LEGACY ARCHITECT";
      if (contribs >= 20) return "🛠️ CORE BUILDER";
      if (weekly > 0) return "⚡ VELOCITY EXPERT";
      return "🌱 GROWING DEVELOPER";
    };

    const detailed = contributors.map(c => {
      const todayCount = todayTally[c.login] || 0;
      const weeklyCount = weekTally[c.login] || 0;
      return {
        ...c,
        details: { name: c.login, bio: null, public_repos: 0, followers: 0, created_at: null },
        ai_title: getAiTitle(c.contributions, weeklyCount),
        todayCommits: todayCount,
        weekCommits: weeklyCount
      };
    });

    const totalCommits = detailed.reduce((s, c) => s + c.contributions, 0);

    // AI Insight Generator
    const topContributor = detailed[0]?.login || 'Anonymous';
    const weekCountSum = detailed.reduce((s, c) => s + c.weekCommits, 0);
    const aiInsight = `S.U.D.O AI ANALYTICS: This week saw ${weekCountSum} commits. @${topContributor} is currently leading the league with high velocity. System status optimal.`;

    const result = {
      timestamp: Date.now(),
      ai_insight: aiInsight,
      data: { detailed, totalCommits }
    };

    const outputPath = path.join(__dirname, '../hub/contributors-backup.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`Successfully saved contributor data to ${outputPath}`);

  } catch (error) {
    console.error('Error in fetch-contributors script:', error.message);
    process.exit(1);
  }
}

fetchContributors();
