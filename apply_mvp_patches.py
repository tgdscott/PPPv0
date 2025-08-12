#!/usr/bin/env python3
"""
apply_mvp_patches.py — One-click patcher for PPPv0
"""
import argparse, re, sys, shutil
from pathlib import Path

def slurp(p: Path) -> str:
    return p.read_text(encoding="utf-8", errors="ignore")

def spit(p: Path, s: str):
    p.write_text(s, encoding="utf-8")

def backup(p: Path):
    bak = p.with_suffix(p.suffix + ".bak")
    shutil.copy2(p, bak)
    return bak

def patch_main_remove_duplicate_auth(src: str) -> (str, int):
    pattern = re.compile(r'^[ \t]*app\.include_router\(\s*auth\.router\s*\)\s*\r?\n', re.M)
    new_src, n = pattern.subn("", src, count=1)
    return new_src, n

def add_publish_alias(src: str) -> (str, int):
    pattern = re.compile(r'^([ \t]*)@router\.post\(\s*([\'"])/publish/\{episode_id\}\2\s*(,.*)?\)\s*$', re.M)
    def repl(m):
        indent = m.group(1)
        extra = m.group(3) or ""
        alias = indent + '@router.post("/{episode_id}/publish"' + (extra if extra else "") + ")\n"
        return m.group(0) + "\n" + alias
    new_src, n = pattern.subn(repl, src, count=1)
    return new_src, n

def replace_status_endpoint(src: str) -> (str, int):
    dec_pat = re.compile(r'^([ \t]*)@router\.get\(\s*["\']/status/\{job_id\}["\']\s*\)\s*$', re.M)
    m = dec_pat.search(src)
    if not m:
        return src, 0
    start = m.start()
    indent = m.group(1)
    tail = src[m.end():]
    next_dec = re.search(r'^\s*@router\.(get|post|put|patch|delete)\(', tail, re.M)
    end = m.end() + (next_dec.start() if next_dec else len(tail))

    template = (
        '{IND}@router.get("/status/{{job_id}}")\n'
        '{IND}async def get_job_status(job_id: str):\n'
        '{IND}    task = celery_app.AsyncResult(job_id)\n'
        '{IND}    status = getattr(task, "status", "PENDING")\n'
        '{IND}    result = getattr(task, "result", None)\n'
        '{IND}\n'
        '{IND}    # Celery may return a JSON string; normalize\n'
        '{IND}    payload = None\n'
        '{IND}    try:\n'
        '{IND}        if isinstance(result, str):\n'
        '{IND}            import json as _json\n'
        '{IND}            payload = _json.loads(result)\n'
        '{IND}        elif isinstance(result, dict):\n'
        '{IND}            payload = result\n'
        '{IND}    except Exception:\n'
        '{IND}        payload = {{"raw_result": str(result)}}\n'
        '{IND}\n'
        '{IND}    if status == "SUCCESS":\n'
        '{IND}        ep_id = None\n'
        '{IND}        if isinstance(payload, dict):\n'
        '{IND}            ep_id = payload.get("episode_id")\n'
        '{IND}        return {{"job_id": job_id, "status": "processed", "episode": {{"id": ep_id}}, "message": (payload or {{}}).get("message")}}\n'
        '{IND}    if status in ("STARTED", "RETRY"):\n'
        '{IND}        return {{"job_id": job_id, "status": "processing"}}\n'
        '{IND}    if status == "PENDING":\n'
        '{IND}        return {{"job_id": job_id, "status": "queued"}}\n'
        '{IND}    # FAILURE or anything else\n'
        '{IND}    err = None\n'
        '{IND}    if isinstance(payload, dict):\n'
        '{IND}        err = payload.get("error") or payload.get("detail")\n'
        '{IND}    if not err:\n'
        '{IND}        err = str(result)\n'
        '{IND}    return {{"job_id": job_id, "status": "error", "error": err}}\n'
    )
    new_block = template.replace("{IND}", indent)
    new_src = src[:start] + new_block + src[end:]
    return new_src, 1

def ensure_gitignore(root: Path) -> int:
    gi = root / ".gitignore"
    if not gi.exists():
        lines = []
    else:
        lines = gi.read_text(encoding="utf-8", errors="ignore").splitlines()
    add = [
        "podcast-pro-plus/database.db",
        "podcast-pro-plus/media_uploads/",
        "podcast-pro-plus/final_episodes/",
        "*.sqlite",
        "*.db",
    ]
    wrote = 0
    for a in add:
        if not any(l.strip() == a for l in lines):
            lines.append(a); wrote += 1
    if wrote:
        gi.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return wrote

def main():
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True, help="Path to PPPv0 repo root (contains frontend/ and podcast-pro-plus/)")
    ap.add_argument("--dry-run", action="store_true", help="Show changes but do not write files")
    ap.add_argument("--no-backup", action="store_true", help="Do not create .bak backups")
    args = ap.parse_args()

    root = Path(args.repo).resolve()
    ep = root / "podcast-pro-plus" / "api" / "routers" / "episodes.py"
    mp = root / "podcast-pro-plus" / "api" / "main.py"

    if not ep.exists() or not mp.exists():
        print("Could not find expected files. Ensure --repo points to the project root.")
        print(f"Looked for: {ep} and {mp}")
        sys.exit(1)

    # episodes.py
    src_ep = slurp(ep)
    ep2, n_status = replace_status_endpoint(src_ep)
    ep3, n_alias = add_publish_alias(ep2)

    # main.py
    src_mp = slurp(mp)
    mp2, n_auth = patch_main_remove_duplicate_auth(src_mp)

    # Report
    print(f"[episodes.py] status-normalized: {bool(n_status)}, publish-alias-added: {bool(n_alias)}")
    print(f"[main.py] duplicate-auth-removed: {bool(n_auth)}")

    if args.dry_run:
        print("Dry run; no files written.")
        return

    if not args.no_backup:
        backup(ep); backup(mp)

    if ep3 != src_ep:
        spit(ep, ep3); print(f"Updated {ep}")
    if mp2 != src_mp:
        spit(mp, mp2); print(f"Updated {mp}")

    # .gitignore
    w = ensure_gitignore(root)
    if w:
        print(f"Updated .gitignore with {w} entries.")
    else:
        print(".gitignore already had the needed entries or file missing.")

    print("Done. Restart your backend & Celery worker and test assemble → status → publish.")

if __name__ == "__main__":
    main()
