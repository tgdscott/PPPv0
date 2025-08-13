from pathlib import Path
import re

MAIN = Path("podcast-pro-plus/api/main.py")
text = MAIN.read_text(encoding="utf-8")

imports = [
    "from api.middleware.request_id import RequestIDMiddleware",
    "from api.exceptions import install_exception_handlers",
    "from api.routers.health import router as health_router",
    "from api.routers.auth_me import router as auth_me_router",
]

for imp in imports:
    if imp not in text:
        # place imports near the top
        text = imp + "\n" + text

# find 'app = FastAPI(' line to inject setup after it
m = re.search(r"^app\s*=\s*FastAPI\\s*\\(", text, flags=re.M)
inject_lines = []
if "app.add_middleware(RequestIDMiddleware)" not in text:
    inject_lines.append("app.add_middleware(RequestIDMiddleware)")
if "install_exception_handlers(app)" not in text:
    inject_lines.append("install_exception_handlers(app)")
if "app.include_router(health_router)" not in text:
    inject_lines.append("app.include_router(health_router)")
if "app.include_router(auth_me_router)" not in text:
    inject_lines.append("app.include_router(auth_me_router)")

if m and inject_lines:
    # insert after the line where app is created
    lines = text.splitlines()
    idx = None
    for i, line in enumerate(lines):
        if re.match(r"^app\s*=\s*FastAPI\\s*\\(", line):
            idx = i
            break
    if idx is not None:
        # insert a blank line + our lines after app=FastAPI(...)
        lines.insert(idx + 1, "")
        for l in inject_lines[::-1]:
            lines.insert(idx + 2, l)
        text = "\n".join(lines)

MAIN.write_text(text, encoding="utf-8")
print("Patched api/main.py")
