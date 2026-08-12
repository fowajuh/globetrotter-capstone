import os
import hashlib


def count_nodes(tree: dict) -> int:
    """Count total number of dirs+files a tree will produce (for progress bar)."""
    total = 0
    for _, value in tree.items():
        total += 1
        if isinstance(value, dict):
            total += count_nodes(value)
    return total


def sha1_of_file(path: str) -> str:
    with open(path, "rb") as f:
        return hashlib.sha1(f.read()).hexdigest()


def relpath(path: str, root: str) -> str:
    return os.path.relpath(path, root).replace(os.sep, "/")
