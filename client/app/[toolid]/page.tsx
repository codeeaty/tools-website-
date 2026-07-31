import { notFound } from "next/navigation";
import { TOOLS } from "@/types/ToolTypes";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Metadata } from "next";

// ── Lazy-loaded tool components ──
// Each tool's actual implementation is only fetched/loaded when the user visits that specific page.
const ImageResizer = dynamic(() => import("@/components/toolsComponents/ImageResizer"));
const FormatConverter = dynamic(() => import("@/components/toolsComponents/FormatConverter"));
const Backgoundremover = dynamic(() => import("@/components/toolsComponents/Backgoundremover"));
const ImageCompressor = dynamic(() => import("@/components/toolsComponents/ImageCompressor"));
const ImageEditor = dynamic(() => import("@/components/toolsComponents/ImageEditor"));

const AudioConverter = dynamic(() => import("@/components/toolsComponents/audio/AudioConverter"));
const AudioTrimmer = dynamic(() => import("@/components/toolsComponents/audio/Audiotrimmer"));
const VolumeBooster = dynamic(() => import("@/components/toolsComponents/audio/AudioBooster"));
const NoiseRemover = dynamic(() => import("@/components/toolsComponents/audio/RemoveNoise"));

const VideoConverter = dynamic(() => import("@/components/toolsComponents/VideoContverter"));
const VideoTrimmer = dynamic(() => import("@/components/toolsComponents/VideoTrimmer"));
const VideoCompressor = dynamic(() => import("@/components/Videoconpress"));
const GifMaker = dynamic(() => import("@/components/toolsComponents/VideoGif"));

const CaseConverter = dynamic(() => import("@/components/textcompoents/Caseconverter"));
const WordCounter = dynamic(() => import("@/components/textcompoents/wordCounter"));
const PlagiarismChecker = dynamic(() => import("@/components/textcompoents/PlagiarismChecker"));
const MarkdownEditor = dynamic(() => import("@/components/textcompoents/Markdowneditor"));
const JsonFormatter = dynamic(() => import("@/components/textcompoents/Jsonformater"));

// ── Wrapper components (same card styling as before) ──
const wrap = (Comp: React.ComponentType) => () => (
  <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-xl">
    <Comp />
  </div>
);

const ResizerTool = wrap(ImageResizer);
const ImageConverter = wrap(FormatConverter);
const BackgruondImage = wrap(Backgoundremover);
const Imagecompressor = wrap(ImageCompressor);
const Imageeditor = wrap(ImageEditor);

const Audioconverter = wrap(AudioConverter);
const Audiotrimmer = wrap(AudioTrimmer);
const Volumebooster = wrap(VolumeBooster);
const Noiseremover = wrap(NoiseRemover);

const Videoconverter = wrap(VideoConverter);
const Videotrimmer = wrap(VideoTrimmer);
const Videocompressor = wrap(VideoCompressor);
const Gifmaker = wrap(GifMaker);

const Caseconverter = wrap(CaseConverter);
const Wordcounter = wrap(WordCounter);
const plagiarism_checker = wrap(PlagiarismChecker);
const Markdowneditor = wrap(MarkdownEditor);
const Jsonformatter = wrap(JsonFormatter);

// ── Map tool IDs to their corresponding workspace components ──
const toolComponents: Record<string, React.ComponentType> = {
  "image-resizer": ResizerTool,
  "format-converter": ImageConverter,
  "background-remover": BackgruondImage,
  "image-compressor": Imagecompressor,
  "image-editor": Imageeditor,
  "audio-converter": Audioconverter,
  "audio-trimmer": Audiotrimmer,
  "volume-booster": Volumebooster,
  "noise-remover": Noiseremover,
  "video-converter": Videoconverter,
  "video-trimmer": Videotrimmer,
  "video-compressor": Videocompressor,
  "gif-maker": Gifmaker,
  "case-converter": Caseconverter,
  "word-counter": Wordcounter,
  "plagiarism-checker": plagiarism_checker,
  "markdown-editor": Markdowneditor,
  "json-formatter": Jsonformatter,
};

interface ToolDetailPageProps {
  params: Promise<{ toolid: string }>;
}

// ── SEO metadata, generated per-tool from the real TOOLS array ──
export async function generateMetadata({
  params,
}: ToolDetailPageProps): Promise<Metadata> {
  const { toolid } = await params;
  const tool = TOOLS.find((t) => t.id === toolid);

  if (!tool) {
    return { title: "Tool Not Found" };
  }

  return {
    title: tool.name,
    description: tool.description,
    openGraph: {
      title: `${tool.name} | ToolKit`,
      description: tool.description,
      url: `https://yourdomain.com/tools/${toolid}`,
    },
  };
}

export default async function ToolDetailPage({ params }: ToolDetailPageProps) {
  const { toolid } = await params;

  // Find the tool config
  const tool = TOOLS.find((t) => t.id === toolid);
  const ToolComponent = toolComponents[toolid];

  // If the user types a URL tool ID that doesn't exist, throw a 404
  if (!tool || !ToolComponent) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Navigation */}
        <Link
          href="/"
          className="text-sm text-neutral-400 hover:text-white mb-6 inline-block transition-colors"
        >
          ← Back to Tools
        </Link>

        {/* Dynamic Header */}
        <div className="flex items-center gap-3 mb-8">
          <span className="text-3xl">{tool.icon}</span>
          <div>
            <h1 className="text-3xl font-bold">{tool.name}</h1>
            <p className="text-neutral-400 text-sm">{tool.description}</p>
          </div>
        </div>

        {/* Dynamically Rendered Tool Workspace (lazy-loaded per tool) */}
        <div className="mt-4">
          <ToolComponent />
        </div>
      </div>
    </div>
  );
}