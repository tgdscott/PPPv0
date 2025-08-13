from pathlib import Path
p = Path("podcast-pro-plus/api/main.py")
text = p.read_text(encoding="utf-8")

imp = "from api.routers.episodes_publish_alias import router as episodes_publish_alias_router"
if imp not in text:
    text = imp + "\n" + text

lines = text.splitlines()
insert_at = None
for i, line in enumerate(lines):
    if line.strip().startswith("app = FastAPI("):
        insert_at = i + 1
        break
if insert_at is None:
    insert_at = 0

hook = "app.include_router(episodes_publish_alias_router)"
if hook not in text:
    lines.insert(insert_at, hook)

p.write_text("\n".join(lines), encoding="utf-8")
print("main.py wired for publish alias")
