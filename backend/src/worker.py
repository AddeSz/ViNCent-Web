import json
import logging
import os
from typing import Optional, cast

from celery import Celery, Task
from redis import Redis

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
    worker_prefetch_multiplier=1, #necessary for queue tracking, losing a bit of performance but it doesn't matter as the tasks take long time anyway
    task_acks_late=True,
    task_reject_on_worker_lost=True,
)

# Separate raw redis client for queue inspection
_redis_client: Optional["Redis"] = None


def _get_redis_client() -> "Redis":
    global _redis_client
    if _redis_client is None:
        broker_url = os.getenv("CELERY_BROKER_URL")
        if not broker_url:
            raise RuntimeError("CELERY_BROKER_URL is not set")
        _redis_client = Redis.from_url(broker_url)
    return _redis_client

def get_queue_position(
    task_id: str,
    queue_name: str = "celery",
    cache_ttl_seconds: int = 5,
) -> tuple[Optional[int], int]:
    client = _get_redis_client()
    cache_key = f"queue_position_cache:{queue_name}:{task_id}"

    if cache_ttl_seconds > 0:
        try:
            cached = client.get(cache_key)
        except Exception as e:
            logger.warning(f"Could not read queue position cache: {e}")
            cached = None

        if cached is not None:
            try:
                cached_data = json.loads(cached)
                return cached_data["position"], cached_data["queue_length"]
            except (json.JSONDecodeError, KeyError, TypeError):
                pass

    try:
        # LRANGE copies the whole list to inspect it! (CAN BE SLOW but it works ok from my testing)
        # We grab queue_length & queue_position from the same snapshot (we avoid race conditions).
        raw_messages = client.lrange(queue_name, 0, -1)
    except Exception as e:
        logger.warning(f"Could not inspect Redis queue '{queue_name}': {e}")
        return None, 0

    queue_length = len(raw_messages)
    position = None

    for index, raw_message in enumerate(raw_messages):
        try:
            message = json.loads(raw_message)
        except (json.JSONDecodeError, TypeError):
            continue

        message_id = message.get("headers", {}).get("id")

        if message_id == task_id:
            position = queue_length - 1 - index
            break

    if cache_ttl_seconds > 0:
        try:
            client.setex(
                cache_key,
                cache_ttl_seconds,
                json.dumps({"position": position, "queue_length": queue_length}),
            )
        except Exception as e:
            logger.warning(f"Could not write queue position cache: {e}")

    return position, queue_length

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

# celery lacks type stubs, @task returns a task at runtime, but pylance sees a plain function
# cast restores .delay() and .apply_async() for type checking and this does not affect runtime
process_network_task = cast(Task, _process_network_task)