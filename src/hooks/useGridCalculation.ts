import { useState, useEffect, useCallback } from 'react';

const TARGET_ASPECT = 16 / 9;

/**
 * Discord-like grid: optimal rows/cols to maximize cell size ~16:9.
 * - 1: 1x1
 * - 2: 2x1 (or 1x2 on narrow)
 * - 3-4: 2x2
 * - 5-6: 2x3
 * - 7-9: 3x3
 * - 10-12: 3x4 or 4x3
 */
function getPreferredGrid(count: number, width: number, height: number): { cols: number; rows: number } {
  if (count <= 0) return { cols: 1, rows: 1 };
  if (count === 1) return { cols: 1, rows: 1 };
  if (count === 2) {
    const portrait = height > width;
    return portrait ? { cols: 1, rows: 2 } : { cols: 2, rows: 1 };
  }
  if (count <= 4) return { cols: 2, rows: 2 };
  if (count <= 6) return { cols: 3, rows: 2 };
  if (count <= 9) return { cols: 3, rows: 3 };
  if (count <= 12) return { cols: 4, rows: 3 };
  return { cols: 4, rows: 3 };
}

/**
 * For a given participant count and container size, pick rows/cols that fit
 * and keep cell aspect ratio close to 16:9.
 */
function optimizeGrid(
  count: number,
  width: number,
  height: number
): { cols: number; rows: number; cellWidth: number; cellHeight: number } {
  const preferred = getPreferredGrid(count, width, height);
  let cols = preferred.cols;
  let rows = preferred.rows;
  const totalCells = cols * rows;
  const effectiveCount = Math.min(count, totalCells);

  if (effectiveCount <= 0) return { cols: 1, rows: 1, cellWidth: width, cellHeight: height };

  // Adjust rows so we have enough cells (e.g. 5 people -> 2x3)
  while (rows * cols < effectiveCount && rows * cols < 12) {
    if (cols >= rows) rows += 1;
    else cols += 1;
  }
  rows = Math.max(1, Math.min(rows, Math.ceil(effectiveCount / cols)));
  cols = Math.max(1, Math.min(cols, Math.ceil(effectiveCount / rows)));

  const gap = 8;
  const availableW = width - (cols - 1) * gap;
  const availableH = height - (rows - 1) * gap;
  let cellWidth = availableW / cols;
  let cellHeight = availableH / rows;

  const currentAspect = cellWidth / cellHeight;
  if (currentAspect > TARGET_ASPECT) {
    cellWidth = cellHeight * TARGET_ASPECT;
  } else if (currentAspect < TARGET_ASPECT) {
    cellHeight = cellWidth / TARGET_ASPECT;
  }

  return { cols, rows, cellWidth, cellHeight };
}

export interface GridCalculationResult {
  cols: number;
  rows: number;
  cellWidth: number;
  cellHeight: number;
  containerRef: (node: HTMLDivElement | null) => void;
}

/**
 * Accepts participant count and uses container dimensions (ResizeObserver)
 * to compute optimal grid (Discord-like, ~16:9 cells).
 */
export function useGridCalculation(participantCount: number): GridCalculationResult {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 640, height: 360 });

  const containerRef = useCallback((node: HTMLDivElement | null) => {
    setContainer(node);
  }, []);

  useEffect(() => {
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0]?.contentRect ?? { width: 640, height: 360 };
      setSize({ width, height });
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, [container]);

  const { width, height } = size;
  const result = optimizeGrid(participantCount, width, height);

  return {
    ...result,
    containerRef,
  };
}

export { getPreferredGrid, optimizeGrid };
