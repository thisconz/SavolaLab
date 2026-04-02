export function useVirtualizer(options: any) {
  return {
    getVirtualItems: (): { 
        index: number, 
        start: number, 
        size: number, 
        key: number 
    }[] => Array.from({ length: options.count }).map((_, i) => ({ index: i, start: i * options.estimateSize(), size: options.estimateSize(), key: i })),
    getTotalSize: () => options.count * options.estimateSize(),
  };
}
