// components/data-table/table-pagination.tsx
import { Table as RTTable } from "@tanstack/react-table";
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React, { useRef, useState, useEffect } from "react"; // Import React for React.ReactNode

interface TablePaginationProps<TData> {
  table: RTTable<TData>;
  children?: React.ReactNode; // Slot for filter component
  actions?: React.ReactNode; // Slot for action buttons like export
}

export function TablePagination<TData>({
  table,
  children,
  actions,
}: TablePaginationProps<TData>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(false);
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // detect if content overflows its container
        const el = entry.target as HTMLElement;
        setIsCompact(el.scrollWidth > el.clientWidth);
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex items-center justify-between whitespace-nowrap overflow-hidden"
    >
      <div className="flex items-center gap-8">
        {!isCompact && (
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex w-fit items-center justify-center text-sm font-medium">
          <span>{`Page ${table.getState().pagination.pageIndex + 1} of ${table.getPageCount()}`}</span>
        </div>
        <div className="flex items-center gap-2">
          {!isCompact && (
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Go to first page</span>
              <IconChevronsLeft />
            </Button>
          )}
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <span className="sr-only">Go to previous page</span>
            <IconChevronLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <span className="sr-only">Go to next page</span>
            <IconChevronRight />
          </Button>
          {!isCompact && (
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Go to last page</span>
              <IconChevronsRight />
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {actions} {/* Render action buttons here if provided */}
        {children} {/* Render filters here if provided */}
      </div>
    </div>
  );
}
