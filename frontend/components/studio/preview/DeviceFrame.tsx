'use client';

import type { ReactNode } from 'react';
import type { DeviceType } from '@/types/deployment';
import { cn } from '@/utils/cn';

interface DeviceFrameProps {
  device: DeviceType;
  children: ReactNode;
}

const deviceStyles: Record<DeviceType, string> = {
  desktop: '',
  tablet: 'shadow-lg shadow-gray-300/30 dark:shadow-black/30',
  mobile: 'rounded-[28px] shadow-xl shadow-gray-300/40 dark:shadow-black/40 border-4 border-gray-800 dark:border-gray-600 overflow-hidden',
};

const widthConstraints: Record<DeviceType, string> = {
  desktop: 'w-full',
  tablet: 'w-[768px]',
  mobile: 'w-[375px]',
};

export default function DeviceFrame({ device, children }: DeviceFrameProps) {
  return (
    <div className={cn('mx-auto transition-all duration-300', deviceStyles[device], widthConstraints[device])}>
      {device === 'mobile' && (
        <div className="bg-gray-800 dark:bg-gray-600 px-4 py-1 flex justify-center">
          <div className="w-16 h-1.5 rounded-full bg-gray-600 dark:bg-gray-400" />
        </div>
      )}
      {children}
    </div>
  );
}
