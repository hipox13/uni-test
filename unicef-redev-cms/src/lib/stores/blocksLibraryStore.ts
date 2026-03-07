import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SavedBlock {
  id: string;
  name: string;
  type: string;
  props: Record<string, unknown>;
  createdAt: string;
}

interface BlocksLibraryState {
  blocks: SavedBlock[];
  addBlock: (block: Omit<SavedBlock, 'id' | 'createdAt'>) => void;
  removeBlock: (id: string) => void;
}

export const useBlocksLibraryStore = create<BlocksLibraryState>()(
  persist(
    (set) => ({
      blocks: [],
      addBlock: (b) => set((s) => ({
        blocks: [...s.blocks, { ...b, id: crypto.randomUUID?.() ?? String(Date.now()), createdAt: new Date().toISOString() }],
      })),
      removeBlock: (id) => set((s) => ({ blocks: s.blocks.filter((x) => x.id !== id) })),
    }),
    { name: 'unicef_cms_blocks_library' }
  )
);
