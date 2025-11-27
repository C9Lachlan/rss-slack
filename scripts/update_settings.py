#!/usr/bin/env python3
"""
Update settings.json from UI changes.
Triggered via GitHub Actions workflow_dispatch.
Optionally updates send-reminder.yml cron schedule if time changed.
"""

import json
import logging
import re
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)


def validate_settings(settings_data):
    """Validate settings JSON structure"""
    if not isinstance(settings_data, dict):
        raise ValueError("Settings data must be an object")

    required_fields = ['reminder_time', 'reminder_timezone', 'message_template']
    for field in required_fields:
        if field not in settings_data:
            raise ValueError(f"Missing required field: {field}")

    # Validate time format (HH:MM)
    time_pattern = re.compile(r'^([0-1][0-9]|2[0-3]):[0-5][0-9]$')
    if not time_pattern.match(settings_data['reminder_time']):
        raise ValueError("reminder_time must be in HH:MM format")

    logger.info("Validated settings")
    return True


def convert_to_utc_cron(time_str, timezone_str):
    """Convert local time and timezone to UTC cron expression"""
    try:
        # Parse time (e.g., "08:30")
        hour, minute = map(int, time_str.split(':'))

        # Create datetime in target timezone for today
        local_tz = ZoneInfo(timezone_str)
        local_time = datetime.now(local_tz).replace(hour=hour, minute=minute, second=0, microsecond=0)

        # Convert to UTC
        utc_time = local_time.astimezone(ZoneInfo('UTC'))

        # Return cron expression (minute hour * * *)
        cron = f"{utc_time.minute} {utc_time.hour} * * *"
        logger.info(f"Converted {time_str} {timezone_str} to UTC cron: {cron}")
        return cron

    except Exception as e:
        logger.error(f"Error converting time to cron: {e}")
        raise


def update_reminder_cron(cron_expression):
    """Update send-reminder.yml with new cron schedule"""
    workflow_path = Path(".github/workflows/send-reminder.yml")

    if not workflow_path.exists():
        logger.warning("send-reminder.yml not found, skipping cron update")
        return False

    # Read workflow file
    with open(workflow_path, 'r') as f:
        content = f.read()

    # Replace cron expression (look for the schedule section)
    # Pattern matches:     - cron: '30 22 * * *'
    pattern = r"(\s+- cron:\s+['\"])([^'\"]+)(['\"])"
    replacement = rf"\g<1>{cron_expression}\g<3>"

    new_content = re.sub(pattern, replacement, content)

    if new_content != content:
        # Write updated workflow
        with open(workflow_path, 'w') as f:
            f.write(new_content)
        logger.info(f"Updated send-reminder.yml cron schedule to: {cron_expression}")
        return True
    else:
        logger.warning("Could not find cron schedule in send-reminder.yml")
        return False


def main():
    """Main execution"""
    # Get settings JSON from command line argument
    if len(sys.argv) < 2:
        logger.error("Usage: python update_settings.py '<settings_json>'")
        sys.exit(1)

    try:
        new_settings = json.loads(sys.argv[1])
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON: {e}")
        sys.exit(1)

    logger.info("🚀 Updating settings...")

    # Validate settings
    try:
        validate_settings(new_settings)
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        sys.exit(1)

    # Load existing settings to check if time changed
    settings_path = Path("data/settings.json")
    time_changed = False

    if settings_path.exists():
        with open(settings_path, 'r') as f:
            old_settings = json.load(f)

        time_changed = (
            old_settings.get('reminder_time') != new_settings['reminder_time'] or
            old_settings.get('reminder_timezone') != new_settings['reminder_timezone']
        )

    # Write new settings
    settings_path.parent.mkdir(exist_ok=True)
    with open(settings_path, 'w') as f:
        json.dump(new_settings, f, indent=2)

    logger.info("✅ Updated data/settings.json")

    # Update cron schedule if time changed
    if time_changed:
        logger.info("Reminder time changed, updating workflow cron schedule...")
        try:
            cron_expression = convert_to_utc_cron(
                new_settings['reminder_time'],
                new_settings['reminder_timezone']
            )
            update_reminder_cron(cron_expression)
        except Exception as e:
            logger.error(f"Failed to update cron schedule: {e}")
            # Don't fail the whole operation
            pass

    logger.info("✅ Complete!")


if __name__ == "__main__":
    main()
