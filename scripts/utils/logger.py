"""
Advanced logging system with multiple levels and formatting.

This module provides a centralized logging system with:
- Consistent formatting across all modules
- Multiple log levels (DEBUG, INFO, WARNING, ERROR)
- Optional file output
- Color support (optional, for terminal output)
"""

import logging
import sys
from typing import Optional

# Import config for default formats
try:
    from config import LOG_FORMAT, LOG_DATE_FORMAT
except ImportError:
    LOG_FORMAT = "[%(asctime)s] [%(levelname)s] %(name)s: %(message)s"
    LOG_DATE_FORMAT = "%Y-%m-%d %H:%M:%S"


def setup_logger(
    name: str,
    level: int = logging.INFO,
    log_file: Optional[str] = None,
    console: bool = True
) -> logging.Logger:
    """
    Set up a logger with consistent formatting.
    
    Args:
        name: Logger name (typically __name__ of the module)
        level: Logging level (DEBUG, INFO, WARNING, ERROR)
        log_file: Optional path to log file
        console: Whether to also log to console (default: True)
    
    Returns:
        Configured logger instance
    
    Example:
        >>> logger = setup_logger(__name__, level=logging.DEBUG)
        >>> logger.debug("This is a debug message")
        >>> logger.info("Processing started")
    """
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # Remove existing handlers to avoid duplicates
    logger.handlers.clear()
    
    # Create formatter
    formatter = logging.Formatter(LOG_FORMAT, datefmt=LOG_DATE_FORMAT)
    
    # Console handler
    if console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(level)
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
    
    # File handler
    if log_file:
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setLevel(level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger


def get_logger(name: str) -> logging.Logger:
    """
    Get an existing logger or create a new one with default settings.
    
    Args:
        name: Logger name
    
    Returns:
        Logger instance
    
    Example:
        >>> logger = get_logger(__name__)
        >>> logger.info("Using existing or default logger")
    """
    logger = logging.getLogger(name)
    
    # If logger has no handlers, set it up with defaults
    if not logger.handlers:
        return setup_logger(name)
    
    return logger


def set_global_log_level(level: int):
    """
    Set log level for all existing loggers.
    
    Args:
        level: Logging level (DEBUG, INFO, WARNING, ERROR)
    
    Example:
        >>> set_global_log_level(logging.DEBUG)
    """
    logging.root.setLevel(level)
    for handler in logging.root.handlers:
        handler.setLevel(level)


# Convenience functions for common logging patterns
def log_section(logger: logging.Logger, title: str, width: int = 70):
    """
    Log a section header for better readability.
    
    Args:
        logger: Logger instance
        title: Section title
        width: Width of separator line
    
    Example:
        >>> log_section(logger, "PROCESSING PROFILES")
        [INFO] ======================================================================
        [INFO] PROCESSING PROFILES
        [INFO] ======================================================================
    """
    separator = "=" * width
    logger.info(separator)
    logger.info(title)
    logger.info(separator)


def log_progress(logger: logging.Logger, current: int, total: int, item: str = "items"):
    """
    Log progress in a consistent format.
    
    Args:
        logger: Logger instance
        current: Current item number
        total: Total number of items
        item: Name of items being processed
    
    Example:
        >>> log_progress(logger, 50, 150, "profiles")
        [INFO] Progress: 50/150 profiles (33.3%)
    """
    percentage = (current / total * 100) if total > 0 else 0
    logger.info(f"Progress: {current}/{total} {item} ({percentage:.1f}%)")


def log_dict(logger: logging.Logger, title: str, data: dict, level: int = logging.DEBUG):
    """
    Log a dictionary in a readable format.
    
    Args:
        logger: Logger instance
        title: Title for the dictionary
        data: Dictionary to log
        level: Log level to use
    
    Example:
        >>> log_dict(logger, "Profile data", {"name": "John", "age": 30})
        [DEBUG] Profile data:
        [DEBUG]   name: John
        [DEBUG]   age: 30
    """
    logger.log(level, f"{title}:")
    for key, value in data.items():
        logger.log(level, f"  {key}: {value}")

