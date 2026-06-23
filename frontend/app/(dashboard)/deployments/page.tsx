'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Rocket, ExternalLink, RotateCcw } from 'lucide-react';

type Environment = 'dev' | 'staging' | 'production';
type DeploymentStatus = 'pending' | 'building' | 'deployed' | 'failed';

interface Deployment {
  id: string;
  project: string;
  environment: Environment;
  status: DeploymentStatus;
  url: string;
  date: string;
}

const deployments: Deployment[] = [
  { id: 'd-1', project: 'Marketing Site', environment: 'production', status: 'deployed', url: 'https://marketing.example.com', date: '2026-06-23 10:30' },
  { id: 'd-2', project: 'Mobile App', environment: 'staging', status: 'building', url: 'https://staging.mobile.example.com', date: '2026-06-23 09:15' },
  { id: 'd-3', project: 'API Service', environment: 'dev', status: 'deployed', url: 'https://dev.api.example.com', date: '2026-06-22 16:45' },
  { id: 'd-4', project: 'Analytics Dashboard', environment: 'production', status: 'failed', url: 'https://analytics.example.com', date: '2026-06-22 14:00' },
  { id: 'd-5', project: 'Documentation', environment: 'production', status: 'pending', url: 'https://docs.example.com', date: '2026-06-21 11:20' },
];

const envVariant: Record<Environment, 'default' | 'warning' | 'success'> = {
  dev: 'default',
  staging: 'warning',
  production: 'success',
};

const statusVariant: Record<DeploymentStatus, 'secondary' | 'warning' | 'success' | 'destructive'> = {
  pending: 'secondary',
  building: 'warning',
  deployed: 'success',
  failed: 'destructive',
};

export default function DeploymentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Rocket className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Deployments</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Monitor and manage your deployments across environments.
          </p>
        </div>
        <Button variant="outline">
          <RotateCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-gray-500" />
            <CardTitle>Deployment History</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Environment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deployments.map((dep) => (
                <TableRow key={dep.id}>
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100">{dep.project}</TableCell>
                  <TableCell>
                    <Badge variant={envVariant[dep.environment]}>{dep.environment}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[dep.status]}>{dep.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <a
                      href={dep.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {dep.url}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400">{dep.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
