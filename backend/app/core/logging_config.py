import logging
import sys

from pythonjsonlogger import jsonlogger


def setup_logging():
    logger = logging.getLogger()

    logger.setLevel(logging.INFO)

    log_handler = logging.StreamHandler(sys.stdout)

    formatter = jsonlogger.JsonFormatter(
        "%(asctime)s %(levelname)s %(name)s %(message)s"
    )

    log_handler.setFormatter(formatter)

    logger.handlers.clear()
    logger.addHandler(log_handler)
