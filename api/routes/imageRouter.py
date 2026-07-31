from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse
from PIL import Image
import io
from rembg import remove

# Optional: if pillow-avif-plugin is installed, it registers automatically on import
# try:
#     import pillow_avif
# except ImportError:
#     pass



# 1. Keep ONLY the router here. Do not create app = FastAPI() in this file.
router = APIRouter(
    tags=["Image Tools"]
)

SUPPORTED_FORMATS = {"jpeg", "png", "webp", "avif", "gif", "bmp"}

FORMAT_MIME = {
    "jpeg": "image/jpeg",
    "png":  "image/png",
    "webp": "image/webp",
    "avif": "image/avif",
    "gif":  "image/gif",
    "bmp":  "image/bmp",
}

PILLOW_FORMAT = {
    "jpeg": "JPEG",
    "png":  "PNG",
    "webp": "WEBP",
    "avif": "AVIF",
    "gif":  "GIF",
    "bmp":  "BMP",
}

# 2. Changed from @app.get to @router.get
# If using the prefix above, this will be: http://127.0.0.1:8000/image/resizeimage
@router.get("/resizeimage")
def root():
    return {"message": "ToolKit Image API is running 🚀"}

# 3. Changed from @app.post to @router.post
# If using the prefix above, this will be: http://127.0.0.1:8000/image/resize
@router.post("/resize")
async def resize_image(

    file: UploadFile = File(...),
    width: int = Form(...),
    height: int = Form(...),
    format: str = Form("jpeg"),
    quality: int = Form(90),
    maintain_aspect_ratio: bool = Form(False),
):
    # ── Validate format ──────────────────────────────────────────────────────
    fmt = format.lower().strip()
    if fmt not in SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{fmt}'. Allowed: {', '.join(SUPPORTED_FORMATS)}",
        )

    # ── Validate dimensions ──────────────────────────────────────────────────
    if width <= 0 or height <= 0:
        raise HTTPException(status_code=400, detail="Width and height must be positive integers.")
    if width > 8000 or height > 8000:
        raise HTTPException(status_code=400, detail="Maximum dimension is 8000px.")

    # ── Validate quality ─────────────────────────────────────────────────────
    quality = max(1, min(100, quality))

    # ── Read & open image ────────────────────────────────────────────────────
    contents = await file.read()
    try:
        img = Image.open(io.BytesIO(contents))
    except Exception:
        raise HTTPException(status_code=422, detail="Could not open the uploaded file as an image.")

    # Convert palette / RGBA images where needed
    if fmt in ("jpeg", "jpg") and img.mode in ("RGBA", "P", "LA"):
        img = img.convert("RGB")
    elif img.mode == "P":
        img = img.convert("RGBA")

    # ── Resize ───────────────────────────────────────────────────────────────
    if maintain_aspect_ratio:
        img.thumbnail((width, height), Image.LANCZOS)
    else:
        img = img.resize((width, height), Image.LANCZOS)

    # ── Encode output ────────────────────────────────────────────────────────
    output = io.BytesIO()

    save_kwargs: dict = {"format": PILLOW_FORMAT[fmt]}
    if fmt in ("jpeg", "jpg", "webp"):
        save_kwargs["quality"] = quality
        save_kwargs["optimize"] = True
    if fmt == "webp":
        save_kwargs["method"] = 6          # best compression
    if fmt == "png":
        save_kwargs["optimize"] = True

    try:
        img.save(output, **save_kwargs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to encode image: {str(e)}")

    output.seek(0)

    filename = f"resized_{width}x{height}.{fmt}"
    return StreamingResponse(
        output,
        media_type=FORMAT_MIME[fmt],
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

@router.post("/convert")
async def convert_image(

    file: UploadFile = File(...),
    format: str = Form("webp"),
    quality: int = Form(90)
):
    # ── 1. Format Standardization ────────────────────────────────────────────
    fmt = format.lower().strip()
    
    # Safety feature: Convert 'jpg' to 'jpeg' to match your 6 exact keys
    if fmt == "jpg":
        fmt = "jpeg"
        
    if fmt not in SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Target format '{fmt}' not supported. Choose from: {', '.join(SUPPORTED_FORMATS)}"
        )

    # ── 2. Quality Normalization ─────────────────────────────────────────────
    quality = max(1, min(100, quality))

    # ── 3. Read Source Payload & Open via Pillow ─────────────────────────────
    contents = await file.read()
    try:
        img = Image.open(io.BytesIO(contents))
    except Exception:
        raise HTTPException(
            status_code=422, 
            detail="Uploaded file payload could not be decoded as a valid image."
        )

    # ── 4. Color Channel Optimization ────────────────────────────────────────
    # JPEG does not support transparency (Alpha channels). Convert to flat RGB.
    if fmt == "jpeg" and img.mode in ("RGBA", "P", "LA"):
        img = img.convert("RGB")
    # If source is Paletted (P) and target supports transparency, scale up to RGBA
    elif img.mode == "P" and fmt in ("png", "webp", "avif", "gif"):
        img = img.convert("RGBA")

    # ── 5. Setup Compression Arguments ───────────────────────────────────────
    output_buffer = io.BytesIO()
    save_kwargs = {"format": PILLOW_FORMAT[fmt]}

    # Inject quality controls for lossy file structures
    if fmt in ("jpeg", "webp", "avif"):
        save_kwargs["quality"] = quality
        save_kwargs["optimize"] = True

    # WebP advanced structural optimization (Method 6 = Max compression ratio)
    if fmt == "webp":
        save_kwargs["method"] = 6

    # Transparent PNG layout pass configurations
    if fmt == "png":
        save_kwargs["optimize"] = True

    # ── 6. Write to Memory Stream & Return ───────────────────────────────────
    try:
        img.save(output_buffer, **save_kwargs)
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Engine failed to encode image structure to metadata format '{fmt}': {str(e)}"
        )

    # Reset buffer position stream marker back to zero
    output_buffer.seek(0)
    
    # Isolate original name prefix to handle clean client-side dynamic downloads
    base_name = file.filename.rsplit(".", 1)[0] if file.filename else "converted"
    target_filename = f"{base_name}.{fmt}"

    return StreamingResponse(
        output_buffer,
        media_type=FORMAT_MIME[fmt],
        headers={"Content-Disposition": f'attachment; filename="{target_filename}"'}
    )



SUPPORTED_OUTPUT_BG = {"png", "webp"}

FORMAT_MIME_BG = {
    "png":  "image/png",
    "webp": "image/webp",
}

PILLOW_FORMAT_BG = {
    "png":  "PNG",
    "webp": "WEBP",
}


@router.post("/remove-background")
async def remove_background(
    file: UploadFile = File(...),
    format: str = Form("png"),
    bg_color: str = Form(None),   # None = transparent, "white", "black", or "#rrggbb"
):
    # ── Validate format ──────────────────────────────────────────────────────
    fmt = format.lower().strip()
    if fmt not in SUPPORTED_OUTPUT_BG:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{fmt}'. Allowed: png, webp",
        )

    # ── Validate file type ───────────────────────────────────────────────────
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=422, detail="File must be an image.")

    # ── Read image ───────────────────────────────────────────────────────────
    contents = await file.read()

    if len(contents) > 15 * 1024 * 1024:   # 15 MB limit
        raise HTTPException(status_code=413, detail="File too large. Max size is 15MB.")

    try:
        input_image = Image.open(io.BytesIO(contents)).convert("RGBA")
    except Exception:
        raise HTTPException(status_code=422, detail="Could not open the uploaded file as an image.")

    # ── Remove background using rembg ────────────────────────────────────────
    try:
        output_image = remove(input_image)   # returns RGBA PIL image
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Background removal failed: {str(e)}")

    # ── Apply background color if requested ─────────────────────────────────
    if bg_color:
        try:
            bg = Image.new("RGBA", output_image.size, parse_color(bg_color))
            bg.paste(output_image, mask=output_image.split()[3])  # use alpha as mask
            output_image = bg.convert("RGB") if fmt != "webp" else bg
        except Exception:
            raise HTTPException(status_code=400, detail=f"Invalid background color: {bg_color}")

    # ── Encode output ────────────────────────────────────────────────────────
    output = io.BytesIO()

    save_kwargs: dict = {"format": PILLOW_FORMAT_BG[fmt]}
    if fmt == "webp":
        save_kwargs["quality"] = 90
        save_kwargs["method"] = 6

    # Keep RGBA for PNG/WEBP transparency
    if bg_color is None:
        final_image = output_image  # already RGBA from rembg
    else:
        final_image = output_image

    try:
        final_image.save(output, **save_kwargs)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to encode image: {str(e)}")

    output.seek(0)

    base_name = file.filename or "image"
    name_without_ext = base_name.rsplit(".", 1)[0]
    out_filename = f"{name_without_ext}_nobg.{fmt}"

    return StreamingResponse(
        output,
        media_type=FORMAT_MIME_BG[fmt],
        headers={"Content-Disposition": f'attachment; filename="{out_filename}"'},
    )


def parse_color(color: str) -> tuple:
    """Parse color string to RGBA tuple."""
    color = color.strip().lower()

    named = {
        "white": (255, 255, 255, 255),
        "black": (0,   0,   0,   255),
        "red":   (255, 0,   0,   255),
        "blue":  (0,   0,   255, 255),
        "green": (0,   128, 0,   255),
    }
    if color in named:
        return named[color]

    # Hex color e.g. #6366f1 or #fff
    if color.startswith("#"):
        hex_color = color[1:]
        if len(hex_color) == 3:
            hex_color = "".join(c * 2 for c in hex_color)
        if len(hex_color) == 6:
            r = int(hex_color[0:2], 16)
            g = int(hex_color[2:4], 16)
            b = int(hex_color[4:6], 16)
            return (r, g, b, 255)

    raise ValueError(f"Cannot parse color: {color}")

SUPPORTED_FORMATS_Compress = {"jpeg", "png", "webp", "avif"}

FORMAT_MIME_Compress = {
    "jpeg": "image/jpeg",
    "png": "image/png",
    "webp": "image/webp",
    "avif": "image/avif",
}

PILLOW_FORMAT_Compress = {
    "jpeg": "JPEG",
    "png": "PNG",
    "webp": "WEBP",
    "avif": "AVIF",
}


@router.post("/compress")
async def compress_image(
    file: UploadFile = File(...),
    format: str = Form("webp"),
    quality: int = Form(80),
    lossless: bool = Form(False),
):
    # ── Validate format ──────────────────────────────────────────────────────
    fmt = format.lower().strip()
    if fmt not in SUPPORTED_FORMATS_Compress:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{fmt}'. Allowed: jpeg, png, webp, avif",
        )

    # ── Validate quality ─────────────────────────────────────────────────────
    quality = max(1, min(100, quality))

    # ── Validate file ────────────────────────────────────────────────────────
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=422, detail="Uploaded file must be an image."
        )

    contents = await file.read()

    if len(contents) > 20 * 1024 * 1024:  # 20 MB limit
        raise HTTPException(
            status_code=413, detail="File too large. Max size is 20MB."
        )

    # ── Open image ───────────────────────────────────────────────────────────
    try:
        img = Image.open(io.BytesIO(contents))
    except Exception:
        raise HTTPException(
            status_code=422, detail="Could not open the uploaded file as an image."
        )

    # ── Convert mode if needed ───────────────────────────────────────────────
    if fmt in ("jpeg",) and img.mode in ("RGBA", "P", "LA"):
        img = img.convert("RGB")
    elif img.mode == "P":
        img = img.convert("RGBA")

    # ── Build save options ───────────────────────────────────────────────────
    output = io.BytesIO()
    save_kwargs: dict = {"format": PILLOW_FORMAT_Compress[fmt]}

    if fmt == "png":
        # PNG lossless — use max compression level (0-9)
        save_kwargs["optimize"] = True
        save_kwargs["compress_level"] = 9

    elif fmt == "jpeg":
        save_kwargs["quality"] = quality
        save_kwargs["optimize"] = True
        save_kwargs["progressive"] = (
            True  # progressive JPEG loads faster in browser
        )

    elif fmt == "webp":
        if lossless:
            save_kwargs["lossless"] = True
            save_kwargs["method"] = 6
        else:
            save_kwargs["quality"] = quality
            save_kwargs["method"] = 6  # slowest but best compression

    elif fmt == "avif":
        save_kwargs["quality"] = quality

    # ── Save ─────────────────────────────────────────────────────────────────
    try:
        img.save(output, **save_kwargs)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Compression failed: {str(e)}"
        )

    output.seek(0)

    # ── Check if compressed is actually smaller ───────────────────────────────
    compressed_size = output.getbuffer().nbytes
    original_size = len(contents)

    # If somehow larger (rare), return original
    if compressed_size >= original_size:
        output = io.BytesIO(contents)
        output.seek(0)

    base_name = (file.filename or "image").rsplit(".", 1)[0]
    out_filename = f"{base_name}_compressed.{fmt}"

    return StreamingResponse(
        output,
        media_type=FORMAT_MIME_Compress[fmt],
        headers={
            "Content-Disposition": f'attachment; filename="{out_filename}"',
            "X-Original-Size": str(original_size),
            "X-Compressed-Size": str(compressed_size),
        },
    )





from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import StreamingResponse
from PIL import Image, ImageFilter, ImageEnhance, ImageDraw, ImageFont
import io
import math



# ── Constants ────────────────────────────────────────────────────────────────

SUPPORTED_OUTPUT = {"png", "jpeg", "webp"}

FORMAT_MIME = {
    "png":  "image/png",
    "jpeg": "image/jpeg",
    "webp": "image/webp",
}

PILLOW_FORMAT = {
    "png":  "PNG",
    "jpeg": "JPEG",
    "webp": "WEBP",
}

# Preset filter configs  →  (brightness, contrast, saturation, hue_shift)
FILTER_PRESETS = {
    "none":     (1.0,  1.0,  1.0,   0),
    "grayscale":(1.0,  1.0,  0.0,   0),
    "sepia":    (1.0,  1.0,  0.5,  15),
    "vivid":    (1.0,  1.1,  1.8,   0),
    "cool":     (1.0,  1.0,  1.2,  30),
    "warm":     (1.05, 1.0,  1.4, -15),
    "fade":     (1.1,  0.9,  0.85,  0),
    "noir":     (0.9,  1.3,  0.0,   0),
    "chrome":   (1.05, 1.15, 2.0,   0),
    "matte":    (1.08, 0.9,  0.9,   0),
    "invert":   (1.0,  1.0,  1.0,   0),   # handled separately
    "polaroid": (1.1,  0.85, 1.3,  10),
}


# ── Helpers ──────────────────────────────────────────────────────────────────

def hex_to_rgb(hex_color: str) -> tuple:
    """Convert #rrggbb or #rgb to (r, g, b)."""
    h = hex_color.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))


def apply_sepia(img: Image.Image) -> Image.Image:
    """Apply a sepia tone to an RGB image."""
    img = img.convert("RGB")
    r, g, b = img.split()

    def sepia_channel(r_val, g_val, b_val):
        nr = min(255, int(r_val * 0.393 + g_val * 0.769 + b_val * 0.189))
        ng = min(255, int(r_val * 0.349 + g_val * 0.686 + b_val * 0.168))
        nb = min(255, int(r_val * 0.272 + g_val * 0.534 + b_val * 0.131))
        return nr, ng, nb

    pixels = [sepia_channel(r, g, b) for r, g, b in zip(
        r.getdata(), g.getdata(), b.getdata()
    )]
    nr_data = [p[0] for p in pixels]
    ng_data = [p[1] for p in pixels]
    nb_data = [p[2] for p in pixels]

    nr = Image.new("L", img.size); nr.putdata(nr_data)
    ng = Image.new("L", img.size); ng.putdata(ng_data)
    nb = Image.new("L", img.size); nb.putdata(nb_data)
    return Image.merge("RGB", (nr, ng, nb))


def apply_adjustments(
    img: Image.Image,
    brightness: float,
    contrast:   float,
    saturation: float,
    sharpness:  float,
    blur:       float,
) -> Image.Image:
    """Apply PIL enhancement adjustments."""
    if brightness != 1.0:
        img = ImageEnhance.Brightness(img).enhance(brightness)
    if contrast != 1.0:
        img = ImageEnhance.Contrast(img).enhance(contrast)
    if saturation != 1.0:
        img = ImageEnhance.Color(img).enhance(saturation)
    if sharpness != 1.0:
        img = ImageEnhance.Sharpness(img).enhance(sharpness)
    if blur > 0:
        img = img.filter(ImageFilter.GaussianBlur(radius=blur))
    return img


def apply_opacity(img: Image.Image, opacity: float) -> Image.Image:
    """Set image opacity (0.0 – 1.0). Converts to RGBA."""
    img = img.convert("RGBA")
    r, g, b, a = img.split()
    a = a.point(lambda v: int(v * opacity))
    return Image.merge("RGBA", (r, g, b, a))


# ── Main edit endpoint ───────────────────────────────────────────────────────

@router.post("/edit")
async def edit_image(
    file: UploadFile = File(...),

    # Output
    output_format: str  = Form("png"),

    # Rotation & flip
    rotation:      float = Form(0),       # degrees  (0, 90, 180, 270 or any)
    flip_h:        bool  = Form(False),   # horizontal flip
    flip_v:        bool  = Form(False),   # vertical flip

    # Crop  (all 0 = no crop)
    crop_x:        int   = Form(0),
    crop_y:        int   = Form(0),
    crop_w:        int   = Form(0),
    crop_h:        int   = Form(0),

    # Adjustments  (frontend sends -100 → +100; we convert to PIL factors)
    brightness:    float = Form(0),   # -100 to +100
    contrast:      float = Form(0),   # -100 to +100
    saturation:    float = Form(0),   # -100 to +100
    blur:          float = Form(0),   # 0 to 20
    sharpness:     float = Form(0),   # -100 to +100 (0 = no change)
    opacity:       float = Form(100), # 0 to 100

    # Filter preset
    filter_preset: str   = Form("none"),

    # Text overlay
    text:          str   = Form(""),
    text_color:    str   = Form("#ffffff"),
    font_size:     int   = Form(32),
    text_position: str   = Form("bottom"),   # top | center | bottom
):
    # ── Validate ─────────────────────────────────────────────────────────────
    fmt = output_format.lower().strip()
    if fmt not in SUPPORTED_OUTPUT:
        raise HTTPException(400, detail=f"Unsupported format '{fmt}'. Use: png, jpeg, webp")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(422, detail="Uploaded file must be an image.")

    contents = await file.read()
    if len(contents) > 25 * 1024 * 1024:
        raise HTTPException(413, detail="File too large. Max 25 MB.")

    # ── Open ─────────────────────────────────────────────────────────────────
    try:
        img = Image.open(io.BytesIO(contents))
    except Exception:
        raise HTTPException(422, detail="Could not open the file as an image.")

    # Preserve RGBA if present, otherwise work in RGBA for full support
    has_alpha = img.mode in ("RGBA", "LA")
    img = img.convert("RGBA")

    # ── 1. Crop ───────────────────────────────────────────────────────────────
    if crop_w > 0 and crop_h > 0:
        iw, ih = img.size
        x1 = max(0, min(crop_x, iw))
        y1 = max(0, min(crop_y, ih))
        x2 = max(0, min(crop_x + crop_w, iw))
        y2 = max(0, min(crop_y + crop_h, ih))
        if x2 > x1 and y2 > y1:
            img = img.crop((x1, y1, x2, y2))

    # ── 2. Rotate ─────────────────────────────────────────────────────────────
    if rotation % 360 != 0:
        img = img.rotate(-rotation, expand=True, resample=Image.BICUBIC)

    # ── 3. Flip ───────────────────────────────────────────────────────────────
    if flip_h:
        img = img.transpose(Image.FLIP_LEFT_RIGHT)
    if flip_v:
        img = img.transpose(Image.FLIP_TOP_BOTTOM)

    # ── 4. Filter preset ──────────────────────────────────────────────────────
    preset = filter_preset.lower().strip()

    if preset == "invert":
        rgb  = img.convert("RGB")
        from PIL import ImageChops
        rgb  = ImageChops.invert(rgb)
        img  = rgb.convert("RGBA")

    elif preset == "grayscale" or preset == "noir":
        img  = img.convert("L").convert("RGBA")
        if preset == "noir":
            brightness += 15   # slight boost for noir already baked in

    elif preset == "sepia" or preset == "polaroid" or preset == "warm":
        rgb = apply_sepia(img.convert("RGB"))
        img = rgb.convert("RGBA")

    if preset in FILTER_PRESETS and preset not in ("none", "invert", "grayscale", "noir"):
        pb, pc, ps, _ = FILTER_PRESETS[preset]
        # Blend preset factors with user adjustments
        brightness += (pb - 1.0) * 100
        contrast   += (pc - 1.0) * 100
        saturation += (ps - 1.0) * 100

    # ── 5. Adjustments  (-100→+100  to  PIL factor) ───────────────────────────
    #   PIL factor: 1.0 = original, 0.0 = none, 2.0 = double
    def to_factor(val: float) -> float:
        return 1.0 + val / 100.0

    img = apply_adjustments(
        img,
        brightness = max(0.0, to_factor(brightness)),
        contrast   = max(0.0, to_factor(contrast)),
        saturation = max(0.0, to_factor(saturation)),
        sharpness  = max(0.0, to_factor(sharpness)),
        blur       = max(0.0, blur),
    )

    # ── 6. Opacity ────────────────────────────────────────────────────────────
    if opacity < 100:
        img = apply_opacity(img, opacity / 100.0)

    # ── 7. Text overlay ───────────────────────────────────────────────────────
    if text.strip():
        try:
            draw = ImageDraw.Draw(img)
            iw, ih = img.size

            # Try to load a font; fall back to default
            try:
                font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
            except Exception:
                font = ImageFont.load_default()

            # Measure text
            bbox = draw.textbbox((0, 0), text, font=font)
            tw   = bbox[2] - bbox[0]
            th   = bbox[3] - bbox[1]
            tx   = (iw - tw) // 2

            if text_position == "top":
                ty = max(10, font_size)
            elif text_position == "center":
                ty = (ih - th) // 2
            else:  # bottom
                ty = ih - th - max(10, font_size)

            # Shadow
            try:
                text_rgb = hex_to_rgb(text_color)
            except Exception:
                text_rgb = (255, 255, 255)

            draw.text((tx + 2, ty + 2), text, font=font, fill=(0, 0, 0, 160))
            draw.text((tx, ty),         text, font=font, fill=(*text_rgb, 255))

        except Exception as e:
            pass   # Text errors are non-fatal

    # ── 8. Convert for output ──────────────────────────────────────────────────
    if fmt == "jpeg":
        # JPEG doesn't support alpha
        background = Image.new("RGB", img.size, (255, 255, 255))
        background.paste(img, mask=img.split()[3] if img.mode == "RGBA" else None)
        img = background
    elif fmt in ("png", "webp"):
        pass   # keep RGBA

    # ── 9. Save ───────────────────────────────────────────────────────────────
    output      = io.BytesIO()
    save_kwargs = {"format": PILLOW_FORMAT[fmt]}

    if fmt == "jpeg":
        save_kwargs["quality"]     = 92
        save_kwargs["optimize"]    = True
        save_kwargs["progressive"] = True
    elif fmt == "webp":
        save_kwargs["quality"] = 92
        save_kwargs["method"]  = 6

    try:
        img.save(output, **save_kwargs)
    except Exception as e:
        raise HTTPException(500, detail=f"Failed to encode image: {str(e)}")

    output.seek(0)

    base_name    = (file.filename or "image").rsplit(".", 1)[0]
    out_filename = f"{base_name}_edited.{fmt}"

    return StreamingResponse(
        output,
        media_type=FORMAT_MIME[fmt],
        headers={"Content-Disposition": f'attachment; filename="{out_filename}"'},
    )


# ── Individual operation endpoints ───────────────────────────────────────────

@router.post("/rotate")
async def rotate_image(
    file:     UploadFile = File(...),
    angle:    float      = Form(...),
    expand:   bool       = Form(True),
    format:   str        = Form("png"),
):
    """Rotate image by given angle."""
    fmt = format.lower()
    if fmt not in SUPPORTED_OUTPUT:
        raise HTTPException(400, detail=f"Unsupported format '{fmt}'.")

    contents = await file.read()
    try:
        img = Image.open(io.BytesIO(contents)).convert("RGBA")
    except Exception:
        raise HTTPException(422, detail="Could not open image.")

    img    = img.rotate(-angle, expand=expand, resample=Image.BICUBIC)
    output = io.BytesIO()

    if fmt == "jpeg":
        img = img.convert("RGB")

    img.save(output, format=PILLOW_FORMAT[fmt], quality=92)
    output.seek(0)

    return StreamingResponse(output, media_type=FORMAT_MIME[fmt],
        headers={"Content-Disposition": f'attachment; filename="rotated.{fmt}"'})


@router.post("/flip")
async def flip_image(
    file:      UploadFile = File(...),
    direction: str        = Form(...),   # horizontal | vertical
    format:    str        = Form("png"),
):
    """Flip image horizontally or vertically."""
    fmt = format.lower()
    if fmt not in SUPPORTED_OUTPUT:
        raise HTTPException(400, detail=f"Unsupported format '{fmt}'.")
    if direction not in ("horizontal", "vertical"):
        raise HTTPException(400, detail="direction must be 'horizontal' or 'vertical'.")

    contents = await file.read()
    try:
        img = Image.open(io.BytesIO(contents)).convert("RGBA")
    except Exception:
        raise HTTPException(422, detail="Could not open image.")

    method = Image.FLIP_LEFT_RIGHT if direction == "horizontal" else Image.FLIP_TOP_BOTTOM
    img    = img.transpose(method)
    output = io.BytesIO()

    if fmt == "jpeg":
        img = img.convert("RGB")

    img.save(output, format=PILLOW_FORMAT[fmt], quality=92)
    output.seek(0)

    return StreamingResponse(output, media_type=FORMAT_MIME[fmt],
        headers={"Content-Disposition": f'attachment; filename="flipped.{fmt}"'})


@router.post("/crop")
async def crop_image(
    file:   UploadFile = File(...),
    x:      int        = Form(...),
    y:      int        = Form(...),
    width:  int        = Form(...),
    height: int        = Form(...),
    format: str        = Form("png"),
):
    """Crop image to given box."""
    fmt = format.lower()
    if fmt not in SUPPORTED_OUTPUT:
        raise HTTPException(400, detail=f"Unsupported format '{fmt}'.")
    if width <= 0 or height <= 0:
        raise HTTPException(400, detail="Width and height must be positive.")

    contents = await file.read()
    try:
        img = Image.open(io.BytesIO(contents)).convert("RGBA")
    except Exception:
        raise HTTPException(422, detail="Could not open image.")

    iw, ih = img.size
    x1 = max(0, min(x, iw));      y1 = max(0, min(y, ih))
    x2 = max(0, min(x + width, iw)); y2 = max(0, min(y + height, ih))

    if x2 <= x1 or y2 <= y1:
        raise HTTPException(400, detail="Crop box is out of image bounds.")

    img    = img.crop((x1, y1, x2, y2))
    output = io.BytesIO()

    if fmt == "jpeg":
        img = img.convert("RGB")

    img.save(output, format=PILLOW_FORMAT[fmt], quality=92)
    output.seek(0)

    return StreamingResponse(output, media_type=FORMAT_MIME[fmt],
        headers={"Content-Disposition": f'attachment; filename="cropped.{fmt}"'})