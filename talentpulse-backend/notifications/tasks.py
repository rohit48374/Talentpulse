# NOTIFICATIONS MODULE - tasks.py
from celery import shared_task
import threading
import logging
from notifications.emails import EmailService

logger = logging.getLogger(__name__)

@shared_task(name='notifications.tasks.send_async_email_task')
def send_async_email_task(method_name, *args, **kwargs):
    """Celery worker task to execute EmailService methods asynchronously"""
    logger.info(f"CELERY WORKER: executing async email {method_name} with args {args}")
    try:
        method = getattr(EmailService, method_name)
        result = method(*args, **kwargs)
        return result
    except Exception as e:
        logger.error(f"CELERY WORKER ERROR: failed to run email task {method_name}: {str(e)}")
        return False


def dispatch_email(method_name, *args, **kwargs):
    """
    Main dispatch helper for HRMS developers.
    Spawns a fast daemon thread to execute the entire dispatch pipeline asynchronously.
    Inside the thread, it attempts Celery queueing with retry=False.
    If Celery connection fails, times out, or has result backend errors,
    it falls back to direct SMTP. This guarantees 0ms lag to the DRF API caller!
    """
    def thread_dispatcher():
        try:
            # Attempt Celery queueing with retry=False to fail fast if Redis is down
            send_async_email_task.apply_async(
                args=[method_name] + list(args),
                kwargs=kwargs,
                retry=False,
                retry_policy={'max_retries': 0}
            )
            logger.info(f"EMAIL ENGINE: successfully queued {method_name} via Celery apply_async")
        except Exception as cel_err:
            logger.warning(f"EMAIL ENGINE: Celery/Redis connection failed. Falling back to direct SMTP! Error: {str(cel_err)}")
            try:
                # Direct SMTP fallback execution
                method = getattr(EmailService, method_name)
                method(*args, **kwargs)
            except Exception as smtp_err:
                logger.error(f"EMAIL ENGINE DIRECT SMTP ERROR: failed to send {method_name}: {str(smtp_err)}")

    t = threading.Thread(target=thread_dispatcher, daemon=True)
    t.start()
