# Bootstrap Setup Log

**Date:** 2025-11-27
**Project:** RSS Slack Consolidator
**Mode:** Quick Setup (Auto-detection)

## Project Overview

**Description:** An automated system that consolidates multiple RSS feeds, intelligently reviews content, and publishes relevant items to Slack channels.

**Purpose:** Automate the process of monitoring multiple RSS feeds and surfacing relevant content to team Slack channels, eliminating manual feed checking.

**Primary Users:** Team members who need curated, relevant updates from multiple RSS sources in one place (Slack).

## Auto-Detected Tech Stack

Based on project requirements analysis:

### Framework/Language
- ✅ **Python 3.11+**
  - Rationale: Best-in-class libraries for RSS parsing (feedparser) and Slack integration (slack-sdk)
  - Type: Backend service / background worker

### Database
- ✅ **SQLite**
  - Rationale: Simple, no setup required, perfect for feed history tracking and duplicate detection
  - Use case: Store feed metadata, parsed items, posting history

### Deployment Platform
- ✅ **Railway (Primary)** / Render (Alternative)
  - Rationale: Excellent Python support, built-in cron jobs, easy environment management
  - Free tier available for initial testing

### Key Libraries
- `feedparser` - RSS/Atom feed parsing
- `slack-sdk` - Slack API integration
- `APScheduler` - Periodic feed checking
- `python-dotenv` - Environment configuration

### Additional Features
- No UI framework needed (backend service)
- No AI integration (straightforward RSS processing)
- Testing: Unit tests with pytest (can add Playwright for Slack UI testing later)

## Generated Configuration

### Files Created
- ✅ `CLAUDE.md` - Main project configuration (487 lines)
- ✅ `.claude/agents/general-assistant.md` - Day-to-day development
- ✅ `.claude/agents/database-specialist.md` - SQLite operations
- ✅ `.claude/agents/deployment-specialist.md` - Railway/Render deployments
- ✅ `.claude/bootstrap/setup-log.md` - This file

### Subagent Strategy

**1. general-assistant** (Always created)
- **Purpose:** Day-to-day development tasks
- **Tools:** Read, Write, Edit, Grep, Glob, Bash
- **Model:** Sonnet
- **Use for:** Feature implementation, bug fixes, code refactoring

**2. database-specialist** (Created - SQLite selected)
- **Purpose:** Database schema, queries, migrations
- **Tools:** Read, Edit, Bash, Grep, Glob
- **Model:** Sonnet
- **Rationale:** SQLite requires careful schema design, indexing, and duplicate detection for RSS feeds

**3. deployment-specialist** (Created - Railway/Render deployment)
- **Purpose:** Git workflow, deployments, environment config
- **Tools:** Bash, Read, Edit
- **Model:** Haiku (cost-effective for operations)
- **Rationale:** Background service requires reliable deployment and monitoring

**Subagents NOT created:**
- ❌ playwright-tester - Not needed initially (backend service, can add later)
- ❌ ai-integration-specialist - No AI features required
- ❌ project-planner - Straightforward project, not complex architecture

## Database Schema Design

### feeds table
Tracks configured RSS feed sources with metadata and check status.

### feed_items table
Stores parsed feed items with duplicate detection (GUID), relevance scoring, and Slack posting status.

### Indexes
- `guid` (unique) - Fast duplicate detection
- `posted_to_slack`, `fetched_at` - Efficient unposted item queries
- `relevance_score` - Quick sorting by relevance

## Deployment Strategy

### Environment Variables
Required:
- `SLACK_BOT_TOKEN` - Bot OAuth token (xoxb-...)
- `SLACK_CHANNEL_ID` - Target channel ID

Optional:
- `DATABASE_PATH` - SQLite file location
- `CHECK_INTERVAL` - Feed check frequency (seconds)
- `LOG_LEVEL` - Logging verbosity
- `MIN_RELEVANCE_SCORE` - Posting threshold

### Deployment Flow
1. Develop and test locally
2. Push to GitHub
3. Deploy to Railway with `railway up`
4. Monitor logs and verify Slack posting

## Next Steps

### Immediate (Setup)
1. **Create project structure:**
   ```bash
   cd ~/rss-slack-consolidator
   mkdir -p src data tests logs
   touch main.py requirements.txt README.md .env.example .gitignore
   ```

2. **Install dependencies:**
   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install feedparser slack-sdk apscheduler python-dotenv
   pip freeze > requirements.txt
   ```

3. **Set up Slack Bot:**
   - Go to api.slack.com/apps
   - Create new app
   - Add bot scopes: `chat:write`, `chat:write.public`
   - Install to workspace
   - Get bot token (xoxb-...)
   - Invite bot to channel: `/invite @BotName`

4. **Create .env file:**
   ```bash
   cp .env.example .env
   # Edit .env with your tokens
   ```

### Development Phase
5. **Implement core modules:**
   - `src/database.py` - SQLite operations
   - `src/feed_parser.py` - RSS parsing
   - `src/slack_poster.py` - Slack API
   - `src/scheduler.py` - APScheduler setup
   - `src/filters.py` - Content relevance scoring
   - `main.py` - Entry point

6. **Test locally:**
   ```bash
   # Add test feed
   python cli.py add-feed "https://example.com/feed.xml"

   # Run processor
   python main.py
   ```

### Deployment Phase
7. **Deploy to Railway:**
   ```bash
   railway login
   railway init
   railway variables set SLACK_BOT_TOKEN="xoxb-..."
   railway up
   ```

8. **Verify production:**
   - Check Railway logs
   - Verify feeds are being checked
   - Confirm Slack messages appear

## Recommended MCPs

No MCP servers needed for initial setup. Consider later:
- **Supabase MCP** - If upgrading from SQLite to PostgreSQL for scaling
- **Chrome DevTools MCP** - If adding web scraping beyond RSS

## Customization Suggestions

### Short Term
- Add CLI tool for feed management (`cli.py`)
- Implement basic relevance scoring (keyword matching)
- Set up logging to file and console
- Create `.gitignore` for Python projects

### Medium Term
- Add web dashboard (Flask/FastAPI) for feed management
- Implement more sophisticated content filtering (ML-based)
- Add support for multiple Slack channels
- Create admin commands via Slack slash commands

### Long Term
- Migrate to PostgreSQL for better concurrency
- Add user preferences for content filtering
- Implement analytics on popular topics
- Create browser extension for feed discovery

## Team Collaboration

### Commit Configuration to Git
```bash
git add CLAUDE.md .claude/ README.md
git commit -m "feat: Add Claude Code configuration and project bootstrap"
git push origin main
```

When team members clone the repository, they'll automatically get:
- Project context (CLAUDE.md)
- Specialized subagents (.claude/agents/)
- Consistent development workflows

## Support Resources

- **Claude Code Docs:** https://code.claude.com/docs
- **Subagents Guide:** https://code.claude.com/docs/en/sub-agents
- **feedparser Docs:** https://feedparser.readthedocs.io/
- **Slack SDK Docs:** https://slack.dev/python-slack-sdk/
- **Railway Docs:** https://docs.railway.app/
- **Render Docs:** https://render.com/docs

---

**Setup completed successfully! 🎉**

You can now start developing your RSS-to-Slack consolidator. Use the specialized subagents for database operations and deployments, and the general-assistant for day-to-day coding tasks.
