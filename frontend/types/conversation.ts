export interface Conversation {
  id: string;
  title: string;
  projectId?: string;
  messages: Message[];
  status: ConversationStatus;
  context: ConversationContext;
  createdAt: string;
  updatedAt: string;
}

export type ConversationStatus = 'active' | 'archived' | 'completed';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type: MessageType;
  timestamp: string;
  metadata?: Record<string, unknown>;
  streaming?: boolean;
}

export type MessageType = 'text' | 'question' | 'answer' | 'suggestion' | 'system' | 'error' | 'code';

export interface ConversationContext {
  intent: DetectedIntent;
  entities: Entity[];
  brand: BrandInfo;
  pages: PageInfo[];
  features: FeatureInfo[];
  missingFields: MissingField[];
  assets: Asset[];
  progress: number;
}

export interface DetectedIntent {
  type: string;
  confidence: number;
  label: string;
}

export interface Entity {
  name: string;
  value: string;
  confidence: number;
}

export interface BrandInfo {
  name?: string;
  tagline?: string;
  colors?: string[];
  typography?: string;
  tone?: string;
  industry?: string;
}

export interface PageInfo {
  name: string;
  description?: string;
  route?: string;
  estimatedComplexity?: number;
}

export interface FeatureInfo {
  name: string;
  description: string;
  priority: 'essential' | 'nice-to-have' | 'future';
  estimatedEffort?: number;
}

export interface MissingField {
  field: string;
  label: string;
  description: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
}

export type QuestionType = 'radio' | 'checkbox' | 'select' | 'text' | 'textarea' | 'number' | 'color' | 'date' | 'boolean' | 'file';

export interface Asset {
  id: string;
  name: string;
  type: 'image' | 'logo' | 'document' | 'other';
  url?: string;
  size?: number;
  uploadedAt: string;
}
