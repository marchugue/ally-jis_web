import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Custom Toaster — glass card look, adaptive to light or dark surfaces.
 *
 * Two glass "textures", switched via Tailwind's `dark:` variant (i.e. it
 * follows whatever puts the `dark` class on `<html>`/a parent — next-themes,
 * a manual toggle, etc.):
 *
 *  • Light surfaces → a bright, mostly-opaque frosted white panel, dark
 *    slate text, a soft grey drop shadow, hairline border that's brighter
 *    on top than the sides (light glass mockup reference).
 *  • Dark surfaces  → a near-transparent dark panel, white text, a glow-y
 *    drop shadow, bright top edge fading down the sides (dark glass
 *    mockup reference).
 *
 * In both modes:
 *  • NO solid background colour driving the look — just a translucent
 *    wash + backdrop-blur, so the toast frosts whatever's actually behind
 *    it instead of imposing a fixed tint.
 *  • A soft highlight blob sits in the top-left corner (glass catching
 *    light), and a status-colour STAIN pools in from the left edge — an
 *    off-centre radial blot (not a flat diagonal band) that reads like
 *    ink soaking into the glass and dissolving outward, tuned separately
 *    per mode so it reads correctly against either a light or dark
 *    backdrop.
 *  • The left border itself picks up the status colour (instead of the
 *    neutral hairline used on the other edges), and an inset glow bleeds
 *    inward from that edge and fades out over ~1.5rem — so the border
 *    "adapts" to the stain colour at the left and dissolves back to the
 *    plain glass edge everywhere else, rather than being a flat ring.
 *  • Coloured icon (inherits currentColor from the icon wrapper)
 *  • Centred, top position, 5 s auto-dismiss, swipe-up to close
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="top-right"
      duration={5000}
      swipeDirections={["top"]}
      expand={false}
      visibleToasts={4}
      gap={10}
      toastOptions={{
        unstyled: true,
        classNames: {
          // ── Base toast shell ────────────────────────────────────────────
          toast: [
            // Layout
            "relative overflow-hidden",
            "flex items-start gap-3 w-full",
            "px-4 py-3.5 rounded-2xl",
            // Glass base — no fixed background colour driving the look.
            // Light mode: bright, near-opaque white wash (frosted-glass
            // mockup). Dark mode: near-transparent dark wash (glows-with-
            // colour mockup). Either way, backdrop-blur does the actual
            // work of frosting whatever's behind the toast.
            "bg-white/70 dark:bg-white/[0.06]",
            "backdrop-blur-2xl backdrop-saturate-150 dark:backdrop-brightness-110",
            // Glass edge: bright top catching the light, dimmer sides —
            // tuned separately per mode since "bright" means something
            // different against white vs. black. Variants override the
            // left edge with a status-tinted colour (see below).
            "border border-t-white/90 border-x-black/[0.06] border-b-black/[0.09]",
            "dark:border-t-white/40 dark:border-x-white/[0.14] dark:border-b-white/[0.06]",
            // Floating shadow beneath + bright inner rim on the top edge.
            "shadow-[0_20px_45px_-14px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.8)]",
            "dark:shadow-[0_24px_60px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.35)]",
            // Typography
            "font-jakarta text-sm leading-snug",
            "transition-all duration-300 ease-out",
          ].join(" "),

          // ── Text ────────────────────────────────────────────────────────
          title: "font-semibold text-slate-900 dark:text-white leading-tight relative z-10",
          description:
            "text-slate-500 dark:text-white/60 text-xs mt-0.5 leading-relaxed relative z-10",

          // ── Variants ────────────────────────────────────────────────────
          // Three layers stack on top of the glass base:
          //  1. a soft highlight blob in the top-left corner (light
          //     glinting off the glass)
          //  2. a status-colour STAIN — an off-centre radial blot anchored
          //     just past the left edge, expanding and dissolving outward
          //     (three colour stops so the falloff feels organic instead
          //     of a hard-edged band)
          //  3. the left border recoloured to match the stain, plus an
          //     inset glow hugging that edge that fades inward — so the
          //     border itself feels like part of the same colour bleed
          //     rather than a flat ring around the card
          // Both the stain and the border glow are tuned per mode — what
          // reads as a soft pool on a bright panel needs more punch on a
          // near-black one. The icon picks up the same colour via
          // [&_[data-icon]].

          success: [
            "bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.55),transparent_50%),radial-gradient(65%_90%_at_2%_50%,rgba(34,197,94,0.28),rgba(34,197,94,0.12)_38%,rgba(34,197,94,0)_72%)]",
            "dark:bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.16),transparent_50%),radial-gradient(65%_90%_at_2%_50%,rgba(34,197,94,0.42),rgba(34,197,94,0.18)_38%,rgba(34,197,94,0)_72%)]",
            "[&_[data-icon]]:text-[#16a34a] dark:[&_[data-icon]]:text-[#22c55e]",
            "!border-l-[rgba(22,163,74,0.4)] dark:!border-l-[rgba(34,197,94,0.5)]",
            "shadow-[0_20px_45px_-14px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.8),inset_18px_0_26px_-20px_rgba(34,197,94,0.38),0_0_28px_rgba(34,197,94,0.1)]",
            "dark:shadow-[0_24px_60px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.35),inset_18px_0_28px_-18px_rgba(34,197,94,0.48),0_0_36px_rgba(34,197,94,0.14)]",
          ].join(" "),

          error: [
            "bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.55),transparent_50%),radial-gradient(65%_90%_at_2%_50%,rgba(239,68,68,0.28),rgba(239,68,68,0.12)_38%,rgba(239,68,68,0)_72%)]",
            "dark:bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.16),transparent_50%),radial-gradient(65%_90%_at_2%_50%,rgba(239,68,68,0.42),rgba(239,68,68,0.18)_38%,rgba(239,68,68,0)_72%)]",
            "[&_[data-icon]]:text-[#dc2626] dark:[&_[data-icon]]:text-[#ef4444]",
            "!border-l-[rgba(220,38,38,0.4)] dark:!border-l-[rgba(239,68,68,0.5)]",
            "shadow-[0_20px_45px_-14px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.8),inset_18px_0_26px_-20px_rgba(239,68,68,0.38),0_0_28px_rgba(239,68,68,0.1)]",
            "dark:shadow-[0_24px_60px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.35),inset_18px_0_28px_-18px_rgba(239,68,68,0.48),0_0_36px_rgba(239,68,68,0.14)]",
          ].join(" "),

          warning: [
            "bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.55),transparent_50%),radial-gradient(65%_90%_at_2%_50%,rgba(245,158,11,0.28),rgba(245,158,11,0.12)_38%,rgba(245,158,11,0)_72%)]",
            "dark:bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.16),transparent_50%),radial-gradient(65%_90%_at_2%_50%,rgba(245,158,11,0.42),rgba(245,158,11,0.18)_38%,rgba(245,158,11,0)_72%)]",
            "[&_[data-icon]]:text-[#d97706] dark:[&_[data-icon]]:text-[#f59e0b]",
            "!border-l-[rgba(217,119,6,0.4)] dark:!border-l-[rgba(245,158,11,0.5)]",
            "shadow-[0_20px_45px_-14px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.8),inset_18px_0_26px_-20px_rgba(245,158,11,0.38),0_0_28px_rgba(245,158,11,0.1)]",
            "dark:shadow-[0_24px_60px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.35),inset_18px_0_28px_-18px_rgba(245,158,11,0.48),0_0_36px_rgba(245,158,11,0.14)]",
          ].join(" "),

          info: [
            "bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.55),transparent_50%),radial-gradient(65%_90%_at_2%_50%,rgba(59,130,246,0.28),rgba(59,130,246,0.12)_38%,rgba(59,130,246,0)_72%)]",
            "dark:bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.16),transparent_50%),radial-gradient(65%_90%_at_2%_50%,rgba(59,130,246,0.42),rgba(59,130,246,0.18)_38%,rgba(59,130,246,0)_72%)]",
            "[&_[data-icon]]:text-[#2563eb] dark:[&_[data-icon]]:text-[#3b82f6]",
            "!border-l-[rgba(37,99,235,0.4)] dark:!border-l-[rgba(59,130,246,0.5)]",
            "shadow-[0_20px_45px_-14px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.8),inset_18px_0_26px_-20px_rgba(59,130,246,0.38),0_0_28px_rgba(59,130,246,0.1)]",
            "dark:shadow-[0_24px_60px_-8px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.35),inset_18px_0_28px_-18px_rgba(59,130,246,0.48),0_0_36px_rgba(59,130,246,0.14)]",
          ].join(" "),

          // Plain toast (no status) — still gets the corner glass glint,
          // just without a colour wash or tinted edge
          default: [
            "bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.55),transparent_50%)]",
            "dark:bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.16),transparent_50%)]",
          ].join(" "),

          // ── Icon wrapper ────────────────────────────────────────────────
          icon: "mt-0.5 shrink-0",

          // ── Progress ────────────────────────────────────────────────────
          loader: "bg-black/10 dark:bg-white/15",

          // ── Close button ─────────────────────────────────────────────────
          closeButton: [
            "!static !translate-x-0 !translate-y-0",
            "text-black/30 hover:text-black/70 dark:text-white/30 dark:hover:text-white/70",
            "transition-colors ml-auto shrink-0 self-start mt-0.5",
          ].join(" "),
        },
      }}
      {...props}
    />
  );
};

// ─── Convenience wrappers ─────────────────────────────────────────────────────

export const notify = {
  success: (title: string, description?: string) =>
    toast.success(title, { description }),

  error: (title: string, description?: string) =>
    toast.error(title, { description }),

  warning: (title: string, description?: string) =>
    toast.warning(title, { description }),

  info: (title: string, description?: string) =>
    toast.info(title, { description }),

  /** Plain glass toast — no colour accent, adapts to light/dark */
  plain: (title: string, description?: string) =>
    toast(title, { description }),
};

export { Toaster, toast };