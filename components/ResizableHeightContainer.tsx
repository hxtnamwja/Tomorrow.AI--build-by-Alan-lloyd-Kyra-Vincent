import React, { useState, useRef, useCallback, useEffect } from 'react';

interface ResizableHeightContainerProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  minHeight?: number;
  maxHeight?: number;
  defaultHeight?: number;
}

export const ResizableHeightContainer: React.FC<ResizableHeightContainerProps> = ({
  children,
  header,
  minHeight = 200,
  maxHeight = 600,
  defaultHeight = 350
}) => {
  const [height, setHeight] = useState(defaultHeight);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    startYRef.current = e.clientY;
    startHeightRef.current = height;
  }, [height]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    startYRef.current = e.touches[0].clientY;
    startHeightRef.current = height;
  }, [height]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const deltaY = e.clientY - startYRef.current;
      const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeightRef.current + deltaY));
      setHeight(newHeight);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const deltaY = e.touches[0].clientY - startYRef.current;
      const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeightRef.current + deltaY));
      setHeight(newHeight);
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, minHeight, maxHeight]);

  return (
    <div className="flex flex-col overflow-hidden flex-1">
      {/* 可拖动的调整手柄 - 现在在顶部 */}
      <div
        className={`h-4 flex items-center justify-center cursor-ns-resize select-none transition-colors flex-shrink-0 ${
          isDragging ? 'bg-indigo-200' : 'bg-slate-100 hover:bg-slate-200'
        }`}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        title="拖动调整高度"
      >
        <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
      </div>
      
      {/* Header区域（如学科分类标题） */}
      {header && (
        <div className="flex-shrink-0">
          {header}
        </div>
      )}
      
      {/* 内容区域 */}
      <div
        ref={containerRef}
        className="overflow-y-auto custom-scrollbar flex-1"
        style={{ height: `${height}px`, minHeight: `${minHeight}px`, maxHeight: `${maxHeight}px` }}
      >
        {children}
      </div>
    </div>
  );
}
