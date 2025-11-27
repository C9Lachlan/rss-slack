// GitHub Configuration
// This should match your GitHub repository details
export const CONFIG = {
  owner: 'C9Lachlan',
  repo: 'rss-slack',
  branch: 'main',
  // Base URL for raw content from GitHub
  getRawUrl: (path) => `https://raw.githubusercontent.com/${CONFIG.owner}/${CONFIG.repo}/${CONFIG.branch}/${path}`,
};
