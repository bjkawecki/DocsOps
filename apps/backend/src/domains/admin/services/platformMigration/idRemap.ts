/** Maps export IDs (source DB cuids) to newly created target DB IDs during platform import. */
export class ExportIdMap {
  private readonly map = new Map<string, string>();

  set(exportId: string, newId: string): void {
    this.map.set(exportId, newId);
  }

  get(exportId: string | null | undefined): string | null {
    if (exportId == null || exportId === '') return null;
    return this.map.get(exportId) ?? null;
  }

  getOrThrow(exportId: string): string {
    const id = this.map.get(exportId);
    if (!id) {
      throw new Error(`Missing ID mapping for exportId: ${exportId}`);
    }
    return id;
  }

  has(exportId: string): boolean {
    return this.map.has(exportId);
  }
}
