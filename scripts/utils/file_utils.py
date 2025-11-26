"""
File and directory utility functions.

This module provides helper functions for safe file operations,
directory management, and filename sanitization.
"""

import os
import shutil
import stat
from typing import Tuple, Optional
from .logger import get_logger

logger = get_logger(__name__)


def safe_filename(name: str) -> str:
    """
    Convert a string to a safe filename.
    
    Allows: alphanumeric characters, Hebrew characters, spaces, hyphens,
    underscores, parentheses, and apostrophes.
    
    Args:
        name: Original name (may contain invalid characters)
    
    Returns:
        Safe filename with invalid characters replaced by underscores
    
    Examples:
        >>> safe_filename("John/Doe")
        'John_Doe'
        >>> safe_filename("Morris (Moishe)")
        'Morris (Moishe)'
        >>> safe_filename("משה כהן")
        'משה כהן'
    """
    allowed = "-_ ()'"
    result = "".join(c if c.isalnum() or c in allowed else "_" for c in name)
    return result.strip()


def ensure_dir(path: str) -> bool:
    """
    Create directory if it doesn't exist.
    
    Args:
        path: Directory path
    
    Returns:
        True if successful or already exists, False on failure
    
    Example:
        >>> ensure_dir("output/profiles")
        True
    """
    try:
        os.makedirs(path, exist_ok=True)
        logger.debug(f"Ensured directory exists: {path}")
        return True
    except Exception as e:
        logger.error(f"Failed to create directory {path}: {e}")
        return False


def handle_remove_readonly(func, path: str, exc):
    """
    Error handler for Windows readonly files.
    
    This is used as the onerror parameter for shutil.rmtree().
    
    Args:
        func: Function that raised the error
        path: Path to the file/directory
        exc: Exception info
    """
    try:
        os.chmod(path, stat.S_IWRITE)
        func(path)
    except Exception as e:
        logger.warning(f"Could not remove readonly file {path}: {e}")


def copy_directory_safe(
    src: str,
    dst: str,
    overwrite: bool = True
) -> Tuple[bool, Optional[str]]:
    """
    Copy a directory with error handling.
    
    Args:
        src: Source directory
        dst: Destination directory
        overwrite: Whether to remove existing destination
    
    Returns:
        Tuple of (success, error_message)
    
    Example:
        >>> success, error = copy_directory_safe("bios/", "site/content/bios/")
        >>> if not success:
        ...     print(f"Copy failed: {error}")
    """
    try:
        # Check source exists
        if not os.path.exists(src):
            return False, f"Source directory does not exist: {src}"
        
        # Remove destination if it exists and overwrite is True
        if os.path.exists(dst) and overwrite:
            logger.debug(f"Removing existing destination: {dst}")
            shutil.rmtree(dst, onerror=handle_remove_readonly)
        
        # Copy directory
        logger.debug(f"Copying {src} -> {dst}")
        shutil.copytree(src, dst)
        
        # Count files
        total_files = sum(len(files) for _, _, files in os.walk(dst))
        logger.info(f"Copied {total_files} files from {src} to {dst}")
        
        return True, None
    
    except Exception as e:
        error_msg = f"Failed to copy {src} to {dst}: {e}"
        logger.error(error_msg)
        return False, error_msg


def copy_file_safe(src: str, dst: str, preserve_metadata: bool = True) -> bool:
    """
    Copy a single file with error handling.
    
    Args:
        src: Source file path
        dst: Destination file path
        preserve_metadata: Whether to preserve file metadata (timestamps, etc.)
    
    Returns:
        True if successful, False otherwise
    
    Example:
        >>> copy_file_safe("index.md", "site/content/index.md")
        True
    """
    try:
        if not os.path.exists(src):
            logger.error(f"Source file does not exist: {src}")
            return False
        
        # Ensure destination directory exists
        dst_dir = os.path.dirname(dst)
        if dst_dir:
            ensure_dir(dst_dir)
        
        # Copy file
        if preserve_metadata:
            shutil.copy2(src, dst)
        else:
            shutil.copy(src, dst)
        
        logger.debug(f"Copied {src} -> {dst}")
        return True
    
    except Exception as e:
        logger.error(f"Failed to copy {src} to {dst}: {e}")
        return False


def remove_directory_safe(path: str) -> bool:
    """
    Remove a directory with error handling.
    
    Args:
        path: Directory path to remove
    
    Returns:
        True if successful or doesn't exist, False on failure
    
    Example:
        >>> remove_directory_safe("site/public")
        True
    """
    try:
        if not os.path.exists(path):
            logger.debug(f"Directory doesn't exist (skipping): {path}")
            return True
        
        logger.debug(f"Removing directory: {path}")
        shutil.rmtree(path, onerror=handle_remove_readonly)
        logger.info(f"Removed directory: {path}")
        return True
    
    except Exception as e:
        logger.error(f"Failed to remove directory {path}: {e}")
        return False


def count_files(directory: str, pattern: Optional[str] = None) -> int:
    """
    Count files in a directory (recursively).
    
    Args:
        directory: Directory to count files in
        pattern: Optional glob pattern to filter files (e.g., "*.md")
    
    Returns:
        Number of files found
    
    Example:
        >>> count_files("bios/", "*.md")
        42
    """
    if not os.path.exists(directory):
        return 0
    
    count = 0
    for root, dirs, files in os.walk(directory):
        if pattern:
            import fnmatch
            count += len([f for f in files if fnmatch.fnmatch(f, pattern)])
        else:
            count += len(files)
    
    return count


def list_subdirectories(directory: str) -> list:
    """
    List all subdirectories (non-recursive).
    
    Args:
        directory: Directory to list
    
    Returns:
        List of subdirectory names (not full paths)
    
    Example:
        >>> list_subdirectories("bios/")
        ['I11052340', 'I39965449', 'I11032861']
    """
    if not os.path.exists(directory):
        return []
    
    return [
        d for d in os.listdir(directory)
        if os.path.isdir(os.path.join(directory, d)) and not d.startswith('.')
    ]

