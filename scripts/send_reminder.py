#!/usr/bin/env python3
"""
Send daily reminder DM to review unpublished articles.
Runs daily via GitHub Actions at configured time.
"""

import json
import logging
import os
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)


def load_articles():
    """Load all articles"""
    articles_path = Path("data/articles.json")
    if not articles_path.exists():
        return []

    with open(articles_path, 'r') as f:
        data = json.load(f)
    return data.get('articles', [])


def load_settings():
    """Load settings"""
    settings_path = Path("data/settings.json")
    with open(settings_path, 'r') as f:
        return json.load(f)


def load_published():
    """Load published articles"""
    published_path = Path("data/published.json")
    if not published_path.exists():
        return set()

    with open(published_path, 'r') as f:
        data = json.load(f)
    return set(data.get('published_articles', []))


def get_unpublished_articles(articles, published_ids):
    """Get unpublished articles from last 24 hours"""
    cutoff = datetime.now(timezone.utc) - timedelta(days=1)
    unpublished = []

    for article in articles:
        # Skip if already published
        if article['id'] in published_ids:
            continue

        # Check if published in last 24 hours
        try:
            published_date = datetime.fromisoformat(article['published'].replace('Z', '+00:00'))
            if published_date >= cutoff:
                unpublished.append(article)
        except (ValueError, KeyError):
            continue

    return unpublished


def send_reminder_dm(user_id, article_count, pages_url):
    """Send reminder DM to user"""
    slack_token = os.getenv("SLACK_BOT_TOKEN")
    if not slack_token:
        logger.error("SLACK_BOT_TOKEN not found in environment")
        sys.exit(1)

    try:
        client = WebClient(token=slack_token)

        # Format message
        greeting = "Good morning!"
        if article_count == 0:
            message = f"{greeting} No new articles to review today."
        elif article_count == 1:
            message = f"{greeting} You have 1 new article to review."
        else:
            message = f"{greeting} You have {article_count} new articles to review."

        # Send DM
        response = client.chat_postMessage(
            channel=user_id,
            text=message,
            blocks=[
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"*{message}*"
                    }
                },
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": f"Review and publish articles from your RSS feeds:"
                    }
                },
                {
                    "type": "actions",
                    "elements": [
                        {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "Review Articles"
                            },
                            "url": pages_url,
                            "style": "primary"
                        }
                    ]
                }
            ]
        )

        logger.info(f"✅ Sent reminder DM to user {user_id}")
        return True

    except SlackApiError as e:
        logger.error(f"Slack API error: {e.response['error']}")
        return False


def main():
    """Main execution"""
    logger.info("🚀 Checking for unpublished articles...")

    # Load data
    articles = load_articles()
    settings = load_settings()
    published_ids = load_published()

    # Get user ID
    user_id = settings.get('slack_user_id') or os.getenv("SLACK_USER_ID")
    if not user_id:
        logger.error("slack_user_id not configured in settings")
        sys.exit(1)

    # Get GitHub Pages URL
    pages_url = settings.get('github_pages_url', 'https://lachlancowie.github.io/rss-slack-consolidator/')

    # Find unpublished articles from last 24 hours
    unpublished = get_unpublished_articles(articles, published_ids)
    logger.info(f"Found {len(unpublished)} unpublished articles from last 24 hours")

    # Send reminder DM
    send_reminder_dm(user_id, len(unpublished), pages_url)

    logger.info("✅ Complete!")


if __name__ == "__main__":
    main()
