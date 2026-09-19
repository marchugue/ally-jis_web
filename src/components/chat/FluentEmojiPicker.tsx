import { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Smile, Trees, Utensils, Trophy, Plane, Lightbulb, Heart, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import catalogData from '@/lib/fluentEmojiCatalog.json';

export interface FluentEmojiItem {
  id: string;
  name: string;
  emoji: string;
  url: string;
  keywords: string[];
}

export interface FluentEmojiCategory {
  id: string;
  name: string;
  emojis: FluentEmojiItem[];
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  people: <Smile size={18} />,
  nature: <Trees size={18} />,
  foods: <Utensils size={18} />,
  activity: <Trophy size={18} />,
  places: <Plane size={18} />,
  objects: <Lightbulb size={18} />,
  symbols: <Heart size={18} />,
  flags: <Flag size={18} />,
};

interface FluentEmojiPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
  autoFocus?: boolean;
}

const RECENT_KEY = 'ally_recent_fluent_emojis';

export function FluentEmojiPicker({
  onSelect,
  className,
  autoFocus = false,
}: FluentEmojiPickerProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('people');
  const [hoveredEmoji, setHoveredEmoji] = useState<FluentEmojiItem | null>(null);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load recents from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_KEY);
      if (saved) {
        setRecentEmojis(JSON.parse(saved).slice(0, 16));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleSelect = (emoji: FluentEmojiItem) => {
    // Save to recents
    try {
      const updated = [emoji.emoji, ...recentEmojis.filter((e) => e !== emoji.emoji)].slice(0, 16);
      setRecentEmojis(updated);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage errors
    }
    onSelect(emoji.emoji);
  };

  useEffect(() => {
    if (autoFocus && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [autoFocus]);

  const categories = catalogData as FluentEmojiCategory[];

  // Filtered emojis based on search query
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;

    const results: FluentEmojiItem[] = [];
    for (const cat of categories) {
      for (const em of cat.emojis) {
        if (
          em.name.toLowerCase().includes(q) ||
          em.id.toLowerCase().includes(q) ||
          em.emoji.includes(q) ||
          em.keywords.some((k) => k.toLowerCase().includes(q))
        ) {
          results.push(em);
        }
      }
    }
    return results;
  }, [search, categories]);

  // Map for fast recent emoji lookup
  const emojiMap = useMemo(() => {
    const map = new Map<string, FluentEmojiItem>();
    for (const cat of categories) {
      for (const em of cat.emojis) {
        map.set(em.emoji, em);
      }
    }
    return map;
  }, [categories]);

  const recentItems = useMemo(() => {
    return recentEmojis.map((e) => emojiMap.get(e)).filter(Boolean) as FluentEmojiItem[];
  }, [recentEmojis, emojiMap]);

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    setSearch('');
    const el = document.getElementById(`fluent-cat-${categoryId}`);
    if (el && scrollRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col w-[360px] max-w-[min(100vw-2rem,360px)] h-[440px]',
        'bg-white/95 dark:bg-[#111827]/95 backdrop-blur-2xl',
        'border border-black/[0.08] dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden select-none',
        className,
      )}
    >
      {/* Search Header */}
      <div className="p-3 pb-2 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center gap-2">
        <div className="relative flex-1 flex items-center">
          <Search
            size={16}
            className="absolute left-2.5 text-gray-400 dark:text-gray-500 pointer-events-none"
          />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search Microsoft Fluent emojis…"
            className={cn(
              'w-full pl-8 pr-8 py-1.5 text-xs rounded-xl',
              'bg-gray-100/80 dark:bg-white/[0.06] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500',
              'border border-transparent focus:border-emerald-500/40 dark:focus:border-emerald-500/40 focus:bg-white dark:focus:bg-[#1E293B]',
              'outline-none transition-all',
            )}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer p-0.5"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Category Icons Nav */}
      {!search && (
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-black/[0.04] dark:border-white/[0.06] bg-gray-50/50 dark:bg-white/[0.02] overflow-x-auto no-scrollbar">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => scrollToCategory(cat.id)}
                title={cat.name}
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-lg transition-colors cursor-pointer flex-shrink-0',
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 font-semibold'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5',
                )}
              >
                {CATEGORY_ICONS[cat.id] ?? <Smile size={18} />}
              </button>
            );
          })}
        </div>
      )}

      {/* Emoji Scroll Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-2 space-y-4"
        style={{ scrollbarWidth: 'thin' }}
      >
        {/* Search Results */}
        {searchResults !== null ? (
          <div>
            <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
              Search Results ({searchResults.length})
            </div>
            {searchResults.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 dark:text-gray-500">
                No Microsoft Fluent emojis found for &ldquo;{search}&rdquo;
              </div>
            ) : (
              <div className="grid grid-cols-8 gap-1.5">
                {searchResults.map((em) => (
                  <button
                    key={em.id + em.emoji}
                    type="button"
                    onClick={() => handleSelect(em)}
                    onMouseEnter={() => setHoveredEmoji(em)}
                    onMouseLeave={() => setHoveredEmoji(null)}
                    title={em.name}
                    className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 hover:scale-120 active:scale-95 transition-transform duration-100 cursor-pointer"
                  >
                    <img
                      src={em.url}
                      alt={em.name}
                      width={28}
                      height={28}
                      loading="lazy"
                      className="w-7 h-7 object-contain pointer-events-none drop-shadow-xs"
                      draggable={false}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Recents Section */}
            {recentItems.length > 0 && (
              <div>
                <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 px-1">
                  Recently Used
                </div>
                <div className="grid grid-cols-8 gap-1.5">
                  {recentItems.map((em) => (
                    <button
                      key={'recent-' + em.id + em.emoji}
                      type="button"
                      onClick={() => handleSelect(em)}
                      onMouseEnter={() => setHoveredEmoji(em)}
                      onMouseLeave={() => setHoveredEmoji(null)}
                      title={em.name}
                      className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 hover:scale-120 active:scale-95 transition-transform duration-100 cursor-pointer"
                    >
                      <img
                        src={em.url}
                        alt={em.name}
                        width={28}
                        height={28}
                        loading="lazy"
                        className="w-7 h-7 object-contain pointer-events-none drop-shadow-xs"
                        draggable={false}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category Sections */}
            {categories.map((cat) => (
              <div key={cat.id} id={`fluent-cat-${cat.id}`}>
                <div className="sticky top-0 z-10 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md py-1 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1">
                  {cat.name}
                </div>
                <div className="grid grid-cols-8 gap-1.5 pt-1">
                  {cat.emojis.map((em) => (
                    <button
                      key={em.id + em.emoji}
                      type="button"
                      onClick={() => handleSelect(em)}
                      onMouseEnter={() => setHoveredEmoji(em)}
                      onMouseLeave={() => setHoveredEmoji(null)}
                      title={em.name}
                      className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 hover:scale-120 active:scale-95 transition-transform duration-100 cursor-pointer"
                    >
                      <img
                        src={em.url}
                        alt={em.name}
                        width={28}
                        height={28}
                        loading="lazy"
                        className="w-7 h-7 object-contain pointer-events-none drop-shadow-xs"
                        draggable={false}
                      />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Footer Preview */}
      <div className="h-10 px-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-gray-50/70 dark:bg-white/[0.02]">
        {hoveredEmoji ? (
          <div className="flex items-center gap-2 overflow-hidden">
            <img
              src={hoveredEmoji.url}
              alt={hoveredEmoji.name}
              width={24}
              height={24}
              className="w-6 h-6 object-contain flex-shrink-0 drop-shadow-xs"
            />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-200 truncate">
              {hoveredEmoji.name}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
            1,499 Microsoft Fluent 3D emojis
          </span>
        )}
      </div>
    </div>
  );
}
