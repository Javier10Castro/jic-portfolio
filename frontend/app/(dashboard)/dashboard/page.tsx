'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FolderKanban, Sparkles, Rocket, Activity, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const statCards = [
  { title: 'Projects', value: '12', icon: FolderKanban, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  { title: 'Active Builds', value: '4', icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  { title: 'Deployments', value: '24', icon: Rocket, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  { title: 'Team Members', value: '8', icon: Users, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
];

const recentActivity = [
  { action: 'Deployed v2.4.1 to production', project: 'Marketing Site', time: '2 minutes ago' },
  { action: 'Build completed successfully', project: 'Mobile App', time: '15 minutes ago' },
  { action: 'New workflow created', project: 'API Service', time: '1 hour ago' },
  { action: 'Project settings updated', project: 'Documentation', time: '3 hours ago' },
  { action: 'Deployment failed', project: 'Analytics Dashboard', time: '5 hours ago' },
];

const quickActions = [
  { label: 'Open Studio', href: '/studio', icon: Sparkles },
  { label: 'View Projects', href: '/projects', icon: FolderKanban },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Welcome back! Here&apos;s an overview of your workspace.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{stat.title}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{stat.value}</p>
                </div>
                <div className={`rounded-lg p-3 ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-500" />
              <CardTitle>Recent Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0 dark:border-gray-800">
                  <div>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{item.action}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.project}</p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-gray-400">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-gray-500" />
              <CardTitle>Quick Actions</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
