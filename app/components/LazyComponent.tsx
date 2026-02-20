'use client';

import { Suspense, lazy, ComponentType, memo } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LazyComponentProps {
  loader: () => Promise<{ default: ComponentType<unknown> }>;
  loadingText?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props?: Record<string, any>;
}

// Preload function for route prefetching
export function preloadComponent(loader: () => Promise<{ default: ComponentType<unknown> }>) {
  loader();
}

// Generic lazy loader with retry
export function lazyWithRetry<T extends ComponentType<unknown>>(
  loader: () => Promise<{ default: T }>,
  retries = 3
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    for (let i = 0; i < retries; i++) {
      try {
        return await loader();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    throw new Error('Failed to load component');
  });
}

// Lazy component wrapper
const LazyComponent = memo(function LazyComponent({
  loader,
  loadingText = 'Memuat komponen...',
  props = {},
}: LazyComponentProps) {
  const Component = lazyWithRetry(loader);

  return (
    <Suspense fallback={<LoadingSpinner text={loadingText} />}>
      <Component {...props} />
    </Suspense>
  );
});

export default LazyComponent;
