export interface ProjectSummary {
  projectId?: string;
  name: string;
  pages: PageSummary[];
  features: FeatureSummary[];
  colorPalette: string[];
  typography: string;
  deploymentTarget: DeploymentTarget;
  estimatedCost: number;
  estimatedTokens: number;
  estimatedTime: number;
}

export interface PageSummary {
  name: string;
  route?: string;
  description?: string;
}

export interface FeatureSummary {
  name: string;
  description: string;
  included: boolean;
}

export type DeploymentTarget = 'vercel' | 'netlify' | 'aws' | 'gcp' | 'azure';
