# Audio Streaming Application

This is a comprehensive audio streaming solution that enables chunk-by-chunk audio playback using MPEG-DASH. The application consists of a FastAPI backend for audio processing and streaming, and a React frontend for user interaction.

## Features

- Upload and process audio files (MP3, WAV, AAC)
- Convert audio to DASH segments for streaming
- Adaptive bitrate streaming support
- Modern web interface with Material-UI
- Real-time audio playback using Shaka Player

## Prerequisites

- Python 3.8+
- Node.js 14+
- FFmpeg installed on your system
- Modern web browser with MSE support

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

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # macOS/Linux
   python -m venv venv
   source venv/bin/activate
   ```

3. Upgrade pip and install dependencies:
   ```bash
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## Running the Application

### Start the Backend Server

1. Make sure you're in the backend directory and your virtual environment is activated
2. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload
   ```
   The server will start on http://localhost:8000

### Start the Frontend Development Server

1. Make sure you're in the frontend directory
2. Start the React development server:
   ```bash
   npm run dev
   ```
   The application will open in your browser at http://localhost:3000

## Usage

1. Open the web application in your browser
2. Click the "Upload Audio" button to select an audio file
3. Wait for the file to be processed
4. Select the processed file from the list to start playback
5. Use the audio player controls to play, pause, and adjust volume

## API Endpoints

- `POST /upload`: Upload and process an audio file
- `GET /files`: List all processed audio files
- `GET /stream/{filename}/manifest`: Get the DASH manifest for a file
- `GET /stream/{filename}/segment/{segment_name}`: Get an audio segment

## Technical Details

- The backend uses FastAPI for the HTTP server and FFmpeg for audio processing
- Audio files are segmented using MPEG-DASH format
- The frontend uses React with Material-UI for the interface
- Shaka Player handles the DASH playback in the browser

## License

MIT 