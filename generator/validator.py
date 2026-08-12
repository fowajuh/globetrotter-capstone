import os
import logger


def validate(tree: dict, root: str) -> list[str]:
    """Re-walks the tree and confirms every node exists. Returns a list of
    problems (empty list == clean build)."""
    problems: list[str] = []
    _check(tree, root, problems)
    return problems


def _check(tree: dict, current_path: str, problems: list[str]):
    for name, value in tree.items():
        path = os.path.join(current_path, name)
        if isinstance(value, dict):
            if not os.path.isdir(path):
                problems.append(f"missing directory: {path}")
            else:
                _check(value, path, problems)
        else:
            if not os.path.isfile(path):
                problems.append(f"missing file: {path}")


def report(problems: list[str]):
    if not problems:
        logger.ok("Validation passed — every declared path exists on disk.")
        return
    logger.error(f"Validation found {len(problems)} problem(s):")
    for p in problems:
        print(f"    - {p}")
