# Audio Streaming Backend

A FastAPI-based backend service for audio streaming that processes audio files and serves them using MPEG-DASH format.

## Features

- Audio file upload and processing
- MPEG-DASH segmentation for adaptive streaming
- Support for multiple audio formats (MP3, WAV, AAC)
- Efficient chunk-based streaming
- RESTful API endpoints for file management

## Prerequisites

- Python 3.8 or higher
- FFmpeg installed on your system
- Virtual environment tool (venv)

### FFmpeg Installation

#### Windows
1. Download FFmpeg from https://ffmpeg.org/download.html
2. Extract the files to a directory (e.g., `C:\ffmpeg`)
3. Add the `bin` directory to your system PATH
4. Verify installation by running `ffmpeg -version` in a terminal

#### macOS
```bash
brew install ffmpeg
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install ffmpeg
```

## Installation

1. Create a virtual environment:
   ```bash
   # Windows
   python -m venv venv
   
   # macOS/Linux
   python -m venv venv
   ```

2. Activate the virtual environment:
   ```bash
   # Windows
   .\venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. Upgrade pip and install dependencies:
   ```bash
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

## Running the Server

1. Make sure your virtual environment is activated
2. Start the server:
   ```bash
   uvicorn main:app --reload
   ```
   The server will start on http://localhost:8000

## API Endpoints

### File Management

- `POST /upload`
  - Upload and process an audio file
  - Accepts multipart/form-data with audio file
  - Returns success message and filename

- `GET /files`
  - List all processed audio files
  - Returns array of file objects with name and manifest URL

### Streaming

- `GET /stream/{filename}/manifest`
  - Get the DASH manifest file for a specific audio file
  - Returns the .mpd manifest file

- `GET /stream/{filename}/segment/{segment_name}`
  - Get a specific audio segment
  - Returns the requested audio segment file

## Project Structure

```
backend/
├── main.py              # Main FastAPI application
├── requirements.txt     # Python dependencies
├── uploads/            # Temporary storage for uploaded files
├── segments/           # Processed audio segments
└── manifests/          # DASH manifest files
```

## Technical Details

### Audio Processing

The backend uses FFmpeg to:
- Convert audio files to DASH-compatible format
- Create audio segments for streaming
- Generate DASH manifest files

### File Management

- Uploaded files are temporarily stored in the `uploads` directory
- Processed segments are stored in the `segments` directory
- Each audio file gets its own subdirectory for segments and manifest

### Streaming Implementation

- Uses MPEG-DASH for adaptive streaming
- Segments are 4 seconds long by default
- Supports multiple audio qualities (128k AAC)
- Uses HTTP/1.1 for delivery

## Error Handling

The backend includes error handling for:
- Invalid file uploads
- Missing files
- Processing failures
- Invalid requests

## Development

To modify the backend:

1. Make sure all dependencies are installed
2. Run the server with reload flag for development:
   ```bash
   uvicorn main:app --reload
   ```
3. The server will automatically reload when changes are detected

## Testing

To test the API endpoints:

1. Start the server
2. Use tools like curl or Postman to make requests
3. Example curl command for file upload:
   ```bash
   curl -X POST -F "file=@audio.mp3" http://localhost:8000/upload
   ```

## License

MIT 