import { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, FileText, FileArchive, FileAudio, FileVideo } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/media-utils";

export function ImageMessageBubble({ mediaUrl }: { mediaUrl: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-56 rounded-2xl overflow-hidden border border-black/5"
      >
        <img src={mediaUrl} alt="Attachment" className="w-full h-auto max-h-72 object-cover" />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
              onClick={() => setOpen(false)}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <motion.img
                initial={{ scale: 0.92 }}
                animate={{ scale: 1 }}
                src={mediaUrl}
                alt="Attachment"
                className="max-w-full max-h-full rounded-lg object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}

function iconForMime(mime: string | null) {
  if (!mime) return FileText;
  if (mime.startsWith("audio/")) return FileAudio;
  if (mime.startsWith("video/")) return FileVideo;
  if (mime.includes("zip") || mime.includes("compressed")) return FileArchive;
  return FileText;
}

export function FileMessageBubble({
  mediaUrl,
  fileName,
  fileSizeBytes,
  mediaMimeType,
  isUser,
}: {
  mediaUrl: string;
  fileName: string;
  fileSizeBytes: number | null;
  mediaMimeType: string | null;
  isUser: boolean;
}) {
  const Icon = iconForMime(mediaMimeType);
  return (
    <a
      href={mediaUrl}
      download={fileName}
      className={cn(
        "flex items-center gap-3 w-64 rounded-2xl p-3 transition-colors",
        isUser ? "bg-primary-foreground/15 hover:bg-primary-foreground/20" : "bg-background hover:bg-muted",
      )}
    >
      <div className={cn("shrink-0 w-10 h-10 rounded-xl flex items-center justify-center", isUser ? "bg-primary-foreground/20" : "bg-primary/10")}>
        <Icon className={cn("w-5 h-5", isUser ? "text-primary-foreground" : "text-primary")} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium truncate">{fileName}</p>
        <p className={cn("text-[11px]", isUser ? "text-primary-foreground/70" : "text-muted-foreground")}>
          {fileSizeBytes ? formatBytes(fileSizeBytes) : "File"}
        </p>
      </div>
      <Download className={cn("w-4 h-4 shrink-0", isUser ? "text-primary-foreground/70" : "text-muted-foreground")} />
    </a>
  );
}
