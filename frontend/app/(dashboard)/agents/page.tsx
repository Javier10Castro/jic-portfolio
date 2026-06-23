'use client';

import { Bot, Code2, Lightbulb, PenLine, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AgentCapability {
  name: string;
  icon: typeof Code2;
}

interface Agent {
  name: string;
  description: string;
  status: 'active' | 'idle';
  capabilities: AgentCapability[];
}

const agents: Agent[] = [
  {
    name: 'Code Generator',
    description: 'Generates production-ready code snippets and boilerplate based on natural language descriptions.',
    status: 'active',
    capabilities: [
      { name: 'Code Gen', icon: Code2 },
      { name: 'Refactoring', icon: Code2 },
      { name: 'Boilerplate', icon: Code2 },
    ],
  },
  {
    name: 'Architecture Advisor',
    description: 'Analyzes system architecture and provides recommendations for scalability and best practices.',
    status: 'active',
    capabilities: [
      { name: 'Analysis', icon: Lightbulb },
      { name: 'Diagrams', icon: Lightbulb },
      { name: 'Reviews', icon: Lightbulb },
    ],
  },
  {
    name: 'Content Writer',
    description: 'Creates documentation, blog posts, and technical content with customizable tone and style.',
    status: 'idle',
    capabilities: [
      { name: 'Writing', icon: PenLine },
      { name: 'Editing', icon: PenLine },
      { name: 'SEO', icon: PenLine },
    ],
  },
];

const statusIcon = {
  active: CheckCircle2,
  idle: Clock,
};

const statusVariant = {
  active: 'success' as const,
  idle: 'secondary' as const,
};

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Bot className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Agents</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your AI agents and their capabilities
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => {
          const StatusIcon = statusIcon[agent.status];
          return (
            <Card key={agent.name}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>{agent.name}</CardTitle>
                  <Badge variant={statusVariant[agent.status]}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {agent.status}
                  </Badge>
                </div>
                <CardDescription>{agent.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {agent.capabilities.map((cap) => (
                    <Badge key={cap.name} variant="outline">
                      <cap.icon className="mr-1 h-3 w-3" />
                      {cap.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
