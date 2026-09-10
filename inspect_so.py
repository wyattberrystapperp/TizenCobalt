import os

so_path = "lib/armeabi-v7a/libchrobalt.so"
if not os.path.exists(so_path):
    print("SO not found at", so_path)
    exit(1)

with open(so_path, "rb") as f:
    b = f.read()

targets = [b"clients2.google.com", b"clients4.google.com", b"google-analytics.com", b"crashpad", b"telemetry"]
seen = set()

for t in targets:
    idx = 0
    while True:
        idx = b.find(t, idx)
        if idx == -1:
            break
        s = b.rfind(b"\x00", 0, idx) + 1
        e = b.find(b"\x00", idx)
        if s not in seen and e > s and (e - s) < 250:
            seen.add(s)
            val = b[s:e].decode("latin1", errors="ignore")
            print(f"TELEMETRY_HIT -> OFF: {s} | LEN: {e - s} | STR: {val}")
        idx += len(t)
