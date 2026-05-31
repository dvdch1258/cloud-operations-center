from fastapi import FastAPI

app = FastAPI(
    title="Cloud Operations Center",
    version="0.1.0"
)


@app.get("/health")
def health():
    return {
        "status": "ok"
    }
