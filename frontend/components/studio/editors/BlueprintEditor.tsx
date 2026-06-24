'use client';

import { Artifact } from '@/types/workspace';
import BaseEditor from './BaseEditor';

interface Props {
  artifact?: Artifact;
  isEditing: boolean;
  content: string;
  onContentChange: (content: string) => void;
}

export default function BlueprintEditor(props: Props) {
  return (
    <BaseEditor
      {...props}
      title="Blueprint"
      description="Architecture blueprint defining the project structure, components, and data flow."
      language="json"
    />
  );
}
