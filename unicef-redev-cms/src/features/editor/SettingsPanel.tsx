import { useState } from 'react';
import { useEditor } from '@craftjs/core';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Settings, Trash2, BookmarkPlus } from 'lucide-react';
import { useBlocksLibraryStore } from '@/lib/stores/blocksLibraryStore';

export function SettingsPanel() {
  const [saved, setSaved] = useState(false);
  const { addBlock } = useBlocksLibraryStore();
  const { selected, actions } = useEditor((state, q) => {
    const [currentNodeId] = state.events.selected;
    if (currentNodeId) {
      const node = state.nodes[currentNodeId];
      return {
        selected: {
          id: currentNodeId,
          name: node?.data?.displayName || (node?.data?.type as any)?.resolvedName || 'Unknown',
          settings: node?.related?.settings,
          isDeletable: q.node(currentNodeId).isDeletable(),
          type: (node?.data?.type as any)?.resolvedName,
          props: node?.data?.props ?? {},
        },
      };
    }
    return { selected: undefined };
  });

  const handleSaveAsBlock = () => {
    if (!selected?.type) return;
    const name = prompt('Block name');
    if (name?.trim()) {
      addBlock({ name: name.trim(), type: selected.type, props: selected.props });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  if (!selected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
        <Settings className="h-8 w-8 text-muted-foreground/20 mb-3" />
        <p className="text-sm font-medium text-muted-foreground">No element selected</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Click on an element in the canvas to edit its properties.</p>
      </div>
    );
  }

  const SettingsComponent = selected.settings;

  return (
    <div className="space-y-4 p-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Badge variant="outline" className="text-[10px] font-mono shrink-0">{selected.name}</Badge>
        <div className="flex items-center gap-1">
          {selected.type && selected.type !== 'EditorCanvas' && (
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleSaveAsBlock} title="Save as Block">
              <BookmarkPlus className="h-3.5 w-3.5" />
            </Button>
          )}
          {selected.isDeletable && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive shrink-0" onClick={() => actions.delete(selected.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
      {saved && <p className="text-xs text-emerald-600 font-medium">Block saved!</p>}
      <Separator />
      {SettingsComponent ? (
        <SettingsComponent />
      ) : (
        <p className="text-xs text-muted-foreground py-4 text-center">No settings available for this element.</p>
      )}
    </div>
  );
}
