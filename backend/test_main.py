import pytest
from pathlib import Path
import shutil
from main import process_audio, UPLOAD_DIR, SEGMENTS_DIR
import os

START_DIR = Path(os.getcwd())
TEST_UPLOAD_DIR = START_DIR / UPLOAD_DIR / Path("test")
TEST_SEGMENTS_DIR = START_DIR / SEGMENTS_DIR / Path("test")

def cleanup_dirs():
    shutil.rmtree(TEST_UPLOAD_DIR, ignore_errors=True)
    shutil.rmtree(TEST_SEGMENTS_DIR, ignore_errors=True)

@pytest.fixture
def test_dirs():
    """Create and clean up test directories"""
    # Create test directories
    TEST_UPLOAD_DIR.mkdir(exist_ok=True)
    TEST_SEGMENTS_DIR.mkdir(exist_ok=True)
    
    yield
    
    # Cleanup after tests
    cleanup_dirs()

@pytest.fixture
def sample_audio_file(test_dirs):
    """Create a sample audio file for testing"""
    # # Create a dummy audio file
    # audio_path = UPLOAD_DIR / "test_audio.mp3"
    # with open(audio_path, "wb") as f:
    #     # Write some dummy data
    #     f.write(b"dummy audio data")
    audio_path = START_DIR / Path("data") / Path("01-Main Theme, Pt. 1.mp3")
    return audio_path

@pytest.mark.asyncio
async def test_process_audio_success(sample_audio_file):
    """Test successful audio processing"""
    output_dir = TEST_SEGMENTS_DIR
    
    # Process the audio file
    success = await process_audio(sample_audio_file, output_dir)
    
    # Check if processing was successful
    assert success is True
    # Check if output directory was created
    assert output_dir.exists()
    # Check if manifest file was created
    assert (output_dir / "manifest.mpd").exists()
    # Cleanup
    cleanup_dirs()

@pytest.mark.asyncio
async def test_process_audio_invalid_file(test_dirs):
    """Test audio processing with invalid file"""
    # Create a non-existent file path
    invalid_file = TEST_UPLOAD_DIR / "nonexistent.mp3"
    output_dir = TEST_SEGMENTS_DIR
    
    # Process the invalid audio file
    success = await process_audio(invalid_file, output_dir)
    
    # Check if processing failed
    assert success is False
    # Cleanup
    cleanup_dirs()


if __name__ == "__main__":
    pytest.main()