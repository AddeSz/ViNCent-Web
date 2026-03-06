import logging
import os
import random
import time

from celery import Celery

from .config import ALL_COMMUNITY_ALGORITHMS
from .parsers import parse_network_file
from .preprocessing import process_network
from .types import CentralityType

logging.basicConfig(
    level=logging.DEBUG,
    format="[%(levelname)s] %(name)s: %(message)s"
)
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
def process_network_task(self, file_content: bytes, file_extension: str, centralities: list, communities: list):
    try:
        self.update_state(state="PROCESSING", meta={"status": "Parsing file..."})
        
        data = parse_network_file(file_content, file_extension)
        
        self.update_state(state="PROCESSING", meta={"status": "Processing network..."})
        
        selected_centralities = []
        if centralities:
            selected_centralities = [
                CentralityType(c) for c in centralities
                if c in [ct.value for ct in CentralityType]
            ]
        
        selected_communities = []
        if communities:
            selected_communities = [
                algo for algo in communities
                if algo in [a.value for a in ALL_COMMUNITY_ALGORITHMS]
            ]
        
        self.update_state(state="PROCESSING", meta={"status": "Calculating metrics..."})
        
        processed = process_network(
            data, 
            selected_centralities,
            selected_communities
        )
        
        return processed
        
    except Exception as e:
        logger.error(f"Error processing network in Celery task: {e}", exc_info=True)
        self.update_state(state="FAILURE", meta={"error": str(e)})
        raise


@celery_app.task
def random_number(max_value: int):
    time.sleep(5)
    return random.randint(0, max_value)