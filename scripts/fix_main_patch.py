from pathlib import Path

p = Path("podcast-pro-plus/api/main.py")
text = p.read_text(encoding="utf-8")

imports = [
    "from api.middleware.request_id import RequestIDMiddleware",
    "from api.exceptions import install_exception_handlers",
    "from api.routers.health import router as health_router",
    "from api.routers.auth_me import router as auth_me_router",
]

changed = False

# Ensure imports exist at top
for imp in imports:
    if imp not in text:
        text = imp + "\n" + text
        changed = True

# Ensure we add the setup lines right after `app = FastAPI(`
lines = text.splitlines()
insert_at = None
for i, line in enumerate(lines):
    if line.strip().startswith("app = FastAPI("):
        insert_at = i + 1
        break

if insert_at is None:
    insert_at = 0  # fallback: put near top

to_insert = [
    "app.add_middleware(RequestIDMiddleware)",
    "install_exception_handlers(app)",
    "app.include_router(health_router)",
    "app.include_router(auth_me_router)",
]

for li in to_insert:
    if li not in text:
        lines.insert(insert_at, li)
        insert_at += 1
        changed = True

if changed:
    p.write_text("\n".join(lines), encoding="utf-8")
    print("main.py updated")
else:
    print("main.py already OK")
