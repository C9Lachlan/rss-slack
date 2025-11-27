# RSS Slack Consolidator

An automated system that consolidates multiple RSS feeds, reviews content for relevance, and publishes selected items to Slack channels.

## 🎯 Purpose

Automate monitoring of multiple RSS feeds and surface relevant content to team Slack channels, eliminating manual feed checking and ensuring important updates reach your team.

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Slack workspace with admin access
- RSS feeds you want to monitor

### Installation

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

Edit `.env`:
```bash
SLACK_BOT_TOKEN=xoxb-your-token-here
SLACK_CHANNEL_ID=C1234567890
DATABASE_PATH=./data/feeds.db
CHECK_INTERVAL=3600
MIN_RELEVANCE_SCORE=0.5
```

### Usage

```bash
# Run the consolidator
python main.py

# Add a new RSS feed (when CLI is implemented)
python cli.py add-feed "https://example.com/feed.xml"

# List tracked feeds
python cli.py list-feeds

# Test feed parsing
python cli.py test-feed "https://example.com/feed.xml"
```

## 📁 Project Structure

```
rss-slack-consolidator/
├── main.py                 # Entry point
├── requirements.txt        # Python dependencies
├── README.md              # This file
├── .env.example           # Environment variable template
├── .env                   # Your local config (git-ignored)
├── src/
│   ├── __init__.py
│   ├── feed_parser.py     # RSS parsing logic
│   ├── slack_poster.py    # Slack integration
│   ├── database.py        # SQLite operations
│   ├── scheduler.py       # Periodic job management
│   ├── filters.py         # Content relevance scoring
│   └── config.py          # Configuration management
├── data/
│   └── feeds.db           # SQLite database (auto-created)
├── tests/
│   └── test_parser.py     # Unit tests
├── logs/
│   └── app.log            # Application logs
└── .claude/
    └── agents/            # Claude Code subagents
```

## 🤖 Claude Code Integration

This project uses Claude Code with specialized subagents:

- **general-assistant** - Day-to-day development
- **database-specialist** - SQLite operations
- **deployment-specialist** - Railway/Render deployments

See [CLAUDE.md](CLAUDE.md) for full configuration.

## 🛠️ Development

### Running Tests

```bash
pytest tests/ -v
pytest tests/ --cov=src/
```

### Code Style

```bash
# Format code
black src/ tests/

# Lint
flake8 src/ tests/
```

### Adding a New Feed Source

1. Identify RSS feed URL
2. Test parsing: `python cli.py test-feed <url>`
3. Add to database: `python cli.py add-feed <url>`
4. Monitor in logs for any parsing errors

## 🚀 Deployment

### Railway (Recommended)

```bash
# Install Railway CLI
npm install -g railway

# Login and initialize
railway login
railway init

# Set environment variables
railway variables set SLACK_BOT_TOKEN="xoxb-..."
railway variables set SLACK_CHANNEL_ID="C..."

# Deploy
railway up

# Monitor
railway logs
```

### Render

1. Connect GitHub repository
2. Select "Background Worker" service type
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `python main.py`
5. Add environment variables
6. Deploy

See [CLAUDE.md](CLAUDE.md) for detailed deployment instructions.

## 📊 Database Schema

### feeds table
Tracks configured RSS feed sources
- URL, title, check frequency
- Last check timestamp, error tracking
- Active/inactive status

### feed_items table
Stores parsed feed items
- GUID (for duplicate detection)
- Title, link, description
- Relevance score
- Slack posting status

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SLACK_BOT_TOKEN` | Slack Bot OAuth Token | - | Yes |
| `SLACK_CHANNEL_ID` | Target Slack channel ID | - | Yes |
| `DATABASE_PATH` | SQLite database path | `./data/feeds.db` | No |
| `CHECK_INTERVAL` | Feed check interval (seconds) | `3600` | No |
| `LOG_LEVEL` | Logging level | `INFO` | No |
| `MIN_RELEVANCE_SCORE` | Minimum score to post | `0.5` | No |
| `MAX_POSTS_PER_RUN` | Max items per cycle | `10` | No |

## 🎨 Customization

### Content Filtering

Edit `src/filters.py` to customize relevance scoring:
- Keyword matching
- Source credibility
- Recency weighting
- Custom scoring logic

### Slack Message Format

Edit `src/slack_poster.py` to customize message appearance:
- Use Slack Block Kit for rich formatting
- Add custom buttons and actions
- Include threading for conversations

## 📈 Monitoring

### Check Logs

```bash
# Application logs
tail -f logs/app.log

# Production logs (Railway)
railway logs --tail 100

# Production logs (Render)
render logs <service-name>
```

### Database Inspection

```bash
# Open database
sqlite3 data/feeds.db

# Check feed status
SELECT * FROM feeds;

# Check unposted items
SELECT COUNT(*) FROM feed_items WHERE posted_to_slack = 0;
```

## 🐛 Troubleshooting

### Feeds Not Updating
- Check `last_checked` timestamp in `feeds` table
- Verify `CHECK_INTERVAL` setting
- Look for errors in logs

### Slack Posts Not Appearing
- Verify bot is invited to channel
- Check `SLACK_CHANNEL_ID` is correct
- Confirm bot has `chat:write` permission
- Check Slack API rate limits

### Database Errors
- Ensure `data/` directory exists
- Check file permissions
- Verify SQLite version compatibility

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

---

Built with Claude Code 🤖
