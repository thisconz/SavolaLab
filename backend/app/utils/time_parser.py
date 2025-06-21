from datetime import datetime
from typing import Optional

# Parse a datetime string into a datetime object
def parse_datetime(dt_str: str, fmt: Optional[str] = None) -> datetime:
    if fmt:
        return datetime.strptime(dt_str, fmt)

    try:
        return datetime.fromisoformat(dt_str)
    except ValueError:
        # Fallback to common format
        try:
            return datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            raise ValueError(f"Unsupported datetime format: {dt_str}")

# Format a datetime object to string
def format_datetime(dt: datetime, fmt: str = "%Y-%m-%d %H:%M:%S") -> str:
    """
    Formats a datetime object to string.
    :param dt: datetime object
    :param fmt: format string
    :return: formatted datetime string
    """
    return dt.strftime(fmt)
