'use client';

import { useState } from 'react';
import { Settings, Bell, Shield, Key, Globe, Moon, Sun, Monitor } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';

interface ToggleItem {
  id: string;
  label: string;
  enabled: boolean;
}

const notificationToggles: ToggleItem[] = [
  { id: 'deployments', label: 'Deployment notifications', enabled: true },
  { id: 'mentions', label: 'Mentions and comments', enabled: true },
  { id: 'weekly', label: 'Weekly summary', enabled: false },
  { id: 'marketing', label: 'Product updates and marketing', enabled: false },
];

export default function SettingsPage() {
  const [toggles, setToggles] = useState(notificationToggles);

  function toggleNotification(id: string) {
    setToggles((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage your application preferences
          </p>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'general', label: 'General', icon: <Globe className="h-4 w-4" /> },
          { id: 'notifications', label: 'Notifications', icon: <Bell className="h-4 w-4" /> },
          { id: 'security', label: 'Security', icon: <Shield className="h-4 w-4" /> },
          { id: 'api', label: 'API', icon: <Key className="h-4 w-4" /> },
        ]}
        defaultTab="general"
      >
        {(activeTab) => (
          <>
            {activeTab === 'general' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Settings</CardTitle>
                    <CardDescription>Configure your project defaults</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input label="Project Name" defaultValue="My Project" />
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Default Environment
                      </label>
                      <select className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
                        <option>Development</option>
                        <option>Staging</option>
                        <option>Production</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Timezone
                      </label>
                      <select className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
                        <option>UTC (Coordinated Universal Time)</option>
                        <option>America/New_York (Eastern)</option>
                        <option>America/Chicago (Central)</option>
                        <option>America/Denver (Mountain)</option>
                        <option>America/Los_Angeles (Pacific)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Theme
                      </label>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Sun className="h-4 w-4" /> Light
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Moon className="h-4 w-4" /> Dark
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Monitor className="h-4 w-4" /> System
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose what notifications you receive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {toggles.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                    >
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {item.label}
                      </span>
                      <button
                        onClick={() => toggleNotification(item.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          item.enabled
                            ? 'bg-blue-600'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        role="switch"
                        aria-checked={item.enabled}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            item.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {activeTab === 'security' && (
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input label="Current Password" type="password" />
                  <Input label="New Password" type="password" />
                  <Input label="Confirm New Password" type="password" />
                  <Button>Update Password</Button>
                </CardContent>
              </Card>
            )}

            {activeTab === 'api' && (
              <Card>
                <CardHeader>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>Manage your API access tokens</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Your API Key
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm font-mono dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100">
                        sk-••••••••••••••••a3f8
                      </code>
                      <Button variant="outline" size="sm">
                        Copy
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      Regenerating your API key will invalidate the current key. All services using this key will lose access.
                    </p>
                  </div>
                  <Button variant="destructive">Regenerate Key</Button>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Tabs>
    </div>
  );
}
