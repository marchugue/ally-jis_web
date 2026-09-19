import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FluentEmojiPicker } from "@/components/chat/FluentEmojiPicker";

interface EmojiPickerButtonProps {
  /** Called with the native emoji character, e.g. "😂" */
  onEmojiSelect: (emoji: string) => void;
  /** Where the popover opens relative to the trigger button. Default "top". */
  placement?: "top" | "bottom";
  /** Disables the trigger (e.g. while a message is sending). */
  disabled?: boolean;
  /** Optional className passed to the trigger button for layout control. */
  className?: string;
}

/**
 * Self-contained Microsoft Fluent 3D emoji picker button: opens FluentEmojiPicker
 * in a floating panel. Closes on outside click, Escape, or selection.
 */
export default function EmojiPickerButton({
  onEmojiSelect,
  placement = "top",
  disabled = false,
  className = "",
}: EmojiPickerButtonProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleSelect(emoji: string) {
    onEmojiSelect(emoji);
    setOpen(false);
  }

  const panelPositionClass =
    placement === "top" ? "bottom-full mb-2" : "top-full mt-2";

  return (
    <div className="relative inline-block" ref={containerRef}>
      <button
        type="button"
        aria-label="Add emoji"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-9 w-9 items-center justify-center rounded-full text-lg text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
      >
        🙂
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: placement === "top" ? 8 : -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: placement === "top" ? 8 : -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute left-0 z-50 ${panelPositionClass}`}
          >
            <FluentEmojiPicker autoFocus onSelect={handleSelect} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}