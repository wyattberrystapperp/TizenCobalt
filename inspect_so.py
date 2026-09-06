with open("apk_out/lib/armeabi-v7a/libchrobalt.so", "rb") as f:
    b = f.read()

idx = 0
while True:
    idx = b.find(b"jsdelivr", idx)
    if idx == -1:
        break
    s = b.rfind(b"\x00", 0, idx) + 1
    e = b.find(b"\x00", idx)
    url = b[s:e].decode("latin1", errors="ignore")
    print("OFFSET:", s, "| LEN:", e - s, "| URL:", url)
    idx += 8
