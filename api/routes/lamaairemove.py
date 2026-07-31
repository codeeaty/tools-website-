# from fastapi import APIRouter , FastAPI, Request, File, UploadFile, Form
# from fastapi.templating import Jinja2Templates
# from fastapi.responses import StreamingResponse

# from uuid import uuid4
# import onnxruntime as ort
# import numpy as np 
# import cv2
# import io
# router = APIRouter()

# Lama_model_path = "lama_fp32.onnx"

# templates = Jinja2Templates(directory="templates")

# print("Loading LaMa ONNX model into memory...")
# session = ort.InferenceSession(Lama_model_path, providers=['CPUExecutionProvider'])


# @router.get("/removeobject")
# async def removeObject(req:Request):
#       return templates.TemplateResponse("removeobject.html", {
#     "request": req,
# })

# @router.post("/removeobjectvalue")
# async def removeObject(req: Request, image: UploadFile = File(...), mask: UploadFile = File(...)):
#     # 1. Read all raw binary bytes from the uploaded image file asynchronously
#     context = await image.read()
    
#     # Read all raw binary bytes from the uploaded mask canvas file asynchronously
#     mask_content = await mask.read()
    
#     # Generate a unique string ID (UUID v4) to prevent filenames from overwriting each other
#     file_name = f"{uuid4()}.png"

#     # Construct the local directory file path where the original uploaded file will be backed up
#     save_path = f"uploads/{file_name}"
    
#     # Open a new file in 'write binary' mode safely using a context manager
#     with open(save_path, "wb") as f:
#         # Write the raw image bytes directly into the local storage backup file
#         f.write(context)
    
#     # 2. Convert the raw image byte buffer into a 1D unsigned 8-bit integer NumPy array
#     np_array = np.frombuffer(context, dtype=np.uint8)
    
#     # Decode the 1D byte array into a standard 3D BGR image matrix using OpenCV
#     img_original = cv2.imdecode(np_array, cv2.IMREAD_COLOR) 
    
#     # Unpack the height and width of the original high-resolution image matrix
#     orig_h, orig_w = img_original.shape[:2]
    
#     # Flip the color channels from standard OpenCV BGR order to standard AI model RGB order
#     img_rgb = cv2.cvtColor(img_original, cv2.COLOR_BGR2RGB)
    
#     # Resize the high-res image down to exactly 512x512 pixels as requested by the model inputs
#     img_resized = cv2.resize(img_rgb, (512, 512))
    
#     # Cast integer array (0-255) to decimal floats and scale down values to a normalized 0.0 to 1.0 range
#     img_normalized = img_resized.astype(np.float32) / 255.0
    
#     # Rearrange dimensions from Height-Width-Channel (H,W,C) format to Channel-Height-Width (C,H,W) format
#     img_transpose = np.transpose(img_normalized, (2, 0, 1))
    
#     # Add a placeholder batch dimension at index 0 to morph the shape from (3, 512, 512) to (1, 3, 512, 512)
#     final_input = np.expand_dims(img_transpose, axis=0) 

#     # 3. Decode the raw mask byte buffer, keeping its transparency/alpha channel intact (IMREAD_UNCHANGED)
#     mask_img = cv2.imdecode(np.frombuffer(mask_content, np.uint8), cv2.IMREAD_UNCHANGED)
    
#     # Check if the decoded mask matrix has 3 structural dimensions and contains a 4th channel (Alpha)
#     if len(mask_img.shape) == 3 and mask_img.shape[2] == 4:
#         # Isolate and extract just the 4th channel (Alpha) where your canvas brush strokes live
#         mask_alpha = mask_img[:, :, 3] 
#     else:
#         # Fallback: if no alpha channel exists, convert the entire RGB mask image into Grayscale
#         mask_alpha = cv2.cvtColor(mask_img, cv2.COLOR_BGR2GRAY)

#     # Resize the isolated mask layer to exactly 512x512 pixels to match input canvas constraints
#     mask_resized = cv2.resize(mask_alpha, (512, 512))
    
#     # Apply binary thresholding: turn any pixel above mid-gray (127) into pure solid white (255)
#     _, mask_binary = cv2.threshold(mask_resized, 127, 255, cv2.THRESH_BINARY)
    
#     # Convert integer mask values to decimal float scale (0.0 to 1.0) and force shape to (1, 1, 512, 512)
#     mask_input = (mask_binary.astype(np.float32) / 255.0).reshape(1, 1, 512, 512) 

#     # --- CRITICAL FIX: ZERO OUT THE MASK AREA IN THE INPUT ---
#     # Invert the mask values (1.0 - mask) and multiply it by image matrix to make the masked area pure black for LaMa
#     final_input = final_input * (1.0 - mask_input)

#     # 4. Execute ONNX runtime inference session by passing the final image and mask arrays into model inputs
#     results = session.run(None, {"image": final_input, "mask": mask_input})
    
#     # Extract the raw output multi-channel image array from batch index 0 of the output results array
#     output_img_raw = results[0][0] 

#     # 5. Pivot tensor axis array back from Channel-Height-Width (C,H,W) layout to standard image (H,W,C) layout
#     img_reverse_transpose = np.transpose(output_img_raw, (1, 2, 0))
    
#     # Clamp out-of-bound pixel calculations strictly between 0 and 255, then downcast to 8-bit unsigned integers
#     img_clip = img_reverse_transpose.clip(0, 255).astype(np.uint8)
    
#     # Convert AI result matrix back from RGB color spaces to default OpenCV BGR layout at 512x512 size
#     output_img_512 = cv2.cvtColor(img_clip, cv2.COLOR_RGB2BGR) 

#     # --- NEW FEATURE: PASTE BACK ONTO ORIGINAL HIGH-RES IMAGE ---
#     # A. Resize the 512x512 patch generated by the AI back up to the exact width and height of your original photo
#     output_resized = cv2.resize(output_img_512, (orig_w, orig_h), interpolation=cv2.INTER_CUBIC)
    
#     # B. Resize the binary 512x512 mask back up to original image dimensions matching raw dimensions
#     mask_original_size = cv2.resize(mask_binary, (orig_w, orig_h), interpolation=cv2.INTER_LINEAR)
    
#     # C. Run Gaussian blur filter on high-res mask edges using 5x5 kernel matrix to smooth out step cuts
#     mask_blur = cv2.GaussianBlur(mask_original_size, (5, 5), 0)
    
#     # Scale blurred mask matrix down to 0.0-1.0 float ranges to use it as an interpolation weights array
#     mask_normalized = mask_blur.astype(np.float32) / 255.0
    
#     # Add trailing channel axis to expand shape from (H,W) matrix format to matching broadcast shape (H,W,1)
#     mask_normalized = np.expand_dims(mask_normalized, axis=2) 

#     # D. Apply math blending formula: Keep original photo pixels where mask is 0, substitute AI pixels where mask is 1
#     final_blended = (img_original.astype(np.float32) * (1.0 - mask_normalized) + 
#                      output_resized.astype(np.float32) * mask_normalized)
    
#     # Clamp blended composite float data between 0 and 255, then lock types back to solid 8-bit unsigned integers
#     final_output = final_blended.clip(0, 255).astype(np.uint8)

#     # 6. Construct final destination file output path inside local disk outputs folder
#     result_path = f"outputs/result_{file_name}"
    
#     # Write final processed composited high-resolution image array to local server file system
#     cv2.imwrite(result_path, final_output)

#     # 7. Encode final high-resolution BGR image array into standard PNG memory byte container string
#     _, buf = cv2.imencode(".png", final_output)
    
#     # Stream the raw uncompressed byte data block directly over the network socket back to frontend
#     return StreamingResponse(io.BytesIO(buf.tobytes()), media_type="image/png")