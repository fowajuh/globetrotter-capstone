#!/usr/bin/env python3
"""
GlobeTrotter repo scaffolder.

Usage:
    python generator/scaffold.py [--root .] [--overwrite]

Safe to rerun any time you add to architecture.py — it only fills gaps,
never deletes, and never overwrites a file that already has content
unless you pass --overwrite explicitly.
"""
import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import logger
from architecture import ARCHITECTURE
from creator import Creator
from validator import validate, report


def main():
    parser = argparse.ArgumentParser(description="Build the GlobeTrotter repo structure.")
    parser.add_argument("--root", default=".", help="Where to build the tree (default: current dir)")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite existing template files")
    args = parser.parse_args()

    root = os.path.abspath(args.root)

    logger.header("GlobeTrotter scaffold")
    print(f"  target: {root}")
    print(f"  mode:   {'overwrite' if args.overwrite else 'idempotent (fill gaps only)'}")

    logger.header("Building tree")
    creator = Creator(root, overwrite=args.overwrite)
    stats = creator.build(ARCHITECTURE)

    logger.header("Validating")
    problems = validate(ARCHITECTURE, root)
    report(problems)

    logger.header("Summary")
    print(f"  dirs created:   {stats['dirs_created']}")
    print(f"  dirs existing:  {stats['dirs_existing']}")
    print(f"  files created:  {stats['files_created']}")
    print(f"  files skipped:  {stats['files_skipped']} (already existed)")

    if problems:
        sys.exit(1)
    logger.ok("Repo structure ready.")


if __name__ == "__main__":
    main()
