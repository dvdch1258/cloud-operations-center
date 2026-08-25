import argparse
import json
from pathlib import Path

from app.core.database import SessionLocal
from app.services.vulnerability_import_service import (
    import_trivy_report,
)


def main():
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--component",
        required=True,
        choices=("backend", "frontend"),
    )

    parser.add_argument(
        "--file",
        required=True,
    )

    args = parser.parse_args()

    data = json.loads(
        Path(args.file).read_text()
    )

    db = SessionLocal()

    try:
        scan = import_trivy_report(
            db,
            args.component,
            data,
        )

        db.commit()

        print(
            f"scan_id={scan.id} "
            f"component={scan.component} "
            f"total={scan.total} "
            f"unique={scan.unique_vulnerabilities} "
            f"critical={scan.critical} "
            f"high={scan.high} "
            f"medium={scan.medium} "
            f"low={scan.low} "
            f"unknown={scan.unknown}"
        )

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    main()
