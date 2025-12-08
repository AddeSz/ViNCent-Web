import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .cache_utils import CACHE_DIR, CACHE_ENABLED
from .parsers import parse_network_file
from .preprocessing import process_network

logging.basicConfig(
    level=logging.DEBUG,
    format="[%(levelname)s] %(name)s: %(message)s"
)
logging.getLogger("python_multipart.multipart").setLevel(logging.ERROR)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    if CACHE_ENABLED:
        try:
            CACHE_DIR.mkdir(parents=True, exist_ok=True)
            logger.info(f"Cache directory initialized at {CACHE_DIR}")
        except Exception as e:
            logger.error(f"Failed to create cache directory: {e}")
    
    yield


app = FastAPI(title="Centrality API", version="1.0.0", lifespan=lifespan)
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/validate-network")
async def validate_network(file: UploadFile = File(...)):
    try:
        content = await file.read()
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="No filename provided"
            )
            
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
        
        data = parse_network_file(content, file_extension)
        
        processed = process_network(data)

        return JSONResponse(content=processed)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in validate_network: {e}", exc_info=True)
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to process network: {str(e)}"
        )