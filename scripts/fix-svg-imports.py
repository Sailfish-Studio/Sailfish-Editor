import subprocess, re, os

result = subprocess.run(
    ["git", "grep", "tw-recolor/build", "HEAD", "--", "scratch-gui/src/"],
    capture_output=True, text=True
)

lines = result.stdout.strip().split("\n")

file_icons = {}
for line in lines:
    parts = line.split(":")
    if len(parts) < 3: continue
    fpath = parts[1]
    code_part = ":".join(parts[2:]).strip()
    m = re.search(r"from '([^']+)", code_part)
    if not m: continue
    full_import = m.group(1)
    icon = full_import.split("!")[-1]
    if fpath not in file_icons:
        file_icons[fpath] = []
    file_icons[fpath].append(icon)

for fpath, icons in file_icons.items():
    if not os.path.exists(fpath):
        continue
    with open(fpath, "r") as f:
        content = f.read()
    for icon in icons:
        old_full = "from '" + "!../../lib/tw-recolor/build!" + icon + "'"
        new = 'from "' + icon + '?url"'
        content = content.replace(old_full, new)
    with open(fpath, "w") as f:
        f.write(content)
    print(f"Fixed {fpath}: {icons}")

print("Done")
