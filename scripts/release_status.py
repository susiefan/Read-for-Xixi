"""Update the repository's open-source release dashboard."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from audio_job_state import atomic_write_json, utc_now

STATUS_FILE = Path(__file__).resolve().parents[1] / "data/open-source-release.json"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("task")
    parser.add_argument("status", choices=["planned", "ready", "active", "waiting-user", "blocked", "done"])
    parser.add_argument("--note", required=True)
    parser.add_argument("--evidence", action="append", default=[])
    args = parser.parse_args()
    data = json.loads(STATUS_FILE.read_text(encoding="utf-8"))
    task = next((item for item in data["tasks"] if item["id"] == args.task), None)
    if task is None:
        parser.error("Unknown release task")
    now = utc_now()
    task.update(status=args.status, note=args.note, updatedAt=now)
    if args.evidence:
        task["evidence"] = args.evidence
    data["updatedAt"] = now
    data.setdefault("history", []).append({"at": now, "task": task["title"], "status": args.status, "note": args.note})
    atomic_write_json(STATUS_FILE, data)
    print(json.dumps({"task": task["id"], "status": task["status"]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
