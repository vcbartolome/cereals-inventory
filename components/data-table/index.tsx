// components/data-table/index.tsx
"use client";

import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useState, useEffect } from "react";
import { FilterState, FilterValue } from "@/components/filter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconDownload, IconChevronDown } from "@tabler/icons-react";
import * as ExcelJS from "exceljs";

import { TableContent } from "./table-content";
import { TablePagination } from "./table-pagination";
import { FilterField, TableFilters } from "./table-filters";
import { InventoryFormValues } from "@/lib/schemas/inventory";
import { globalFilterFn, updateFilterState } from "./utils"; // Import from utils

interface DataTableProps<TData extends Record<string, unknown>> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  loading?: boolean;
  filterableFields?: FilterField[];
  onRowUpdate?: (updated: TData) => void;
  showExport?: boolean;
  stickyActions?: boolean;
  disableDelete?: boolean;
  extraActions?: React.ReactNode;
  onPageDataChange?: (pageData: TData[]) => void;
}

export function DataTable<TData extends Record<string, unknown>>({
  data,
  columns,
  loading = false,
  filterableFields,
  onRowUpdate,
  showExport = true,
  stickyActions = false,
  disableDelete = false,
  extraActions,
  onPageDataChange,
}: DataTableProps<TData>) {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filterState, setFilterState] = useState<FilterState>({});
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const formatExportCellValue = (value: unknown) => {
    if (value === undefined || value === null) return "";
    return String(value);
  };

  const getExportGroupLabel = (value: unknown) => {
    const label = formatExportCellValue(value).trim();
    return label || "Unknown";
  };

  const handleFilterChange = (
    fieldName: string,
    value: FilterValue | FilterValue[] | null,
  ) => {
    setFilterState((prev) => updateFilterState(prev, fieldName, value));
  };

  const handleClearAllFilters = () => {
    setFilterState({});
  };

  const handleExport = (
    format: "csv" | "xlsx" | "xlsx-per-box" | "xlsx-per-year",
  ) => {
    if (format === "csv") {
      const filteredData = table
        .getFilteredRowModel()
        .rows.map((row) => row.original);

      if (filteredData.length === 0) {
        console.warn("No data to export");
        return;
      }

      // Build column info with both header and accessor key
      const columnInfo = columns.map((col) => ({
        header: (typeof col.header === "string"
          ? col.header
          : "accessorKey" in col && col.accessorKey
            ? (col.accessorKey as string)
            : col.id || "Unknown") as string,
        accessorKey: ("accessorKey" in col && col.accessorKey
          ? (col.accessorKey as string)
          : col.id || "unknown") as string,
      }));

      const csvHeaders = columnInfo.map((info) => info.header);
      const accessorKeys = columnInfo.map((info) => info.accessorKey);

      // Convert data to CSV format
      const csvContent = [
        csvHeaders.join(","), // Header row
        ...filteredData.map((row) =>
          accessorKeys
            .map((key) => {
              const stringValue = formatExportCellValue((row as any)[key]);
              // Escape quotes and wrap in quotes if contains comma, quote, or newline
              if (
                stringValue.includes(",") ||
                stringValue.includes('"') ||
                stringValue.includes("\n")
              ) {
                return `"${stringValue.replace(/"/g, '""')}"`;
              }
              return stringValue;
            })
            .join(","),
        ),
      ].join("\n");

      // Create and download the file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `inventory-export-${new Date().toISOString().split("T")[0]}.csv`,
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (format === "xlsx") {
      const filteredData = table
        .getFilteredRowModel()
        .rows.map((row) => row.original);

      if (filteredData.length === 0) {
        console.warn("No data to export");
        return;
      }

      // Build column info with both header and accessor key
      const columnInfo = columns.map((col) => ({
        header: (typeof col.header === "string"
          ? col.header
          : "accessorKey" in col && col.accessorKey
            ? (col.accessorKey as string)
            : col.id || "Unknown") as string,
        accessorKey: ("accessorKey" in col && col.accessorKey
          ? (col.accessorKey as string)
          : col.id || "unknown") as string,
      }));

      const accessorKeys = columnInfo.map((info) => info.accessorKey);

      // Convert data to format suitable for xlsx
      const worksheetData = [
        columnInfo.map((info) => info.header), // Header row
        ...filteredData.map((row) =>
          accessorKeys.map((key) => formatExportCellValue((row as any)[key])),
        ),
      ];

      // Use ExcelJS to create workbook and worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Inventory");
      worksheetData.forEach((row) => worksheet.addRow(row));

      // Auto-size columns with ExcelJS
      columnInfo.forEach((_, idx) => {
        const maxLength = Math.max(
          columnInfo[idx].header.length,
          ...filteredData.map(
            (row) => String((row as any)[accessorKeys[idx]] ?? "").length,
          ),
        );
        worksheet.columns[idx].width = Math.min(
          Math.max(maxLength + 2, 10),
          50,
        );
      });

      // Generate and download the file
      workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `inventory-export-${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    } else if (format === "xlsx-per-box") {
      const filteredData = table
        .getFilteredRowModel()
        .rows.map((row) => row.original);

      if (filteredData.length === 0) {
        console.warn("No data to export");
        return;
      }

      // Build column info with both header and accessor key
      const columnInfo = columns.map((col) => ({
        header: (typeof col.header === "string"
          ? col.header
          : "accessorKey" in col && col.accessorKey
            ? (col.accessorKey as string)
            : col.id || "Unknown") as string,
        accessorKey: ("accessorKey" in col && col.accessorKey
          ? (col.accessorKey as string)
          : col.id || "unknown") as string,
      }));

      const accessorKeys = columnInfo.map((info) => info.accessorKey);

      // Group data by box number
      const dataByBox = filteredData.reduce(
        (acc, row) => {
          const boxNumber = getExportGroupLabel((row as any).box_number);
          if (!acc[boxNumber]) {
            acc[boxNumber] = [];
          }
          acc[boxNumber].push(row);
          return acc;
        },
        {} as Record<string | number, typeof filteredData>,
      );

      // Use ExcelJS to create workbook
      const workbook = new ExcelJS.Workbook();

      // Sort box numbers for consistent ordering
      const sortedBoxNumbers = Object.keys(dataByBox).sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (isNaN(numA) && isNaN(numB)) return a.localeCompare(b);
        if (isNaN(numA)) return 1;
        if (isNaN(numB)) return -1;
        return numA - numB;
      });

      // Create a worksheet for each box number
      sortedBoxNumbers.forEach((boxNumber) => {
        const boxData = dataByBox[boxNumber];

        // Convert data to format suitable for xlsx
        const worksheetData = [
          columnInfo.map((info) => info.header), // Header row
          ...boxData.map((row) =>
            accessorKeys.map((key) => formatExportCellValue((row as any)[key])),
          ),
        ];

        // Create worksheet for each box
        const worksheet = workbook.addWorksheet(`Box ${boxNumber}`);
        worksheetData.forEach((row) => worksheet.addRow(row));

        // Auto-size columns
        columnInfo.forEach((_, idx) => {
          const maxLength = Math.max(
            columnInfo[idx].header.length,
            ...boxData.map(
              (row) => String((row as any)[accessorKeys[idx]] ?? "").length,
            ),
          );
          worksheet.columns[idx].width = Math.min(
            Math.max(maxLength + 2, 10),
            50,
          );
        });
      });

      // Generate and download workbook
      workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `inventory-by-box-${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    } else if (format === "xlsx-per-year") {
      const filteredData = table
        .getFilteredRowModel()
        .rows.map((row) => row.original);

      if (filteredData.length === 0) {
        console.warn("No data to export");
        return;
      }

      // Build column info with both header and accessor key
      const columnInfo = columns.map((col) => ({
        header: (typeof col.header === "string"
          ? col.header
          : "accessorKey" in col && col.accessorKey
            ? (col.accessorKey as string)
            : col.id || "Unknown") as string,
        accessorKey: ("accessorKey" in col && col.accessorKey
          ? (col.accessorKey as string)
          : col.id || "unknown") as string,
      }));

      const accessorKeys = columnInfo.map((info) => info.accessorKey);

      // Group data by year
      const dataByYear = filteredData.reduce(
        (acc, row) => {
          const year = getExportGroupLabel((row as any).year);
          if (!acc[year]) {
            acc[year] = [];
          }
          acc[year].push(row);
          return acc;
        },
        {} as Record<string | number, typeof filteredData>,
      );

      // Use ExcelJS to create workbook
      const workbook = new ExcelJS.Workbook();

      // Sort years for consistent ordering (most recent first)
      const sortedYears = Object.keys(dataByYear).sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (isNaN(numA) && isNaN(numB)) return a.localeCompare(b);
        if (isNaN(numA)) return 1;
        if (isNaN(numB)) return -1;
        return numB - numA; // Descending order (most recent first)
      });

      // Create a worksheet for each year
      sortedYears.forEach((year) => {
        const yearData = dataByYear[year];

        // Convert data to format suitable for xlsx
        const worksheetData = [
          columnInfo.map((info) => info.header), // Header row
          ...yearData.map((row) =>
            accessorKeys.map((key) => formatExportCellValue((row as any)[key])),
          ),
        ];

        // Create worksheet for each year
        const worksheet = workbook.addWorksheet(`${year}`);
        worksheetData.forEach((row) => worksheet.addRow(row));

        // Auto-size columns
        columnInfo.forEach((_, idx) => {
          const maxLength = Math.max(
            columnInfo[idx].header.length,
            ...yearData.map(
              (row) => String((row as any)[accessorKeys[idx]] ?? "").length,
            ),
          );
          worksheet.columns[idx].width = Math.min(
            Math.max(maxLength + 2, 10),
            50,
          );
        });
      });

      // Generate and download workbook
      workbook.xlsx.writeBuffer().then((buffer) => {
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `inventory-by-year-${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      });
    }
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination,
      sorting,
      globalFilter: filterState, // Pass filterState as globalFilter
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getRowId: (row) => String((row as any).id),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: globalFilterFn, // Use the extracted globalFilterFn
  });
  
  useEffect(() => {
    const pageRows = table.getRowModel().rows.map(row => row.original);
    onPageDataChange?.(pageRows);
  }, [table.getState().pagination.pageIndex, table.getState().pagination.pageSize, table.getState().globalFilter, table.getState().sorting]);

  const showFilters = filterableFields && filterableFields.length > 0;

  // Wrap export actions to hide on small screens
  const exportActions = (
    <div className="hidden sm:flex items-center gap-2">
      {extraActions}
      {showExport && (
      <DropdownMenu
        open={exportDropdownOpen}
        onOpenChange={setExportDropdownOpen}
      >
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <IconDownload className="mr-2 h-4 w-4" />
            Export
            <IconChevronDown
              className={`ml-2 h-4 w-4 transition-transform duration-300 ease-in-out ${exportDropdownOpen ? "-rotate-180" : "rotate-0"}`}
            />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => handleExport("xlsx")}>
            Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("xlsx-per-box")}>
            Excel, per Box Number
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("xlsx-per-year")}>
            Excel, per Year
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleExport("csv")}>
            CSV
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      )}
    </div>
  );

  return (
    <div className="w-full flex-col justify-start gap-6">
      <div className="relative flex flex-col gap-4">
        <div className="overflow-auto">
          <TableContent
            table={table}
            columns={columns}
            loading={loading}
            onRowUpdate={onRowUpdate}
            stickyActions={stickyActions}
            disableDelete={disableDelete}
          />
        </div>
        <TablePagination table={table} actions={exportActions}>
          {showFilters && (
            <TableFilters
              filterState={filterState}
              onFilterChange={handleFilterChange}
              onClearAllFilters={handleClearAllFilters}
              data={data as unknown as InventoryFormValues[]}
              filterFields={filterableFields!}
            />
          )}
        </TablePagination>
      </div>
    </div>
  );
}
