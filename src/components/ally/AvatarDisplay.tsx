import { cn } from '@/lib/utils';

type AvatarDisplayProps = {
  src?: string | null;
  name?: string | null;
  alt?: string;
  className?: string;
  textClassName?: string;
};

const isEmojiAvatar = (value?: string | null) => {
  if (!value) return false;
  if (value.startsWith('http')) return false;
  if (value.startsWith('data:')) return false;
  if (value.startsWith('/')) return false;
  return true;
};

export function AvatarDisplay({ src, name, alt, className, textClassName }: AvatarDisplayProps) {
  if (src && isEmojiAvatar(src)) {
    return (
      <div className={cn('flex items-center justify-center bg-[#1A6B3C]/10 text-[#1A6B3C]', className)}>
        <span className={cn('text-lg leading-none', textClassName)}>{src}</span>
      </div>
    );
  }

  if (src) {
    return <img src={src} alt={alt ?? name ?? ''} className={className} />;
  }

  const fallback = name?.trim().slice(0, 1).toUpperCase() || '?';

  return (
    <div className={cn('flex items-center justify-center bg-[#1A6B3C]/10 text-[#1A6B3C] font-bold', className)}>
      <span className={cn('text-sm leading-none', textClassName)}>{fallback}</span>
    </div>
  );
}
