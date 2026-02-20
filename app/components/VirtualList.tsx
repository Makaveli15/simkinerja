'use client';

import React, { useRef, useState, useEffect, useCallback, memo } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
}

function VirtualListInner<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(items.length, startIndex + visibleCount + 2 * overscan);

  const visibleItems = items.slice(startIndex, endIndex);
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const VirtualList = memo(VirtualListInner) as typeof VirtualListInner;

export default VirtualList;

// Simple virtualized table for large datasets
interface VirtualTableProps<T> {
  data: T[];
  columns: {
    key: keyof T | string;
    header: string;
    width?: string;
    render?: (value: unknown, row: T, index: number) => React.ReactNode;
  }[];
  rowHeight?: number;
  maxHeight?: number;
  className?: string;
}

export function VirtualTable<T extends Record<string, unknown>>({
  data,
  columns,
  rowHeight = 48,
  maxHeight = 500,
  className = '',
}: VirtualTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(maxHeight);

  useEffect(() => {
    if (containerRef.current) {
      setContainerHeight(Math.min(maxHeight, containerRef.current.clientHeight));
    }
  }, [maxHeight]);

  const overscan = 3;
  const totalHeight = data.length * rowHeight;
  const visibleCount = Math.ceil(containerHeight / rowHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const endIndex = Math.min(data.length, startIndex + visibleCount + 2 * overscan);

  const visibleRows = data.slice(startIndex, endIndex);
  const offsetY = startIndex * rowHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="flex">
          {columns.map((col, i) => (
            <div
              key={i}
              className="px-4 py-3 text-sm font-semibold text-gray-700"
              style={{ width: col.width || 'auto', flex: col.width ? 'none' : 1 }}
            >
              {col.header}
            </div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-auto"
        style={{ maxHeight }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleRows.map((row, rowIndex) => (
              <div
                key={startIndex + rowIndex}
                className="flex border-b border-gray-100 hover:bg-gray-50"
                style={{ height: rowHeight }}
              >
                {columns.map((col, colIndex) => {
                  const value = typeof col.key === 'string' ? row[col.key] : undefined;
                  return (
                    <div
                      key={colIndex}
                      className="px-4 flex items-center text-sm text-gray-700"
                      style={{ width: col.width || 'auto', flex: col.width ? 'none' : 1 }}
                    >
                      {col.render
                        ? col.render(value, row, startIndex + rowIndex)
                        : String(value ?? '-')}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
