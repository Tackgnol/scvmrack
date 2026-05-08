export function statToModifier(stat: number): number {
    if (stat <= 4) return -3;
    if (stat <= 6) return -2;
    if (stat <= 8) return -1;
    if (stat <= 12) return 0;
    if (stat <= 14) return 1;
    if (stat <= 16) return 2;
    return 3;
}
