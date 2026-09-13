import sys
so_path = sys.argv[1] if len(sys.argv) > 1 else "lib/armeabi-v7a/libchrobalt.so"
URL_OFF, URL_LEN = 10220288, 69
NEW_URL = b"https://cdn.jsdelivr.net/gh/wyattberrystapperp/TizenCobalt@main/s.js?"
assert len(NEW_URL) == URL_LEN
SW_OFF, SW_LEN = 14185589, 29; NEW_SW = b"disable-web-security" + b"\x00" * 9
DR_OFF, DR_LEN = 8591518, 52; NEW_DR = b"http://127.0.0.1/" + b"\x00" * 35
CR1_OFF, CR1_LEN = 10152451, 37; NEW_CR1 = b"http://127.0.0.1/" + b"\x00" * 20
CR2_OFF, CR2_LEN = 15000203, 37; NEW_CR2 = b"http://127.0.0.1/" + b"\x00" * 20
# Starboard: ForceTunnelMode (0x492f888), ReleaseVideoFramesAfterAudio (0x492f890), EnableAv1 (0x492f8b0)
EXP_PATCHES = [(0x492f888, b"\x01\x00\x00\x00"), (0x492f890, b"\x01\x00\x00\x00"), (0x492f8b0, b"\x01\x00\x00\x00")]
with open(so_path, "r+b") as f:
    for off, val in [(URL_OFF, NEW_URL), (SW_OFF, NEW_SW), (DR_OFF, NEW_DR), (CR1_OFF, NEW_CR1), (CR2_OFF, NEW_CR2)] + EXP_PATCHES:
        f.seek(off); f.write(val)
print("Patched: CDN + WebSec + Telemetry Nulls + Tunneling & AV1 flags!")
