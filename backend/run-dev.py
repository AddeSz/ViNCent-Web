import os

import uvicorn
from dotenv import load_dotenv

load_dotenv()
PORT = int(os.getenv("BACKEND_PORT", "8000"))

def main():
    print(f"\nRunning dev backend on http://localhost:{PORT}\n")
    uvicorn.run("src.main:app", host="0.0.0.0", port=PORT, reload=True)

if __name__ == "__main__":
    main()