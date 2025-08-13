import uuid
from sqlalchemy import event

try:
    # Adjust the import path if your models live elsewhere
    from api.models import Episode  # type: ignore
except Exception as e:  # pragma: no cover
    raise RuntimeError("Update db_listeners import to your Episode model") from e

def _to_uuid(val):
    if val is None:
        return None
    if isinstance(val, uuid.UUID):
        return val
    s = str(val)
    try:
        # Accept 32-hex or dashed
        if len(s) == 32 and "-" not in s:
            return uuid.UUID(hex=s)
        return uuid.UUID(s)
    except Exception:
        # Not a UUID; return original so we don't mask bad inputs
        return val

@event.listens_for(Episode, "before_insert")
def episode_before_insert(mapper, connection, target):
    # Coerce string IDs to real UUID objects if possible
    try:
        if hasattr(target, "template_id"):
            target.template_id = _to_uuid(getattr(target, "template_id"))
        if hasattr(target, "podcast_id"):
            target.podcast_id = _to_uuid(getattr(target, "podcast_id"))
        if hasattr(target, "id"):
            target.id = _to_uuid(getattr(target, "id"))
        if hasattr(target, "user_id"):
            target.user_id = _to_uuid(getattr(target, "user_id"))
    except Exception:
        # Let the normal exception handler surface any issues
        pass
