'use client';

import { Artifact } from '@/types/workspace';
import BaseEditor from './BaseEditor';

interface Props {
  artifact?: Artifact;
  isEditing: boolean;
  content: string;
  onContentChange: (content: string) => void;
}

export default function ContextEditor(props: Props) {
  return (
    <BaseEditor
      {...props}
      title="Context"
      description="Project context including brand, audience, goals, and constraints gathered during the conversation."
      language="json"
    />
  );
}
