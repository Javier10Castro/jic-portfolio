'use client';

import { Link2, Code2, MessageSquare, Cloud, Mail } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type ConnectionStatus = 'connected' | 'disconnected' | 'error';

interface Integration {
  name: string;
  type: string;
  description: string;
  status: ConnectionStatus;
  icon: typeof Code2;
}

const integrations: Integration[] = [
  {
    name: 'GitHub',
    type: 'Version Control',
    description: 'Sync repositories, manage pull requests, and automate CI/CD workflows.',
    status: 'connected',
    icon: Code2,
  },
  {
    name: 'Slack',
    type: 'Communication',
    description: 'Receive notifications and alerts directly in your Slack channels.',
    status: 'disconnected',
    icon: MessageSquare,
  },
  {
    name: 'AWS',
    type: 'Cloud Provider',
    description: 'Deploy and manage infrastructure on Amazon Web Services.',
    status: 'error',
    icon: Cloud,
  },
  {
    name: 'SendGrid',
    type: 'Email Service',
    description: 'Send transactional emails and manage email templates.',
    status: 'disconnected',
    icon: Mail,
  },
];

const statusVariant: Record<ConnectionStatus, 'success' | 'secondary' | 'destructive'> = {
  connected: 'success',
  disconnected: 'secondary',
  error: 'destructive',
};

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Integrations</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Connect your tools and services
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          return (
            <Card key={integration.name}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                  <Icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{integration.name}</CardTitle>
                    <Badge variant={statusVariant[integration.status]}>
                      {integration.status}
                    </Badge>
                  </div>
                  <CardDescription className="mt-0.5">{integration.description}</CardDescription>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{integration.type}</span>
                </div>
                {integration.status === 'disconnected' && (
                  <Button variant="default" size="sm">
                    Connect
                  </Button>
                )}
                {integration.status === 'error' && (
                  <Button variant="outline" size="sm">
                    Reconnect
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
