'use client';

import { Puzzle, Package, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Plugin {
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  author: string;
}

const plugins: Plugin[] = [
  {
    name: 'ESLint',
    version: '2.1.0',
    description: 'Integrates ESLint for real-time code linting and formatting within the editor.',
    enabled: true,
    author: 'Team',
  },
  {
    name: 'Prettier',
    version: '1.8.3',
    description: 'Automatic code formatting with Prettier on save with customizable rules.',
    enabled: true,
    author: 'Community',
  },
  {
    name: 'GitLens',
    version: '3.0.1',
    description: 'Supercharges Git capabilities with blame annotations, code lens, and history.',
    enabled: false,
    author: 'GitKraken',
  },
  {
    name: 'Tailwind CSS IntelliSense',
    version: '0.12.5',
    description: 'Advanced Tailwind CSS class completion, linting, and hover previews.',
    enabled: true,
    author: 'Tailwind Labs',
  },
];

export default function PluginsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Puzzle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Plugins</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Extend functionality with community and official plugins
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {plugins.map((plugin) => (
          <Card key={plugin.name}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-gray-400" />
                  <CardTitle>{plugin.name}</CardTitle>
                </div>
                <Badge variant={plugin.enabled ? 'success' : 'secondary'}>
                  {plugin.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <CardDescription>{plugin.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>v{plugin.version}</span>
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {plugin.author}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
