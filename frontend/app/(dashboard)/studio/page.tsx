'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sparkles, Send, FlaskConical, Database, Code, TestTube, Shield, Globe, Zap, CheckCircle, Rocket, MessageSquarePlus } from 'lucide-react';

const pipelineStages = [
  { step: 1, name: 'Idea Validation', icon: FlaskConical, description: 'AI analyzes your concept for feasibility and market potential.' },
  { step: 2, name: 'Requirement Generation', icon: Database, description: 'Structured requirements and user stories are generated.' },
  { step: 3, name: 'Architecture Design', icon: Code, description: 'System architecture and tech stack are recommended.' },
  { step: 4, name: 'UI/UX Prototyping', icon: Sparkles, description: 'Wireframes and design prototypes are created.' },
  { step: 5, name: 'Code Generation', icon: Code, description: 'Full-stack code is generated from the specifications.' },
  { step: 6, name: 'Automated Testing', icon: TestTube, description: 'Unit, integration, and e2e tests are written and run.' },
  { step: 7, name: 'Security Audit', icon: Shield, description: 'Vulnerability scanning and compliance checks.' },
  { step: 8, name: 'Deployment Prep', icon: Globe, description: 'Infrastructure as code and CI/CD pipelines are set up.' },
  { step: 9, name: 'Staging Deploy', icon: Zap, description: 'Deployed to staging for final verification.' },
  { step: 10, name: 'Production Launch', icon: Rocket, description: 'Live deployment with monitoring and rollback.' },
];

const recentBuilds = [
  { id: 'B-001', name: 'Marketing Site v2', status: 'completed', created: '2026-06-22' },
  { id: 'B-002', name: 'Mobile App MVP', status: 'building', created: '2026-06-21' },
  { id: 'B-003', name: 'API Service', status: 'failed', created: '2026-06-19' },
  { id: 'B-004', name: 'Documentation Portal', status: 'pending', created: '2026-06-18' },
];

const buildStatusVariant: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  completed: 'success',
  building: 'warning',
  failed: 'destructive',
  pending: 'secondary',
};

export default function StudioPage() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Product Studio</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Build full-stack products from a single prompt using our 10-stage AI pipeline.
          </p>
        </div>
        <Button onClick={() => router.push('/studio/chat')} size="lg" className="gap-2 ml-4 shrink-0">
          <MessageSquarePlus className="h-5 w-5" />
          Start Conversation
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pipeline Overview</CardTitle>
          <CardDescription>Your product goes through these 10 stages from idea to launch.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {pipelineStages.map((stage) => (
              <div key={stage.step} className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900">
                <div className="mb-2 flex items-center gap-2">
                  <stage.icon className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-600">Step {stage.step}</span>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{stage.name}</h4>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{stage.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Start New Build</CardTitle>
            <CardDescription>Describe the product you want to build.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              className="min-h-[120px] w-full rounded-lg border border-gray-300 bg-white p-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500"
              placeholder="e.g. Build a SaaS dashboard with user authentication, billing via Stripe, and real-time analytics..."
            />
            <Button className="w-full">
              <Send className="mr-2 h-4 w-4" />
              Generate Product
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-gray-500" />
              <CardTitle>Recent Builds</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Build</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBuilds.map((build) => (
                  <TableRow key={build.id}>
                    <TableCell className="font-mono text-xs text-gray-500">{build.id}</TableCell>
                    <TableCell className="font-medium text-gray-900 dark:text-gray-100">{build.name}</TableCell>
                    <TableCell>
                      <Badge variant={buildStatusVariant[build.status]}>{build.status}</Badge>
                    </TableCell>
                    <TableCell className="text-gray-500 dark:text-gray-400">{build.created}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
