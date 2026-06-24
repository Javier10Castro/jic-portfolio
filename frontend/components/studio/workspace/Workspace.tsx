'use client';

import { useState, useCallback } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { useSummaryStore } from '@/store/summaryStore';
import { ArtifactType } from '@/types/workspace';
import WorkspaceTabs from './WorkspaceTabs';
import WorkspaceSidebar from './WorkspaceSidebar';
import WorkspaceToolbar from './WorkspaceToolbar';
import WorkspaceStatus from './WorkspaceStatus';
import BlueprintEditor from '@/components/studio/editors/BlueprintEditor';
import ContextEditor from '@/components/studio/editors/ContextEditor';
import ContentEditor from '@/components/studio/editors/ContentEditor';
import CodeEditor from '@/components/studio/editors/CodeEditor';
import SeoEditor from '@/components/studio/editors/SeoEditor';
import MetadataEditor from '@/components/studio/editors/MetadataEditor';
import DiffViewer from '@/components/studio/diff/DiffViewer';
import VersionTimeline from '@/components/studio/history/VersionTimeline';
import PromptInspector from '@/components/studio/prompt/PromptInspector';
import GenerationConsole from '@/components/studio/console/GenerationConsole';
import ExportCenter from '@/components/studio/export/ExportCenter';
import CommentThread from '@/components/studio/collaboration/CommentThread';
import { studioNotifications } from '@/lib/sync/notifications';

export default function Workspace() {
  const {
    artifacts, editor, diff, promptInspector, comments, console: consoleEntries,
    setActiveEditor, setEditing, setContent, markSaved,
    setDiff, addVersion, setArtifactApproval, setPromptInspector,
    addConsoleEntry, addComment, resolveComment,
    setExportConfig, resetExportConfig, setSelectedPreviewElement,
  } = useWorkspaceStore();
  const summary = useSummaryStore((s) => s.summary);

  const [activeTab, setActiveTab] = useState<ArtifactType | null>('blueprint');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showDiff, setShowDiff] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [versionMessage, setVersionMessage] = useState('');

  const activeArtifact = artifacts.find((a) => a.type === activeTab);

  const handleTabChange = useCallback((tab: ArtifactType) => {
    setActiveTab(tab);
    setActiveEditor(tab, null);
    setShowDiff(false);
  }, [setActiveEditor]);

  const handleEdit = useCallback(() => {
    setEditing(!editor.isEditing);
  }, [editor.isEditing, setEditing]);

  const handleSave = useCallback(() => {
    if (!activeArtifact) return;
    const version = activeArtifact.currentVersion + 1;
    addVersion({
      id: `v_${Date.now()}`,
      artifactId: activeArtifact.id,
      version,
      content: editor.content,
      author: 'user',
      timestamp: new Date().toISOString(),
      message: versionMessage || undefined,
    });
    useWorkspaceStore.getState().updateArtifact(activeArtifact.id, {
      content: editor.content,
      currentVersion: version,
      updatedAt: new Date().toISOString(),
    });
    markSaved();
    studioNotifications.success('Saved', `${activeArtifact.name} saved as v${version}`);
    setVersionMessage('');
  }, [activeArtifact, editor.content, versionMessage, addVersion, markSaved]);

  const handleReset = useCallback(() => {
    if (!activeArtifact) return;
    useWorkspaceStore.getState().setContent(activeArtifact.content);
    studioNotifications.info('Reset', 'Reverted to last saved version');
  }, [activeArtifact]);

  const handleRegenerate = useCallback(() => {
    if (!activeArtifact) return;
    studioNotifications.info('Regenerating', `${activeArtifact.name}`);
    addConsoleEntry({
      id: `ce_${Date.now()}`, type: 'ai_call',
      message: `Regenerating ${activeArtifact.type}...`,
      timestamp: Date.now(),
    });
    setTimeout(() => {
      const newContent = `${editor.content}\n/* Regenerated at ${new Date().toLocaleTimeString()} */`;
      useWorkspaceStore.getState().setContent(newContent);
      addConsoleEntry({
        id: `ce_${Date.now() + 1}`, type: 'info',
        message: `${activeArtifact?.type} regeneration complete`,
        timestamp: Date.now(),
      });
    }, 1000);
  }, [activeArtifact, editor.content, addConsoleEntry]);

  const handleApprove = useCallback(() => {
    if (!activeArtifact) return;
    setArtifactApproval(activeArtifact.id, 'approved');
    studioNotifications.success('Approved', `${activeArtifact.name}`);
    addConsoleEntry({
      id: `ce_${Date.now()}`, type: 'info',
      message: `${activeArtifact.name} approved`,
      timestamp: Date.now(),
    });
  }, [activeArtifact, setArtifactApproval, addConsoleEntry]);

  const handleReject = useCallback(() => {
    if (!activeArtifact) return;
    setArtifactApproval(activeArtifact.id, 'rejected');
    studioNotifications.info('Rejected', `${activeArtifact.name}`);
    addConsoleEntry({
      id: `ce_${Date.now()}`, type: 'warn',
      message: `${activeArtifact.name} rejected`,
      timestamp: Date.now(),
    });
  }, [activeArtifact, setArtifactApproval, addConsoleEntry]);

  if (artifacts.length === 0 && !summary) {
    return null;
  }

  return (
    <div className="flex flex-col h-full border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <WorkspaceTabs activeTab={activeTab} onTabChange={handleTabChange} />

      <WorkspaceToolbar
        isEditing={editor.isEditing}
        isDirty={editor.isDirty}
        approval={activeArtifact?.approval}
        artifactName={activeArtifact?.name}
        onEdit={handleEdit}
        onSave={handleSave}
        onReset={handleReset}
        onRegenerate={handleRegenerate}
        onApprove={handleApprove}
        onReject={handleReject}
        onCompare={() => setShowDiff(true)}
        onComment={() => setShowComments(!showComments)}
        onExpand={() => {}}
      />

      <div className="flex flex-1 overflow-hidden">
        <WorkspaceSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

        <div className="flex-1 overflow-y-auto p-4">
          {showDiff && activeArtifact && (
            <div className="mb-4">
              <DiffViewer
                artifactId={activeArtifact.id}
                onClose={() => setShowDiff(false)}
              />
            </div>
          )}

          <div className="max-w-4xl mx-auto">
            {activeTab === 'blueprint' && (
              <BlueprintEditor artifact={activeArtifact} isEditing={editor.isEditing} content={editor.content} onContentChange={setContent} />
            )}
            {activeTab === 'context' && (
              <ContextEditor artifact={activeArtifact} isEditing={editor.isEditing} content={editor.content} onContentChange={setContent} />
            )}
            {activeTab === 'content' && (
              <ContentEditor artifact={activeArtifact} isEditing={editor.isEditing} content={editor.content} onContentChange={setContent} />
            )}
            {activeTab === 'code' && (
              <CodeEditor artifact={activeArtifact} isEditing={editor.isEditing} content={editor.content} onContentChange={setContent} />
            )}
            {activeTab === 'seo' && (
              <SeoEditor artifact={activeArtifact} isEditing={editor.isEditing} content={editor.content} onContentChange={setContent} />
            )}
            {activeTab === 'deployment' && (
              <MetadataEditor artifact={activeArtifact} isEditing={editor.isEditing} content={editor.content} onContentChange={setContent} />
            )}
            {(activeTab === 'design' || activeTab === 'pages' || activeTab === 'assets' || activeTab === 'metadata') && (
              <MetadataEditor artifact={activeArtifact} isEditing={editor.isEditing} content={editor.content} onContentChange={setContent} />
            )}
          </div>
        </div>

        {showComments && activeArtifact && (
          <div className="w-72 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
            <CommentThread artifactId={activeArtifact.id} />
          </div>
        )}

        {showHistory && (
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 overflow-y-auto p-3">
            <VersionTimeline artifactId={activeArtifact?.id ?? ''} onClose={() => setShowHistory(false)} />
          </div>
        )}
      </div>

      <WorkspaceStatus />

      {showPrompt && promptInspector && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center" onClick={() => setShowPrompt(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <PromptInspector record={promptInspector} onClose={() => setShowPrompt(false)} />
          </div>
        </div>
      )}

      {showConsole && (
        <div className="fixed bottom-0 right-0 z-40 w-full max-w-lg border-t border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl" style={{ maxHeight: '40vh' }}>
          <GenerationConsole onClose={() => setShowConsole(false)} />
        </div>
      )}

      {showExport && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center" onClick={() => setShowExport(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <ExportCenter onClose={() => setShowExport(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
