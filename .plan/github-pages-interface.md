# Implementation Plan: GitHub Pages RSS Feed Manager

## Overview
Transform the RSS Slack Consolidator from auto-posting to a manual curation system with a GitHub Pages web interface for reviewing and publishing articles.

## Architecture Decisions
- ✅ No authentication for accessing interface (rely on URL privacy)
- ✅ Google favicon service for feed icons
- ✅ 7 days of article history
- ✅ Full feed editing via UI
- ✅ GitHub token embedded in static site code

## System Architecture

### Frontend (GitHub Pages)
**Technology Stack:**
- Vanilla HTML/CSS/JavaScript (no build step)
- Tailwind CSS via CDN
- Single-page application with client-side routing

**URL:** `https://lachlancowie.github.io/rss-slack-consolidator/`

**Pages/Tabs:**

1. **Feeds Tab**
   - Display all feeds in cards with:
     - Favicon (via `https://www.google.com/s2/favicons?domain={feed-domain}`)
     - Title, description
     - Keywords badges
     - Enabled/disabled toggle
     - Edit and Delete buttons
   - "Add New Feed" button → modal form
   - Edit feed → modal with all fields
   - Changes trigger `update-feeds.yml` workflow

2. **Articles Tab**
   - Load from `data/articles.json`
   - Display articles from last 24h by default (toggle for 7 days)
   - Each article shows:
     - Checkbox (disabled if already published)
     - Feed name with favicon
     - Title (linked)
     - Summary (truncated)
     - Published date
     - Published status badge
   - "Select All" / "Deselect All" buttons
   - "Publish Selected" button
   - On publish: trigger `publish-articles.yml` with article IDs

3. **Settings Tab**
   - Reminder time (HH:MM format, default 08:30)
   - Timezone selector (default Australia/Sydney)
   - Slack user ID input (for DMs)
   - News channel ID input
   - Message template textarea with {articles} placeholder
   - Save button → trigger `update-settings.yml`

**Files:**
```
docs/
├── index.html          # Main page with 3-tab interface
├── app.js              # All JavaScript logic
├── config.js           # GitHub token and repo config (embedded)
└── styles.css          # Custom styles (if not using Tailwind only)
```

### Backend (GitHub Actions Workflows)

#### 1. `fetch-articles.yml`
**Trigger:**
- Scheduled: `0 21 * * *` (7:00 AM AEST = 9:00 PM UTC previous day)
- Manual: workflow_dispatch

**Purpose:** Fetch all RSS articles and store for review

**Steps:**
1. Checkout repo
2. Setup Python
3. Run fetch script:
   - Parse all enabled feeds from feeds.json
   - Fetch articles published in last 7 days
   - Generate unique ID for each article
   - Store to `data/articles.json` with metadata:
     ```json
     {
       "articles": [
         {
           "id": "uuid",
           "feed_id": "feed-uuid",
           "feed_name": "Python Insider",
           "feed_url": "https://...",
           "title": "Article title",
           "link": "https://...",
           "summary": "Article summary...",
           "published": "2025-11-27T10:00:00Z",
           "fetched": "2025-11-27T07:00:00Z"
         }
       ],
       "last_updated": "2025-11-27T07:00:00Z"
     }
     ```
4. Commit and push changes

**Python Script:** `scripts/fetch_articles.py`

#### 2. `publish-articles.yml`
**Trigger:** workflow_dispatch with inputs

**Inputs:**
- `article_ids`: JSON array of article IDs to publish

**Purpose:** Publish selected articles to Slack news channel

**Steps:**
1. Checkout repo
2. Setup Python
3. Run publish script:
   - Read `article_ids` from input
   - Load articles from `data/articles.json`
   - Load message template from `data/settings.json`
   - Format all selected articles into single message:
     ```
     📰 Daily News Digest:

     • [Title 1](link1)
       From: Feed Name
       Summary...

     • [Title 2](link2)
       From: Feed Name
       Summary...
     ```
   - Post to Slack news channel
   - Mark articles as published in `data/published.json`
   - Add to history with timestamp and slack message TS
4. Commit and push changes

**Python Script:** `scripts/publish_articles.py`

#### 3. `send-reminder.yml`
**Trigger:**
- Scheduled: `30 22 * * *` (8:30 AM AEST = 10:30 PM UTC previous day)
- Note: Cron time is read from settings.json and workflow is updated dynamically

**Purpose:** Send daily reminder DM to review articles

**Steps:**
1. Checkout repo
2. Setup Python
3. Run reminder script:
   - Load settings from `data/settings.json`
   - Load unpublished articles from last 24h
   - If unpublished articles exist:
     - Send Slack DM to user with:
       - Count of pending articles
       - Link to GitHub Pages interface
       - Example: "Good morning! You have 12 new articles to review: https://lachlancowie.github.io/rss-slack-consolidator/"
   - Log reminder sent

**Python Script:** `scripts/send_reminder.py`

#### 4. `update-feeds.yml`
**Trigger:** workflow_dispatch with inputs

**Inputs:**
- `feeds_json`: Complete feeds configuration as JSON string

**Purpose:** Update feeds.json from UI changes

**Steps:**
1. Checkout repo
2. Validate JSON input
3. Write to `feeds.json`
4. Commit with message: "chore: Update feeds configuration [via UI]"
5. Push changes
6. Return success/failure status

**Python Script:** `scripts/update_feeds.py` (or bash script)

#### 5. `update-settings.yml`
**Trigger:** workflow_dispatch with inputs

**Inputs:**
- `settings_json`: Complete settings as JSON string

**Purpose:** Update settings and optionally update reminder schedule

**Steps:**
1. Checkout repo
2. Validate JSON input
3. Write to `data/settings.json`
4. If reminder_time changed:
   - Parse time and timezone
   - Calculate cron expression in UTC
   - Update `send-reminder.yml` cron schedule
5. Commit and push
6. Return success/failure status

**Python Script:** `scripts/update_settings.py`

### Data Structure

#### `feeds.json` (Updated)
```json
{
  "feeds": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Python Insider",
      "url": "https://blog.python.org/feeds/posts/default",
      "description": "Official Python blog with release announcements and community news",
      "keywords": ["release", "security", "announcement"],
      "enabled": true
    },
    {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "name": "GitHub Blog",
      "url": "https://github.blog/feed/",
      "description": "GitHub product updates, features, and engineering insights",
      "keywords": ["features", "security", "api"],
      "enabled": true
    }
  ]
}
```

#### `data/articles.json` (New)
```json
{
  "articles": [
    {
      "id": "article-uuid-1",
      "feed_id": "550e8400-e29b-41d4-a716-446655440000",
      "feed_name": "Python Insider",
      "feed_url": "https://blog.python.org",
      "title": "Python 3.12 Release Candidate",
      "link": "https://blog.python.org/2025/11/python-312-rc.html",
      "summary": "We're excited to announce the first release candidate...",
      "published": "2025-11-27T10:00:00Z",
      "fetched": "2025-11-27T07:00:00Z"
    }
  ],
  "last_updated": "2025-11-27T07:00:00Z"
}
```

#### `data/settings.json` (New)
```json
{
  "reminder_time": "08:30",
  "reminder_timezone": "Australia/Sydney",
  "slack_user_id": "U1234567890",
  "news_channel_id": "C9876543210",
  "message_template": "📰 *Daily News Digest*\n\n{articles}\n\n_Curated from {feed_count} sources_"
}
```

#### `data/published.json` (New)
```json
{
  "published_articles": [
    "article-uuid-1",
    "article-uuid-2"
  ],
  "history": [
    {
      "date": "2025-11-27",
      "article_ids": ["article-uuid-1", "article-uuid-2"],
      "article_count": 2,
      "slack_ts": "1234567890.123456",
      "published_at": "2025-11-27T09:15:00Z"
    }
  ]
}
```

## Implementation Steps

### Phase 1: Data Structure & Backend (Days 1-2)

1. **Update data structure:**
   - Add `id` and `description` fields to feeds.json
   - Create data/articles.json (empty initially)
   - Create data/settings.json with defaults
   - Create data/published.json (empty initially)

2. **Create Python scripts:**
   - `scripts/fetch_articles.py` - RSS fetching logic
   - `scripts/publish_articles.py` - Slack publishing logic
   - `scripts/send_reminder.py` - DM reminder logic
   - `scripts/update_feeds.py` - Feed config updater
   - `scripts/update_settings.py` - Settings updater
   - Add dependencies: `python-dotenv`, `slack-sdk`, `feedparser`

3. **Create GitHub Actions workflows:**
   - `.github/workflows/fetch-articles.yml`
   - `.github/workflows/publish-articles.yml`
   - `.github/workflows/send-reminder.yml`
   - `.github/workflows/update-feeds.yml`
   - `.github/workflows/update-settings.yml`

4. **Add GitHub Secrets:**
   - `SLACK_BOT_TOKEN` (existing)
   - `SLACK_USER_ID` (for DMs)
   - `SLACK_NEWS_CHANNEL_ID` (news channel)
   - `GITHUB_PAT` (for workflow triggers from UI)

### Phase 2: Frontend Development (Days 3-4)

5. **Create GitHub Pages structure:**
   - Create `docs/` folder for GitHub Pages
   - `docs/index.html` - Main page structure
   - `docs/app.js` - Application logic
   - `docs/config.js` - GitHub API configuration (token, repo)
   - `docs/styles.css` - Custom styles (optional)

6. **Implement Feeds Tab:**
   - Feed list display with cards
   - Add feed modal form
   - Edit feed modal
   - Delete confirmation
   - Enable/disable toggle
   - Favicon integration
   - Trigger update-feeds workflow on changes

7. **Implement Articles Tab:**
   - Load and display articles from JSON
   - Checkbox selection
   - Filter by date (24h / 7d)
   - Published status indication
   - Publish button with confirmation
   - Trigger publish-articles workflow with selected IDs
   - Show loading state during publish

8. **Implement Settings Tab:**
   - Form for all settings
   - Time picker for reminder
   - Timezone selector
   - Slack ID inputs
   - Message template editor
   - Save button triggers update-settings workflow

9. **Enable GitHub Pages:**
   - Settings → Pages → Source: `main` branch `/docs` folder
   - Verify deployment
   - Test URL access

### Phase 3: Integration & Testing (Day 5)

10. **Test workflows individually:**
    - Run fetch-articles manually, verify articles.json created
    - Test publish-articles with sample article IDs
    - Test send-reminder workflow
    - Test update-feeds with JSON input
    - Test update-settings with JSON input

11. **Test frontend integration:**
    - Load feeds and articles in browser
    - Test adding/editing/deleting feeds
    - Test article selection and publishing
    - Test settings updates
    - Verify GitHub API calls work with embedded token

12. **End-to-end testing:**
    - Add test feeds
    - Wait for/trigger fetch-articles
    - Review articles in UI
    - Publish selected articles to Slack
    - Verify Slack message format
    - Test reminder DM
    - Test timezone conversion for reminder

### Phase 4: Polish & Documentation (Day 6)

13. **UI/UX improvements:**
    - Loading states
    - Error handling and messages
    - Success confirmations
    - Responsive design for mobile
    - Keyboard shortcuts (optional)

14. **Update documentation:**
    - README.md with new workflow
    - Setup instructions for GitHub Pages
    - How to get Slack user ID
    - How to create GitHub PAT
    - Timezone configuration guide

15. **Cleanup:**
    - Remove old auto-posting workflow
    - Archive old main.py (or repurpose)
    - Update CLAUDE.md with new architecture

## Technical Details

### GitHub API Calls from Frontend

```javascript
// config.js (embedded token)
const config = {
  githubToken: 'ghp_xxxxxxxxxxxxxxxxxxxxx', // Fine-grained PAT
  owner: 'lachlancowie',
  repo: 'rss-slack-consolidator'
};

// app.js - Trigger workflow
async function triggerWorkflow(workflowId, inputs) {
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/actions/workflows/${workflowId}/dispatches`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.githubToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      ref: 'main',
      inputs: inputs
    })
  });

  return response.ok;
}

// Example: Publish articles
await triggerWorkflow('publish-articles.yml', {
  article_ids: JSON.stringify(['id1', 'id2', 'id3'])
});
```

### Favicon URL Generation

```javascript
function getFaviconUrl(feedUrl) {
  try {
    const domain = new URL(feedUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return 'data:image/svg+xml,...'; // Default icon SVG
  }
}
```

### Article Formatting for Slack

```python
def format_articles_for_slack(articles, template):
    """Format multiple articles into a single Slack message"""
    article_blocks = []

    for article in articles:
        block = f"• *<{article['link']}|{article['title']}>*\n"
        block += f"  _{article['feed_name']}_ • {format_date(article['published'])}\n"
        block += f"  {truncate(article['summary'], 200)}\n"
        article_blocks.append(block)

    articles_text = '\n'.join(article_blocks)
    feed_count = len(set(a['feed_id'] for a in articles))

    message = template.replace('{articles}', articles_text)
    message = message.replace('{feed_count}', str(feed_count))
    message = message.replace('{count}', str(len(articles)))

    return message
```

### Timezone Handling for Reminders

```python
from datetime import datetime
from zoneinfo import ZoneInfo

def convert_reminder_to_cron(time_str, timezone_str):
    """Convert HH:MM and timezone to UTC cron expression"""
    # Parse time (e.g., "08:30")
    hour, minute = map(int, time_str.split(':'))

    # Create datetime in target timezone
    local_tz = ZoneInfo(timezone_str)
    local_time = datetime.now(local_tz).replace(hour=hour, minute=minute)

    # Convert to UTC
    utc_time = local_time.astimezone(ZoneInfo('UTC'))

    # Return cron expression (minute hour * * *)
    return f"{utc_time.minute} {utc_time.hour} * * *"

# Example: 08:30 AEST → "30 22 * * *" (UTC)
```

## Deployment Checklist

- [ ] Create GitHub PAT with workflow and contents permissions
- [ ] Add all required GitHub Secrets
- [ ] Get Slack user ID (run `users.list` or check profile)
- [ ] Create/identify news Slack channel
- [ ] Enable GitHub Pages in repo settings
- [ ] Test fetch-articles workflow
- [ ] Test publish workflow with sample data
- [ ] Test reminder DM
- [ ] Verify GitHub Pages loads correctly
- [ ] Test all UI interactions
- [ ] Document the GitHub token setup process
- [ ] Set up initial feeds with descriptions

## Future Enhancements (Optional)

- [ ] Article preview before publishing
- [ ] Search/filter articles by keyword or feed
- [ ] Schedule publishing for later
- [ ] Article archive/history view
- [ ] Analytics dashboard (articles per feed, publish rates)
- [ ] RSS feed health monitoring
- [ ] Slack command to trigger publish from mobile
- [ ] Email fallback for reminders
- [ ] Multiple news channels with different filters
- [ ] AI-powered article summaries or relevance scoring

## Migration from Current System

1. **Preserve existing data:**
   - Backup current tracking.json
   - Keep feeds.json structure, add new fields

2. **Transition period:**
   - Disable old auto-posting workflow
   - Run new fetch workflow daily
   - Manually publish for first few days to test

3. **Cutover:**
   - Delete old workflow
   - Archive/rename old main.py
   - Update documentation

---

**Estimated Timeline:** 5-6 days for full implementation
**Complexity:** Medium-High (multiple moving parts, but well-defined)
**Risk:** Low (can test each component independently)
