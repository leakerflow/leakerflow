'use client';

import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface KortixLogoProps {
  size?: number;
}
export function KortixLogo({ size = 24 }: KortixLogoProps) {
  return (
    <Image
      src="/leakerflow.png"
      alt="Leaker Flow"
      width={size}
      height={size}
      className="flex-shrink-0"
    />
  );
}
