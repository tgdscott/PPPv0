import os, re
ROOT = os.path.abspath(".")
SKIP = {".git","node_modules","dist","build","__pycache__",".venv","media_uploads","final_episodes",".idea",".vscode","coverage",".cache"}

print("=== FASTAPI ROUTES ===")
pat = re.compile(r'@(app|router)\.(get|post|put|patch|delete)\(\s*["\']([^"\']+)["\']', re.I)
pre = re.compile(r'APIRouter\([^)]*prefix\s*=\s*["\']([^"\']+)["\']', re.I)
for base, dirs, files in os.walk(os.path.join(ROOT, "podcast-pro-plus", "api")):
    dirs[:] = [d for d in dirs if d not in SKIP]
    for f in sorted(files):
        if f.endswith(".py"):
            p = os.path.join(base,f)
            try: t = open(p, 'r', encoding='utf-8', errors='ignore').read()
            except: continue
            px = pre.search(t); px = px.group(1).rstrip("/") if px else ""
            hits = [(m.group(2).upper(), (px+"/"+m.group(3).lstrip("/")).replace("//","/")) for m in pat.finditer(t)]
            if hits:
                print(f"\n{os.path.relpath(p, ROOT)}")
                for mth, path in hits: print(f"  {mth}  {path}")

print("\n=== FRONTEND → API CALLS ===")
api_fetch = re.compile(r'fetch\(\s*["\'](/api[^"\']+)["\']', re.I)
api_ax = re.compile(r'axios\.(get|post|put|patch|delete)\(\s*["\'](/api[^"\']+)["\']', re.I)
src = os.path.join(ROOT, "frontend", "src")
for base, dirs, files in os.walk(src):
    dirs[:] = [d for d in dirs if d not in SKIP]
    for f in sorted(files):
        if os.path.splitext(f)[1].lower() in {".js",".jsx",".ts",".tsx"}:
            p = os.path.join(base,f)
            try:
                with open(p, "r", encoding="utf-8", errors="ignore") as fh:
                    for i, line in enumerate(fh, 1):
                        for pat in (api_fetch, api_ax):
                            m = pat.search(line)
                            if m: print(f"{os.path.relpath(p, ROOT)}:{i}  {m.group(1) if pat is api_fetch else m.group(2)}")
            except: pass
