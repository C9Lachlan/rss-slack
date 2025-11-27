# RSS Slack Consolidator

An automated system that consolidates multiple RSS feeds, reviews content for relevance, and publishes selected items to Slack channels. **Runs entirely on GitHub Actions** - zero infrastructure, zero cost!

## 🎯 Purpose

Automate monitoring of multiple RSS feeds and surface relevant content to team Slack channels, eliminating manual feed checking and ensuring important updates reach your team. Powered by GitHub Actions for hands-free, scheduled execution.

## 🚀 Quick Start

### Prerequisites

- GitHub account (with Actions enabled)
- Slack workspace with admin access
- RSS feeds you want to monitor
- Python 3.11+ (for local testing only)

### Installation

**1. Fork or clone this repository**

**2. Set up Slack Bot** (see section below)

**3. Configure GitHub Secrets:**
   - Go to: **Settings → Secrets and variables → Actions**
   - Add two secrets:
     - `SLACK_BOT_TOKEN` - Your bot token (starts with `xoxb-`)
     - `SLACK_CHANNEL_ID` - Your channel ID (e.g., `C1234567890`)

**4. Configure RSS feeds:**
   - Edit `feeds.json`
   - Add/modify feeds and keywords
   - Commit and push

**5. Done!** GitHub Actions will run hourly and post to Slack.

### Local Testing (Optional)

```bash
# Clone repository
git clone <your-repo-url>
cd rss-slack-consolidator

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your Slack tokens

# Run once
python main.py
```

### Slack Bot Setup

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name your app (e.g., "RSS Consolidator")
4. Add Bot Token Scopes:
   - `chat:write` - Post messages
   - `chat:write.public` - Post to public channels
5. Install app to workspace
6. Copy "Bot User OAuth Token" (starts with `xoxb-`)
7. Get channel ID:
   - Open Slack channel
   - Click channel name → Copy link
   - Extract ID from URL: `C1234567890`
8. Invite bot to channel: `/invite @BotName`

### Configuration

**feeds.json** - Configure RSS feeds and settings:
```json
{
  "feeds": [
    {
      "name": "Python Insider",
      "url": "https://blog.python.org/feeds/posts/default",
      "enabled": true,
      "keywords": ["release", "security"]
    }
  ],
  "settings": {
    "min_relevance_score": 0.5,
    "max_posts_per_run": 10
  }
}
```

**GitHub Secrets** (Settings → Secrets → Actions):
- `SLACK_BOT_TOKEN` - Slack bot token
- `SLACK_CHANNEL_ID` - Target Slack channel

### Usage

**Automated (GitHub Actions):**
- Runs every hour automatically
- View logs: **Actions** tab → **RSS to Slack**
- Manual trigger: **Actions** → **Run workflow**

**Local testing:**
```bash
# Test locally before pushing
python main.py

# Check what was tracked
cat data/tracking.json
```

**Managing feeds:**
```bash
# Add new feed
# Edit feeds.json, add entry, then:
git add feeds.json
git commit -m "feat: Add new RSS feed"
git push
```

## 📁 Project Structure

```
rss-slack-consolidator/
├── main.py                      # Complete implementation (~200 lines)
├── feeds.json                   # RSS feed configuration
├── requirements.txt             # Python dependencies
├── README.md                    # This file
├── .env.example                 # Local testing env vars
├── .github/
│   └── workflows/
│       └── rss-slack.yml        # GitHub Actions workflow (hourly cron)
├── data/
│   └── tracking.json            # Posted items (auto-updated by Actions)
└── .claude/
    └── agents/                  # Claude Code subagents
```

**Why single-file architecture:**
- ✅ Easy to understand and modify
- ✅ No complex module dependencies
- ✅ Perfect for GitHub Actions execution
- ✅ All logic in one place (~200 lines)

## 🤖 Claude Code Integration

This project uses Claude Code with specialized subagents:

- **general-assistant** - Day-to-day development
- **deployment-specialist** - GitHub Actions workflows

See [CLAUDE.md](CLAUDE.md) for full configuration.

## 🛠️ Development

### Adding a New Feed

1. Edit `feeds.json`
2. Add feed entry with URL and optional keywords
3. Test locally: `python main.py`
4. Commit and push: GitHub Actions handles the rest

**Example feed entry:**
```json
{
  "name": "Django News",
  "url": "https://django-news.com/issues.rss",
  "enabled": true,
  "keywords": ["release", "security", "tutorial"]
}
```

### Testing Changes

```bash
# Test locally first
python main.py

# Check tracking works
cat data/tracking.json

# Push to test in Actions
git commit -m "test: Try new feed"
git push

# View workflow logs
gh run watch
# Or check Actions tab in GitHub
```

## 🚀 Deployment

**No deployment needed!** Everything runs on GitHub Actions automatically.

### How it works:

1. **GitHub Actions workflow** (`.github/workflows/rss-slack.yml`):
   - Runs on cron schedule (default: hourly)
   - Checks out your code
   - Installs dependencies
   - Runs `main.py`
   - Commits updated `tracking.json`

2. **Secrets** stored in GitHub (Settings → Secrets)
3. **Tracking data** committed back to repo
4. **Zero infrastructure** - no servers, no containers, no bills

### Customizing schedule:

Edit `.github/workflows/rss-slack.yml`:
```yaml
schedule:
  - cron: '0 */2 * * *'  # Every 2 hours
  - cron: '*/30 * * * *' # Every 30 minutes
```

### Monitoring:

- **GitHub Actions tab** - View all runs
- **Workflow logs** - See what was posted
- **tracking.json** - Git history shows all activity

## 📊 Data Storage

**No database needed!** Uses simple JSON files:

### feeds.json
```json
{
  "feeds": [...],
  "settings": {
    "min_relevance_score": 0.5,
    "max_posts_per_run": 10
  }
}
```

### data/tracking.json (auto-managed)
```json
{
  "posted_items": ["item-guid-1", "item-guid-2"],
  "last_check": "2025-11-27T10:00:00+00:00",
  "stats": {
    "total_items_posted": 42,
    "last_run_posted": 3
  }
}
```

**Benefits:**
- ✅ Human-readable
- ✅ Git history = audit trail
- ✅ No database setup
- ✅ Easy to debug

## 🔧 Configuration

### GitHub Secrets (Required)

Set these in **Settings → Secrets and variables → Actions**:

| Secret | Description | Example |
|--------|-------------|---------|
| `SLACK_BOT_TOKEN` | Slack Bot OAuth Token | `xoxb-123...` |
| `SLACK_CHANNEL_ID` | Target Slack channel ID | `C1234567890` |

### feeds.json Settings

| Setting | Description | Default |
|---------|-------------|---------|
| `min_relevance_score` | Minimum score to post (0.0-1.0) | `0.5` |
| `max_posts_per_run` | Max items per run | `10` |
| `hours_lookback` | How far back to check | `24` |

### Per-feed Configuration

| Field | Description | Required |
|-------|-------------|----------|
| `name` | Human-readable feed name | Yes |
| `url` | RSS feed URL | Yes |
| `enabled` | Whether to check this feed | Yes |
| `keywords` | Keywords for relevance scoring | No (empty = post all) |

## 🎨 Customization

### Content Filtering

The `calculate_relevance()` function in `main.py` (line 64) scores items:
- Keyword matching (configurable in feeds.json)
- Simple scoring: matches / total keywords
- Easy to extend with custom logic

**Example enhancement:**
```python
def calculate_relevance(entry, feed_config):
    # Add date weighting, source reputation, etc.
    score = keyword_score * 0.7 + recency_score * 0.3
    return score
```

### Slack Message Format

The `post_to_slack()` function (line 83) formats messages:
- Currently uses simple markdown
- Easily extend to Slack Block Kit
- Add buttons, images, reactions

**Example rich format:**
```python
blocks=[{
    "type": "section",
    "text": {"type": "mrkdwn", "text": f"*{title}*\n{summary}"},
    "accessory": {
        "type": "button",
        "text": {"type": "plain_text", "text": "Read"},
        "url": link
    }
}]
```

## 📈 Monitoring

### GitHub Actions

**View runs:**
- Go to **Actions** tab in GitHub
- Click **RSS to Slack** workflow
- See all runs with timestamps and status

**View logs:**
```bash
# Using GitHub CLI
gh run list --workflow=rss-slack.yml
gh run view --log

# Or in browser: Actions tab → Click run → View logs
```

### Tracking Data

```bash
# View what's been posted
cat data/tracking.json

# Check git history to see posting activity
git log --oneline data/tracking.json

# See stats
cat data/tracking.json | jq '.stats'
```

## 🐛 Troubleshooting

### Workflow Not Running
- **Check Actions enabled:** Settings → Actions → Allow all actions
- **Check cron schedule:** Verify syntax in `.github/workflows/rss-slack.yml`
- **Note:** GitHub cron can delay up to 10 minutes

### No Posts to Slack
- **Check secrets:** Settings → Secrets → Verify `SLACK_BOT_TOKEN` and `SLACK_CHANNEL_ID`
- **Invite bot:** Run `/invite @YourBot` in Slack channel
- **Check bot permissions:** Needs `chat:write` and `chat:write.public`
- **View logs:** Actions tab → Click run → Check error messages

### Duplicate Posts
- **Check tracking.json commits:** Ensure workflow is committing changes
- **Verify workflow permissions:** Actions need write access to repo
- **Check git config:** Workflow should commit as github-actions[bot]

### Items Not Posting
- **Relevance score too high:** Lower `min_relevance_score` in feeds.json
- **No keyword matches:** Remove or adjust keywords
- **Max posts reached:** Increase `max_posts_per_run`
- **Already posted:** Item GUID exists in tracking.json

### Testing Issues
```bash
# Test locally first
python main.py

# Check for errors
echo $?  # Should be 0

# Verify tracking updates
cat data/tracking.json
```

## 📝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m "feat: Add new feature"`
4. Push branch: `git push origin feature/new-feature`
5. Submit pull request

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- [feedparser](https://feedparser.readthedocs.io/) - RSS parsing
- [Slack SDK](https://slack.dev/python-slack-sdk/) - Slack integration
- [APScheduler](https://apscheduler.readthedocs.io/) - Task scheduling

## 📞 Support

For issues and questions:
- Check [CLAUDE.md](CLAUDE.md) for Claude Code usage
- Review logs for error details
- Open GitHub issue with details

## 💰 Cost & Limits

**GitHub Actions Free Tier:**
- ✅ 2,000 minutes/month (public repos: unlimited)
- ✅ ~3 minutes per run = ~650 runs/month
- ✅ Hourly schedule = ~720 runs/month
- ✅ **Conclusion: Plenty for this use case!**

**Scaling considerations:**
- Each run takes 1-3 minutes (install deps, check feeds, post)
- Hourly checks use ~50-90 minutes/month
- Can run every 30 mins and still stay under limit

## 🌟 Why GitHub Actions?

**vs. Traditional deployment (Railway/Render/EC2):**
- ❌ ~$5-20/month → ✅ $0/month
- ❌ Server management → ✅ Zero infrastructure
- ❌ Docker/containers → ✅ Simple Python script
- ❌ Complex deployments → ✅ Git push = deployed
- ❌ Separate monitoring → ✅ Built-in logs

**Perfect for:**
- ✅ Scheduled tasks (cron jobs)
- ✅ Simple automation
- ✅ RSS/feed processing
- ✅ Periodic API calls
- ✅ Notification bots

**Not ideal for:**
- ❌ Real-time processing
- ❌ High-frequency tasks (< every 5 min)
- ❌ Long-running processes (> 6 hours)
- ❌ Stateful applications

---

**Built with Claude Code** 🤖
**Powered by GitHub Actions** ⚡
**Zero infrastructure, zero cost!** 💰
