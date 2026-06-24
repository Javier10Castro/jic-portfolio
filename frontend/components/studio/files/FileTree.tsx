'use client';

import { useState } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { FileNode } from '@/types/workspace';
import { Folder, FolderOpen, File, FileText, Image, FileCode, Search } from 'lucide-react';
import { cn } from '@/utils/cn';

const fileIcons: Record<string, typeof File> = {
  ts: FileCode, tsx: FileCode, js: FileCode, jsx: FileCode,
  html: FileCode, css: FileCode, json: FileCode,
  md: FileText, png: Image, jpg: Image, svg: Image,
};

function getIcon(name: string, isDir: boolean) {
  if (isDir) return null;
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return fileIcons[ext] ?? File;
}

export default function FileTree() {
  const fileTree = useWorkspaceStore((s) => s.fileTree);
  const setActiveEditor = useWorkspaceStore((s) => s.setActiveEditor);
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['/']));
  const [search, setSearch] = useState('');

  const toggle = (path: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleFileClick = (node: FileNode) => {
    if (node.artifactId) {
      const type = node.path.split('/')[1] as any;
      setActiveEditor(type || 'code', node.path);
    }
  };

  function renderNode(node: FileNode, depth: number) {
    const isExpanded = expanded.has(node.path);
    const Icon = getIcon(node.name, node.type === 'directory');
    const filtered = search
      ? node.name.toLowerCase().includes(search.toLowerCase())
      : true;

    if (!filtered && node.type === 'file') return null;

    return (
      <div key={node.path}>
        <button
          onClick={() => node.type === 'directory' ? toggle(node.path) : handleFileClick(node)}
          className={cn(
            'flex items-center gap-1.5 w-full px-2 py-1 text-xs rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left',
            node.type === 'directory' ? 'text-gray-600 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300',
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {node.type === 'directory' ? (
            isExpanded ? <FolderOpen className="w-3.5 h-3.5 text-yellow-500 shrink-0" /> : <Folder className="w-3.5 h-3.5 text-yellow-500 shrink-0" />
          ) : Icon ? (
            <Icon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          ) : (
            <File className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {node.children && isExpanded && (
          <div>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="relative">
        <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search files..."
          className="w-full pl-6 pr-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded bg-transparent text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
      </div>
      {fileTree.map((node) => renderNode(node, 0))}
    </div>
  );
}
