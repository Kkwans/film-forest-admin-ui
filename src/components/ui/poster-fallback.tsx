import type { CSSProperties } from 'react';

const TYPE_LABELS: Record<string, string> = {
  movie: '电影',
  drama: '剧集',
  variety: '综艺',
  anime: '动漫',
  short_drama: '短剧',
};

const COLORS = [
  ['#11221d', '#6ee7b7', '#164e43'],
  ['#24151d', '#fda4af', '#7f1d3d'],
  ['#121d32', '#93c5fd', '#1e3a8a'],
  ['#241d12', '#fcd34d', '#854d0e'],
  ['#1b1728', '#c4b5fd', '#5b21b6'],
];

function hashOf(value: string) {
  return [...value].reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) | 0, 0) >>> 0;
}

export default function PosterFallback({
  title,
  type,
  year,
  genre,
}: {
  title: string;
  type?: string;
  year?: number | string | null;
  genre?: string | null;
}) {
  const safeTitle = title.trim() || '暂无片名';
  const [ink, accent, glow] = COLORS[hashOf(`${type || ''}:${safeTitle}`) % COLORS.length];
  const typeLabel = TYPE_LABELS[type || ''] || '影视';
  const genreLabel = genre?.replace(/[\[\]"']/gu, '').split(/[，,、/]/u).map(value => value.trim()).find(Boolean);
  const initial = [...safeTitle][0] || '影';
  const style = { '--poster-ink': ink, '--poster-accent': accent, '--poster-glow': glow } as CSSProperties;
  return (
    <div className="relative isolate flex size-full overflow-hidden bg-[var(--poster-ink)] p-[9%] text-white" style={style} aria-label={`${safeTitle}海报占位图`}>
      <div aria-hidden className="absolute inset-0 opacity-90" style={{ background: 'radial-gradient(circle at 76% 18%, var(--poster-glow) 0, transparent 42%), linear-gradient(145deg, transparent 20%, var(--poster-glow) 100%)' }} />
      <div aria-hidden className="absolute -right-[28%] top-[15%] aspect-square w-[92%] rounded-full border border-[var(--poster-accent)]/25" />
      <div aria-hidden className="absolute -right-[11%] top-[28%] aspect-square w-[70%] rounded-full border border-[var(--poster-accent)]/20" />
      <div aria-hidden className="absolute -bottom-[20%] -left-[30%] h-[70%] w-[90%] rounded-full bg-[var(--poster-glow)]/45 blur-3xl" />
      <div className="relative z-10 flex min-h-full w-full flex-col justify-between">
        <div className="flex items-center justify-between gap-2 text-[0.48rem] font-semibold uppercase tracking-[0.2em] text-white/65">
          <span className="border-l-2 border-[var(--poster-accent)] pl-1.5">FILM FOREST</span>
          <span>{year || typeLabel}</span>
        </div>
        <div className="relative mt-auto pt-[42%]">
          <span aria-hidden className="absolute -top-[10%] left-[-4%] font-black text-[clamp(5rem,18vw,9rem)] leading-none text-[var(--poster-accent)]/10">{initial}</span>
          <div className="relative">
            <p className="mb-1.5 text-[0.5rem] font-bold uppercase tracking-[0.2em] text-[var(--poster-accent)]">{typeLabel}{genreLabel ? ` / ${genreLabel}` : ''}</p>
            <p className="line-clamp-3 text-[clamp(0.95rem,4vw,1.5rem)] font-black leading-[1.08] tracking-[-0.04em]">{safeTitle}</p>
          </div>
        </div>
        <div className="mt-5 flex items-end justify-between gap-2 border-t border-white/15 pt-2 text-[0.45rem] font-semibold uppercase tracking-[0.16em] text-white/45">
          <span>ARCHIVE EDITION</span>
          <span className="text-[var(--poster-accent)]/80">{typeLabel}</span>
        </div>
      </div>
    </div>
  );
}
