// Centralized exports for optimized components
// Import from 'app/components' for tree-shaking benefits

// Loading components
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as Skeleton } from './Skeleton';
export {
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonStatCard,
  SkeletonDashboard,
  SkeletonList,
  SkeletonForm,
} from './Skeleton';

// Virtual list for large datasets
export { default as VirtualList } from './VirtualList';
export { VirtualTable } from './VirtualList';

// Lazy loading
export { default as LazyComponent } from './LazyComponent';

// Pagination
export { default as Pagination } from './Pagination';
