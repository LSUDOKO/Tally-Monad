"""Original procedural ambient bed (numpy only) -> public/audio/music.wav, ducked under vo.wav.

Run after voice.py:
  /home/arpit/video-tools/kokoro/.venv/bin/python video/scripts/music.py
"""
import json
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parent.parent
STORYBOARD = ROOT / "storyboard.json"
VO = ROOT / "public" / "audio" / "vo.wav"
OUT = ROOT / "public" / "audio" / "music.wav"

SR = 48000
CHORD_LEN = 8.0
XFADE = 2.0
EIGHTH = 60 / 75 / 2          # 0.4 s
TARGET_RMS_DB = -26.0
DUCK_DB = -6.0
ATTACK, RELEASE = 0.15, 0.6

# Cmaj9 - Am9 - Fmaj7 - G6sus (MIDI), root for the sub
CHORDS = [
    ([48, 52, 55, 59, 62], 36),
    ([45, 48, 52, 55, 59], 33),
    ([41, 45, 48, 52, 55], 29),
    ([43, 48, 50, 52, 55], 31),
]


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def soft_saw(f, t, phase=0.0, harmonics=6):
    out = np.zeros_like(t)
    for n in range(1, harmonics + 1):
        if f * n > 6000:
            break
        out += np.sin(2 * np.pi * f * n * t + phase * n) / n
    return out


def chord_segment(notes, root, length, rng):
    t = np.arange(int(length * SR)) / SR
    L = np.zeros_like(t)
    R = np.zeros_like(t)
    for m in notes:
        f = hz(m)
        for det, pan in ((-6, 0.8), (0, 0.5), (6, 0.2)):   # cents, pan (0=R..1=L)
            ff = f * 2 ** (det / 1200)
            s = 0.55 * soft_saw(ff, t, rng.uniform(0, 2 * np.pi)) + 0.45 * np.sin(2 * np.pi * ff * t)
            L += s * np.sqrt(pan)
            R += s * np.sqrt(1 - pan)
    sub = 1.6 * np.sin(2 * np.pi * hz(root) * t)
    L += sub
    R += sub
    # slow breathing swell
    lfo = 0.85 + 0.15 * np.sin(2 * np.pi * t / length - np.pi / 2)
    return L * lfo, R * lfo


def raised_cos_env(n, fade):
    env = np.ones(n)
    k = int(fade * SR)
    ramp = 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, k))
    env[:k] = ramp
    env[-k:] = ramp[::-1]
    return env


def lowpass(x, fc):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X /= 1 + (f / fc) ** 2          # gentle 12 dB/oct-like roll-off, zero phase
    return np.fft.irfft(X, n=len(x))


def main():
    sb = json.loads(STORYBOARD.read_text())
    sc = sb["scenes"]
    total = sc[-1]["start"] + sc[-1]["duration"]
    N = int(round(total * SR))
    rng = np.random.default_rng(7)
    L = np.zeros(N + int(XFADE * SR))
    R = np.zeros_like(L)

    # pads + sub with overlapping chord segments
    seg_len = CHORD_LEN + XFADE
    idx = 0
    t0 = -XFADE / 2
    while t0 < total:
        notes, root = CHORDS[idx % 4]
        l, r = chord_segment(notes, root, seg_len, rng)
        env = raised_cos_env(len(l), XFADE)
        a = int(round(t0 * SR))
        s0 = max(0, -a)
        b = min(len(L), a + len(l))
        L[a + s0:b] += (l * env)[s0:b - a]
        R[a + s0:b] += (r * env)[s0:b - a]
        t0 += CHORD_LEN
        idx += 1
    L, R = L[:N], R[:N]
    L = lowpass(L, 1400)
    R = lowpass(R, 1400)

    # soft plucked arpeggio on eighths
    arpL = np.zeros(N)
    arpR = np.zeros(N)
    pl = int(1.2 * SR)
    tp = np.arange(pl) / SR
    pluck_env = np.exp(-tp / 0.18) * np.minimum(1, tp / 0.005)
    pattern = [0, 2, 1, 3, 2, 4, 1, 3]
    k = 0
    t = 0.0
    while t < total:
        notes, _ = CHORDS[int(t // CHORD_LEN) % 4]
        m = notes[pattern[k % 8] % len(notes)] + 12
        p = np.sin(2 * np.pi * hz(m) * tp) * pluck_env
        p += 0.2 * np.sin(2 * np.pi * 2 * hz(m) * tp) * pluck_env ** 2
        vel = 0.8 + 0.2 * rng.random()
        pan = 0.35 if k % 2 else 0.65
        a = int(round(t * SR))
        b = min(N, a + pl)
        arpL[a:b] += vel * p[: b - a] * np.sqrt(pan)
        arpR[a:b] += vel * p[: b - a] * np.sqrt(1 - pan)
        k += 1
        t += EIGHTH
    pad_rms = np.sqrt(np.mean(L ** 2))
    arp_rms = np.sqrt(np.mean(arpL ** 2))
    arp_gain = pad_rms * 10 ** (-14 / 20) / arp_rms   # arp ~14 dB under pads
    L += arpL * arp_gain
    R += arpR * arp_gain

    # master level
    mix = np.stack([L, R], axis=1)
    mix *= 10 ** (TARGET_RMS_DB / 20) / np.sqrt(np.mean(mix ** 2))

    # sidechain ducking from vo.wav
    vo, vsr = sf.read(VO, dtype="float64")
    if vo.ndim > 1:
        vo = vo.mean(axis=1)
    assert vsr == SR
    vo = np.pad(vo, (0, max(0, N - len(vo))))[:N]
    hop = int(0.01 * SR)
    nf = N // hop + 1
    fr = np.pad(vo, (0, nf * hop - N)).reshape(nf, hop)
    active = 20 * np.log10(np.sqrt(np.mean(fr ** 2, axis=1)) + 1e-9) > -45
    # hold across short word gaps
    hold = int(0.25 / 0.01)
    act = active.copy()
    for i in np.where(active)[0]:
        act[i:i + hold] = True
    target = np.where(act, 10 ** (DUCK_DB / 20), 1.0)
    g = np.empty(nf)
    cur = 1.0
    ca = 1 - np.exp(-0.01 / ATTACK)
    cr = 1 - np.exp(-0.01 / RELEASE)
    for i in range(nf):
        c = ca if target[i] < cur else cr
        cur += (target[i] - cur) * c
        g[i] = cur
    gain = np.interp(np.arange(N), np.arange(nf) * hop, g)
    mix *= gain[:, None]

    # fades
    fi, fo = int(2 * SR), int(3 * SR)
    mix[:fi] *= np.linspace(0, 1, fi)[:, None] ** 2
    mix[-fo:] *= np.linspace(1, 0, fo)[:, None] ** 2

    sf.write(OUT, mix.astype(np.float32), SR, subtype="PCM_16")

    def db(x):
        return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
    sp = np.repeat(active, hop)[:N]
    body = np.zeros(N, bool)
    body[fi:-fo] = True
    print(f"music.wav {N/SR:.3f}s  overall RMS {db(mix):.1f} dBFS  peak {20*np.log10(np.abs(mix).max()):.1f} dBFS")
    print(f"music RMS during speech {db(mix[sp & body]):.1f} dBFS | in gaps {db(mix[~sp & body]):.1f} dBFS")
    print(f"voice RMS during speech {db(vo[sp]):.1f} dBFS -> voice-over-music margin {db(vo[sp]) - db(mix[sp & body]):.1f} dB")


if __name__ == "__main__":
    main()
