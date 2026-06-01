import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnSizingState,
} from "@tanstack/react-table";

export type TableDataGridProps = {
  columns: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
  page: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number) => void;
};

const MIN_ROW_HEIGHT = 28;
const DEFAULT_ROW_HEIGHT = 36;
const ROW_RESIZE_ZONE_PX = 8;
const COLUMN_MIN_WIDTH = 60;

function cellToText(value: unknown): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function isNearRowBottom(target: HTMLElement, clientY: number): boolean {
  const rect = target.getBoundingClientRect();
  return clientY >= rect.bottom - ROW_RESIZE_ZONE_PX;
}

export function TableDataGrid({ columns, rows, totalRows, page, pageSize, loading, onPageChange }: TableDataGridProps) {
  const [rowHeights, setRowHeights] = useState<Record<number, number>>({});
  const [resizingRow, setResizingRow] = useState<number | null>(null);
  const [resizeHintRow, setResizeHintRow] = useState<number | null>(null);
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({});
  const dragRef = useRef<{
    rowIndex: number;
    startY: number;
    startHeight: number;
  } | null>(null);

  useEffect(() => {
    setRowHeights({});
    setResizingRow(null);
    setResizeHintRow(null);
    dragRef.current = null;
  }, [columns, rows]);

  const columnDefs = useMemo<ColumnDef<Record<string, unknown>>[]>(
    () =>
      columns.map((col) => ({
        id: col,
        accessorFn: (row) => row[col],
        header: col,
        cell: ({ getValue }) => cellToText(getValue()),
        minSize: COLUMN_MIN_WIDTH,
      })),
    [columns],
  );

  const table = useReactTable({
    data: rows,
    columns: columnDefs,
    state: { columnSizing },
    onColumnSizingChange: setColumnSizing,
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const beginRowResize = useCallback(
    (rowIndex: number, clientY: number) => {
      const measured =
        rowHeights[rowIndex] ??
        document
          .querySelector<HTMLTableRowElement>(
            `tr[data-row-index="${rowIndex}"]`,
          )
          ?.getBoundingClientRect().height ??
        DEFAULT_ROW_HEIGHT;
      dragRef.current = {
        rowIndex,
        startY: clientY,
        startHeight: measured,
      };
      setResizingRow(rowIndex);
    },
    [rowHeights],
  );

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) {
        return;
      }
      const next = Math.max(
        MIN_ROW_HEIGHT,
        drag.startHeight + (event.clientY - drag.startY),
      );
      setRowHeights((prev) => {
        if (prev[drag.rowIndex] === next) {
          return prev;
        }
        return { ...prev, [drag.rowIndex]: next };
      });
    };

    const endResize = () => {
      dragRef.current = null;
      setResizingRow(null);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", endResize);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", endResize);
    };
  }, []);

  if (columns.length === 0) {
    return null;
  }

  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const showingFrom = totalRows === 0 ? 0 : page * pageSize + 1;
  const showingTo = Math.min((page + 1) * pageSize, totalRows);

  return (
    <div
      className={`db-data-table-wrap${resizingRow !== null ? " db-data-table-wrap--resizing" : ""}${table.getState().columnSizingInfo?.isResizingColumn ? " db-data-table-wrap--col-resizing" : ""}`}
    >
      <table className="db-data-table">
        <thead>
              {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isColumnResized = columnSizing[header.column.id] !== undefined;
                return (
                <th
                  key={header.id}
                  style={isColumnResized ? { width: header.getSize() } : undefined}
                  className={`${isColumnResized ? "db-data-table-th--sized" : "db-data-table-th--auto"}${table.getState().columnSizingInfo?.isResizingColumn === header.column.id ? " db-data-table-th-resizing" : ""}`}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getCanResize() && (
                    <div
                      className="db-col-resize-handle"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        header.getResizeHandler()(e);
                      }}
                      onDoubleClick={() => header.column.resetSize()}
                      title="Drag to resize"
                    />
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const rowHeight = rowHeights[row.index];
            const isCustomHeight = rowHeight !== undefined;

            return (
              <tr
                key={row.id}
                data-row-index={row.index}
                className={`db-data-table-row${isCustomHeight ? " db-data-table-row--custom-h" : ""}${resizingRow === row.index ? " db-data-table-row--resizing" : ""}${resizeHintRow === row.index ? " db-data-table-row--resize-hint" : ""}`}
                style={isCustomHeight ? { height: rowHeight } : undefined}
                onMouseDown={(event) => {
                  if (!isNearRowBottom(event.currentTarget, event.clientY)) {
                    return;
                  }
                  event.preventDefault();
                  beginRowResize(row.index, event.clientY);
                }}
                onMouseMove={(event) => {
                  if (resizingRow !== null) {
                    return;
                  }
                  const nearBottom = isNearRowBottom(event.currentTarget, event.clientY);
                  event.currentTarget.style.cursor = nearBottom ? "row-resize" : "";
                  setResizeHintRow(nearBottom ? row.index : null);
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.cursor = "";
                  setResizeHintRow((prev) => (prev === row.index ? null : prev));
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`db-data-table-cell${isCustomHeight ? " db-data-table-cell--custom-h" : ""}${columnSizing[cell.column.id] !== undefined ? " db-data-table-cell--sized" : ""}`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="db-pagination">
        <div className="db-pagination-info">
          {loading ? (
            <span>Loading...</span>
          ) : totalRows > 0 ? (
            <span>
              {showingFrom.toLocaleString()}–{showingTo.toLocaleString()} of{" "}
              {totalRows.toLocaleString()} rows
            </span>
          ) : (
            <span>0 rows</span>
          )}
        </div>
        <div className="db-pagination-controls">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={page <= 0 || loading}
            onClick={() => onPageChange(page - 1)}
            title="Previous page"
          >
            ‹
          </button>
          {totalPages > 0 && (
            <span className="db-pagination-pages">
              {page + 1} / {totalPages}
            </span>
          )}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled={page >= totalPages - 1 || loading}
            onClick={() => onPageChange(page + 1)}
            title="Next page"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
