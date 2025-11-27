#!/usr/bin/env python3
"""
Publish selected articles to Slack.
Triggered via GitHub Actions workflow_dispatch from the UI.
"""

import json
import logging
import os
import sys
from datetime import datetime, timezone
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
    with open(articles_path, 'r') as f:
        data = json.load(f)
    return {article['id']: article for article in data['articles']}


def load_settings():
    """Load settings"""
    settings_path = Path("data/settings.json")
    with open(settings_path, 'r') as f:
        return json.load(f)


def load_published():
    """Load published articles tracking"""
    published_path = Path("data/published.json")
    with open(published_path, 'r') as f:
        return json.load(f)


def save_published(data):
    """Save published articles tracking"""
    published_path = Path("data/published.json")
    with open(published_path, 'w') as f:
        json.dump(data, f, indent=2)


def format_date(iso_date):
    """Format ISO date to readable format"""
    try:
        dt = datetime.fromisoformat(iso_date.replace('Z', '+00:00'))
        return dt.strftime('%b %d, %Y')
    except:
        return iso_date


def truncate(text, max_length):
    """Truncate text to max length"""
    if len(text) <= max_length:
        return text
    return text[:max_length-3] + '...'


def format_articles_for_slack(articles, template):
    """Format multiple articles into a single Slack message"""
    article_blocks = []

    for article in articles:
        # Format each article
        block = f"• *<{article['link']}|{article['title']}>*\n"
        block += f"  _{article['feed_name']}_ • {format_date(article['published'])}\n"

        if article['summary']:
            summary = truncate(article['summary'].strip(), 200)
            block += f"  {summary}\n"

        article_blocks.append(block)

    articles_text = '\n'.join(article_blocks)
    feed_count = len(set(a['feed_id'] for a in articles))

    # Replace template placeholders
    message = template.replace('{articles}', articles_text)
    message = message.replace('{feed_count}', str(feed_count))
    message = message.replace('{count}', str(len(articles)))

    return message


def publish_to_slack(articles, settings):
    """Publish articles to Slack"""
    slack_token = os.getenv("SLACK_BOT_TOKEN")
    if not slack_token:
        logger.error("SLACK_BOT_TOKEN not found in environment")
        sys.exit(1)

    channel_id = settings.get('news_channel_id') or os.getenv("SLACK_NEWS_CHANNEL_ID")
    if not channel_id:
        logger.error("news_channel_id not configured")
        sys.exit(1)

    # Format message
    template = settings.get('message_template', '{articles}')
    message = format_articles_for_slack(articles, template)

    # Post to Slack
    try:
        client = WebClient(token=slack_token)
        response = client.chat_postMessage(
            channel=channel_id,
            text=f"Daily News Digest - {len(articles)} articles",
            blocks=[
                {
                    "type": "section",
                    "text": {
                        "type": "mrkdwn",
                        "text": message
                    }
                }
            ],
            unfurl_links=False,
            unfurl_media=False
        )

        logger.info(f"✅ Published {len(articles)} articles to Slack")
        return response['ts']  # Return message timestamp

    except SlackApiError as e:
        logger.error(f"Slack API error: {e.response['error']}")
        sys.exit(1)


def main():
    """Main execution"""
    # Get article IDs from command line argument
    if len(sys.argv) < 2:
        logger.error("Usage: python publish_articles.py '<article_ids_json>'")
        sys.exit(1)

    try:
        article_ids = json.loads(sys.argv[1])
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON for article IDs: {e}")
        sys.exit(1)

    logger.info(f"🚀 Publishing {len(article_ids)} articles...")

    # Load data
    all_articles = load_articles()
    settings = load_settings()
    published_data = load_published()

    # Get articles to publish
    articles_to_publish = []
    for article_id in article_ids:
        if article_id in all_articles:
            articles_to_publish.append(all_articles[article_id])
        else:
            logger.warning(f"Article ID not found: {article_id}")

    if not articles_to_publish:
        logger.error("No valid articles to publish")
        sys.exit(1)

    # Sort by published date
    articles_to_publish.sort(key=lambda x: x['published'], reverse=True)

    # Publish to Slack
    slack_ts = publish_to_slack(articles_to_publish, settings)

    # Update published tracking
    published_data['published_articles'].extend(article_ids)
    published_data['published_articles'] = list(set(published_data['published_articles']))  # Remove duplicates

    published_data['history'].append({
        'date': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
        'article_ids': article_ids,
        'article_count': len(article_ids),
        'slack_ts': slack_ts,
        'published_at': datetime.now(timezone.utc).isoformat()
    })

    # Keep only last 30 days of history
    published_data['history'] = published_data['history'][-30:]

    save_published(published_data)

    logger.info(f"✅ Complete! Published {len(article_ids)} articles")


if __name__ == "__main__":
    main()
