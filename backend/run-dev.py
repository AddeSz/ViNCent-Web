import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()
PORT = int(os.getenv("BACKEND_PORT"))

def main():
    print(f"\nRunning dev backend on http://localhost:{PORT}\n")
    uvicorn.run("src.main:app", host="127.0.0.1", port=PORT, reload=True)

if __name__ == "__main__":
    main()