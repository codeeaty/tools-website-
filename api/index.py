from fastapi import FastAPI, Request, File, UploadFile, Form
from fastapi.staticfiles import StaticFiles

import os
from routes.imageRouter import router as Imagerouter
from routes.audioRouter import router as audioRouter
from routes.videoRouter import router as videoRouter
from routes.Textrouter import router as textRouter
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware



app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# # --- USING YOUR VERIFIED MODEL ---
# MODEL_FILE = "003_realSR_BSRGAN_DFO_s64w8_SwinIR-M_x4_GAN.onnx"

# print(f"--- Attempting to load model: {MODEL_FILE} ---")

# try:
#     if not os.path.exists(MODEL_FILE):
#         print(f"CRITICAL ERROR: {MODEL_FILE} not found in the current folder!")
#     else:
#         ort_session = ort.InferenceSession(MODEL_FILE, providers=['CPUExecutionProvider'])
#         input_name = ort_session.get_inputs()[0].name
#         print("--- Model loaded successfully! ---")
# except Exception as e:
#     print(f"--- FAILED TO LOAD MODEL: {e} ---")

# templates = Jinja2Templates(directory="templates")

# Guarantee that system resource folders exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("outputs", exist_ok=True)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")
# Paste this after all app.include_router() calls
@app.get("/debug-routes")
def list_routes():
    from fastapi.routing import APIRoute
    return [
        {"path": r.path, "methods": list(r.methods)}
        for r in app.routes
        if isinstance(r, APIRoute)  # ← skip Mount objects
    ]
# -----------------------------
# HAAR CASCADE DOWNLOAD
# -----------------------------
# XML_FILE = "haarcascade_frontalface_default.xml"

# if not os.path.exists(XML_FILE):
#     print("--- Cascade XML missing! Downloading now... ---")
#     url = "https://raw.githubusercontent.com/opencv/opencv/master/data/haarcascades/haarcascade_frontalface_default.xml"
#     try:
#         urllib.request.urlretrieve(url, XML_FILE)
#         print("add successfuly")
#     except Exception as e:
#         print(f"CRITICAL: Failed to download face detector file: {e}")
# else:
#     print("add successfuly")

# -----------------------------
# HOME PAGE
# -----------------------------


@app.get("/")
def home(request: Request):
    return {"working":"afadsf"}

# app.include_router(testingrotuer)
app.include_router(Imagerouter)
app.include_router(audioRouter)
app.include_router(videoRouter)
app.include_router(textRouter)


# IMPORTANT: Allow Next.js (usually on port 3000) to talk to FastAPI (usually on 8000)

# @app.post("/enhance-image")
# async def enhance_image(file: UploadFile = File(...)):
#     # Here you would call your "load-process-unload" logic
#     # contents = await file.read()
#     # ... process image ...
#     return {"filename": file.filename, "message": "Processing complete!"}







# @app.get("/upscale")
# def upscale_view(request: Request):
#     return templates.TemplateResponse("upscale.html", {"request": request})

# # ---------------------------------------------------------
# # 2X HD ENHANCER ENDPOINT (FORCED TO STRICT 2X)
# # ---------------------------------------------------------
# @app.post("/upscales")
# async def upscale(request: Request, file: UploadFile = File(...)):
#     content = await file.read()
#     filename = f"{uuid.uuid4()}.png"

#     # Save original user file
#     with open(f"uploads/{filename}", "wb") as f:
#         f.write(content)

#     np_array = np.frombuffer(content, np.uint8)
#     img = cv2.imdecode(np_array, cv2.IMREAD_COLOR) 
    
#     # 1. Safety Check (Prevent massive images from crashing the CPU)
#     h_orig, w_orig = img.shape[:2]
#     if h_orig > 2000 or w_orig > 2000:
#         scale = 2000 / max(h_orig, w_orig)
#         img = cv2.resize(img, (int(w_orig * scale), int(h_orig * scale)), interpolation=cv2.INTER_AREA)
#         h_orig, w_orig = img.shape[:2]

#     # 2. AI PRE-PROCESSING
#     img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    
#     # PADDING FIX: Ensure dimensions are multiples of 8 for SwinIR
#     mod_h = (8 - h_orig % 8) % 8
#     mod_w = (8 - w_orig % 8) % 8
#     img_padded = cv2.copyMakeBorder(img_rgb, 0, mod_h, 0, mod_w, cv2.BORDER_REFLECT)
    
#     img_normalized = img_padded.astype(np.float32) / 255.0
#     img_transposed = np.transpose(img_normalized, (2, 0, 1))
#     input_tensor = np.expand_dims(img_transposed, axis=0)

#     # 3. AI RUNTIME (Generates 4x output internally)
#     onnx_outputs = ort_session.run(None, {input_name: input_tensor})
#     output_tensor = onnx_outputs[0][0]

#     # 4. AI POST-PROCESSING
#     output_transposed = np.transpose(output_tensor, (1, 2, 0))
    
#     # Crop away the padding pixels from the 4x result first
#     h_target_4x = h_orig * 4
#     w_target_4x = w_orig * 4
#     output_cropped = output_transposed[:h_target_4x, :w_target_4x]
    
#     output_clamped = np.clip(output_cropped * 255.0, 0, 255).astype(np.uint8)
#     img_4x = cv2.cvtColor(output_clamped, cv2.COLOR_RGB2BGR)

#     # --- FORCED 2X DOWN-SAMPLE ---
#     # Downscale the beautifully sharpened 4x image to exactly 2x of the original size
#     h_target_2x = h_orig * 2
#     w_target_2x = w_orig * 2
#     final_img = cv2.resize(img_4x, (w_target_2x, h_target_2x), interpolation=cv2.INTER_CUBIC)

#     # Save premium AI 2x upscaled image
#     cv2.imwrite(f"outputs/{filename}", final_img)

#     return templates.TemplateResponse("upscale.html", {
#         "request": request,
#         "original": f"/uploads/{filename}",
#         "removed": f"/outputs/{filename}"
#     })

#  @app.post("/upload")
#  async def upload(request:Request,
#     file: UploadFile = File(...),
#     remove_bg: Optional[str] = Form(None), # Returns "true" if checked, None if unchecked
#     add_color: Optional[str] = Form(None), # Returns "true" if checked, None if unchecked
#     bg_color: str = Form(...)              # Returns "#ffffff" or "#4d74ff"
#     ,crop_category: str = Form("none")  # Receives "none" or "passport"
# ):

#     content = await file.read()

#     # Force output filename extension to .png to safely support image layers
#     unique_id = uuid.uuid4()
#     filename = f"{unique_id}.png"

#     # 1. Save original picture
#     with open(f"uploads/{filename}", "wb") as f:
#         f.write(content)
#     # 2. Check if user wants to remove background
#     if remove_bg == "true":
#      result_bytes = remove(content)
#     else:
#        result_bytes = content

#     if add_color == "true":
#     # decode the image 
#     # turn buffer to numpy array 
#      np_array =  np.frombuffer(result_bytes,np.uint8)
#     # turn numpy array to cv2 image 
#      img = cv2.imdecode(np_array,cv2.IMREAD_UNCHANGED)
#     # 💡 USING CVTCOLOR HERE: 
#     # If the image only has 3 channels (BGR), force it to 4 channels (BGRA)
#      if(img.shape[2]==3):
#        img = cv2.cvtColor(img,cv2.COLOR_BGR2BGRA)

#      # 🔥 SMART CROP LOGIC INJECTED HERE (And nowhere else!)
#      if crop_category == "passport":
#         h, w = img.shape[:2]
#         gray = cv2.cvtColor(img, cv2.COLOR_BGRA2GRAY)
#         face_cascade = cv2.CascadeClassifier(XML_FILE)
#         faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(100, 100))
        
#         if len(faces) > 0:
#             faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
#             fx, fy, fw, fh = faces[0]
#             padding_y = int(fh * 0.55)  
#             padding_x = int(fw * 0.50)  
#             y1 = max(0, fy - padding_y)
#             y2 = min(h, fy + fh + int(padding_y * 1.3))
#             x1 = max(0, fx - padding_x)
#             x2 = min(w, fx + fw + padding_x)
#             img = img[y1:y2, x1:x2]
#         else:
#             crop_w = int(h * 0.75)
#             if crop_w > w:
#                 crop_w = w
#             start_x = (w - crop_w) // 2
#             img = img[0:h, start_x : start_x + crop_w]

#     # Convert the frontend Hex string ('#4d74ff') straight to OpenCV BGR values 
#         hex_value = bg_color.lstrip("#")  
#     #Convert a hex color string (like "FF00AA") into RGB values.
#         r, g, b = tuple(int(hex_value[i:i+2], 16) for i in (0, 2, 4))
#      bgr_color = (b, g, r)
#     # Create a solid color background layer (B, G, R, Alpha=255) matching our image size
#      background = np.full(img.shape,bgr_color+(255,),dtype =np.uint8)
#     # Extract the alpha channel (transparency mask) safely now!
#       # 🔥 STEP WHERE FIX IS APPLIED (IMPORTANT PART)

#     # 👉 Step 8: extract alpha channel (transparency mask)
#      alpha = img[:, :, 3]
    
#     # 👉 Step 9: normalize alpha values from 0–255 → 0.0–1.0
#      alpha = alpha / 255.0

#     # 👉 Step 10: reshape alpha so it can multiply RGB channels
#      alpha = alpha[:, :, None]

#     # 👉 Step 11: separate foreground (person/image without alpha)
#      foreground = img[:, :, :3]

#     # 👉 Step 12: separate background color image (only RGB)
#      bg = background[:, :, :3]

#     # 👉 Step 13: blend foreground + background using alpha
#     # This removes white edges and creates smooth blending
#      final_composite = (foreground * alpha + bg * (1 - alpha)).astype(np.uint8)

#     # 👉 Step 14: save final image to output folder
#      cv2.imwrite(f"outputs/{filename}", final_composite)
#     else:
# # Save raw transparent or original bytes directly
#      with open(f"outputs/{filename}", "wb") as f:
#             f.write(result_bytes)

#     return templates.TemplateResponse("index.html", {
#     "request": request,
#     "original": f"/uploads/{filename}",
#     "removed": f"/outputs/{filename}"
# })