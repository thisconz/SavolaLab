from datetime import datetime
from typing import Optional

# Parse a datetime string into a datetime object
def parse_datetime(dt_str: str, fmt: Optional[str] = None) -> datetime:
    """
    Parses a datetime string into a datetime object.
    :param dt_str: datetime string, e.g. "2025-06-10 14:30:00"
    :param fmt: optional format string, e.g. "%Y-%m-%d %H:%M:%S"
    :return: datetime object
    """
    if fmt:
        return datetime.strptime(dt_str, fmt)
    # Try ISO format by default
    return datetime.fromisoformat(dt_str)

# Format a datetime object to string
def format_datetime(dt: datetime, fmt: str = "%Y-%m-%d %H:%M:%S") -> str:
    """
    Formats a datetime object to string.
    :param dt: datetime object
    :param fmt: format string
    :return: formatted datetime string
    """
    return dt.strftime(fmt)
