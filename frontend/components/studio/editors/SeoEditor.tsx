'use client';

import { Artifact } from '@/types/workspace';
import BaseEditor from './BaseEditor';

interface Props {
  artifact?: Artifact;
  isEditing: boolean;
  content: string;
  onContentChange: (content: string) => void;
}

export default function SeoEditor(props: Props) {
  return (
    <BaseEditor
      {...props}
      title="SEO"
      description="SEO metadata, meta tags, Open Graph, sitemap configuration, and analytics."
      language="json"
    />
  );
}
