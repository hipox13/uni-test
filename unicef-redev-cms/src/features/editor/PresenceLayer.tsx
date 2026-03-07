import type { CursorPosition } from '@/lib/hooks/useEditorPresence';

interface PresenceLayerProps {
  cursors: Map<string, CursorPosition>;
}

export function PresenceLayer({ cursors }: PresenceLayerProps) {
  if (cursors.size === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
      {[...cursors.entries()].map(([id, c]) => (
        <div
          key={id}
          className="absolute"
          style={{
            left: c.x,
            top: c.y,
            transition: 'left 80ms linear, top 80ms linear',
          }}
        >
          <svg width="16" height="20" viewBox="0 0 16 20" fill="none">
            <path
              d="M0.5 0.5L15 10L8.5 11L5 19.5L0.5 0.5Z"
              fill={c.color}
              stroke="white"
              strokeWidth="1"
            />
          </svg>
          <span
            className="absolute left-4 top-3 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium text-white shadow-sm"
            style={{ backgroundColor: c.color }}
          >
            {c.name}
          </span>
        </div>
      ))}
    </div>
  );
}
