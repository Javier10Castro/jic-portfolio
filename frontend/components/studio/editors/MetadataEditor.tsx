'use client';

import { Artifact } from '@/types/workspace';
import BaseEditor from './BaseEditor';

interface Props {
  artifact?: Artifact;
  isEditing: boolean;
  content: string;
  onContentChange: (content: string) => void;
}

export default function MetadataEditor(props: Props) {
  return (
    <BaseEditor
      {...props}
      title="Metadata"
      description="Deployment configuration, environment variables, build settings, and project metadata."
      language="json"
    />
  );
}
