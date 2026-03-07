export interface MenuTreeItem {
    id: number;
    parent: number | null;
    groupName: string | null;
    title: string | null;
    href: string | null;
    target: string | null;
    svgIcon: string | null;
    status: number | null;
    ordering: number | null;
    authorId: number | null;
    modifierId: number | null;
    dateCreated: Date | null;
    dateModified: Date | null;
    posX?: number | null;
    posY?: number | null;
    children?: MenuTreeItem[];
}
