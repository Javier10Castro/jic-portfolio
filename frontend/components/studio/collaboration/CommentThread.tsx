'use client';

import { useState, useCallback } from 'react';
import { useWorkspaceStore } from '@/store/workspaceStore';
import { MessageSquare, CheckCircle2, User, Bot } from 'lucide-react';
import { cn } from '@/utils/cn';
import { formatDistanceToNow } from '@/utils/date';

interface Props {
  artifactId: string;
}

export default function CommentThread({ artifactId }: Props) {
  const comments = useWorkspaceStore((s) => s.comments.filter((c) => c.artifactId === artifactId));
  const addComment = useWorkspaceStore((s) => s.addComment);
  const resolveComment = useWorkspaceStore((s) => s.resolveComment);
  const [newComment, setNewComment] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('open');

  const filteredComments = filter === 'all' ? comments : comments.filter((c) => filter === 'resolved' ? c.resolved : !c.resolved);
  const openCount = comments.filter((c) => !c.resolved).length;

  const handleSubmit = useCallback(() => {
    if (!newComment.trim()) return;
    addComment({
      id: `cm_${Date.now()}`,
      artifactId,
      type: 'user_note',
      author: 'You',
      content: newComment.trim(),
      timestamp: new Date().toISOString(),
    });
    setNewComment('');
  }, [newComment, artifactId, addComment]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Comments</span>
          {openCount > 0 && <span className="text-[10px] text-gray-400">({openCount})</span>}
        </div>
        <div className="flex gap-1">
          {(['open', 'all', 'resolved'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-1.5 py-0.5 text-[10px] rounded', filter === f ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'text-gray-400 hover:text-gray-600')}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredComments.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">No comments</p>
        ) : (
          filteredComments.map((comment) => (
            <div key={comment.id} className={cn('rounded-lg p-2', comment.type === 'ai_suggestion' ? 'bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800' : 'bg-gray-50 dark:bg-gray-800/50')}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1">
                  {comment.type === 'ai_suggestion' ? (
                    <Bot className="w-3 h-3 text-purple-500" />
                  ) : (
                    <User className="w-3 h-3 text-gray-500" />
                  )}
                  <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300">{comment.author}</span>
                  {comment.type === 'ai_suggestion' && <span className="text-[9px] text-purple-500 font-medium">AI</span>}
                </div>
                {!comment.resolved && (
                  <button onClick={() => resolveComment(comment.id)} className="p-0.5 text-gray-400 hover:text-green-500" title="Resolve">
                    <CheckCircle2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{comment.content}</p>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1">
                {formatDistanceToNow(new Date(comment.timestamp))}
                {comment.resolved && ' · resolved'}
              </p>
            </div>
          ))
        )}
      </div>

      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a comment..."
          className="w-full text-xs border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 resize-none focus:outline-none focus:border-blue-500"
          rows={2}
        />
        <button
          onClick={handleSubmit}
          disabled={!newComment.trim()}
          className={cn('mt-1 w-full py-1 text-xs font-medium rounded-lg transition-colors',
            newComment.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed')}
        >
          Send
        </button>
      </div>
    </div>
  );
}
