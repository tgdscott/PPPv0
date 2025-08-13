#!/usr/bin/env bash
set -euo pipefail

# Create directories (idempotent)
mkdir -p podcast-pro-plus/api/middleware \
         podcast-pro-plus/api/routers \
         scripts \
         frontend/src/lib \
         frontend/src/components/common

############################################
# Backend files
############################################

# Request ID middleware
cat > podcast-pro-plus/api/middleware/request_id.py <<'PY'
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import uuid

class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        rid = request.headers.get("X-Request-ID") or str(uuid.uuid4())
        request.state.request_id = rid
        response = await call_next(request)
        response.headers["X-Request-ID"] = rid
        return response
PY

# Error envelope + handlers
cat > podcast-pro-plus/api/exceptions.py <<'PY'
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from pydantic import ValidationError

def error_payload(code: str, message: str, details=None, request: Request | None = None):
    out = {"error": {"code": code, "message": message, "details": details}}
    rid = getattr(getattr(request, "state", None), "request_id", None)
    if rid:
        out["error"]["request_id"] = rid
    return out

def install_exception_handlers(app):
    @app.exception_handler(StarletteHTTPException)
    async def http_exc_handler(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            error_payload("http_error", exc.detail, {"status_code": exc.status_code}, request),
            status_code=exc.status_code
        )

    @app.exception_handler(ValidationError)
    async def validation_exc_handler(request: Request, exc: ValidationError):
        return JSONResponse(
            error_payload("validation_error", "Validation failed", exc.errors(), request),
            status_code=422
        )

    @app.exception_handler(Exception)
    async def unhandled_exc_handler(request: Request, exc: Exception):
        return JSONResponse(
            error_payload("internal_error", "Something went wrong", None, request),
            status_code=500
        )
PY

# Health router
cat > podcast-pro-plus/api/routers/health.py <<'PY'
from fastapi import APIRouter

router = APIRouter()

@router.get("/health")
def health():
    return {"status": "ok"}
PY

# Auth/me router (adjust import if your auth module path differs)
cat > podcast-pro-plus/api/routers/auth_me.py <<'PY'
from fastapi import APIRouter, Depends

router = APIRouter()

# Try the expected path; if it differs in your repo, update this import.
try:
    from api.core.auth import get_current_user  # type: ignore
except Exception:  # pragma: no cover
    def get_current_user():
        # This makes the route fail clearly if the import path is different.
        # Update the import above to match your project.
        raise RuntimeError("Wire get_current_user from api.core.auth")

@router.get("/api/auth/me")
def auth_me(user=Depends(get_current_user)):
    # Return whatever your get_current_user provides (Pydantic model or dict)
    return {"user": user}
PY

# Programmatic patcher for api/main.py (idempotent)
cat > scripts/patch_main_for_pr1.py <<'PY'
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
PY

python scripts/patch_main_for_pr1.py

# Backup helper
cat > scripts/backup_db.py <<'PY'
import os, shutil, time, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
src_db = ROOT / "podcast-pro-plus" / "database.db"
src_tpl = ROOT / "podcast-pro-plus" / "templates.json"
dst_dir = ROOT / "backups" / time.strftime("%Y%m%d-%H%M%S")
dst_dir.mkdir(parents=True, exist_ok=True)
for p in (src_db, src_tpl):
    if p.exists():
        shutil.copy2(p, dst_dir / p.name)
print(f"Backed up to {dst_dir}")
PY

############################################
# Frontend files
############################################

# Tiny API client (typed)
cat > frontend/src/lib/apiClient.ts <<'TS'
export type ApiError = { error: { code: string; message: string; details?: unknown; request_id?: string } };

const BASE = (import.meta as any).env.VITE_API_BASE?.replace(/\\/+$/, "") || "";

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(\`\${BASE}\${path}\`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw (data as ApiError);
  return data as T;
}

export const api = {
  get: <T>(p: string) => req<T>(p),
  post: <T>(p: string, body?: unknown) =>
    req<T>(p, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
};
TS

# ProtectedRoute
cat > frontend/src/components/common/ProtectedRoute.tsx <<'TSX'
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "@/lib/apiClient";

export default function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [status, setStatus] = useState<"loading" | "ok" | "unauthed">("loading");

  useEffect(() => {
    api.get<{ user: unknown }>("/api/auth/me")
      .then(() => setStatus("ok"))
      .catch(() => setStatus("unauthed"));
  }, []);

  if (status === "loading") return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  if (status === "unauthed") return <Navigate to="/login" replace />;
  return children;
}
TSX

# Simple curl smoke script
cat > scripts/smoke.sh <<'SH'
#!/usr/bin/env bash
set -e
BASE="${1:-http://localhost:8000}"
echo "==> GET $BASE/health"
curl -sS "$BASE/health"; echo; echo
echo "==> GET $BASE/api/auth/me (expect 401 if not logged in)"
code=$(curl -s -o /tmp/ppp_me.json -w "%{http_code}" "$BASE/api/auth/me" || true)
cat /tmp/ppp_me.json; echo; echo "HTTP $code"
SH
chmod +x scripts/smoke.sh

echo
echo "PR1 files added. Next steps:"
echo "1) Run the backend from podcast-pro-plus/:"
echo "     uvicorn api.main:app --reload"
echo "2) In a new terminal, run: scripts/smoke.sh"
echo "3) Frontend: ensure VITE_API_BASE is set (e.g., http://localhost:8000) in frontend/.env.local"
echo "4) Gate dashboards with <ProtectedRoute> when ready."
