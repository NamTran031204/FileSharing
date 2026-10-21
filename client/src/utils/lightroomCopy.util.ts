export interface LightroomList {
    text: string;
    count: number;
    hasSpaces: boolean;
}

// Lightroom: ten file bo duoi, khu trung giu thu tu, ngan cach bang ", "
export function toLightroomList(names: string[]): LightroomList {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const raw of names) {
        const trimmed = raw?.trim();
        if (!trimmed) continue;
        const dot = trimmed.lastIndexOf('.');
        const base = dot > 0 ? trimmed.slice(0, dot) : trimmed;
        if (!seen.has(base)) {
            seen.add(base);
            result.push(base);
        }
    }
    return {
        text: result.join(', '),
        count: result.length,
        hasSpaces: result.some((n) => n.includes(' ')),
    };
}
