import { useRef } from "react";
import { Image as ImageIcon, Paperclip, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Props = {
  onPickImage: (file: File) => void;
  onPickFile: (file: File) => void;
  disabled?: boolean;
};

export function AttachmentPicker({ onPickImage, onPickFile, disabled }: Props) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label="Add attachment"
            className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-40 shrink-0 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-52 p-1.5">
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-muted transition-colors text-sm text-left"
          >
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <ImageIcon className="w-4 h-4 text-primary" />
            </span>
            Photo
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-muted transition-colors text-sm text-left"
          >
            <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Paperclip className="w-4 h-4 text-primary" />
            </span>
            File
          </button>
        </PopoverContent>
      </Popover>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onPickImage(file);
        }}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onPickFile(file);
        }}
      />
    </>
  );
}
