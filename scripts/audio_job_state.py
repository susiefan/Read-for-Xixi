from __future__ import annotations

import fcntl
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def atomic_write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    temporary.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    os.replace(temporary, path)


def try_acquire_lock(path: Path) -> int | None:
    path.parent.mkdir(parents=True, exist_ok=True)
    descriptor = os.open(path, os.O_RDWR | os.O_CREAT, 0o600)
    try:
        fcntl.flock(descriptor, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        os.close(descriptor)
        return None
    return descriptor


def lock_is_held(path: Path) -> bool:
    descriptor = try_acquire_lock(path)
    if descriptor is None:
        return True
    fcntl.flock(descriptor, fcntl.LOCK_UN)
    os.close(descriptor)
    return False


def effective_status(
    *,
    reported_status: str | None,
    lock_held: bool,
    completed_tracks: int,
    expected_tracks: int,
) -> str:
    if expected_tracks > 0 and completed_tracks == expected_tracks:
        return "complete"
    if lock_held:
        return "running"
    if reported_status == "running":
        return "interrupted"
    return reported_status or "not_started"
