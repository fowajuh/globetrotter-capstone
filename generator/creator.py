import os
import logger
import utils


class Creator:
    """Walks an ARCHITECTURE dict and materializes it on disk.

    Idempotent: existing directories are left alone, existing files are
    never overwritten (so re-running the scaffolder never clobbers work
    you've done inside a generated file). Pass overwrite=True to force a
    refresh of template files if you really want that.
    """

    def __init__(self, root: str, overwrite: bool = False):
        self.root = root
        self.overwrite = overwrite
        self.stats = {"dirs_created": 0, "dirs_existing": 0,
                       "files_created": 0, "files_skipped": 0}
        self._total = 0
        self._done = 0

    def build(self, tree: dict):
        total = utils.count_nodes(tree)
        self._done = 0
        self._total = total
        os.makedirs(self.root, exist_ok=True)
        self._walk(tree, self.root)
        print()  # close progress line
        return self.stats

    def _walk(self, tree: dict, current_path: str):
        for name, value in tree.items():
            path = os.path.join(current_path, name)
            if isinstance(value, dict):
                self._make_dir(path)
                self._walk(value, path)
            else:
                self._make_file(path, value or "")
            self._done += 1
            logger.progress(self._done, self._total, utils.relpath(path, self.root))

    def _make_dir(self, path: str):
        if os.path.isdir(path):
            self.stats["dirs_existing"] += 1
        else:
            os.makedirs(path, exist_ok=True)
            self.stats["dirs_created"] += 1

    def _make_file(self, path: str, content: str):
        if os.path.exists(path) and not self.overwrite:
            self.stats["files_skipped"] += 1
            return
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8", newline="\n") as f:
            f.write(content)
        self.stats["files_created"] += 1
