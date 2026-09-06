import zipfile

targets = [
    ("android.permission.RECORD_AUDIO", "android.permission._DISABLED__"),
    ("android.hardware.microphone", "android.hardware._disabled_"),
    ("android.permission.CAMERA", "android.permission.DISBLD"),
    ("android.permission.ACCESS_COARSE_LOCATION", "android.permission._DISABLED_COARSE_LOCAT_"),
    ("com.google.android.gms.permission.AD_ID", "com.google.android.gms.permission._DIS_ID_"),
    ("android.permission.QUERY_ALL_PACKAGES", "android.permission._DISABLED_ALL_PACKAGES"),
    ("android.permission.REQUEST_INSTALL_PACKAGES", "android.permission._DISABLED_INSTALL_PACKS_"),
    ("android.permission.VIBRATE", "android.permission._DISAB_"),
    ("supportsPictureInPicture", "disabledPictureInPicture"),
    ("com.google.android.tv.pip.category", "com.google.android.tv.dis.category")
]

with zipfile.ZipFile("cobalt-arm.apk", "r") as z:
    manifest = z.read("AndroidManifest.xml")

for old, new in targets:
    manifest = manifest.replace(old.encode("utf-16le"), new.encode("utf-16le"))

with open("AndroidManifest.xml", "wb") as f:
    f.write(manifest)
print("Manifest patched: Permissions stripped & PiP disabled.")
