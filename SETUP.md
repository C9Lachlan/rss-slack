# RSS Feed Manager - Setup Guide

## What's Been Built

You now have a complete GitHub Pages interface for managing RSS feeds and publishing articles to Slack. Here's what's included:

### ✅ Backend (GitHub Actions Workflows)
- **fetch-articles.yml** - Runs daily at 7 AM AEST to fetch new articles
- **publish-articles.yml** - Publishes selected articles to Slack (triggered from UI)
- **send-reminder.yml** - Sends daily DM reminder at 8:30 AM AEST
- **update-feeds.yml** - Updates feed configuration from UI
- **update-settings.yml** - Updates settings and reminder schedule from UI

### ✅ Frontend (GitHub Pages)
- **Feeds Tab** - Manage RSS feeds (add, edit, delete, enable/disable)
- **Articles Tab** - Review and select articles to publish
- **Settings Tab** - Configure reminder time, Slack channels, message template

### ✅ Data Structure
- Updated feeds.json with IDs and descriptions
- Created data files for articles, settings, and published tracking

## Setup Steps

### 1. Create GitHub Personal Access Token

You need a fine-grained Personal Access Token (PAT) with specific permissions:

1. Go to https://github.com/settings/tokens?type=beta
2. Click "Generate new token"
3. Configure:
   - **Token name**: `RSS Feed Manager`
   - **Repository access**: Only select repositories → `rss-slack-consolidator`
   - **Permissions**:
     - **Contents**: Read and write
     - **Workflows**: Read and write
4. Click "Generate token"
5. **Copy the token** (you won't see it again!)

### 2. Configure GitHub Pages

1. Go to your repository → Settings → Pages
2. Under "Source", select:
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/docs`
3. Click "Save"
4. Wait a few minutes for deployment
5. Your site will be at: `https://lachlancowie.github.io/rss-slack-consolidator/`

### 3. Add GitHub Token to Frontend

1. Edit `docs/config.js`
2. Replace `YOUR_GITHUB_TOKEN` with your actual token:
   ```javascript
   const CONFIG = {
       owner: 'lachlancowie',
       repo: 'rss-slack-consolidator',
       githubToken: 'ghp_your_actual_token_here'
   };
   ```
3. Commit and push this change

### 4. Add GitHub Secrets

Add these secrets to your repository (Settings → Secrets and variables → Actions → New repository secret):

| Secret Name | Description | How to Get |
|-------------|-------------|------------|
| `SLACK_BOT_TOKEN` | Your Slack bot token | Starts with `xoxb-`, from your Slack app |
| `SLACK_USER_ID` | Your Slack user ID for DMs | From your Slack profile (e.g., `U1234567890`) |
| `SLACK_NEWS_CHANNEL_ID` | Channel for published articles | From Slack channel details (e.g., `C9876543210`) |

#### Getting Slack User ID:
1. In Slack, click your profile picture → Profile
2. Click "More" (three dots) → "Copy member ID"

#### Getting Slack Channel ID:
1. Right-click the channel name → View channel details
2. Scroll to bottom → Copy the channel ID

### 5. Test the Workflows

1. Go to Actions tab in GitHub
2. Run each workflow manually to test:
   - **Fetch Articles** - Should create/update `data/articles.json`
   - **Send Reminder** - Should send you a DM
   - **Update Feeds** - Test from the UI by adding a feed
   - **Publish Articles** - Test from the UI after fetching articles

### 6. Update Settings in UI

1. Visit your GitHub Pages URL
2. Go to Settings tab
3. Fill in:
   - Slack User ID
   - News Channel ID
   - Adjust reminder time if needed
   - Customize message template
4. Click "Save Settings"

## Daily Workflow

Once set up, your daily workflow will be:

1. **7:00 AM AEST** - GitHub Actions fetches new articles automatically
2. **8:30 AM AEST** - You receive a Slack DM with a link to review articles
3. **You review** - Open the GitHub Pages interface
4. **Select & Publish** - Check the articles you want to publish, click "Publish Selected"
5. **Articles posted** - All selected articles appear in one Slack message in your news channel

## File Structure

```
rss-slack-consolidator/
├── docs/                          # GitHub Pages site
│   ├── index.html                 # Main interface
│   ├── app.js                     # Application logic
│   └── config.js                  # GitHub configuration (with token)
├── scripts/                       # Python scripts
│   ├── fetch_articles.py          # Fetch RSS feeds
│   ├── publish_articles.py        # Publish to Slack
│   ├── send_reminder.py           # Send DM reminder
│   ├── update_feeds.py            # Update feed config
│   └── update_settings.py         # Update settings
├── .github/workflows/             # GitHub Actions
│   ├── fetch-articles.yml
│   ├── publish-articles.yml
│   ├── send-reminder.yml
│   ├── update-feeds.yml
│   └── update-settings.yml
├── data/                          # Data files (auto-updated)
│   ├── articles.json              # Fetched articles
│   ├── settings.json              # User settings
│   └── published.json             # Published tracking
└── feeds.json                     # RSS feed configuration
```

## Troubleshooting

### GitHub Pages shows 404
- Wait 5-10 minutes after enabling Pages
- Verify `/docs` folder exists with index.html
- Check deployment in Actions → pages-build-deployment

### "Error loading data" in UI
- Check that articles.json, settings.json, published.json exist
- Run fetch-articles workflow manually
- Verify files are committed to main branch

### Workflows failing
- Check GitHub Secrets are set correctly
- Verify Slack token has correct permissions
- Check workflow logs in Actions tab

### Token errors in UI
- Verify token in config.js is correct
- Check token hasn't expired
- Verify token permissions include Contents and Workflows

### Articles not publishing to Slack
- Verify SLACK_NEWS_CHANNEL_ID secret is set
- Ensure bot is invited to the channel: `/invite @YourBot`
- Check publish-articles workflow logs

## Next Steps

1. ✅ Complete setup steps above
2. ✅ Add your favorite RSS feeds via the UI
3. ✅ Run fetch-articles manually to get initial articles
4. ✅ Test publishing a few articles to Slack
5. ✅ Customize the message template to your liking
6. ✅ Set your preferred reminder time

## Security Notes

- The GitHub token in `config.js` is visible in your repository
- Since you chose "no authentication", anyone with the URL can access the interface
- For personal use on a private repository, this is acceptable
- If you make the repository public, consider using a different authentication method

---

**Need help?** Check the workflow logs in the Actions tab or review the implementation plan in `.plan/github-pages-interface.md`
