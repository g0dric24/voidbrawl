import type { Arena } from '@voidbrawl/shared';

let active: Arena | null = null;

export function setActiveArena( arena: Arena | null ): void {
    active = arena;
}

export function activeArena(): Arena | null {
    return active;
}
