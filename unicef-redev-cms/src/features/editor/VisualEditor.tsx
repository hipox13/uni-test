import { useCallback, useEffect, useRef, useState } from 'react';
import { Editor, Frame, Element, useEditor } from '@craftjs/core';
import { Toolbox } from './Toolbox';
import { SettingsPanel } from './SettingsPanel';
import { PresenceLayer } from './PresenceLayer';
import { Block, blocksToNodes, nodesToBlocks } from './serializer';
import { useEditorPresence, ContentUpdate } from '@/lib/hooks/useEditorPresence';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Undo2, Redo2, Monitor, Tablet, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  EditorCanvas, EditorHeading, EditorRichText, EditorImage, EditorHero,
  EditorCTA, EditorDivider, EditorEmbed, EditorPromo, EditorGallery,
  EditorFAQ, EditorTwoColumn, EditorFormEmbed,
} from './blocks';

const RESOLVER = {
  EditorCanvas, EditorHeading, EditorRichText, EditorImage, EditorHero,
  EditorCTA, EditorDivider, EditorEmbed, EditorPromo, EditorGallery,
  EditorFAQ, EditorTwoColumn, EditorFormEmbed,
};

interface VisualEditorProps {
  initialBlocks: Block[];
  onSave: (blocks: Block[]) => void;
  onReady?: () => void;
  pageId?: string;
}

export function VisualEditor({ initialBlocks, onSave, onReady, pageId }: VisualEditorProps) {
  const initialData = useRef(blocksToNodes(initialBlocks));

  return (
    <Editor resolver={RESOLVER} enabled onNodesChange={() => { }}>
      <EditorInner initialData={initialData.current} onSave={onSave} onReady={onReady} pageId={pageId} />
    </Editor>
  );
}

function EditorInner({ initialData, onSave, onReady, pageId }: { initialData: string; onSave: (blocks: Block[]) => void; onReady?: () => void; pageId?: string }) {
  const { actions, query, canUndo, canRedo } = useEditor((_state, q) => ({
    canUndo: q.history.canUndo(),
    canRedo: q.history.canRedo(),
  }));

  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const loaded = useRef(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const isApplyingRemote = useRef(false);

  // Handle incoming content updates from other users
  const handleRemoteContent = useCallback((data: ContentUpdate) => {
    try {
      isApplyingRemote.current = true;
      actions.deserialize(data.nodes);
      // Brief timeout to reset the flag after React has processed the deserialize
      setTimeout(() => { isApplyingRemote.current = false; }, 100);
    } catch (err) {
      console.error('Failed to apply remote content:', err);
      isApplyingRemote.current = false;
    }
  }, [actions]);

  const { users, cursors, emitCursorMove, emitContentUpdate } = useEditorPresence(pageId, handleRemoteContent);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    emitCursorMove(e.clientX - rect.left, e.clientY - rect.top);
  }, [emitCursorMove]);

  useEffect(() => {
    if (!loaded.current && initialData) {
      try {
        actions.deserialize(initialData);
      } catch {
        // If deserialization fails, start with empty canvas
      }
      loaded.current = true;
      if (onReady) onReady();
      window.dispatchEvent(new Event('editor:ready'));
    }
  }, [initialData, actions, onReady]);

  const handleSave = useCallback(() => {
    const serialized = query.getSerializedNodes();
    const blocks = nodesToBlocks(serialized);
    onSave(blocks);
  }, [query, onSave]);

  // Expose save function to parent via custom event
  useEffect(() => {
    const handler = () => handleSave();
    window.addEventListener('editor:save', handler);
    return () => window.removeEventListener('editor:save', handler);
  }, [handleSave]);

  // Broadcast content changes to other users (throttled in the hook)
  useEffect(() => {
    const handler = () => {
      // Don't re-broadcast changes that came from another user
      if (isApplyingRemote.current) return;
      try {
        const serialized = query.getSerializedNodes();
        const nodesStr = JSON.stringify(serialized);
        emitContentUpdate(nodesStr);
      } catch { /* ignore serialization errors during transition */ }
    };

    // Listen for craft.js internal node changes via a polling approach
    // Craft.js calls onNodesChange for every render, so we use a MutationObserver
    // on the canvas DOM to detect actual visual changes
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const observer = new MutationObserver(() => {
      // Debounce: only emit after mutations settle
      clearTimeout((observer as any).__timeout);
      (observer as any).__timeout = setTimeout(handler, 400);
    });

    observer.observe(canvasEl, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
    });

    return () => observer.disconnect();
  }, [query, emitContentUpdate]);

  const vpWidth = viewport === 'desktop' ? 'max-w-none' : viewport === 'tablet' ? 'max-w-[768px]' : 'max-w-[375px]';

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Left Sidebar — Toolbox */}
      <aside className="w-52 border-r bg-background p-4 overflow-y-auto shrink-0">
        <Toolbox />
      </aside>

      {/* Center — Canvas */}
      <div className="flex-1 overflow-y-auto bg-muted/30">
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!canUndo} onClick={() => actions.history.undo()}>
              <Undo2 className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!canRedo} onClick={() => actions.history.redo()}>
              <Redo2 className="h-3.5 w-3.5" />
            </Button>
            <Separator orientation="vertical" className="h-5 mx-1" />
            <Badge variant="outline" className="text-[10px] gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Visual Editor
            </Badge>
            {users.length > 0 && (
              <>
                <Separator orientation="vertical" className="h-5 mx-1" />
                <div className="flex -space-x-1.5">
                  {users.map((u) => (
                    <div
                      key={u.userId}
                      title={u.name}
                      className="h-6 w-6 rounded-full border-2 border-background flex items-center justify-center text-[9px] font-bold text-white"
                      style={{ backgroundColor: u.color }}
                    >
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
            {[
              { id: 'desktop' as const, icon: Monitor },
              { id: 'tablet' as const, icon: Tablet },
              { id: 'mobile' as const, icon: Smartphone },
            ].map((vp) => (
              <Button key={vp.id} variant={viewport === vp.id ? 'default' : 'ghost'} size="icon"
                className="h-7 w-7" onClick={() => setViewport(vp.id)}>
                <vp.icon className="h-3.5 w-3.5" />
              </Button>
            ))}
          </div>
        </div>

        <div className="relative p-6" ref={canvasRef} onMouseMove={handleMouseMove}>
          <PresenceLayer cursors={cursors} />
          <div className={cn('mx-auto bg-background rounded-xl shadow-sm border transition-all duration-300', vpWidth)}>
            <Frame data={initialData}>
              <Element is={EditorCanvas} canvas>
                {/* Blocks get dropped/loaded here */}
              </Element>
            </Frame>
          </div>
        </div>
      </div>

      {/* Right Sidebar — Settings */}
      <aside className="w-72 border-l bg-background p-4 overflow-y-auto shrink-0 hidden lg:block">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-4 px-1">
          Properties
        </p>
        <SettingsPanel />
      </aside>
    </div>
  );
}
