/**
 * Converts between our Block[] format and Craft.js serialized node format.
 * This ensures backward compatibility with the API and BlockRenderer on the web.
 */

export interface Block {
  id: string;
  type: string;
  version: number;
  attributes: Record<string, any>;
}

const TYPE_TO_RESOLVER: Record<string, string> = {
  heading: 'EditorHeading',
  richtext: 'EditorRichText',
  image: 'EditorImage',
  hero: 'EditorHero',
  'cta-button': 'EditorCTA',
  divider: 'EditorDivider',
  gallery: 'EditorGallery',
  embed: 'EditorEmbed',
  'faq-accordion': 'EditorFAQ',
  'promo-bar': 'EditorPromo',
  'two-column': 'EditorTwoColumn',
  'form-embed': 'EditorFormEmbed',
};

const RESOLVER_TO_TYPE: Record<string, string> = Object.fromEntries(
  Object.entries(TYPE_TO_RESOLVER).map(([k, v]) => [v, k]),
);

export function blocksToNodes(blocks: Block[]): string {
  const nodes: Record<string, any> = {
    ROOT: {
      type: { resolvedName: 'EditorCanvas' },
      isCanvas: true,
      props: {},
      displayName: 'Canvas',
      custom: {},
      hidden: false,
      nodes: blocks.map((b) => b.id),
      linkedNodes: {},
    },
  };

  blocks.forEach((block) => {
    const resolvedName = TYPE_TO_RESOLVER[block.type] || 'EditorHeading';
    nodes[block.id] = {
      type: { resolvedName },
      isCanvas: false,
      props: { ...block.attributes },
      displayName: resolvedName,
      custom: { blockType: block.type, blockVersion: block.version },
      hidden: false,
      nodes: [],
      linkedNodes: {},
      parent: 'ROOT',
    };
  });

  return JSON.stringify(nodes);
}

export function nodesToBlocks(serializedNodes: Record<string, any>): Block[] {
  const root = serializedNodes.ROOT;
  if (!root?.nodes) return [];

  return root.nodes
    .map((nodeId: string) => {
      const node = serializedNodes[nodeId];
      if (!node) return null;
      const resolvedName = node.type?.resolvedName || '';
      const blockType = node.custom?.blockType || RESOLVER_TO_TYPE[resolvedName] || 'heading';
      const { ...attributes } = node.props || {};

      return {
        id: nodeId,
        type: blockType,
        version: node.custom?.blockVersion || 1,
        attributes,
      } as Block;
    })
    .filter(Boolean) as Block[];
}
