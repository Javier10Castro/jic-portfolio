'use client';

import { Artifact } from '@/types/workspace';
import BaseEditor from './BaseEditor';

interface Props {
  artifact?: Artifact;
  isEditing: boolean;
  content: string;
  onContentChange: (content: string) => void;
}

export default function ContentEditor(props: Props) {
  return (
    <BaseEditor
      {...props}
      title="Content"
      description="Generated page content, copy, and messaging for the project."
      language="markdown"
    />
  );
}
