export interface Tool {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const TOOLS: Tool[] = [
  {
    id: "image-resizer",
    name: "Image Resizer",
    description: "Change the pixel dimensions of your images quickly.",
    icon: "📐",
  },
  {
    id: "image-compressor",
    name: "Image Compressor",
    description: "Reduce file size without losing quality.",
    icon: "🗜️",
  },
 {
  id: "format-converter",
  name: "Format Converter",
  description: "Convert your images between PNG, JPG, WEBP, and AVIF.",
  icon: "🔄",
},
{
  "id": "background-remover",
  "name": "Background Remover",
  "description": "Automatically isolate subjects and erase image backgrounds using AI.",
  "icon": "🖼️"
},
{
  "id": "image-compressor",
  "name": "Image Compressor",
  "description": "Reduce image file sizes instantly without sacrificing visual quality.",
  "icon": "🗜️"
}
,{
  "id": "image-editor",
  "name": "Image Editor",
  "description": "Crop, rotate, adjust, and optimize your images instantly in one place.",
  "icon": "🎨"
},
{
  "id": "audio-converter",
  "name": "Audio Converter",
  "description": "Convert audio files seamlessly between MP3, WAV, OGG, and FLAC formats.",
  "icon": "🎵"
},
{
  "id": "audio-trimmer",
  "name": "Audio Trimmer",
  "description": "Cut and trim audio files down to your exact desired timestamps instantly.",
  "icon": "✂️"
},
{
  "id": "volume-booster",
  "name": "Volume Booster",
  "description": "Amplify the volume levels of audio files and videos cleanly without sacrificing audio depth.",
  "icon": "🔊"
},
{
  "id": "noise-remover",
  "name": "Audio Noise Remover",
  "description": "Clean background hums, hiss, and ambient fan noise out of your audio tracks instantly.",
  "icon": "🪄"
},
{
  "id": "video-converter",
  "name": "Universal Video Converter",
  "description": "Convert videos between formats like MP4, MKV, AVI, and WEBM, or extract audio tracks instantly.",
  "icon": "🎞️"
},
{
  id: "video-trimmer",
  name: "Video Trimmer",
  description: "Cut and extract specific segments out of your video files instantly.",
  icon: "✂️"
},
{
  id: "video-compressor",
  name: "Video Compressor",
  description: "Reduce the file size of your videos while maintaining optimal quality for easier sharing and storage.",
  icon: "🗜️"
},
{
  id: "gif-maker",
  name: "GIF Maker",
  description: "Transform your favorite video clips into high-quality, shareable animated GIFs.",
  icon: "🎞️"
},
 {
  id: "case-converter",
  name: "Case Converter",
  description: "Convert text instantly between UPPERCASE, lowercase, title case, camelCase, snake_case, and more.",
  icon: "🔤"
}
,
 {
  id: "word-counter",
  name: "Word Counter",
  description: "Count words, characters, sentences, and paragraphs in real-time, along with estimated reading time.",
  icon: "🔢"
}

, {
  id: "json-formatter",
  name: "JSON Formatter",
  description: "Validate, beautify, minify, and parse raw JSON text into a clean, easily readable structure.",
  icon: "🧩"
}

, {
  id: "plagiarism-checker",
  name: "Plagiarism Checker",
  description: "Scan your articles or essays against online sources to detect duplicate content and ensure originality.",
  icon: "🛡️"
}

, {
  id: "markdown-editor",
  name: "Markdown Editor",
  description: "Write clean prose using Markdown syntax with a real-time, side-by-side visual HTML preview.",
  icon: "✍️"
}
];