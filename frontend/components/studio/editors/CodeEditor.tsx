'use client';

import { Artifact } from '@/types/workspace';
import BaseEditor from './BaseEditor';

interface Props {
  artifact?: Artifact;
  isEditing: boolean;
  content: string;
  onContentChange: (content: string) => void;
}

export default function CodeEditor(props: Props) {
  return (
    <BaseEditor
      {...props}
      title="Code"
      description="Generated source code including components, pages, styles, and scripts."
      language="html"
    />
  );
}
