"""Tiny colored logger — no external deps, works on Windows/macOS/Linux."""
import sys
import os

_COLOR = sys.stdout.isatty() or os.environ.get("FORCE_COLOR")

class C:
    RESET = "\033[0m" if _COLOR else ""
    DIM = "\033[2m" if _COLOR else ""
    BOLD = "\033[1m" if _COLOR else ""
    GREEN = "\033[32m" if _COLOR else ""
    YELLOW = "\033[33m" if _COLOR else ""
    BLUE = "\033[34m" if _COLOR else ""
    RED = "\033[31m" if _COLOR else ""
    CYAN = "\033[36m" if _COLOR else ""

def header(msg: str):
    print(f"\n{C.BOLD}{C.CYAN}== {msg} =={C.RESET}")

def dir_created(path: str):
    print(f"{C.BLUE}  [dir]  {C.RESET}{path}")

def dir_exists(path: str):
    print(f"{C.DIM}  [dir]  {path} (exists){C.RESET}")

def file_created(path: str):
    print(f"{C.GREEN}  [file] {C.RESET}{path}")

def file_skipped(path: str):
    print(f"{C.YELLOW}  [skip] {path} (already exists, not overwritten){C.RESET}")

def ok(msg: str):
    print(f"{C.GREEN}✓ {msg}{C.RESET}")

def warn(msg: str):
    print(f"{C.YELLOW}! {msg}{C.RESET}")

def error(msg: str):
    print(f"{C.RED}✗ {msg}{C.RESET}")

def progress(current: int, total: int, label: str = ""):
    width = 30
    filled = int(width * current / max(total, 1))
    bar = "#" * filled + "-" * (width - filled)
    pct = int(100 * current / max(total, 1))
    sys.stdout.write(f"\r{C.CYAN}  [{bar}] {pct:3d}%  {label[:40]:<40}{C.RESET}")
    sys.stdout.flush()
    if current >= total:
        print()
