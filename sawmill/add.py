from celery import Celery
from celery import task, current_task
from celery.result import AsyncResult
from celery import states
import json

celery = Celery()
celery.config_from_object("celeryconfig")

@celery.task
def run(input):
    numbers = json.loads(input)
    return numbers[0] + numbers[1]
