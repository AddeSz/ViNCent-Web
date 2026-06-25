import logging
import os
from typing import cast

from celery import Celery, Task

from .parsers import parse_network_file
from .preprocessing import process_network
from .types import CentralityType, CommunityType

logger = logging.getLogger(__name__)

celery_app = Celery(
    "network_processor",
    broker=os.getenv("CELERY_BROKER_URL"),
    backend=os.getenv("CELERY_BACKEND_URL")
)

celery_app.conf.update(
    task_track_started=True,
    task_send_sent_event=True,
    worker_send_task_events=True,
)


#Test setup for tasks, future work.
@celery_app.task(bind=True)
def _process_network_task(self, file_content: bytes, file_extension: str, centralities: list, communities: list):
    try:
        self.update_state(state="PROCESSING", meta={"status": "Parsing file..."})
        
        data = parse_network_file(file_content, file_extension)
        selected_centralities = [CentralityType(c) for c in (centralities or [])]
        selected_communities = [CommunityType(c) for c in (communities or [])]

        self.update_state(state="PROCESSING", meta={"status": "Calculating metrics..."})
        
        progress_callback = make_progress_callback(self)

        processed = process_network(
            data,
            selected_centralities,
            selected_communities,
            progress_callback=progress_callback,
        )
        
        return processed
        
    except Exception as e:
        logger.error(f"Error processing network in Celery task: {e}", exc_info=True)
        self.update_state(
            state="FAILURE",
            meta={
                "exc_type": type(e).__name__,
                "exc_message": str(e),
            }
        )
        raise

# celery lacks type stubs, @task returns a task at runtime, but pylance sees a plain function
# cast restores .delay() and .apply_async() for type checking and this does not affect runtime
process_network_task = cast(Task, _process_network_task)

def make_progress_callback(task):
    def callback(name: str, metric_index: int, metric_total: int, timestep_index: int, timestep_total: int):
        task.update_state(
            state="PROGRESS",
            meta={
                "metric": name,
                "metric_index": metric_index,
                "metric_total": metric_total,
                "timestep_index": timestep_index,
                "timestep_total": timestep_total,
            }
        )
    return callback