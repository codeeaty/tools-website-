import io
import os
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
import math
import subprocess
import tempfile
# 👇 FIX 1: Import and run static_ffmpeg FIRST before touching pydub!
import static_ffmpeg
static_ffmpeg.add_paths()

# Now it is safe to import pydub
from pydub import AudioSegment

router = APIRouter()



SUPPORTED_FORMATS_Audio = {"mp3", "wav", "ogg", "flac"}
FORMAT_MIME_Audio = {
    "mp3": "audio/mpeg",
    "wav": "audio/wav",
    "ogg": "audio/ogg",
    "flac": "audio/flac",
}

@router.post("/convert-audio")
async def convert_audio(
    file: UploadFile = File(...),
    target_format: str = Form("mp3"),
    bitrate: str = Form("192k")
):
    fmt = target_format.lower().strip()
    if fmt not in SUPPORTED_FORMATS_Audio:
        raise HTTPException(status_code=400, detail="Unsupported target format.")

    filename = file.filename or "audio"
    _, ext = os.path.splitext(filename.lower())
    source_fmt = ext.replace(".", "")

    # 👇 FIX 2 & 3: Handle empty extensions and safely accept mp4 video containers
    if not source_fmt:
        source_fmt = None  # Tells pydub to auto-detect headers if extension is missing
    elif source_fmt == "mp4":
        source_fmt = "mp4" # Tells pydub to cleanly demux the audio track from the video

    contents = await file.read()

    try:
        audio_stream = io.BytesIO(contents)
        # Pydub now has the correct static binaries injected perfectly
        audio = AudioSegment.from_file(audio_stream, format=source_fmt)

        output_buffer = io.BytesIO()
        export_kwargs = {"format": fmt}
        if fmt == "mp3":
            export_kwargs["bitrate"] = bitrate

        audio.export(output_buffer, **export_kwargs)
        output_buffer.seek(0)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcoding failed: {str(e)}")

    base_name = filename.rsplit(".", 1)[0]
    out_filename = f"{base_name}_converted.{fmt}"

    return StreamingResponse(
        output_buffer,
        media_type=FORMAT_MIME_Audio[fmt],
        headers={"Content-Disposition": f'attachment; filename="{out_filename}"'}
    )


@router.post("/trim-audio")
async def trim_audio(
    file: UploadFile = File(...),
    start_time: float = Form(0.0),  # in seconds
    end_time: float = Form(10.0),   # in seconds
):
    filename = file.filename or "audio"
    _, ext = os.path.splitext(filename.lower())
    source_fmt = ext.replace(".", "")

    if not source_fmt:
        source_fmt = None
    elif source_fmt == "mp4":
        source_fmt = "mp4"

    if start_time < 0 or end_time <= start_time:
        raise HTTPException(
            status_code=400, 
            detail="Invalid timestamps. Start time must be less than end time."
        )

    contents = await file.read()

    try:
        audio_stream = io.BytesIO(contents)
        audio = AudioSegment.from_file(audio_stream, format=source_fmt)

        # ── Convert seconds to milliseconds for Pydub ────────────────────────
        start_ms = int(start_time * 1000)
        end_ms = int(end_time * 1000)

        # Slice the audio track
        trimmed_audio = audio[start_ms:end_ms]

        # Export setup
        output_buffer = io.BytesIO()
        out_fmt = "mp3" if source_fmt == "mp4" or not source_fmt else source_fmt
        
        if out_fmt not in FORMAT_MIME_Audio:
            out_fmt = "mp3" # Fallback safeguard

        trimmed_audio.export(output_buffer, format=out_fmt)
        output_buffer.seek(0)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trimming pipeline failed: {str(e)}")

    base_name = filename.rsplit(".", 1)[0]
    out_filename = f"{base_name}_trimmed.{out_fmt}"

    return StreamingResponse(
        output_buffer,
        media_type=FORMAT_MIME_Audio[out_fmt],
        headers={"Content-Disposition": f'attachment; filename="{out_filename}"'}
    )



@router.post("/boost-volume")
async def boost_volume(
    file: UploadFile = File(...),
    volume_multiplier: float = Form(1.5)  # e.g., 1.5x, 2.0x, 3.0x volume
):
    if volume_multiplier <= 0:
        raise HTTPException(status_code=400, detail="Volume multiplier must be greater than 0.")
    
    # Cap amplification at 5.0x (+14 dB) as a safety measure for user headphones
    if volume_multiplier > 5.0:
        volume_multiplier = 5.0

    filename = file.filename or "audio"
    _, ext = os.path.splitext(filename.lower())
    source_fmt = ext.replace(".", "")

    if not source_fmt:
        source_fmt = None
    elif source_fmt == "mp4":
        source_fmt = "mp4"

    contents = await file.read()

    try:
        audio_stream = io.BytesIO(contents)
        audio = AudioSegment.from_file(audio_stream, format=source_fmt)

        # ── Calculate Decibel Gain ───────────────────────────────────────────
        # Formula converts raw acoustic multipliers to formal decibel additions
        gain_db = 20 * math.log10(volume_multiplier)

        # Apply gain directly to the audio segment matrix
        boosted_audio = audio + gain_db

        # Export setup
        output_buffer = io.BytesIO()
        out_fmt = "mp3" if source_fmt == "mp4" or not source_fmt else source_fmt
        
        if out_fmt not in FORMAT_MIME_Audio:
            out_fmt = "mp3"

        boosted_audio.export(output_buffer, format=out_fmt)
        output_buffer.seek(0)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Amplification matrix failure: {str(e)}")

    base_name = filename.rsplit(".", 1)[0]
    out_filename = f"{base_name}_boosted.{out_fmt}"

    return StreamingResponse(
        output_buffer,
        media_type=FORMAT_MIME_Audio[out_fmt],
        headers={"Content-Disposition": f'attachment; filename="{out_filename}"'}
    )




@router.post("/remove-noise")
async def remove_noise(
    file: UploadFile = File(...),
    reduction_db: float = Form(12.0)  # Noise reduction intensity in dB (range: 1 to 97)
):
    # Enforce safe bounds for FFmpeg FFT Denoiser
    if reduction_db < 1.0:
        reduction_db = 1.0
    elif reduction_db > 50.0:
        reduction_db = 50.0  # Cap at 50dB to avoid robotic frequency distortion

    filename = file.filename or "audio"
    _, ext = os.path.splitext(filename.lower())
    source_fmt = ext.replace(".", "")

    # Handle video file extracts smoothly
    out_fmt = "mp3" if source_fmt == "mp4" or not source_fmt else source_fmt
    if out_fmt not in FORMAT_MIME_Audio:
        out_fmt = "mp3"

    contents = await file.read()

    # Create safe isolated system files for command line ingestion
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as temp_in:
        temp_in.write(contents)
        temp_in_path = temp_in.name

    temp_out_path = temp_in_path + f"_clean.{out_fmt}"

    try:
        # afftdn options: nr = noise reduction amount in dB. Default is 12.
        filter_configuration = f"afftdn=nr={reduction_db}"

        # Construct the execution command array
        cmd = [
            "ffmpeg", "-y",
            "-i", temp_in_path,
            "-af", filter_configuration,
            temp_out_path
        ]

        # Execute system process thread via subprocess
        process = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        if process.returncode != 0:
            raise HTTPException(
                status_code=500, 
                detail=f"FFmpeg FFT internal exception: {process.stderr}"
            )

        # Read processed audio data back to an architecture buffer
        with open(temp_out_path, "rb") as processed_file:
            clean_bytes = processed_file.read()

        output_buffer = io.BytesIO(clean_bytes)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Spectral gating pipeline failed: {str(e)}")
        
    finally:
        # Strict filesystem clean up block to prevent disk capacity leaks
        if os.path.exists(temp_in_path):
            os.remove(temp_in_path)
        if os.path.exists(temp_out_path):
            os.remove(temp_out_path)

    base_name = filename.rsplit(".", 1)[0]
    out_filename = f"{base_name}_clean.{out_fmt}"

    return StreamingResponse(
        output_buffer,
        media_type=FORMAT_MIME_Audio[out_fmt],
        headers={"Content-Disposition": f'attachment; filename="{out_filename}"'}
    )