// components/data-table/table-filters.tsx
import { Funnel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FilterControl, FilterState, FilterValue } from "@/components/filter";
import { InventoryFormValues } from "@/lib/schemas/inventory";

export interface FilterField {
  label: string;
  fieldName: keyof InventoryFormValues;
}

type TableFiltersProps = {
  filterState: FilterState;
  onFilterChange: (
    fieldName: string,
    value: FilterValue | FilterValue[] | null,
  ) => void;
  onClearAllFilters: () => void;
  data: InventoryFormValues[];
  filterFields: FilterField[];
};

export function TableFilters({
  filterState,
  onFilterChange,
  onClearAllFilters,
  data,
  filterFields,
}: TableFiltersProps) {
  const activeFiltersCount = Object.keys(filterState).length;

  return (
    <div className="flex items-center space-x-2">
      {/* Inline box number input filter */}
      {/* box diabled
      <Input
        type="number"
        placeholder="Box #"
        className="w-20 sm:w-28 md:w-36 lg:w-48 appearance-none [&::-webkit-inner-spin-button]:hidden [&::-webkit-outer-spin-button]:hidden [&::-moz-appearance-textfield]:appearance-none"
        value={
          filterState["box_number"] &&
          filterState["box_number"].type === "numeric"
            ? (filterState["box_number"].numericValue ?? "")
            : ""
        }
        onChange={(e) => {
          const val = e.target.value;
          const num = parseFloat(val);
          if (val === "" || isNaN(num)) {
            onFilterChange("box_number", null);
          } else {
            onFilterChange("box_number", {
              type: "numeric",
              numericOperator: "=",
              numericValue: num,
            });
          }
        }}
      /> */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Funnel className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 hidden sm:inline bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent>
          <div className="m-4">
            <SheetTitle>Filter Data</SheetTitle>
            <SheetDescription>
              Select filters to refine your inventory results.
            </SheetDescription>
          </div>
          <div className="border-b" />
          <div className="m-4 overflow-auto max-h-screen space-y-6">
            {/* Checkbox filters */}
            {[
              { label: "Type", field: "type" },
              { label: "Location", field: "location" }, // switched: Location is now a checkbox filter
              { label: "Season", field: "season" },
              { label: "Shelf Code", field: "shelf_code" },
            ].map(({ label, field }) => {
              // Get unique options from data
              const options = Array.from(
                new Set(
                  data
                    .map((d) => d[field as keyof InventoryFormValues])
                    .filter(Boolean),
                ),
              ).sort((a, b) => {
                // Sort as strings, case-insensitive
                return String(a).localeCompare(String(b), undefined, {
                  sensitivity: "base",
                });
              });
              return (
                <div key={field}>
                  <div className="font-medium mb-1">{label}</div>
                  <div className="flex flex-wrap gap-2">
                    {options.map((option) => {
                      const multi =
                        filterState[field] &&
                        filterState[field].type === "multi"
                          ? (filterState[field].values as string[])
                          : [];
                      const isChecked = multi.includes(option as string);
                      return (
                        <Button
                          key={option as string}
                          variant={isChecked ? "default" : "outline"}
                          size="sm"
                          className="rounded-full"
                          onClick={() => {
                            const next = isChecked
                              ? multi.filter((v) => v !== option)
                              : [...multi, option as string];
                            onFilterChange(
                              field,
                              next.length
                                ? { type: "multi", values: next }
                                : null,
                            );
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            readOnly
                            className="mr-2"
                          />
                          {option as string}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Text filters */}
            {[
              { label: "Description", field: "description" },
              { label: "Pedigree", field: "pedigree" },
              { label: "Area Planted", field: "area_planted" }, // switched: Area Planted is now a text filter
            ].map(({ label, field }) => (
              <div key={field}>
                <div className="font-medium mb-1">{label}</div>
                <Input
                  type="text"
                  placeholder={`Search ${label.toLowerCase()}...`}
                  value={
                    filterState[field] && filterState[field].type === "text"
                      ? (filterState[field].textValue ?? "")
                      : ""
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    onFilterChange(
                      field,
                      val ? { type: "text", textValue: val } : null,
                    );
                  }}
                />
              </div>
            ))}

            {/* Year filter: string-based, UI same as numeric */}
            {[{ label: "Year", field: "year" }].map(({ label, field }) => {
              let conditions: FilterValue[] = Array.isArray(filterState[field])
                ? (filterState[field] as FilterValue[])
                : filterState[field]
                  ? [filterState[field] as FilterValue]
                  : [];
              if (conditions.length === 0) {
                conditions = [
                  {
                    type: "string" as const,
                    stringOperator: "=" as const,
                    stringValue: "",
                  },
                ];
              }
              return (
                <div key={field}>
                  <div className="font-medium mb-1 flex items-center justify-between">
                    <span>{label}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2"
                      onClick={() => {
                        const next = [
                          ...conditions,
                          {
                            type: "string" as const,
                            stringOperator: "=" as const,
                            stringValue: "",
                          },
                        ];
                        onFilterChange(field, next);
                      }}
                      aria-label={`Add ${label} condition`}
                    >
                      <span className="text-lg">+</span>
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {conditions.map((cond, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {cond.type === "string" && (
                          <>
                            <select
                              className="border rounded px-2 py-1 text-sm"
                              value={cond.stringOperator}
                              onChange={(e) => {
                                const op = e.target.value as
                                  | ">"
                                  | ">="
                                  | "<="
                                  | "="
                                  | "range";
                                const next = conditions.map((c, i) =>
                                  i === idx && c.type === "string"
                                    ? { ...c, stringOperator: op }
                                    : c,
                                );
                                onFilterChange(field, next);
                              }}
                            >
                              <option value=">">&gt;</option>
                              <option value=">=">&ge;</option>
                              <option value="<=">&le;</option>
                              <option value="=">=</option>
                              <option value="range">range</option>
                            </select>
                            <Input
                              type="text"
                              className="w-24"
                              value={cond.stringValue ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                const next = conditions.map((c, i) =>
                                  i === idx && c.type === "string"
                                    ? { ...c, stringValue: val }
                                    : c,
                                );
                                onFilterChange(field, next);
                              }}
                            />
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            const next = conditions.filter((_, i) => i !== idx);
                            onFilterChange(field, next.length ? next : null);
                          }}
                          aria-label={`Remove ${label} condition`}
                        >
                          &times;
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Weight filter: numeric, unchanged */}
            {[{ label: "Weight", field: "weight" }].map(({ label, field }) => {
              let conditions: FilterValue[] = Array.isArray(filterState[field])
                ? (filterState[field] as FilterValue[])
                : filterState[field]
                  ? [filterState[field] as FilterValue]
                  : [];
              if (conditions.length === 0) {
                conditions = [
                  {
                    type: "numeric" as const,
                    numericOperator: "=" as const,
                    numericValue: 0,
                  },
                ];
              }
              return (
                <div key={field}>
                  <div className="font-medium mb-1 flex items-center justify-between">
                    <span>{label}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2"
                      onClick={() => {
                        const next = [
                          ...conditions,
                          {
                            type: "numeric" as const,
                            numericOperator: "=" as const,
                            numericValue: 0,
                          },
                        ];
                        onFilterChange(field, next);
                      }}
                      aria-label={`Add ${label} condition`}
                    >
                      <span className="text-lg">+</span>
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {conditions.map((cond, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {cond.type === "numeric" && (
                          <>
                            <select
                              className="border rounded px-2 py-1 text-sm"
                              value={cond.numericOperator}
                              onChange={(e) => {
                                const op = e.target.value as
                                  | ">"
                                  | ">="
                                  | "<="
                                  | "="
                                  | "range";
                                const next = conditions.map((c, i) =>
                                  i === idx && c.type === "numeric"
                                    ? { ...c, numericOperator: op }
                                    : c,
                                );
                                onFilterChange(field, next);
                              }}
                            >
                              <option value=">">&gt;</option>
                              <option value=">=">&ge;</option>
                              <option value="<=">&le;</option>
                              <option value="=">=</option>
                              <option value="range">range</option>
                            </select>
                            <Input
                              type="number"
                              className="w-24"
                              value={cond.numericValue ?? 0}
                              onChange={(e) => {
                                const val = e.target.value;
                                const num = val === "" ? 0 : parseFloat(val);
                                const next = conditions.map((c, i) =>
                                  i === idx && c.type === "numeric"
                                    ? { ...c, numericValue: num }
                                    : c,
                                );
                                onFilterChange(field, next);
                              }}
                            />
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => {
                            const next = conditions.filter((_, i) => i !== idx);
                            onFilterChange(field, next.length ? next : null);
                          }}
                          aria-label={`Remove ${label} condition`}
                        >
                          &times;
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <SheetFooter className="pt-4">
              <Button variant="secondary" onClick={onClearAllFilters}>
                Clear All Filters
              </Button>
            </SheetFooter>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
