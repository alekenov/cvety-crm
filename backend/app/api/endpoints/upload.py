import os
import uuid
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
import aiofiles

from app.api import deps
from app.core.config import get_settings
from app.models.shop import Shop

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Allowed image extensions
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/images", status_code=201)
async def upload_images(
    files: List[UploadFile] = File(...),
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop)  # Require auth
):
    """
    Upload multiple images and return their URLs.
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    uploaded_urls = []
    
    for file in files:
        # Validate file extension
        file_ext = os.path.splitext(file.filename)[1].lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File {file.filename} has invalid extension. Allowed: {ALLOWED_EXTENSIONS}"
            )
        
        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save file
        try:
            content = await file.read()
            
            # Check file size
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=400,
                    detail=f"File {file.filename} exceeds maximum size of 5MB"
                )
            
            # Write file
            async with aiofiles.open(file_path, 'wb') as f:
                await f.write(content)
            
            # Generate URL (in production, this would be a CDN URL)
            file_url = f"/uploads/{unique_filename}"
            uploaded_urls.append({
                "original_name": file.filename,
                "url": file_url,
                "size": len(content)
            })
            
        except Exception as e:
            # Clean up any partially uploaded files
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(status_code=500, detail=f"Failed to upload {file.filename}: {str(e)}")
    
    return {
        "message": f"Successfully uploaded {len(uploaded_urls)} images",
        "images": uploaded_urls
    }


@router.post("/image", status_code=201)
async def upload_single_image(
    file: UploadFile = File(...),
    db: Session = Depends(deps.get_db),
    _: Shop = Depends(deps.get_current_shop)  # Require auth
):
    """
    Upload a single image and return its URL.
    """
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension. Allowed: {ALLOWED_EXTENSIONS}"
        )
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    # Save file
    try:
        content = await file.read()
        
        # Check file size
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"File exceeds maximum size of 5MB"
            )
        
        # Write file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(content)
        
        # Generate URL
        file_url = f"/uploads/{unique_filename}"
        
        return {
            "message": "Image uploaded successfully",
            "url": file_url,
            "original_name": file.filename,
            "size": len(content)
        }
        
    except Exception as e:
        # Clean up
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")