'use client';

import type { BrandInfo } from '@/types/conversation';

interface BrandPanelProps {
  brand: BrandInfo;
}

export default function BrandPanel({ brand }: BrandPanelProps) {
  return (
    <div className="space-y-3">
      {brand.name && (
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Name</p>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{brand.name}</p>
        </div>
      )}
      {brand.tagline && (
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Tagline</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{brand.tagline}</p>
        </div>
      )}
      {brand.industry && (
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Industry</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{brand.industry}</p>
        </div>
      )}
      {brand.tone && (
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Tone</p>
          <p className="text-sm text-gray-700 dark:text-gray-300">{brand.tone}</p>
        </div>
      )}
      {brand.colors && brand.colors.length > 0 && (
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">Colors</p>
          <div className="flex gap-1.5 flex-wrap">
            {brand.colors.map((color, idx) => (
              <div
                key={idx}
                className="w-6 h-6 rounded-full border border-gray-200 dark:border-gray-600"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
      )}
      {brand.typography && (
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500">Typography</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{brand.typography}</p>
        </div>
      )}
      {!brand.name && !brand.tagline && !brand.industry && !brand.tone && !brand.colors && !brand.typography && (
        <p className="text-xs text-gray-400 dark:text-gray-500">No brand information</p>
      )}
    </div>
  );
}
