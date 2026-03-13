const fs = require('fs');
const path = require('path');

async function fetchContributors() {
  const repo = 'Mr-S-U-D-O/javascriptProjectBasedLearning';
  const token = process.env.GITHUB_TOKEN;
  const headers = token ? { 'Authorization': `token ${token}` } : {};

  console.log(`Starting contributor fetch for ${repo}...`);

  try {
    // 1. Fetch contributors
    const contributorsRes = await fetch(`https://api.github.com/repos/${repo}/contributors`, { headers });
    if (!contributorsRes.ok) throw new Error(`Failed to fetch contributors: ${contributorsRes.statusText}`);
    const contributors = await contributorsRes.json();

    // 2. Fetch today's commits
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRes = await fetch(`https://api.github.com/repos/${repo}/commits?since=${today.toISOString()}`, { headers });
    const todaysCommits = todayRes.ok ? await todayRes.json() : [];

    // 3. Fetch week's commits
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const weekRes = await fetch(`https://api.github.com/repos/${repo}/commits?since=${weekAgo.toISOString()}&per_page=100`, { headers });
    const weekCommits = weekRes.ok ? await weekRes.json() : [];

    // Tally commits
    const todayTally = {};
    todaysCommits.forEach(c => {
      const login = c.author?.login || 'Unknown';
      todayTally[login] = (todayTally[login] || 0) + 1;
    });

    const weekTally = {};
    weekCommits.forEach(c => {
      const login = c.author?.login || 'Unknown';
      weekTally[login] = (weekTally[login] || 0) + 1;
    });

    // Map to detailed structure (No individual profile fetches needed for now to be safe)
    const detailed = contributors.map(c => ({
      ...c,
      details: { name: c.login, bio: null, public_repos: 0, followers: 0, created_at: null },
      todayCommits: todayTally[c.login] || 0,
      weekCommits: weekTally[c.login] || 0
    }));

    const totalCommits = detailed.reduce((s, c) => s + c.contributions, 0);

    const result = {
      timestamp: Date.now(),
      data: { detailed, totalCommits }
    };

    const outputPath = path.join(__dirname, '../hub/contributors-backup.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`Successfully saved contributor data to ${outputPath}`);

  } catch (error) {
    console.error('Error in fetch-contributors script:', error);
    process.exit(1);
  }
}

fetchContributors();
