#!/usr/bin/env python3
"""
Update feeds.json from UI changes.
Triggered via GitHub Actions workflow_dispatch.
"""

import json
import logging
import sys
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)


def validate_feeds(feeds_data):
    """Validate feeds JSON structure"""
    if not isinstance(feeds_data, dict):
        raise ValueError("Feeds data must be an object")

    if 'feeds' not in feeds_data:
        raise ValueError("Missing 'feeds' array")

    if not isinstance(feeds_data['feeds'], list):
        raise ValueError("'feeds' must be an array")

    # Validate each feed
    for i, feed in enumerate(feeds_data['feeds']):
        if not isinstance(feed, dict):
            raise ValueError(f"Feed {i} must be an object")

        required_fields = ['id', 'name', 'url']
        for field in required_fields:
            if field not in feed:
                raise ValueError(f"Feed {i} missing required field: {field}")

    logger.info(f"Validated {len(feeds_data['feeds'])} feeds")
    return True


def main():
    """Main execution"""
    # Get feeds JSON from command line argument
    if len(sys.argv) < 2:
        logger.error("Usage: python update_feeds.py '<feeds_json>'")
        sys.exit(1)

    try:
        feeds_data = json.loads(sys.argv[1])
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON: {e}")
        sys.exit(1)

    logger.info("🚀 Updating feeds configuration...")

    # Validate feeds
    try:
        validate_feeds(feeds_data)
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        sys.exit(1)

    # Write to feeds.json
    feeds_path = Path("feeds.json")
    with open(feeds_path, 'w') as f:
        json.dump(feeds_data, f, indent=2)

    logger.info(f"✅ Updated feeds.json with {len(feeds_data['feeds'])} feeds")


if __name__ == "__main__":
    main()
