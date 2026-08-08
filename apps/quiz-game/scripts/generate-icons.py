#!/usr/bin/env python3
"""يولّد أيقونات PWA (هدف/دارتبورد بسيط بألوان هوية التطبيق) كملفات PNG خام
باستخدام مكتبات بايثون القياسية فقط (بدون Pillow أو أي اعتمادية خارجية)."""

import os
import struct
import zlib

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "icons")

PURPLE = (0x7C, 0x5C, 0xFF)
PINK = (0xFF, 0x5C, 0xA8)
GOLD = (0xFF, 0xD1, 0x66)
WHITE = (0xFF, 0xFF, 0xFF)


def lerp(a, b, t):
    return round(a + (b - a) * t)


def pixel(x, y, size):
    cx = cy = size / 2
    dx, dy = x - cx, y - cy
    r = (dx * dx + dy * dy) ** 0.5
    ring = r / size

    if ring <= 0.12:
        return (*WHITE, 255)
    if ring <= 0.24:
        return (*GOLD, 255)
    if ring <= 0.36:
        return (*WHITE, 255)

    # خلفية متدرجة قطريًا (تحاكي primary-gradient بزاوية 135deg)
    t = (x + y) / (size * 2)
    return (lerp(PURPLE[0], PINK[0], t), lerp(PURPLE[1], PINK[1], t), lerp(PURPLE[2], PINK[2], t), 255)


def write_png(path, size):
    raw = bytearray()
    for y in range(size):
        raw.append(0)  # filter type: none
        for x in range(size):
            r, g, b, a = pixel(x, y, size)
            raw.extend((r, g, b, a))
    compressed = zlib.compress(bytes(raw), 9)

    def chunk(tag: bytes, data: bytes) -> bytes:
        body = tag + data
        return struct.pack(">I", len(data)) + body + struct.pack(">I", zlib.crc32(body) & 0xFFFFFFFF)

    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)  # 8-bit RGBA
    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(chunk(b"IHDR", ihdr))
        f.write(chunk(b"IDAT", compressed))
        f.write(chunk(b"IEND", b""))


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    sizes = {
        "icon-192.png": 192,
        "icon-512.png": 512,
        "icon-maskable-512.png": 512,
        "apple-touch-icon.png": 180,
    }
    for name, size in sizes.items():
        write_png(os.path.join(OUT_DIR, name), size)
        print(f"✅ {name} ({size}x{size})")


if __name__ == "__main__":
    main()
