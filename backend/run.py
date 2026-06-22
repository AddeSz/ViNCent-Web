import argparse
import os

import uvicorn
from dotenv import load_dotenv

load_dotenv()
PORT = int(os.getenv("BACKEND_PORT", "8000"))

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument( "--reload", action="store_true", help="Enable auto-reload on code changes (use in development only)")
    args = parser.parse_args()

    print(f"\nRunning dev backend on http://localhost:{PORT}\n")
    uvicorn.run("src.main:app", host="0.0.0.0", port=PORT, reload=args.reload)

if __name__ == "__main__":
    main()