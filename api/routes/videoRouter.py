import asyncio
import os
import subprocess
import tempfile
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

router = APIRouter()

FFMPEG_TIMEOUT = 300

def cleanup_temp_files(*paths):
    for path in paths:
        if os.path.exists(path):
            try:
                os.remove(path)
            except Exception:
                pass

def run_ffmpeg(cmd: list) -> tuple[int, str]:
    """Run ffmpeg synchronously — works on Windows and Linux."""
    result = subprocess.run(
        ["ffmpeg"] + cmd,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        timeout=FFMPEG_TIMEOUT
    )
    return result.returncode, result.stderr.decode(errors="replace")


@router.get("/video_converter")
def video_health():
    return {"message": "Video API is running 🚀"}


@router.post("/convert-video")
async def convert_video(
    file: UploadFile = File(...),
    output_format: str = Form("mp4")
):
    allowed_outputs = {
        "mp4":  "video/mp4",
        "mkv":  "video/x-matroska",
        "webm": "video/webm"
    }

    if output_format not in allowed_outputs:
        raise HTTPException(status_code=400, detail="Unsupported format.")

    temp_dir    = tempfile.gettempdir()
    unique_id   = os.urandom(4).hex()
    input_path  = os.path.join(temp_dir, f"conv_in_{unique_id}_{file.filename}")
    output_path = os.path.join(temp_dir, f"conv_out_{unique_id}.{output_format}")

    # Write file in chunks
    try:
        with open(input_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                buffer.write(chunk)
    except Exception as e:
        cleanup_temp_files(input_path)
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")

    if output_format == "mp4":
        cmd = ["-y", "-i", input_path, "-c:v", "libx264", "-preset", "ultrafast",
               "-pix_fmt", "yuv420p", "-c:a", "aac", output_path]
    elif output_format == "mkv":
        cmd = ["-y", "-i", input_path, "-c:v", "libx264", "-preset", "ultrafast",
               "-c:a", "aac", output_path]
    elif output_format == "webm":
        cmd = ["-y", "-i", input_path, "-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0",
               "-deadline", "realtime", "-cpu-used", "8", "-c:a", "libopus", output_path]

    # ✅ Run ffmpeg in thread pool — works on Windows
    try:
        loop = asyncio.get_event_loop()
        returncode, stderr_text = await loop.run_in_executor(None, run_ffmpeg, cmd)
    except subprocess.TimeoutExpired:
        cleanup_temp_files(input_path, output_path)
        raise HTTPException(status_code=504, detail="FFmpeg timed out. Try a smaller file.")

    if returncode != 0:
        cleanup_temp_files(input_path, output_path)
        raise HTTPException(status_code=500, detail=f"FFmpeg failed: {stderr_text[-500:]}")

    if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
        cleanup_temp_files(input_path, output_path)
        raise HTTPException(status_code=500, detail="Output file is empty.")

    return FileResponse(
        path=output_path,
        media_type=allowed_outputs[output_format],
        filename=f"converted.{output_format}",
        background=BackgroundTask(cleanup_temp_files, input_path, output_path)
    )


@router.post("/trim-video")
async def trim_video(
    file: UploadFile = File(...),
    start_time: float = Form(0.0),
    end_time:   float = Form(10.0)
):
    if start_time < 0 or end_time <= start_time:
        raise HTTPException(status_code=400, detail="Invalid timestamps.")

    temp_dir    = tempfile.gettempdir()
    unique_id   = os.urandom(4).hex()
    input_path  = os.path.join(temp_dir, f"trim_in_{unique_id}_{file.filename}")
    output_path = os.path.join(temp_dir, f"trim_out_{unique_id}.mp4")

    try:
        with open(input_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                buffer.write(chunk)
    except Exception as e:
        cleanup_temp_files(input_path)
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")

    cmd = ["-y", "-i", input_path,
           "-ss", str(start_time), "-to", str(end_time),
           "-c:v", "libx264", "-preset", "ultrafast",
           "-pix_fmt", "yuv420p", "-c:a", "aac", output_path]

    try:
        loop = asyncio.get_event_loop()
        returncode, stderr_text = await loop.run_in_executor(None, run_ffmpeg, cmd)
    except subprocess.TimeoutExpired:
        cleanup_temp_files(input_path, output_path)
        raise HTTPException(status_code=504, detail="FFmpeg trim timed out.")

    if returncode != 0:
        cleanup_temp_files(input_path, output_path)
        raise HTTPException(status_code=500, detail=f"FFmpeg trim failed: {stderr_text[-500:]}")

    if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
        cleanup_temp_files(input_path, output_path)
        raise HTTPException(status_code=500, detail="Trimmed output is empty.")

    return FileResponse(
        path=output_path,
        media_type="video/mp4",
        filename=f"trimmed_{file.filename}",
        background=BackgroundTask(cleanup_temp_files, input_path, output_path)
    )




import asyncio
import os
import subprocess
import tempfile
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

router = APIRouter()

FFMPEG_TIMEOUT = 300  # 5 minutes

def cleanup_temp_files(*paths):
    for path in paths:
        if os.path.exists(path):
            try:
                os.remove(path)
            except Exception:
                pass

def run_ffmpeg(cmd: list) -> tuple:
    """Works on Windows + Linux — runs ffmpeg in a normal thread."""
    result = subprocess.run(
        ["ffmpeg"] + cmd,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        timeout=FFMPEG_TIMEOUT
    )
    return result.returncode, result.stderr.decode(errors="replace")


# =====================================================================
# HEALTH CHECK
# =====================================================================
@router.get("/video_converter")
def video_health():
    return {"message": "Video API is running 🚀"}


# =====================================================================
# 1. VIDEO CONVERTER
# =====================================================================
@router.post("/convert-video")
async def convert_video(
    file: UploadFile = File(...),
    output_format: str = Form("mp4")
):
    allowed_outputs = {
        "mp4":  "video/mp4",
        "mkv":  "video/x-matroska",
        "webm": "video/webm"
    }

    if output_format not in allowed_outputs:
        raise HTTPException(status_code=400, detail="Unsupported format. Use mp4, mkv or webm.")

    temp_dir    = tempfile.gettempdir()
    unique_id   = os.urandom(4).hex()
    input_path  = os.path.join(temp_dir, f"conv_in_{unique_id}_{file.filename}")
    output_path = os.path.join(temp_dir, f"conv_out_{unique_id}.{output_format}")

    # Stream upload in chunks — never loads full video into RAM
    try:
        with open(input_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):  # 1 MB
                buffer.write(chunk)
    except Exception as e:
        cleanup_temp_files(input_path)
        raise HTTPException(status_code=500, detail=f"Upload write failed: {e}")

    if output_format == "mp4":
        cmd = ["-y", "-i", input_path, "-c:v", "libx264", "-preset", "ultrafast",
               "-pix_fmt", "yuv420p", "-c:a", "aac", output_path]
    elif output_format == "mkv":
        cmd = ["-y", "-i", input_path, "-c:v", "libx264", "-preset", "ultrafast",
               "-c:a", "aac", output_path]
    elif output_format == "webm":
        cmd = ["-y", "-i", input_path, "-c:v", "libvpx-vp9", "-crf", "30", "-b:v", "0",
               "-deadline", "realtime", "-cpu-used", "8", "-c:a", "libopus", output_path]

    try:
        loop = asyncio.get_event_loop()
        returncode, stderr_text = await loop.run_in_executor(None, run_ffmpeg, cmd)
    except subprocess.TimeoutExpired:
        cleanup_temp_files(input_path, output_path)
        raise HTTPException(status_code=504, detail="FFmpeg timed out. Try a smaller file.")

    if returncode != 0:
        cleanup_temp_files(input_path, output_path)
        raise HTTPException(status_code=500, detail=f"FFmpeg failed: {stderr_text[-500:]}")

    if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
        cleanup_temp_files(input_path, output_path)
        raise HTTPException(status_code=500, detail="Output file is empty.")

    return FileResponse(
        path=output_path,
        media_type=allowed_outputs[output_format],
        filename=f"converted.{output_format}",
        background=BackgroundTask(cleanup_temp_files, input_path, output_path)
    )


# =====================================================================
# 2. VIDEO TRIMMER
# =====================================================================
@router.post("/trim-video")
async def trim_video(
    file: UploadFile = File(...),
    start_time: float = Form(0.0),
    end_time:   float = Form(10.0)
):
    if start_time < 0:
        raise HTTPException(status_code=400, detail="Start time cannot be negative.")
    if end_time <= start_time:
        raise HTTPException(status_code=400, detail="End time must be greater than start time.")

    temp_dir    = tempfile.gettempdir()
    unique_id   = os.urandom(4).hex()
    input_path  = os.path.join(temp_dir, f"trim_in_{unique_id}_{file.filename}")
    output_path = os.path.join(temp_dir, f"trim_out_{unique_id}.mp4")

    try:
        with open(input_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                buffer.write(chunk)
    except Exception as e:
        cleanup_temp_files(input_path)
        raise HTTPException(status_code=500, detail=f"Upload write failed: {e}")

    cmd = [
        "-y", "-i", input_path,
        "-ss", str(start_time),
        "-to", str(end_time),
        "-c:v", "libx264", "-preset", "ultrafast",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        output_path
    ]

    try:
        loop = asyncio.get_event_loop()
        returncode, stderr_text = await loop.run_in_executor(None, run_ffmpeg, cmd)
    except subprocess.TimeoutExpired:
        cleanup_temp_files(input_path, output_path)
        raise HTTPException(status_code=504, detail="FFmpeg trim timed out.")

    if returncode != 0:
        cleanup_temp_files(input_path, output_path)
        raise HTTPException(status_code=500, detail=f"FFmpeg trim failed: {stderr_text[-500:]}")

    if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
        cleanup_temp_files(input_path, output_path)
        raise HTTPException(status_code=500, detail="Trimmed output is empty.")

    return FileResponse(
        path=output_path,
        media_type="video/mp4",
        filename=f"trimmed_{file.filename}",
        background=BackgroundTask(cleanup_temp_files, input_path, output_path)
    )




FFMPEG_TIMEOUT = 600

# ✅ FIXED CRF values — previous values were too aggressive
# CRF scale: 0 = lossless, 18 = near lossless, 51 = worst
# Human eye cannot notice difference below CRF 24
QUALITY_PRESETS = {
    "high":   {"crf": "18", "preset": "slow"},    # near lossless, bigger file
    "medium": {"crf": "23", "preset": "medium"},   # ffmpeg default, barely noticeable
    "low":    {"crf": "28", "preset": "fast"},     # visibly smaller, still watchable
}

def cleanup_temp_files(*paths):
    for path in paths:
        if os.path.exists(path):
            try:
                os.remove(path)
            except Exception:
                pass

def run_ffmpeg(cmd: list) -> tuple:
    result = subprocess.run(
        ["ffmpeg"] + cmd,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        timeout=FFMPEG_TIMEOUT
    )
    return result.returncode, result.stderr.decode(errors="replace")


@router.get("/compress-video")
def compress_health():
    return {"message": "Video Compressor API is running 🚀"}


@router.post("/compress-video")
async def compress_video(
    file: UploadFile = File(...),
    quality: str = Form("medium")
):
    if quality not in QUALITY_PRESETS:
        raise HTTPException(status_code=400, detail="Quality must be: high, medium or low.")

    temp_dir    = tempfile.gettempdir()
    unique_id   = os.urandom(4).hex()
    input_path  = os.path.join(temp_dir, f"comp_in_{unique_id}_{file.filename}")
    output_path = os.path.join(temp_dir, f"comp_out_{unique_id}.mp4")

    try:
        with open(input_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                buffer.write(chunk)
    except Exception as e:
        cleanup_temp_files(input_path)
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")

    preset = QUALITY_PRESETS[quality]

    cmd = [
        "-y", "-i", input_path,
        "-c:v", "libx264",
        "-crf",    preset["crf"],      # ✅ quality controlled here
        "-preset", preset["preset"],
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",                # ✅ higher audio bitrate (was 128k)
        "-movflags", "+faststart",
        output_path
    ]

    try:
        loop = asyncio.get_event_loop()
        returncode, stderr_text = await loop.run_in_executor(None, run_ffmpeg, cmd)
    except subprocess.TimeoutExpired:
        cleanup_temp_files(input_path, output_path)
        raise HTTPException(status_code=504, detail="Compression timed out.")

    if returncode != 0:
        cleanup_temp_files(input_path, output_path)
        raise HTTPException(status_code=500, detail=f"FFmpeg failed: {stderr_text[-500:]}")

    if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
        cleanup_temp_files(input_path, output_path)
        raise HTTPException(status_code=500, detail="Compressed output is empty.")

    compressed_size = os.path.getsize(output_path)
    base_name = os.path.splitext(file.filename or "video")[0]

    return FileResponse(
        path=output_path,
        media_type="video/mp4",
        filename=f"{base_name}_compressed.mp4",
        headers={"X-Compressed-Size": str(compressed_size)},
        background=BackgroundTask(cleanup_temp_files, input_path, output_path)
    )



FFMPEG_TIMEOUT = 300  # 5 minutes

def cleanup_temp_files(*paths):
    for path in paths:
        if os.path.exists(path):
            try:
                os.remove(path)
            except Exception:
                pass

def run_ffmpeg(cmd: list) -> tuple:
    """Works on Windows + Linux."""
    result = subprocess.run(
        ["ffmpeg"] + cmd,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
        timeout=FFMPEG_TIMEOUT
    )
    return result.returncode, result.stderr.decode(errors="replace")


@router.get("/make-gif")
def gif_health():
    return {"message": "GIF Maker API is running 🚀"}


@router.post("/make-gif")
async def make_gif(
    file:       UploadFile = File(...),
    start_time: float      = Form(0.0),
    end_time:   float      = Form(5.0),
    fps:        int        = Form(15),
    width:      int        = Form(480),
):
    # Validate inputs
    if start_time < 0:
        raise HTTPException(status_code=400, detail="Start time cannot be negative.")
    if end_time <= start_time:
        raise HTTPException(status_code=400, detail="End time must be greater than start time.")
    if end_time - start_time > 30:
        raise HTTPException(status_code=400, detail="Maximum clip length is 30 seconds.")
    if not (1 <= fps <= 30):
        raise HTTPException(status_code=400, detail="FPS must be between 1 and 30.")
    if not (100 <= width <= 1280):
        raise HTTPException(status_code=400, detail="Width must be between 100 and 1280.")

    temp_dir     = tempfile.gettempdir()
    unique_id    = os.urandom(4).hex()
    input_path   = os.path.join(temp_dir, f"gif_in_{unique_id}_{file.filename}")
    palette_path = os.path.join(temp_dir, f"gif_palette_{unique_id}.png")
    output_path  = os.path.join(temp_dir, f"gif_out_{unique_id}.gif")

    # Stream upload in chunks
    try:
        with open(input_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):
                buffer.write(chunk)
    except Exception as e:
        cleanup_temp_files(input_path)
        raise HTTPException(status_code=500, detail=f"Upload failed: {e}")

    loop = asyncio.get_event_loop()

    # ── Step 1: Generate palette for high quality GIF colors ─────────────────
    # Without this step GIFs look washed out and grainy
    palette_cmd = [
        "-y",
        "-ss", str(start_time),
        "-to", str(end_time),
        "-i",  input_path,
        "-vf", f"fps={fps},scale={width}:-1:flags=lanczos,palettegen=stats_mode=diff",
        palette_path
    ]

    try:
        returncode, stderr_text = await loop.run_in_executor(None, run_ffmpeg, palette_cmd)
    except subprocess.TimeoutExpired:
        cleanup_temp_files(input_path, palette_path, output_path)
        raise HTTPException(status_code=504, detail="Palette generation timed out.")

    if returncode != 0:
        cleanup_temp_files(input_path, palette_path, output_path)
        raise HTTPException(status_code=500, detail=f"Palette generation failed: {stderr_text[-500:]}")

    # ── Step 2: Render GIF using the palette ──────────────────────────────────
    gif_cmd = [
        "-y",
        "-ss", str(start_time),
        "-to", str(end_time),
        "-i",  input_path,
        "-i",  palette_path,
        "-lavfi", f"fps={fps},scale={width}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle",
        output_path
    ]

    try:
        returncode, stderr_text = await loop.run_in_executor(None, run_ffmpeg, gif_cmd)
    except subprocess.TimeoutExpired:
        cleanup_temp_files(input_path, palette_path, output_path)
        raise HTTPException(status_code=504, detail="GIF rendering timed out.")

    if returncode != 0:
        cleanup_temp_files(input_path, palette_path, output_path)
        raise HTTPException(status_code=500, detail=f"GIF render failed: {stderr_text[-500:]}")

    if not os.path.exists(output_path) or os.path.getsize(output_path) == 0:
        cleanup_temp_files(input_path, palette_path, output_path)
        raise HTTPException(status_code=500, detail="GIF output is empty.")

    base_name = os.path.splitext(file.filename or "video")[0]

    return FileResponse(
        path=output_path,
        media_type="image/gif",
        filename=f"{base_name}.gif",
        background=BackgroundTask(cleanup_temp_files, input_path, palette_path, output_path)
    )