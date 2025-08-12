'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface LeakerFlowLogoProps {
  size?: number;
  showText?: boolean;
  text?: string;
  textClassName?: string;
}

export function LeakerFlowLogo({
  size = 24,
  showText = false,
  text = 'Leaker Flow',
  textClassName = 'font-semibold text-foreground text-sm md:text-base',
}: LeakerFlowLogoProps) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // After mount, we can access the theme
  useEffect(() => {
    setMounted(true);
  }, []);

  const shouldInvert =
    mounted && (theme === 'dark' || (theme === 'system' && systemTheme === 'dark'));
  return (
    <div className="flex items-center gap-2" style={{ lineHeight: 1 }}>
      <Image
        src="/leakerflow.png"
        alt="LeakerFlow"
        width={size}
        height={size}
        className={`${shouldInvert ? 'invert' : ''} flex-shrink-0`}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      />
      {showText && (
        <span className={textClassName}>{text}</span>
      )}
    </div>
  );
}

// Backwards compatibility: keep old name available for existing imports
export const KortixLogo = LeakerFlowLogo;
