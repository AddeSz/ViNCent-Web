import uvicorn
import os
from dotenv import load_dotenv

load_dotenv()
PORT = int(os.getenv("BACKEND_PORT"))

def main():
    print(f"\nRunning prod backend on http://localhost:{PORT}\n")
    uvicorn.run("src.main:app", host="0.0.0.0", port=PORT, reload=False)
    
if __name__ == "__main__":
    main()