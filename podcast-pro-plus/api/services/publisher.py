import json
import os
from typing import Any, Dict, List, Tuple, Optional

import requests


class SpreakerClient:
    """
    Minimal, stable client used by our API for:
      - listing shows for the authenticated user
      - uploading an episode (kept as-is, but not changed in this patch)
    """

    BASE_URL = "https://api.spreaker.com/v2"

    def __init__(self, api_token: str):
        self.api_token = api_token
        self.session = requests.Session()
        self.session.headers.update({"Authorization": f"Bearer {self.api_token}"})

    def _get(self, path: str, params: Optional[Dict[str, Any]] = None) -> Tuple[bool, Any]:
        try:
            r = self.session.get(f"{self.BASE_URL}{path}", params=params, timeout=30)
            if r.status_code // 100 != 2:
                return False, f"GET {path} -> {r.status_code}: {r.text}"
            data = r.json()
            return True, data.get("response", data)
        except Exception as e:
            return False, str(e)

    def _post(self, path: str, data: Dict[str, Any], files: Optional[Dict[str, Any]] = None) -> Tuple[bool, Any]:
        try:
            r = self.session.post(f"{self.BASE_URL}{path}", data=data, files=files, timeout=120)
            if r.status_code // 100 != 2:
                return False, f"POST {path} -> {r.status_code}: {r.text}"
            data = r.json()
            return True, data.get("response", data)
        except Exception as e:
            return False, str(e)

    # ------------ Public API ------------

    def get_shows(self) -> Tuple[bool, List[Dict[str, Any]]]:
        """
        Returns (ok, shows)
        Each item has at least: show_id, title
        """
        ok, me = self._get("/me")
        if not ok:
            return False, f"/me error: {me}"
        user = me.get("user")
        if not user or "user_id" not in user:
            return False, "No user_id in /me response"

        user_id = user["user_id"]
        ok, shows_resp = self._get(f"/users/{user_id}/shows", params={"limit": 100})
        if not ok:
            return False, f"/users/{user_id}/shows error: {shows_resp}"

        items = shows_resp.get("items", [])
        # Normalize: ensure show_id is present and title exists
        cleaned = []
        for it in items:
            if "show_id" in it and "title" in it:
                cleaned.append(it)
        return True, cleaned

    def upload_episode(
        self,
        show_id: str,
        title: str,
        file_path: str,
        description: Optional[str] = None,
        publish_state: Optional[str] = None,   # 'unpublished'|'public' (we map to Spreaker visibility)
        auto_published_at: Optional[str] = None,
        image_file: Optional[str] = None,
    ) -> Tuple[bool, Any]:
        """
        Kept unchanged in behavior from prior working state; accepts optional image_file.
        """
        if not os.path.isfile(file_path):
            return False, f"media file not found: {file_path}"

        files = {
            "media_file": (os.path.basename(file_path), open(file_path, "rb"), "audio/mpeg"),
        }
        if image_file and os.path.isfile(image_file):
            files["image_file"] = (os.path.basename(image_file), open(image_file, "rb"), "image/png")

        data = {
            "title": title,
        }
        if description:
            data["description"] = description

        # Map our publish_state to Spreaker visibility
        if publish_state == "unpublished":
            data["visibility"] = "PRIVATE"
        elif publish_state == "limited":
            data["visibility"] = "LIMITED"
        else:
            data["visibility"] = "PUBLIC"

        if auto_published_at:
            data["auto_published_at"] = auto_published_at  # "YYYY-MM-DD HH:MM:SS" UTC

        ok, resp = self._post(f"/shows/{show_id}/episodes", data=data, files=files)
        # Close opened files
        for f in files.values():
            try:
                f[1].close()
            except Exception:
                pass

        if not ok:
            return False, resp

        # Expect resp like {"episode": {...}}
        ep = resp.get("episode")
        if not ep:
            return False, f"unexpected response: {resp}"
        return True, {"episode_id": ep.get("episode_id")}
