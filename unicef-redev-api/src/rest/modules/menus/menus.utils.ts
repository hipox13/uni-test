import { MenuTreeItem } from './menus.types';

/**
 * Build tree structure from flat menu items (Optimized O(N)).
 */
export function buildMenuTree(items: any[]): MenuTreeItem[] {
    const map = new Map<number, MenuTreeItem>();
    const roots: MenuTreeItem[] = [];

    // First pass: Create nodes
    items.forEach((item) => {
        map.set(item.id, { ...item, children: [] });
    });

    // Second pass: Build hierarchy
    items.forEach((item) => {
        const node = map.get(item.id)!;
        if (item.parent) {
            const parent = map.get(item.parent);
            if (parent) {
                parent.children!.push(node);
            } else {
                roots.push(node);
            }
        } else {
            roots.push(node);
        }
    });

    // Sort children at each level
    const sortNodes = (nodes: MenuTreeItem[]) => {
        nodes.sort((a, b) => (a.ordering || 0) - (b.ordering || 0));
        nodes.forEach((node) => {
            if (node.children?.length) {
                sortNodes(node.children);
            }
        });
    };

    sortNodes(roots);
    return roots;
}
