'use client';

import { useRef } from 'react';
import { Paperclip } from 'lucide-react';
import { cn } from '@/utils/cn';

interface AttachmentButtonProps {
  onAttach?: (files: File[]) => void;
}

export default function AttachmentButton({ onAttach }: AttachmentButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && onAttach) {
      onAttach(Array.from(files));
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        className={cn(
          'h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors'
        )}
        type="button"
        title="Attach file"
      >
        <Paperclip className="h-4 w-4" />
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.txt"
        onChange={handleChange}
        className="hidden"
      />
    </>
  );
}
