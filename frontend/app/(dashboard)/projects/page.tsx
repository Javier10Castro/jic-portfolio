'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FolderKanban, Plus, ExternalLink } from 'lucide-react';
import Link from 'next/link';

type ProjectStatus = 'active' | 'archived' | 'draft' | 'completed';

interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  created: string;
}

const projects: Project[] = [
  { id: '1', name: 'Marketing Site', status: 'active', created: '2026-01-15' },
  { id: '2', name: 'Mobile App', status: 'draft', created: '2026-03-22' },
  { id: '3', name: 'API Service', status: 'active', created: '2025-11-08' },
  { id: '4', name: 'Documentation', status: 'completed', created: '2025-09-30' },
];

const statusVariant: Record<ProjectStatus, 'success' | 'secondary' | 'warning' | 'default'> = {
  active: 'success',
  archived: 'secondary',
  draft: 'warning',
  completed: 'default',
};

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Projects</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your AI-generated projects.
          </p>
        </div>
        <Link href="/studio">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-gray-500" />
            <CardTitle>All Projects</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium text-gray-900 dark:text-gray-100">{project.name}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[project.status]}>{project.status}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400">{project.created}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
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
