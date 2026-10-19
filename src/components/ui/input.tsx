import * as React from "react"
import { AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface InputProps extends Omit<React.ComponentProps<"input">, "size"> {
  /** Error message string or boolean flag */
  error?: string | boolean | null;
  /** Optional icon or element to display at the start */
  startIcon?: React.ReactNode;
  /** Optional icon or element to display at the end */
  endIcon?: React.ReactNode;
  /** Custom wrapper/container class name */
  wrapperClassName?: string;
  /** If true, renders raw input without the stroke container */
  unstyled?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      wrapperClassName,
      type,
      error,
      startIcon,
      endIcon,
      unstyled,
      disabled,
      ...props
    },
    ref
  ) => {
    // If explicitly unstyled or inside an input-group, render plain input with crisp stroke
    if (unstyled || props["data-slot"] === "input-group-control") {
      return (
        <input
          type={type}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-none transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-[#1A6B3C] dark:focus-visible:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
            className
          )}
          ref={ref}
          {...props}
        />
      );
    }

    const isError = Boolean(error) || props["aria-invalid"] === true || props["aria-invalid"] === "true";
    const errorMessage = typeof error === "string" ? error : null;

    const containerRef = React.useRef<HTMLDivElement>(null);
    const badgeRef = React.useRef<HTMLDivElement>(null);
    const [size, setSize] = React.useState({ width: 0, height: 0 });
    const [badgeWidth, setBadgeWidth] = React.useState(0);
    const [isFocused, setIsFocused] = React.useState(false);

    React.useLayoutEffect(() => {
      if (!containerRef.current) return;
      const measure = () => {
        if (containerRef.current) {
          setSize({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          });
        }
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(containerRef.current);
      return () => ro.disconnect();
    }, []);

    React.useLayoutEffect(() => {
      if (badgeRef.current) {
        setBadgeWidth(badgeRef.current.offsetWidth);
      }
    }, [errorMessage, isError]);

    // Resolve border radius from className or default to 12
    const resolvedRadius = React.useMemo(() => {
      const cls = `${wrapperClassName || ""} ${className || ""}`;
      if (cls.includes("rounded-full")) return size.height > 0 ? size.height / 2 : 20;
      if (cls.includes("rounded-3xl")) return 24;
      if (cls.includes("rounded-2xl")) return 16;
      if (cls.includes("rounded-xl")) return 12;
      if (cls.includes("rounded-lg")) return 10;
      if (cls.includes("rounded-md")) return 8;
      if (cls.includes("rounded-sm")) return 4;
      if (cls.includes("rounded-none")) return 0;
      return 12;
    }, [wrapperClassName, className, size.height]);

    // Stroke width (1.75px crisp stroke)
    const strokeWidth = 1.75;
    const half = strokeWidth / 2;

    const pathData = React.useMemo(() => {
      if (!isError || size.width === 0 || size.height === 0) return "";

      const w = size.width;
      const h = size.height;
      const r = Math.min(resolvedRadius, Math.min(w, h) / 2);

      const xMin = half;
      const yMin = half;
      const xMax = w - half;
      const yMax = h - half;

      // Calculate the cutout / notch at the top
      const pad = 6;
      const gapStart = Math.max(xMin + r, 14);
      const measuredGap = badgeWidth > 0 ? badgeWidth + pad * 2 : 26;
      const gapEnd = Math.min(xMax - r, gapStart + measuredGap);

      // SVG path:
      // Starts at (gapEnd, yMin) with smooth cut (strokeLinecap="round")
      // Traces top-right -> right -> bottom -> left -> top-left
      // Ends at (gapStart, yMin) with smooth cut (strokeLinecap="round")
      return `M ${gapEnd} ${yMin} ` +
        `L ${xMax - r} ${yMin} ` +
        `A ${r} ${r} 0 0 1 ${xMax} ${yMin + r} ` +
        `L ${xMax} ${yMax - r} ` +
        `A ${r} ${r} 0 0 1 ${xMax - r} ${yMax} ` +
        `L ${xMin + r} ${yMax} ` +
        `A ${r} ${r} 0 0 1 ${xMin} ${yMax - r} ` +
        `L ${xMin} ${yMin + r} ` +
        `A ${r} ${r} 0 0 1 ${xMin + r} ${yMin} ` +
        `L ${gapStart} ${yMin}`;
    }, [isError, size.width, size.height, resolvedRadius, half, badgeWidth]);

    return (
      <div
        ref={containerRef}
        onClick={() => {
          if (!disabled) {
            containerRef.current?.querySelector("input")?.focus();
          }
        }}
        className={cn(
          "relative flex items-center w-full transition-all duration-150 cursor-text",
          "rounded-xl bg-white dark:bg-[#111827]/80",
          "shadow-none outline-none",
          !isError && [
            "border-[1.5px] border-gray-200 dark:border-white/10",
            "hover:border-gray-300 dark:hover:border-white/20",
            isFocused && "border-[2px] border-[#1A6B3C] dark:border-emerald-500",
          ],
          isError && [
            pathData
              ? "border-[1.75px] border-transparent"
              : "border-[1.75px] border-red-500 dark:border-red-400",
          ],
          disabled && "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-white/5",
          wrapperClassName
        )}
      >
        {/* Error Stroke Overlay with Smooth Cut End & Start */}
        {isError && pathData && (
          <svg
            className="pointer-events-none absolute inset-0 w-full h-full overflow-visible z-10"
            width={size.width}
            height={size.height}
          >
            <path
              d={pathData}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-500 dark:text-red-400"
            />
          </svg>
        )}

        {/* Floating Error Badge seated inside the Smooth Cut Notch */}
        {isError && (
          <div
            ref={badgeRef}
            className="absolute -top-2.5 left-4 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-semibold text-red-600 dark:text-red-400 pointer-events-none select-none max-w-[calc(100%-32px)]"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
            {errorMessage ? (
              <span className="truncate">{errorMessage}</span>
            ) : (
              <span className="sr-only">Error</span>
            )}
          </div>
        )}

        {/* Leading / Start Icon */}
        {startIcon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-gray-400 dark:text-gray-500 z-10">
            {startIcon}
          </div>
        )}

        {/* Core Input Element */}
        <input
          ref={ref}
          type={type}
          disabled={disabled}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          aria-invalid={isError ? true : props["aria-invalid"]}
          className={cn(
            "w-full h-10 sm:h-11 bg-transparent text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500",
            "font-jakarta outline-none border-0 shadow-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0",
            "disabled:cursor-not-allowed",
            startIcon ? "pl-10" : "px-3.5",
            endIcon ? "pr-10" : "px-3.5",
            className
          )}
          {...props}
        />

        {/* Trailing / End Icon */}
        {endIcon && (
          <div className="absolute right-3.5 flex items-center text-gray-400 dark:text-gray-500 z-10">
            {endIcon}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
