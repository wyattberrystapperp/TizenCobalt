so_path = "lib/armeabi-v7a/libchrobalt.so"

URL_OFF, URL_LEN = 10220288, 69
NEW_URL = b"https://cdn.jsdelivr.net/gh/wyattberrystapperp/TizenCobalt@main/s.js?"
assert len(NEW_URL) == URL_LEN

SW_OFF, SW_LEN = 14185589, 29
NEW_SW = b"disable-web-security" + b"\x00" * 9
assert len(NEW_SW) == SW_LEN

DR_OFF, DR_LEN = 8591518, 52
NEW_DR = b"http://127.0.0.1/" + b"\x00" * 35
assert len(NEW_DR) == DR_LEN

CR1_OFF, CR1_LEN = 10152451, 37
NEW_CR1 = b"http://127.0.0.1/" + b"\x00" * 20
assert len(NEW_CR1) == CR1_LEN

CR2_OFF, CR2_LEN = 15000203, 37
NEW_CR2 = b"http://127.0.0.1/" + b"\x00" * 20
assert len(NEW_CR2) == CR2_LEN

with open(so_path, "r+b") as f:
    for off, val in [(URL_OFF, NEW_URL), (SW_OFF, NEW_SW), (DR_OFF, NEW_DR), (CR1_OFF, NEW_CR1), (CR2_OFF, NEW_CR2)]:
        f.seek(off); f.write(val)

print("Patched: jsDelivr + disable-web-security + 3 telemetry null-routes!")
