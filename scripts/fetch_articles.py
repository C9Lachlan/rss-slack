#!/usr/bin/env python3
"""
Fetch articles from RSS feeds and store for review.
Runs daily via GitHub Actions.
"""

import json
import logging
import sys
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.parse import urlparse

import feedparser

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)


def load_feeds():
    """Load feeds configuration"""
    feeds_path = Path("feeds.json")
    with open(feeds_path, 'r') as f:
        data = json.load(f)
    return data['feeds']


def load_existing_articles():
    """Load existing articles to avoid duplicates"""
    articles_path = Path("data/articles.json")
    if not articles_path.exists():
        return {}

    with open(articles_path, 'r') as f:
        data = json.load(f)

    # Create lookup by article link
    existing = {}
    for article in data.get('articles', []):
        existing[article['link']] = article

    return existing


def parse_published_date(entry):
    """Parse published date from feed entry"""
    # Try different date fields
    for field in ['published_parsed', 'updated_parsed']:
        if hasattr(entry, field) and getattr(entry, field):
            time_tuple = getattr(entry, field)
            try:
                return datetime(*time_tuple[:6], tzinfo=timezone.utc)
            except (TypeError, ValueError):
                pass

    # Fallback to current time
    return datetime.now(timezone.utc)


def fetch_feed_articles(feed, cutoff_date, existing_articles):
    """Fetch articles from a single feed"""
    logger.info(f"Fetching feed: {feed['name']}")

    try:
        parsed_feed = feedparser.parse(feed['url'])

        if parsed_feed.bozo:
            logger.warning(f"Feed parsing warning for {feed['name']}: {parsed_feed.bozo_exception}")

        articles = []
        feed_domain = urlparse(feed['url']).netloc

        for entry in parsed_feed.entries:
            # Get article link
            link = entry.get('link', entry.get('id', ''))
            if not link:
                continue

            # Skip if already exists and not too old
            if link in existing_articles:
                existing = existing_articles[link]
                existing_date = datetime.fromisoformat(existing['published'].replace('Z', '+00:00'))
                if existing_date >= cutoff_date:
                    articles.append(existing)
                continue

            # Parse published date
            published_date = parse_published_date(entry)

            # Skip if older than cutoff
            if published_date < cutoff_date:
                continue

            # Extract summary
            summary = entry.get('summary', entry.get('description', ''))
            # Clean HTML tags (basic cleanup)
            summary = summary.replace('<p>', '').replace('</p>', '\n')
            summary = summary.replace('<br>', '\n').replace('<br/>', '\n')
            summary = summary[:500]  # Limit length

            # Create article object
            article = {
                'id': str(uuid.uuid4()),
                'feed_id': feed['id'],
                'feed_name': feed['name'],
                'feed_url': f"https://{feed_domain}",
                'title': entry.get('title', 'No title'),
                'link': link,
                'summary': summary,
                'published': published_date.isoformat(),
                'fetched': datetime.now(timezone.utc).isoformat()
            }

            articles.append(article)

        logger.info(f"Found {len(articles)} articles from {feed['name']}")
        return articles

    except Exception as e:
        logger.error(f"Error fetching feed {feed['name']}: {str(e)}")
        return []


def save_articles(all_articles):
    """Save articles to JSON file"""
    articles_path = Path("data/articles.json")
    articles_path.parent.mkdir(exist_ok=True)

    data = {
        'articles': all_articles,
        'last_updated': datetime.now(timezone.utc).isoformat()
    }

    with open(articles_path, 'w') as f:
        json.dump(data, f, indent=2)

    logger.info(f"Saved {len(all_articles)} articles to {articles_path}")


def main():
    """Main execution"""
    logger.info("🚀 Starting article fetch...")

    # Load feeds
    feeds = load_feeds()
    enabled_feeds = [f for f in feeds if f.get('enabled', True)]
    logger.info(f"Found {len(enabled_feeds)} enabled feeds")

    # Calculate cutoff date (7 days ago)
    cutoff_date = datetime.now(timezone.utc) - timedelta(days=7)
    logger.info(f"Fetching articles from last 7 days (since {cutoff_date.isoformat()})")

    # Load existing articles
    existing_articles = load_existing_articles()
    logger.info(f"Found {len(existing_articles)} existing articles")

    # Fetch articles from each feed
    all_articles = []
    for feed in enabled_feeds:
        articles = fetch_feed_articles(feed, cutoff_date, existing_articles)
        all_articles.extend(articles)

    # Sort by published date (newest first)
    all_articles.sort(key=lambda x: x['published'], reverse=True)

    # Save to file
    save_articles(all_articles)

    logger.info(f"✅ Complete! Fetched {len(all_articles)} total articles")


if __name__ == "__main__":
    main()
