#!/usr/bin/env bash
set -euo pipefail
task="${1:-}"; echo "PPP agent running task: $task"

need() { [ -f "$1" ] || { echo "Missing $1 — commit the earlier patch script first"; exit 1; }; }

case "$task" in
  pr2)  need scripts/patch_main_add_publish_alias.py;        python scripts/patch_main_add_publish_alias.py ;;
  pr3)  need scripts/patch_main_add_media_alias.py;          python scripts/patch_main_add_media_alias.py ;;
  pr4)  need scripts/patch_frontend_router_for_publisher.py; python scripts/patch_frontend_router_for_publisher.py ;;
  pr5a) need scripts/patch_main_import_listeners.py;         python scripts/patch_main_import_listeners.py ;;
  pr5b)
    # add/patch Vite proxy: /api -> 127.0.0.1:8000 (dev only)
    python - <<'PY'
from pathlib import Path, re
p = Path("frontend/vite.config.ts")
if not p.exists(): p = Path("frontend/vite.config.js")
created = False
if not p.exists():
    p.write_text('import { defineConfig } from "vite"\nimport react from "@vitejs/plugin-react"\n\nexport default defineConfig({\n  plugins:[react()],\n  server:{ proxy:{ "/api":{ target:"http://127.0.0.1:8000", changeOrigin:true, secure:false } } }\n})\n', encoding="utf-8")
    created = True
else:
    txt = p.read_text(encoding="utf-8")
    if "/api" not in txt or "proxy" not in txt:
        txt = re.sub(r'export default defineConfig\\(\\{', 'export default defineConfig({\\n  server:{ proxy:{ "/api":{ target:"http://127.0.0.1:8000", changeOrigin:true, secure:false } } },', txt, count=1)
        p.write_text(txt, encoding="utf-8")
print("vite config:", "created" if created else "patched")
PY
    ;;
  pr5c)
    # plain-JS helpers if missing (apiClient.js, ProtectedRoute.jsx) + fix imports
    if [ ! -f frontend/src/lib/apiClient.js ]; then
      mkdir -p frontend/src/lib
      cat > frontend/src/lib/apiClient.js <<'JS'
export function isApiError(e){return e&&typeof e==="object"&&e.error&&typeof e.error.message==="string";}
const BASE=(import.meta&&import.meta.env&&import.meta.env.VITE_API_BASE?String(import.meta.env.VITE_API_BASE).replace(/\/+$/,""):"");
async function req(path,opts={}){const res=await fetch(`${BASE}${path}`,{credentials:"include",headers:{"Content-Type":"application/json",...(opts.headers||{})},...opts});const data=await res.json().catch(()=>({}));if(!res.ok)throw data;return data;}
export const api={get:(p)=>req(p),post:(p,body)=>req(p,{method:"POST",body:body?JSON.stringify(body):undefined})};
JS
    fi
    if [ ! -f frontend/src/components/common/ProtectedRoute.jsx ]; then
      mkdir -p frontend/src/components/common
      cat > frontend/src/components/common/ProtectedRoute.jsx <<'JSX'
import React,{useEffect,useState} from "react";
import { Navigate } from "react-router-dom";
import { api } from "../../lib/apiClient.js";
export default function ProtectedRoute({children}){const[status,setStatus]=useState("loading");useEffect(()=>{let m=true;api.get("/api/auth/me").then(()=>m&&setStatus("ok")).catch(()=>m&&setStatus("unauthed"));return()=>{m=false};},[]);if(status==="loading")return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;if(status==="unauthed")return <Navigate to="/login" replace/>;return children;}
JSX
    fi
    python - <<'PY'
from pathlib import Path
# fix imports to use .jsx/.js
app = Path("frontend/src/App.jsx")
if app.exists():
    t = app.read_text(encoding="utf-8")
    t = t.replace('import ProtectedRoute from "./components/common/ProtectedRoute";','import ProtectedRoute from "./components/common/ProtectedRoute.jsx";')
    app.write_text(t, encoding="utf-8")
ppt = Path("frontend/src/components/dashboard/PodcastPublisherTool.jsx")
if ppt.exists():
    t = ppt.read_text(encoding="utf-8")
    t = t.replace('from "../../lib/apiClient";','from "../../lib/apiClient.js";')
    ppt.write_text(t, encoding="utf-8")
print("helpers ensured & imports patched")
PY
    ;;
  pr5d)
    # fix old code using fetch('api/...') -> fetch('/api/...')
    python - <<'PY'
from pathlib import Path, re
for p in Path("frontend/src").rglob("*.*"):
    if p.suffix.lower() not in {".js",".jsx",".ts",".tsx"}: continue
    s = p.read_text(encoding="utf-8")
    ns = re.sub(r'fetch\\((["\\\'])api/', r'fetch(\\1/api/', s)
    if ns != s: p.write_text(ns, encoding="utf-8"); print("patched", p)
print("done")
PY
    ;;
  *) echo "Unknown task: $task"; exit 1 ;;
esac
