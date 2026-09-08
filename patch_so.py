so_path = "lib/armeabi-v7a/libchrobalt.so"

URL_OFF, URL_LEN = 10220288, 69
NEW_URL = b"https://cdn.jsdelivr.net/gh/wyattberrystapperp/TizenCobalt@main/s.js?"
assert len(NEW_URL) == URL_LEN, f"Expected {URL_LEN}, got {len(NEW_URL)}"

SW_OFF, SW_LEN = 14185589, 29
NEW_SW = b"disable-web-security" + b"\x00" * 9
assert len(NEW_SW) == SW_LEN, f"Expected {SW_LEN}, got {len(NEW_SW)}"

with open(so_path, "r+b") as f:
    f.seek(URL_OFF); f.write(NEW_URL)
    f.seek(SW_OFF); f.write(NEW_SW)

print("Patched with jsDelivr @main (69b) + disable-web-security (29b)!")
