import random
import time

import requests

BASE_URL = "http://backend:8000"


def create_service():
    payload = {
        "name": random.choice([
            "VPN Producción",
            "Grafana",
            "Tempo",
            "PostgreSQL",
            "Prometheus"
        ]),
        "type": random.choice([
            "vpn",
            "dashboard",
            "tracing",
            "database",
            "monitoring"
        ]),
        "endpoint": random.choice([
            "10.0.0.1",
            "http://grafana:3000",
            "http://tempo:3200",
            "postgres:5432",
            "http://prometheus:9090"
        ])
    }

    requests.post(f"{BASE_URL}/services/", json=payload, timeout=3)


def get_services():
    requests.get(f"{BASE_URL}/services/", timeout=3)


def get_dashboard():
    requests.get(f"{BASE_URL}/dashboard/summary", timeout=3)


def get_incidents():
    requests.get(f"{BASE_URL}/incidents/", timeout=3)


while True:
    action = random.choice([
        create_service,
        get_services,
        get_dashboard,
        get_incidents
    ])

    try:
        action()
        print(f"Executed {action.__name__}", flush=True)
    except Exception as error:
        print(f"Error executing {action.__name__}: {error}", flush=True)

    time.sleep(5)
