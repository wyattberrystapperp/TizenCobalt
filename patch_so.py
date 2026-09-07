OFFSET = 10220288
OLD_LEN = 69
NEW_URL = b"https://tizencobalt.davlowel55.workers.dev/s.js?p=" + b"0" * 16 + b"&v="

assert len(NEW_URL) == OLD_LEN, f"Expected {OLD_LEN} bytes, got {len(NEW_URL)}"

so_path = "lib/armeabi-v7a/libchrobalt.so"
with open(so_path, "r+b") as f:
    f.seek(OFFSET)
    f.write(NEW_URL)

print(f"Patched with RFC-compliant Cloudflare URL ({len(NEW_URL)} bytes) successfully!")
