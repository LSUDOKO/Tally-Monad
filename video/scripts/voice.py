"""Voice-over generator: Kokoro (af_heart) per-scene clips, vo.wav track and captions.json.

Run with the Kokoro venv:
  /home/arpit/video-tools/kokoro/.venv/bin/python video/scripts/voice.py
"""
import json
import re
import sys
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
STORYBOARD = ROOT / "storyboard.json"
OUT_VO = ROOT / "public" / "audio" / "vo"
OUT_TRACK = ROOT / "public" / "audio" / "vo.wav"
OUT_CAPS = ROOT / "public" / "captions.json"

SR = 24000
TRACK_SR = 48000
OFFSET = 0.35          # clip starts this long after scene.start
MARGIN = 0.5           # clip must be <= duration - MARGIN
SPEEDS = [0.95, 1.0, 1.05, 1.1, 1.15]
CLIP_RMS_DB = -20.0
PEAK_DB = -3.0
MAX_LINE = 42
GAP = 0.25             # min silence between clips when a long clip spills into the next scene

RESPELL = [
    (r"\bAUSD\b", "A U S D"),
    (r"\bAP2\b", "A P two"),
    (r"\bEnvio\b", "En-vee-oh"),
    (r"\bMera\b", "Meh-ra"),
    (r"\bPune\b", "Poona"),
    (r"\bEIP-712\b", "E I P seven twelve"),
    (r"\bUW\b", "U W"),
]


def speakable(text):
    for pat, rep in RESPELL:
        text = re.sub(pat, rep, text)
    return text


def trim(audio, lead=0.04, tail=0.10, thresh_db=-45.0):
    win = int(0.01 * SR)
    n = len(audio) // win
    if n == 0:
        return audio
    frames = audio[: n * win].reshape(n, win)
    rms = np.sqrt(np.mean(frames ** 2, axis=1) + 1e-12)
    ref = rms.max()
    active = np.where(20 * np.log10(rms / ref + 1e-12) > thresh_db)[0]
    if len(active) == 0:
        return audio
    a = max(0, active[0] * win - int(lead * SR))
    b = min(len(audio), (active[-1] + 1) * win + int(tail * SR))
    out = audio[a:b].copy()
    fade = int(0.005 * SR)
    out[:fade] *= np.linspace(0, 1, fade)
    out[-fade:] *= np.linspace(1, 0, fade)
    return out


def synth(pipeline, text, speed):
    parts = []
    for _, _, audio in pipeline(text, voice="af_heart", speed=speed):
        if audio is None:
            continue
        a = audio.detach().cpu().numpy() if hasattr(audio, "detach") else np.asarray(audio)
        parts.append(a.astype(np.float32))
    return trim(np.concatenate(parts))


def upsample2(x):
    """Exact 2x resample via zero-stuffing + windowed-sinc low-pass."""
    up = np.zeros(len(x) * 2, dtype=np.float64)
    up[::2] = x
    taps = 255
    n = np.arange(taps) - (taps - 1) / 2
    h = np.sinc(n / 2) * np.blackman(taps)
    h *= 2 / h.sum()
    return np.convolve(up, h, mode="same")


def split_lines(text):
    sentences = re.findall(r"[^.?!]+[.?!]*", text)
    lines = []
    for s in (x.strip() for x in sentences):
        if not s:
            continue
        if len(s) <= MAX_LINE:
            lines.append(s)
            continue
        # phrase pieces at , ; :
        pieces = [p.strip() for p in re.findall(r"[^,;:]+[,;:]?", s) if p.strip()]
        cur = ""
        for p in pieces:
            cand = (cur + " " + p).strip()
            if len(cand) <= MAX_LINE:
                cur = cand
                continue
            if cur:
                lines.append(cur)
            if len(p) <= MAX_LINE:
                cur = p
                continue
            # long phrase: split by words into balanced chunks
            words = p.split()
            k = -(-len(p) // MAX_LINE)
            while True:
                target = len(p) / k
                chunks, c = [], ""
                for w in words:
                    cand2 = (c + " " + w).strip()
                    if c and len(cand2) > target + 4:
                        chunks.append(c)
                        c = w
                    else:
                        c = cand2
                chunks.append(c)
                if all(len(x) <= MAX_LINE for x in chunks):
                    break
                k += 1
            lines.extend(chunks[:-1])
            cur = chunks[-1]
        if cur:
            lines.append(cur)
    return lines


def main():
    sb = json.loads(STORYBOARD.read_text())
    scenes = sb["scenes"]
    total = scenes[-1]["start"] + scenes[-1]["duration"]
    if "--reuse" in sys.argv:   # rebuild track + captions from existing clips, no TTS
        return assemble(scenes, total, {
            sc["id"]: sf.read(OUT_VO / f"{sc['id']}.wav", dtype="float64")[0]
            for sc in scenes if sc.get("vo", "").strip()}, 1.0)

    from kokoro import KPipeline
    pipeline = KPipeline(lang_code="a", repo_id="hexgrad/Kokoro-82M")
    OUT_VO.mkdir(parents=True, exist_ok=True)
    for old in OUT_VO.glob("*.wav"):
        old.unlink()

    clips, report = {}, []
    for sc in scenes:
        vo = sc.get("vo", "").strip()
        if not vo:
            report.append((sc["id"], None, None, sc["duration"] - MARGIN))
            continue
        limit = sc["duration"] - MARGIN
        for speed in SPEEDS:
            audio = synth(pipeline, speakable(vo), speed)
            if len(audio) / SR <= limit:
                break
        rms = np.sqrt(np.mean(audio.astype(np.float64) ** 2))
        audio = audio * (10 ** (CLIP_RMS_DB / 20) / rms)
        clips[sc["id"]] = audio
        report.append((sc["id"], speed, len(audio) / SR, limit))
        print(f"{sc['id']:18s} speed {speed:.2f}  {len(audio)/SR:6.2f}s / limit {limit:5.2f}s"
              + ("  TOO LONG" if len(audio) / SR > limit else ""), flush=True)

    # global gain so the loudest peak sits at PEAK_DB; same gain for clips and track
    peak = max(np.abs(a).max() for a in clips.values())
    g = 10 ** (PEAK_DB / 20) / peak
    long_ = [r for r in report if r[2] and r[2] > r[3]]
    if long_:
        print("STILL TOO LONG at 1.15:", long_, file=sys.stderr)
    for sc in scenes:
        if sc["id"] in clips:
            sf.write(OUT_VO / f"{sc['id']}.wav", (clips[sc["id"]] * g).astype(np.float32), SR, subtype="PCM_16")
    assemble(scenes, total, {k: v * g for k, v in clips.items()}, 1.0)


def assemble(scenes, total, clips, g):
    track = np.zeros(int(round(total * TRACK_SR)), dtype=np.float64)
    caps = []
    prev_end = -1.0
    for sc in scenes:
        if sc["id"] not in clips:
            continue
        a = clips[sc["id"]] * g
        up = upsample2(a)
        t0 = max(sc["start"] + OFFSET, prev_end + GAP)
        if t0 > sc["start"] + OFFSET + 1e-6:
            print(f"  {sc['id']}: delayed {t0 - sc['start'] - OFFSET:.2f}s (previous clip overran)")
        prev_end = t0 + len(a) / SR
        i = int(round(t0 * TRACK_SR))
        j = min(len(track), i + len(up))
        track[i:j] += up[: j - i]

        dur = len(a) / SR
        lines = split_lines(sc["vo"])
        weights = np.array([len(l) for l in lines], dtype=float)
        edges = t0 + np.concatenate([[0], np.cumsum(weights)]) / weights.sum() * dur
        for k, l in enumerate(lines):
            caps.append({"start": round(float(edges[k]), 3), "end": round(float(edges[k + 1]), 3), "text": l})

    track = np.clip(track, -1, 1)
    sf.write(OUT_TRACK, track.astype(np.float32), TRACK_SR, subtype="PCM_16")
    OUT_CAPS.write_text(json.dumps(caps, indent=2, ensure_ascii=False) + "\n")
    print(f"vo.wav {len(track)/TRACK_SR:.3f}s, peak {20*np.log10(np.abs(track).max()):.2f} dBFS, "
          f"{len(caps)} caption lines")


if __name__ == "__main__":
    main()
