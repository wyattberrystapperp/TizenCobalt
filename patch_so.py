OFFSET = 10220288
OLD_LEN = 69
NEW_URL = b"https://cdn.jsdelivr.net/gh/wyattberrystapperp/TizenCobalt/s.js??????"

assert len(NEW_URL) == OLD_LEN, f"Expected {OLD_LEN} bytes, got {len(NEW_URL)}"

so_path = "lib/armeabi-v7a/libchrobalt.so"
with open(so_path, "r+b") as f:
    f.seek(OFFSET)
    old = f.read(OLD_LEN)
    print("Old URL:", old.decode(errors="ignore"))
    f.seek(OFFSET)
    f.write(NEW_URL)

print("Binary patch applied successfully!")
