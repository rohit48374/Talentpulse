import logging
import datetime
from django.utils.deprecation import MiddlewareMixin

logger = logging.getLogger(__name__)


class AuditLoggingMiddleware(MiddlewareMixin):
    """Middleware for audit logging"""
    
    def process_request(self, request):
        request.start_time = datetime.datetime.now()
        return None
    
    def process_response(self, request, response):
        if hasattr(request, 'user') and request.user.is_authenticated:
            duration = (datetime.datetime.now() - request.start_time).total_seconds()
            
            # Log sensitive operations
            if request.method in ['POST', 'PUT', 'DELETE', 'PATCH']:
                logger.info(
                    f"User: {request.user.id} | Method: {request.method} | "
                    f"Path: {request.path} | Status: {response.status_code} | Duration: {duration}s"
                )
        
        return response


class RequestLoggingMiddleware(MiddlewareMixin):
    """Middleware for request/response logging"""
    
    def process_request(self, request):
        logger.debug(f"Incoming request: {request.method} {request.path}")
        return None
