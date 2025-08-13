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
