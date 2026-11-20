"""Resumable local batch adapter for StorySpark narration.

This script intentionally contains no book text, reference voice, model weight,
or generated audio. Run it only with content and voices you are authorized to
use. See docs/api.md for the runtime naming convention.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import random
import sys

from audio_job_state import atomic_write_json, utc_now


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("manifest", type=Path, help="Private JSON track manifest")
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--voice-profile", type=Path, required=True)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--status-file", type=Path)
    parser.add_argument(
        "--lock-fd",
        type=int,
        required=True,
        help="Inherited single-book worker lock; launch through run_audio_job.py",
    )
    return parser.parse_args()


def load_tracks(path: Path) -> dict[str, str | dict]:
    data = json.loads(path.read_text(encoding="utf-8"))
    tracks = data.get("tracks")
    if not isinstance(tracks, dict) or not tracks:
        raise ValueError("manifest must contain a non-empty 'tracks' object")
    for name, track in tracks.items():
        if not isinstance(name, str):
            raise ValueError("every track name must be a string")
        if "/" in name or ".." in name:
            raise ValueError(f"unsafe track name: {name!r}")
        if isinstance(track, str):
            if not track.strip():
                raise ValueError("every text track must be non-empty")
            continue
        if not isinstance(track, dict) or set(track) != {"segments", "pauseMs"}:
            raise ValueError("a segmented track requires only segments and pauseMs")
        segments = track["segments"]
        pause_ms = track["pauseMs"]
        if (
            not isinstance(segments, list)
            or len(segments) < 2
            or any(not isinstance(segment, str) or not segment.strip() for segment in segments)
        ):
            raise ValueError("segmented tracks require at least two non-empty text segments")
        if not isinstance(pause_ms, int) or not 0 <= pause_ms <= 5000:
            raise ValueError("segmented track pauseMs must be an integer from 0 to 5000")
    return tracks


def load_voice_profile(path: Path) -> dict:
    profile_path = path.resolve()
    profile = json.loads(profile_path.read_text(encoding="utf-8"))
    required_identity = ("model", "method", "seed", "instructionSha256")
    missing_identity = [field for field in required_identity if profile.get(field) in (None, "")]
    if missing_identity:
        raise ValueError(f"voice profile identity is missing: {', '.join(missing_identity)}")
    if profile.get("method") != "inference_instruct2":
        raise ValueError("approved Mimi profiles must use inference_instruct2")
    if not isinstance(profile.get("seed"), int):
        raise ValueError("voice profile seed must be an integer")
    instruction = profile.get("instruction")
    if not isinstance(instruction, str) or not instruction.strip():
        raise ValueError("inference_instruct2 requires a non-empty instruction")
    expected_digest = profile["instructionSha256"]
    if not isinstance(expected_digest, str) or len(expected_digest) != 64:
        raise ValueError("voice profile instructionSha256 must be a SHA-256 hex digest")
    actual_digest = hashlib.sha256(instruction.encode("utf-8")).hexdigest()
    if actual_digest != expected_digest:
        raise ValueError("voice instruction does not match instructionSha256")
    return profile


def load_instruct2_inputs(profile: dict) -> tuple[str, Path]:
    """Return the approved style instruction and CosyVoice's packaged prompt WAV.

    The packaged WAV is an engine input, not Mimi's voice identity. Mimi's
    versioned identity is model + method + seed + the verified instruction.
    """
    lab = Path(os.environ["STORYSPARK_TTS_LAB"]).resolve()
    prompt_audio = lab / "CosyVoice" / "asset" / "zero_shot_prompt.wav"
    if not prompt_audio.is_file():
        raise FileNotFoundError(f"CosyVoice instruct2 prompt audio is missing: {prompt_audio}")
    return profile["instruction"], prompt_audio


def load_cosyvoice(profile: dict):
    lab = Path(os.environ["STORYSPARK_TTS_LAB"]).resolve()
    cosy_root = lab / "CosyVoice"
    sys.path.insert(0, str(cosy_root))
    sys.path.insert(0, str(cosy_root / "third_party" / "Matcha-TTS"))

    import torch  # pylint: disable=import-outside-toplevel
    import torchaudio  # pylint: disable=import-outside-toplevel
    threads = int(os.environ.get("STORYSPARK_TTS_THREADS", "2"))
    if not 1 <= threads <= 8: raise ValueError("STORYSPARK_TTS_THREADS must be 1–8")
    torch.set_num_threads(threads)
    from cosyvoice.cli.cosyvoice import AutoModel  # pylint: disable=import-outside-toplevel

    model_path = Path(
        os.environ.get(
            "STORYSPARK_COSYVOICE_MODEL",
            lab / "CosyVoice" / "pretrained_models" / profile["model"],
        )
    )
    seed = int(profile.get("seed", 0))
    random.seed(seed)
    torch.manual_seed(seed)
    return torch, torchaudio, AutoModel(model_dir=str(model_path))


def main() -> None:
    args = parse_args()
    tracks = load_tracks(args.manifest)
    args.output.mkdir(parents=True, exist_ok=True)
    profile = load_voice_profile(args.voice_profile)
    instruction, prompt_audio = load_instruct2_inputs(profile)
    torch, torchaudio, model = load_cosyvoice(profile)

    expected_names = set(tracks)

    def update_progress(**changes) -> None:
        if args.status_file is None:
            return
        current = json.loads(args.status_file.read_text(encoding="utf-8")) if args.status_file.exists() else {}
        completed_names = {path.stem for path in args.output.glob("*.wav")}
        current.update({
            "status": "running",
            "expectedTracks": len(expected_names),
            "completedTracks": len(expected_names & completed_names),
            "remainingTracks": len(expected_names - completed_names),
            "updatedAt": utc_now(),
            **changes,
        })
        atomic_write_json(args.status_file, current)

    for name, track in tracks.items():
        destination = args.output / f"{name}.wav"
        if destination.exists() and not args.force:
            print(f"skip {destination.name}", flush=True)
            update_progress(lastCompletedTrack=name, currentTrack=None)
            continue
        update_progress(currentTrack=name, trackStartedAt=utc_now())
        # A stable per-track seed makes resumed jobs produce the same result as
        # uninterrupted jobs even when earlier WAV files are skipped.
        track_offset = int(hashlib.sha256(name.encode("utf-8")).hexdigest()[:8], 16)
        track_seed = (int(profile["seed"]) + track_offset) % (2**31)
        segments = [track] if isinstance(track, str) else track["segments"]
        pause_ms = 0 if isinstance(track, str) else track["pauseMs"]
        rendered = []
        for segment_index, text in enumerate(segments):
            random.seed(track_seed)
            torch.manual_seed(track_seed)
            chunks = [
                item["tts_speech"]
                for item in model.inference_instruct2(
                    text, instruction, str(prompt_audio), stream=False
                )
            ]
            if not chunks:
                raise RuntimeError(f"no audio returned for {name} segment {segment_index}")
            segment_audio = torch.cat(chunks, dim=-1)
            if rendered and pause_ms:
                silence = torch.zeros(
                    (segment_audio.shape[0], round(model.sample_rate * pause_ms / 1000)),
                    dtype=segment_audio.dtype,
                    device=segment_audio.device,
                )
                rendered.append(silence)
            rendered.append(segment_audio)
        temporary = destination.with_name(f".{destination.stem}.{os.getpid()}.tmp.wav")
        torchaudio.save(
            str(temporary),
            torch.cat(rendered, dim=-1),
            model.sample_rate,
        )
        os.replace(temporary, destination)
        print(f"made {destination.name}", flush=True)
        update_progress(
            lastCompletedTrack=name,
            lastCompletedAt=utc_now(),
            currentTrack=None,
        )


if __name__ == "__main__":
    main()
