export interface FlatMenuNode {
    title: string;
    path?: string;
    [key: string]: unknown;
}

let flat: FlatMenuNode[] = [];

export function setFlatMenu(items: FlatMenuNode[]): void {
    flat = items;
}

export function getFlatMenu(): FlatMenuNode[] {
    return flat;
}

export function removePrefixDefault(url: string): string {
    return url;
}
