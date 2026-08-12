import { motion, useMotionValue, useTransform } from "framer-motion";
import { Archive, Copy, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  onArchive?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
};

/**
 * Manifest row with gesture actions: swipe left reveals Archive/Delete,
 * swipe right reveals Duplicate. Rubber-band, mechanical easing.
 */
export function SwipeRow({ children, onArchive, onDelete, onDuplicate }: Props) {
  const x = useMotionValue(0);
  const [open, setOpen] = useState<"none" | "left" | "right">("none");
  const leftOp = useTransform(x, [-140, -40, 0], [1, 0.4, 0]);
  const rightOp = useTransform(x, [0, 40, 140], [0, 0.4, 1]);

  return (
    <div className="relative">
      <motion.div
        style={{ opacity: leftOp }}
        className="absolute inset-y-0 right-0 flex items-center gap-2 pr-4"
      >
        <button
          onClick={onArchive}
          aria-label="Archive trip"
          className="h-10 w-10 rounded-sm bg-departure-navy text-cloud-white flex items-center justify-center"
        >
          <Archive className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          aria-label="Delete trip"
          className="h-10 w-10 rounded-sm bg-runway-red text-cloud-white flex items-center justify-center"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </motion.div>

      <motion.div
        style={{ opacity: rightOp }}
        className="absolute inset-y-0 left-0 flex items-center pl-4"
      >
        <button
          onClick={onDuplicate}
          aria-label="Duplicate trip"
          className="h-10 w-10 rounded-sm bg-horizon-teal text-cloud-white flex items-center justify-center"
        >
          <Copy className="w-4 h-4" />
        </button>
      </motion.div>

      <motion.div
        drag="x"
        style={{ x }}
        dragConstraints={{ left: -132, right: 96 }}
        dragElastic={0.12}
        onDragEnd={(_, info) => {
          if (info.offset.x < -70) setOpen("left");
          else if (info.offset.x > 60) setOpen("right");
          else setOpen("none");
        }}
        animate={{ x: open === "left" ? -132 : open === "right" ? 96 : 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative cursor-grab active:cursor-grabbing touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}
