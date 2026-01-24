from .api import router as api_router
from .admin import router as admin_router
from .misc import router as misc_router
from .pages import router as pages_router

__all__ = ["api_router", "admin_router", "pages_router", "misc_router"]
