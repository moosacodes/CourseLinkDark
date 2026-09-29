#!/usr/bin/env python3
"""Generate CourseLink Dark icons (16/48/128 PNG) with the standard library only.

Design: dark rounded square, Guelph-red edge, gold crescent moon.
Rendered at 4x and box-downsampled for anti-aliasing. Run from repo root:
    python3 tools/make_icons.py
"""
import os, struct, zlib

BG = (26, 29, 33)       # #1a1d21
RING = (194, 4, 48)     # UofG red-ish #c20430
MOON = (255, 199, 44)   # gold #ffc72c
SS = 4                  # supersampling factor


def inside_rrect(x, y, s, r):
    # rounded rect [0,s)x[0,s) with corner radius r
    cx = min(max(x, r), s - r)
    cy = min(max(y, r), s - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r


def pixel(x, y, s):
    """Return RGBA for a point in a size-s canvas (float coords)."""
    r = s * 0.22
    if not inside_rrect(x, y, s, r):
        return (0, 0, 0, 0)
    edge = s * 0.06
    if not inside_rrect(x - edge, y - edge, s - 2 * edge, r - edge) and s >= 32:
        return RING + (255,)
    # crescent: big circle minus offset circle
    mx, my, mr = s * 0.5, s * 0.5, s * 0.30
    ox, oy, orr = s * 0.62, s * 0.40, s * 0.26
    in_big = (x - mx) ** 2 + (y - my) ** 2 <= mr * mr
    in_cut = (x - ox) ** 2 + (y - oy) ** 2 <= orr * orr
    if in_big and not in_cut:
        return MOON + (255,)
    return BG + (255,)


def render(size):
    big = size * SS
    rows = []
    for y in range(size):
        row = bytearray()
        for x in range(size):
            acc = [0, 0, 0, 0]
            for sy in range(SS):
                for sx in range(SS):
                    px = pixel((x * SS + sx + 0.5) / SS, (y * SS + sy + 0.5) / SS, size)
                    a = px[3]
                    acc[0] += px[0] * a; acc[1] += px[1] * a; acc[2] += px[2] * a; acc[3] += a
            n = SS * SS
            a = acc[3]
            if a:
                row += bytes((round(acc[0] / a), round(acc[1] / a), round(acc[2] / a), round(a / n)))
            else:
                row += b"\0\0\0\0"
        rows.append(bytes(row))
    return rows


def write_png(path, size, rows):
    raw = b"".join(b"\0" + r for r in rows)
    def chunk(t, d):
        c = struct.pack(">I", len(d)) + t + d
        return c + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "icons")
    os.makedirs(out, exist_ok=True)
    for s in (16, 48, 128):
        write_png(os.path.join(out, f"icon{s}.png"), s, render(s))
        print("wrote", f"icons/icon{s}.png")
