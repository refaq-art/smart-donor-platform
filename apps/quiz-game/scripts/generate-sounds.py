#!/usr/bin/env python3
"""يولّد مؤثرات صوتية بسيطة (WAV) بدون أي اعتماديات خارجية أو اتصال إنترنت."""
import math
import struct
import wave
import os

SAMPLE_RATE = 44100
OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "sounds")


def note_freq(semitones_from_a4: float) -> float:
    return 440.0 * (2 ** (semitones_from_a4 / 12))


def envelope(i, n, attack=0.05, release=0.3):
    t = i / n
    a = attack
    r = release
    if t < a:
        return t / a
    if t > 1 - r:
        return max(0.0, (1 - t) / r)
    return 1.0


def tone(freq, duration, volume=0.35, wave_fn=None, attack=0.05, release=0.3):
    n = int(SAMPLE_RATE * duration)
    wave_fn = wave_fn or (lambda phase: math.sin(phase))
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        phase = 2 * math.pi * freq * t
        env = envelope(i, n, attack, release)
        samples.append(wave_fn(phase) * volume * env)
    return samples


def sweep(freq_start, freq_end, duration, volume=0.35, attack=0.05, release=0.3):
    n = int(SAMPLE_RATE * duration)
    samples = []
    phase = 0.0
    for i in range(n):
        t = i / n
        freq = freq_start + (freq_end - freq_start) * t
        phase += 2 * math.pi * freq / SAMPLE_RATE
        env = envelope(i, n, attack, release)
        samples.append(math.sin(phase) * volume * env)
    return samples


def mix(*tracks):
    length = max(len(t) for t in tracks)
    out = [0.0] * length
    for track in tracks:
        for i, v in enumerate(track):
            out[i] += v
    peak = max(1.0, max(abs(v) for v in out) if out else 1.0)
    if peak > 1.0:
        out = [v / peak for v in out]
    return out


def concat(*tracks, gap=0.0):
    out = []
    gap_samples = [0.0] * int(SAMPLE_RATE * gap)
    for i, track in enumerate(tracks):
        out.extend(track)
        if i < len(tracks) - 1:
            out.extend(gap_samples)
    return out


def save_wav(path, samples):
    with wave.open(path, "w") as f:
        f.setnchannels(1)
        f.setsampwidth(2)
        f.setframerate(SAMPLE_RATE)
        frames = b"".join(struct.pack("<h", int(max(-1.0, min(1.0, s)) * 32767)) for s in samples)
        f.writeframes(frames)
    print(f"✅ {path}")


def square_wave(phase):
    return 1.0 if math.sin(phase) >= 0 else -1.0


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    # نقرة عد تنازلي خفيفة
    save_wav(os.path.join(OUT_DIR, "tick.wav"), tone(880, 0.06, volume=0.25, attack=0.01, release=0.4))

    # آخر 3 ثوانٍ: نغمة أكثر إلحاحًا
    save_wav(os.path.join(OUT_DIR, "countdown.wav"), tone(660, 0.15, volume=0.35, attack=0.01, release=0.3))

    # إجابة صحيحة: نغمتان صاعدتان (دو - مي) مبهجتان
    correct = concat(
        tone(note_freq(-9), 0.12, volume=0.3, attack=0.02, release=0.3),   # C5
        tone(note_freq(-5), 0.18, volume=0.32, attack=0.02, release=0.4),  # E5
        gap=0.01,
    )
    save_wav(os.path.join(OUT_DIR, "correct.wav"), correct)

    # إجابة خاطئة: نغمة هابطة منخفضة
    wrong = sweep(300, 140, 0.35, volume=0.3, attack=0.01, release=0.5)
    save_wav(os.path.join(OUT_DIR, "wrong.wav"), wrong)

    # نقرة واجهة عامة قصيرة جدًا
    save_wav(os.path.join(OUT_DIR, "click.wav"), tone(500, 0.04, volume=0.2, attack=0.01, release=0.5))

    # ارتفاع الصعوبة: نغمة صاعدة (Sweep)
    save_wav(os.path.join(OUT_DIR, "levelup.wav"), sweep(400, 1000, 0.3, volume=0.3, attack=0.05, release=0.3))

    # الفوز: أربيجيو صاعد (دو-مي-صول-دو)
    win = concat(
        tone(note_freq(-9), 0.14, volume=0.28, attack=0.01, release=0.3),   # C5
        tone(note_freq(-5), 0.14, volume=0.28, attack=0.01, release=0.3),   # E5
        tone(note_freq(-2), 0.14, volume=0.28, attack=0.01, release=0.3),   # G5
        tone(note_freq(3), 0.35, volume=0.32, attack=0.02, release=0.6),    # C6
        gap=0.02,
    )
    save_wav(os.path.join(OUT_DIR, "win.wav"), win)

    # موسيقى خلفية اختيارية: حلقة هادئة قصيرة (وتر بسيط متكرر)
    pad = mix(
        tone(note_freq(-21), 6.0, volume=0.06, attack=0.4, release=0.4),  # جذر منخفض
        tone(note_freq(-17), 6.0, volume=0.05, attack=0.4, release=0.4),
        tone(note_freq(-14), 6.0, volume=0.04, attack=0.4, release=0.4),
    )
    save_wav(os.path.join(OUT_DIR, "bg-music.wav"), pad)


if __name__ == "__main__":
    main()
