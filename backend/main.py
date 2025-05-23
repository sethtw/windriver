import re
from fastapi import FastAPI, HTTPException, UploadFile, File, Request, Response
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import ffmpeg
import os
import json
from pathlib import Path
import shutil
import subprocess
from typing import List
import aiofiles
import asyncio
from datetime import datetime

app = FastAPI(title="Audio Streaming Server")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "HEAD", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

APP_DIR = Path(r"C:\repos\windriver\backend")
os.chdir(APP_DIR)
BACKEND_DIR = APP_DIR
# Create necessary directories
UPLOAD_DIR = BACKEND_DIR / Path("uploads")
SEGMENTS_DIR = BACKEND_DIR / Path("segments")

for directory in [UPLOAD_DIR, SEGMENTS_DIR]:
    directory.mkdir(exist_ok=True)

# Global variable to track the FFmpeg process
current_stream_process = None

async def delete_upload(input_file: Path):
    """Delete the uploaded file"""
    os.remove(input_file)

async def delete_segments(input_path: Path):
    """Delete the segments directory"""
    os.rmdir(input_path)

def standardize_filename(input_file: Path) -> Path:
    """Standardize the filename"""
    original_filename = input_file.stem
    original_extension = input_file.suffix
    # Remove periods and commas
    standardized_filename = original_filename.replace('.', '').replace(',', '')
    # Replace spaces and special characters with underscores
    standardized_filename = re.sub(r'[^a-zA-Z0-9]', '_', standardized_filename)
    # Add the original extension
    standardized_filename = standardized_filename + original_extension
    return Path(standardized_filename)

async def capture_and_stream_system_audio():
    """Capture and stream system audio"""
    global current_stream_process
    streamId = Path(f"stream_{datetime.now().strftime('%Y%m%d%H%M%S')}")
    output_dir = SEGMENTS_DIR / standardize_filename(streamId).stem
    print("Initiating new stream:", output_dir)

    try:
        # Create output directory if it doesn't exist
        output_dir.mkdir(exist_ok=True)
        
        # Store the original working directory
        original_dir = os.getcwd()

        try:
            # Change to output directory for FFmpeg
            os.chdir(output_dir)

            # Generate DASH segments using FFmpeg
            cmd = [
                "ffmpeg", "-f",
                "dshow", "-i", "audio=CABLE Output (VB-Audio Virtual Cable)",
                "-map", "0:a",
                "-c:a", "aac", "-b:a", "128k",
                "-vf", "asetnsamples=n=1024:p=0",
                "-f", "dash",
                "-seg_duration", "4",
                "-use_timeline", "1",
                "-use_template", "1",
                "-window_size", "10",
                "-extra_window_size", "5",
                "-remove_at_exit", "0",
                "-hls_playlist", "0",
                str(output_dir / "manifest.mpd")
            ]
            
            current_stream_process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await current_stream_process.communicate()
            
            if current_stream_process.returncode != 0:
                raise Exception(f"FFmpeg error: {stderr.decode()}")
            
        except Exception as e:
            print(f"Error processing audio: {str(e)}")
            return False
                
        finally:
            # Always change back to the original directory
            os.chdir(original_dir)
            
        return True
    except Exception as e:
        print(f"Error processing audio: {str(e)}")
        return False

async def process_audio(input_file: Path, output_dir: Path):
    """Process audio file and create DASH segments"""
    try:
        # Create output directory if it doesn't exist
        output_dir.mkdir(exist_ok=True)
        
        # Store the original working directory
        original_dir = os.getcwd()

        try:
            # Change to output directory for FFmpeg
            os.chdir(output_dir)

            # Generate DASH segments using FFmpeg
            cmd = [
                "ffmpeg", "-i", str(input_file),
                "-c:a", "aac", "-b:a", "128k",
                "-map", "0:a:0",
                "-f", "dash",
                "-seg_duration", "4",
                "-use_timeline", "1",
                "-use_template", "1",
                str(output_dir / "manifest.mpd")
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                raise Exception(f"FFmpeg error: {stderr.decode()}")
            
        except Exception as e:
            print(f"Error processing audio: {str(e)}")
            return False
                
        finally:
            # Always change back to the original directory
            os.chdir(original_dir)
            
        return True
    except Exception as e:
        print(f"Error processing audio: {str(e)}")
        return False

@app.get("/audio-devices")
async def get_audio_devices():
    """Get audio devices"""
    # Generate DASH segments using FFmpeg
    cmd = [
        "ffmpeg", "-list_devices", "true",
        "-f", "dshow", "-i", "dummy"
    ]
    
    process = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    
    stdout, stderr = await process.communicate()
    
    devices = stdout.decode() + stderr.decode()
    print("Devices:", devices)
    return devices

@app.post("/upload")
async def upload_audio(file: UploadFile = File(...)):
    """Upload and process audio file"""
    try:
        # Save uploaded file
        upload_path = UPLOAD_DIR / file.filename
        print("upload_path", upload_path)
        async with aiofiles.open(upload_path, 'wb') as out_file:
            content = await file.read()
            await out_file.write(content)
        
        # Process the audio file
        standardized_filename = standardize_filename(Path(file.filename))
        output_dir = SEGMENTS_DIR / standardized_filename.stem
        print("output_dir", output_dir)
        success = await process_audio(upload_path, output_dir)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to process audio file")
        
        # Remove the uploaded file
        await delete_upload(upload_path)
        
        return {"message": "File uploaded and processed successfully", "filename": standardized_filename.stem}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/files")
async def list_files():
    """List all processed audio files"""
    files = []
    for directory in SEGMENTS_DIR.iterdir():
        if directory.is_dir():
            manifest_path = directory / "manifest.mpd"
            if manifest_path.exists():
                files.append({
                    "name": directory.name,
                    "manifest_url": f"/stream/{directory.name}/manifest"
                })
    print("Available files:", files)
    return files

@app.post("/capture-and-stream")
async def capture_and_stream():
    """Capture and stream system audio"""
    success = await capture_and_stream_system_audio()
    if not success:
        raise HTTPException(status_code=500, detail="Failed to capture and stream system audio")
    return {"message": "System audio captured and streaming..."}

@app.route("/stream/{filename}/manifest", methods=["GET", "HEAD"])
async def get_manifest(request: Request):
    """Get DASH manifest file"""
    filename = request.path_params["filename"]
    manifest_path = SEGMENTS_DIR / Path(filename).stem / "manifest.mpd"
    print(f"Requested manifest: {manifest_path}")
    if not manifest_path.exists():
        raise HTTPException(status_code=404, detail="Manifest not found")
    return FileResponse(
        manifest_path,
        media_type="application/dash+xml"
    )

@app.get("/stream/{filename}/{segment_name}")
async def get_direct_segment(filename: str, segment_name: str):
    """Get audio segment file directly"""
    segment_path = SEGMENTS_DIR / Path(filename).stem / segment_name
    print(f"Requested direct segment: {segment_path}")
    if not segment_path.exists():
        raise HTTPException(status_code=404, detail="Segment not found")
    return FileResponse(
        segment_path,
        media_type="audio/mp4"
    )

@app.post("/stop-streaming")
async def stop_streaming():
    """Stop the current audio stream"""
    global current_stream_process
    if current_stream_process:
        try:
            current_stream_process.terminate()
            await current_stream_process.wait()
            current_stream_process = None
            return {"message": "Streaming stopped successfully"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to stop streaming: {str(e)}")
    else:
        raise HTTPException(status_code=400, detail="No active stream to stop")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 