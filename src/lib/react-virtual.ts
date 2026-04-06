/**
 * ZENTHAR VIRTUALIZATION ENGINE (MOCK)
 * Simulates @tanstack/react-virtual for lightweight dashboard performance.
 */

export function useVirtualizer(options: {
  count: number;
  getScrollElement: () => HTMLElement | null;
  estimateSize: (index: number) => number;
  overscan?: number;
}) {
  const { count, estimateSize, overscan = 5 } = options;

  // Calculates the total height of the phantom scroll container
  const getTotalSize = () => {
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += estimateSize(i);
    }
    return total;
  };

  // Generates the positioning data for the list items
  const getVirtualItems = () => {
    return Array.from({ length: count }).map((_, i) => {
      const size = estimateSize(i);
      const start = i * size;
      
      return {
        index: i,
        start,
        size,
        key: `virtual-item-${i}`, // Unique key for React reconciliation
      };
    });
  };

  return {
    getVirtualItems,
    getTotalSize,
    // Future-proofing for scroll-to-index functionality
    scrollToIndex: (index: number) => {
      const element = options.getScrollElement();
      if (element) {
        element.scrollTop = index * estimateSize(index);
      }
    },
  };
}