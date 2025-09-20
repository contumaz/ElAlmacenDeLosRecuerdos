import React from 'react';
import { VirtualScrollContainerProps } from '../hooks/useAdvancedVirtualScrolling';

/**
 * Componente wrapper para virtual scrolling
 */
export const VirtualScrollContainer: React.FC<VirtualScrollContainerProps> = ({
  height,
  className = '',
  children,
  onScroll
}) => {
  return (
    <div
      className={`overflow-auto ${className}`}
      style={{ height }}
      onScroll={onScroll}
    >
      {children}
    </div>
  );
};

export default VirtualScrollContainer;