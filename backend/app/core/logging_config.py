import logging

from opentelemetry import trace


class TraceContextFilter(logging.Filter):
    """Añade trace_id y span_id de OpenTelemetry a cada LogRecord."""

    def filter(self, record: logging.LogRecord) -> bool:
        span = trace.get_current_span()
        context = span.get_span_context()

        if context.is_valid:
            record.trace_id = f"{context.trace_id:032x}"
            record.span_id = f"{context.span_id:016x}"
        else:
            record.trace_id = "0" * 32
            record.span_id = "0" * 16

        return True


def configure_logging() -> None:
    formatter = logging.Formatter(
        "%(asctime)s %(levelname)s %(name)s "
        "trace_id=%(trace_id)s span_id=%(span_id)s "
        "%(message)s"
    )

    trace_filter = TraceContextFilter()
    configured_handlers = set()

    for logger_name in ("", "uvicorn", "uvicorn.error", "uvicorn.access", "fastapi"):
        logger = logging.getLogger(logger_name)

        for handler in logger.handlers:
            handler_id = id(handler)

            if handler_id in configured_handlers:
                continue

            handler.addFilter(trace_filter)
            handler.setFormatter(formatter)
            configured_handlers.add(handler_id)

    root_logger = logging.getLogger()

    if not root_logger.handlers:
        handler = logging.StreamHandler()
        handler.addFilter(trace_filter)
        handler.setFormatter(formatter)
        root_logger.addHandler(handler)

    root_logger.setLevel(logging.INFO)
