'use client';

import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  /** 生成页码数组，含省略号 */
  const getPages = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const delta = 2; // 当前页前后显示的页码数

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-1.5">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="border-border text-muted-foreground hover:text-foreground"
      >
        上一页
      </Button>

      {getPages().map((p, idx) =>
        typeof p === 'number' ? (
          <Button
            key={idx}
            variant={p === currentPage ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(p)}
            className={
              p === currentPage
                ? 'bg-primary text-primary-foreground'
                : 'border-border text-muted-foreground hover:text-foreground'
            }
          >
            {p}
          </Button>
        ) : (
          <span key={idx} className="px-1 text-sm text-muted-foreground">
            {p}
          </span>
        )
      )}

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="border-border text-muted-foreground hover:text-foreground"
      >
        下一页
      </Button>
    </div>
  );
}
