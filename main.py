#!/usr/bin/env python3
"""
RSS Slack Consolidator - GitHub Actions Runner

Single-run script that checks RSS feeds and posts new items to Slack.
Designed to run periodically via GitHub Actions.
"""

import json
import logging
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import feedparser
from dotenv import load_dotenv
from slack_sdk import WebClient
from slack_sdk.errors import SlackApiError

# Load environment variables
load_dotenv()

# Setup logging
logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO")),
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)


def load_feeds_config():
    """Load RSS feeds configuration from feeds.json"""
    config_path = Path("feeds.json")
    if not config_path.exists():
        logger.error("feeds.json not found!")
        sys.exit(1)

    with open(config_path, 'r') as f:
        return json.load(f)


def load_tracking():
    """Load tracking data for posted items"""
    tracking_path = Path("data/tracking.json")
    if not tracking_path.exists():
        return {"posted_items": [], "last_check": None, "stats": {"total_items_posted": 0}}

    with open(tracking_path, 'r') as f:
        return json.load(f)


def save_tracking(tracking_data):
    """Save tracking data"""
    tracking_path = Path("data/tracking.json")
    tracking_path.parent.mkdir(exist_ok=True)

    with open(tracking_path, 'w') as f:
        json.dump(tracking_data, f, indent=2)


def calculate_relevance(entry, feed_config):
    """
    Simple relevance scoring based on keywords.
    Returns score between 0.0 and 1.0
    """
    keywords = feed_config.get('keywords', [])
    if not keywords:
        return 1.0  # No keywords = always relevant

    title = entry.get('title', '').lower()
    summary = entry.get('summary', '').lower()
    content = f"{title} {summary}"

    matches = sum(1 for keyword in keywords if keyword.lower() in content)
    score = matches / len(keywords) if keywords else 1.0

    return min(score, 1.0)


def post_to_slack(client, channel_id, entry, feed_name):
    """Post an RSS item to Slack"""
    try:
        title = entry.get('title', 'No title')
        link = entry.get('link', '')
        summary = entry.get('summary', entry.get('description', ''))[:300]

        # Clean up summary
        if summary:
            summary = summary.replace('<p>', '').replace('</p>', '\n')
            summary = summary[:300] + '...' if len(summary) > 300 else summary

        message = f"*{title}*\n\n{summary}\n\n<{link}|Read more> • Source: {feed_name}"

        client.chat_postMessage(
            channel=channel_id,
            text=message,
            unfurl_links=False,
            unfurl_media=False
        )

        logger.info(f"Posted: {title}")
        return True

    except SlackApiError as e:
        logger.error(f"Slack API error: {e.response['error']}")
        return False


def main():
    """Main execution"""
    logger.info("🚀 RSS Slack Consolidator starting...")

    # Check environment
    slack_token = os.getenv("SLACK_BOT_TOKEN")
    channel_id = os.getenv("SLACK_CHANNEL_ID")

    if not slack_token or not channel_id:
        logger.error("Missing SLACK_BOT_TOKEN or SLACK_CHANNEL_ID environment variables")
        sys.exit(1)

    # Initialize Slack client
    slack_client = WebClient(token=slack_token)

    # Load configuration and tracking
    config = load_feeds_config()
    tracking = load_tracking()
    posted_guids = set(tracking.get('posted_items', []))

    settings = config.get('settings', {})
    min_score = settings.get('min_relevance_score', 0.5)
    max_posts = settings.get('max_posts_per_run', 10)

    posts_this_run = 0
    new_items = []

    # Process each feed
    for feed_config in config['feeds']:
        if not feed_config.get('enabled', True):
            logger.info(f"⏭️  Skipping disabled feed: {feed_config['name']}")
            continue

        feed_url = feed_config['url']
        feed_name = feed_config['name']

        logger.info(f"📡 Checking feed: {feed_name}")

        try:
            feed = feedparser.parse(feed_url)

            if feed.bozo:
                logger.warning(f"Feed parsing warning for {feed_name}: {feed.bozo_exception}")

            # Process entries (newest first)
            for entry in feed.entries[:20]:  # Limit to most recent 20
                guid = entry.get('id', entry.get('link', ''))

                if not guid:
                    continue

                # Skip if already posted
                if guid in posted_guids:
                    continue

                # Calculate relevance
                relevance = calculate_relevance(entry, feed_config)

                if relevance < min_score:
                    logger.debug(f"Skipping (low relevance {relevance:.2f}): {entry.get('title', '')[:50]}")
                    continue

                # Check max posts limit
                if posts_this_run >= max_posts:
                    logger.info(f"⚠️  Reached max posts limit ({max_posts})")
                    break

                # Post to Slack
                if post_to_slack(slack_client, channel_id, entry, feed_name):
                    posted_guids.add(guid)
                    new_items.append(guid)
                    posts_this_run += 1

        except Exception as e:
            logger.error(f"Error processing feed {feed_name}: {str(e)}")
            continue

    # Update tracking
    tracking['posted_items'] = list(posted_guids)[-1000:]  # Keep last 1000
    tracking['last_check'] = datetime.now(timezone.utc).isoformat()
    tracking['stats']['total_items_posted'] = tracking['stats'].get('total_items_posted', 0) + posts_this_run
    tracking['stats']['last_run_posted'] = posts_this_run
    tracking['stats']['last_run_time'] = datetime.now(timezone.utc).isoformat()

    save_tracking(tracking)

    logger.info(f"✅ Complete! Posted {posts_this_run} new items")
    logger.info(f"📊 Total tracked items: {len(posted_guids)}")


if __name__ == "__main__":
    main()
