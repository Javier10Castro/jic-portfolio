'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { GitBranch, Plus, Play } from 'lucide-react';

type WorkflowStatus = 'active' | 'paused' | 'draft';

interface Workflow {
  id: string;
  name: string;
  status: WorkflowStatus;
  steps: number;
  lastRun: string;
}

const workflows: Workflow[] = [
  { id: '1', name: 'CI Pipeline', status: 'active', steps: 6, lastRun: '2026-06-23 09:15' },
  { id: '2', name: 'Deploy to Staging', status: 'active', steps: 4, lastRun: '2026-06-22 14:30' },
  { id: '3', name: 'Code Review Bot', status: 'paused', steps: 3, lastRun: '2026-06-20 11:00' },
  { id: '4', name: 'Release Tagging', status: 'draft', steps: 2, lastRun: 'Never' },
];

const statusVariant: Record<WorkflowStatus, 'success' | 'warning' | 'secondary'> = {
  active: 'success',
  paused: 'warning',
  draft: 'secondary',
};

export default function WorkflowsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-gray-600 dark:text-gray-400" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Workflows</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Automate your development pipeline with custom workflows.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Workflow
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-gray-500" />
            <CardTitle>All Workflows</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Steps</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((wf) => (
                <TableRow key={wf.id}>
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100">{wf.name}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[wf.status]}>{wf.status}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400">{wf.steps}</TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400">{wf.lastRun}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <Play className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
