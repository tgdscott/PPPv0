from fastapi import APIRouter
from starlette.responses import RedirectResponse

router = APIRouter(tags=["media"])

@router.post("/api/media/upload/cover_art")
def media_cover_art_alias():
    # 307 preserves POST + multipart body so the upload continues as-is
    return RedirectResponse(url="/api/media/upload/episode_cover", status_code=307)
