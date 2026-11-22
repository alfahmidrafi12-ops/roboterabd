import React, { useMemo } from 'react';

interface HighlightMatchProps {
  text: string;
  query?: string;
  markClassName?: string;
}

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const HighlightMatch: React.FC<HighlightMatchProps> = ({
  text,
  query = '',
  markClassName = 'bg-[#087BFF]/14 text-[#071A3D] rounded-[3px] px-0.5 font-extrabold ring-1 ring-inset ring-[#087BFF]/25',
}) => {
  const regex = useMemo(() => {
    const rawTokens = query
      .trim()
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);

    if (rawTokens.length === 0) return null;

    const uniqueSorted = Array.from(new Set(rawTokens)).sort(
      (a, b) => b.length - a.length
    );

    const pattern = uniqueSorted.map(escapeRegExp).join('|');
    if (!pattern) return null;

    return new RegExp(`(${pattern})`, 'gi');
  }, [query]);

  if (!regex || !text) {
    return <>{text}</>;
  }

  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) return null;
        // Odd indices from a single-capturing-group split are guaranteed matches
        if (index % 2 === 1) {
          return (
            <mark key={`${index}-${part}`} className={markClassName}>
              {part}
            </mark>
          );
        }
        return <React.Fragment key={`${index}-${part}`}>{part}</React.Fragment>;
      })}
    </>
  );
};
