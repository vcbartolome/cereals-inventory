"use client";

import { useState, useMemo } from "react";
import { X, ChevronDown } from "lucide-react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Checkbox } from "./ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  typeOptions,
  locationOptions,
  seasonOptions,
  type InventoryFormValues,
} from "@/lib/schemas/inventory";

export type FilterValue =
  | {
      type: "multi";
      values: string[];
    }
  | {
      type: "numeric";
      numericOperator: ">" | ">=" | "<=" | "=" | "range";
      numericValue: number;
      numericValue2?: number; // for range
    }
  | {
      type: "text";
      textValue: string;
    }
  | {
      type: "string";
      stringOperator: ">" | ">=" | "<" | "<=" | "=" | "range";
      stringValue: string;
      stringValue2?: string; // for range
    };

export type FilterState = Record<string, FilterValue>;

interface FilterControlProps {
  label: string;
  fieldName: keyof InventoryFormValues;
  filterState: FilterState;
  onFilterChange: (fieldName: string, value: FilterValue | null) => void;
  data: InventoryFormValues[];
}

export function FilterControl({
  label,
  fieldName,
  filterState,
  onFilterChange,
  data,
}: FilterControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentFilter = filterState[fieldName as string];

  // Get unique values from data for text fields
  const uniqueValues = useMemo(() => {
    if (fieldName === "type") return typeOptions;
    if (fieldName === "area_planted") return locationOptions;
    if (fieldName === "season") return seasonOptions;

    // For other text fields, get unique values from data
    const values = data
      .map((row) => String(row[fieldName]))
      .filter((value, index, arr) => value && arr.indexOf(value) === index)
      .sort();
    return values;
  }, [fieldName, data]);

  const isEnumField = ["type", "area_planted", "season"].includes(
    fieldName as string,
  );
  const isNumericField = fieldName === "weight";
  const isBoxNumberField = fieldName === "box_number";
  const isTextField =
    !isEnumField &&
    !isNumericField &&
    !isBoxNumberField &&
    fieldName !== "remarks";

  if (fieldName === "remarks") return null; // Remarks should not be filterable

  const clearFilter = () => {
    onFilterChange(fieldName as string, null);
    setIsOpen(false);
  };

  const handleMultiSelect = (value: string, checked: boolean) => {
    const currentValues =
      currentFilter && currentFilter.type === "multi"
        ? currentFilter.values
        : [];
    const newValues = checked
      ? [...currentValues, value]
      : currentValues.filter((v) => v !== value);

    if (newValues.length === 0) {
      onFilterChange(fieldName as string, null);
    } else {
      onFilterChange(fieldName as string, {
        type: "multi",
        values: newValues,
      });
    }
  };

  const handleNumericFilter = (
    operator: string,
    value1: string,
    value2?: string,
  ) => {
    const num1 = parseFloat(value1);
    const num2 = value2 ? parseFloat(value2) : undefined;

    if (
      isNaN(num1) ||
      (operator === "range" && (isNaN(num2!) || num2 === undefined))
    ) {
      onFilterChange(fieldName as string, null);
      return;
    }

    onFilterChange(fieldName as string, {
      type: "numeric",
      numericOperator: operator as any,
      numericValue: num1,
      numericValue2: num2,
    });
  };

  const handleTextFilter = (value: string) => {
    if (!value.trim()) {
      onFilterChange(fieldName as string, null);
      return;
    }

    onFilterChange(fieldName as string, {
      type: "text",
      textValue: value,
    });
  };

  const hasActiveFilter = currentFilter != null;
  const selectedCount =
    currentFilter && currentFilter.type === "multi"
      ? currentFilter.values.length
      : 0;

  return (
    <div className="space-y-2 m-4">
      <Label className="text-sm font-medium">{label}</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-full justify-between ${hasActiveFilter ? "border-primary" : ""}`}
          >
            <span className="truncate">
              {hasActiveFilter ? (
                <>
                  {isEnumField || isTextField
                    ? selectedCount > 0
                      ? `${selectedCount} selected`
                      : "Filter..."
                    : currentFilter.type === "numeric"
                      ? `${currentFilter.numericOperator} ${currentFilter.numericValue}${
                          currentFilter.numericOperator === "range"
                            ? ` - ${currentFilter.numericValue2}`
                            : ""
                        }`
                      : "Filter..."}
                </>
              ) : (
                "Filter..."
              )}
            </span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filter {label}</h4>
            </div>

            {/* Multi-select for enum and text fields */}
            {(isEnumField || isTextField) && (
              <>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {uniqueValues.map((value) => (
                    <div key={value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${fieldName}-${value}`}
                        checked={
                          currentFilter && currentFilter.type === "multi"
                            ? currentFilter.values.includes(value)
                            : false
                        }
                        onCheckedChange={(checked) =>
                          handleMultiSelect(value, checked as boolean)
                        }
                      />
                      <Label
                        htmlFor={`${fieldName}-${value}`}
                        className="text-sm cursor-pointer flex-1"
                      >
                        {value}
                      </Label>
                    </div>
                  ))}
                </div>
                {hasActiveFilter && (
                  <div className="pt-2">
                    <Button variant="ghost" size="sm" onClick={clearFilter}>
                      Clear all
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Single-number input for box number */}
            {isBoxNumberField &&
              currentFilter &&
              currentFilter.type === "numeric" && (
                <Input
                  type="number"
                  placeholder="Box number"
                  value={currentFilter.numericValue ?? ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    const num = parseFloat(val);
                    if (val === "" || isNaN(num)) {
                      clearFilter();
                    } else {
                      onFilterChange(fieldName as string, {
                        type: "numeric",
                        numericOperator: "=",
                        numericValue: num,
                      });
                    }
                  }}
                />
              )}
            {/* Numeric filter for weight */}
            {isNumericField &&
              currentFilter &&
              currentFilter.type === "numeric" && (
                <div className="space-y-3">
                  <Select
                    value={currentFilter.numericOperator || ""}
                    onValueChange={(operator) => {
                      if (operator === "range") {
                        // Initialize range with empty values
                        onFilterChange(fieldName as string, {
                          type: "numeric",
                          numericOperator: "range",
                          numericValue: 0,
                          numericValue2: 0,
                        });
                      } else {
                        const value = currentFilter.numericValue || 0;
                        handleNumericFilter(operator, String(value));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=">">&gt; Greater than</SelectItem>
                      <SelectItem value=">=">
                        &gt;= Greater than or equal
                      </SelectItem>
                      <SelectItem value="<=">
                        &lt;= Less than or equal
                      </SelectItem>
                      <SelectItem value="=">=Equal to</SelectItem>
                      <SelectItem value="range">Range</SelectItem>
                    </SelectContent>
                  </Select>

                  {currentFilter.numericOperator === "range" ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        type="number"
                        placeholder="Min"
                        value={currentFilter.numericValue || ""}
                        onChange={(e) => {
                          const max = currentFilter.numericValue2 || 0;
                          handleNumericFilter(
                            "range",
                            e.target.value,
                            String(max),
                          );
                        }}
                      />
                      <span>-</span>
                      <Input
                        type="number"
                        placeholder="Max"
                        value={currentFilter.numericValue2 || ""}
                        onChange={(e) => {
                          const min = currentFilter.numericValue || 0;
                          handleNumericFilter(
                            "range",
                            String(min),
                            e.target.value,
                          );
                        }}
                      />
                    </div>
                  ) : currentFilter.numericOperator ? (
                    <Input
                      type="number"
                      placeholder="Enter value"
                      value={currentFilter.numericValue || ""}
                      onChange={(e) => {
                        handleNumericFilter(
                          currentFilter.numericOperator,
                          e.target.value,
                        );
                      }}
                    />
                  ) : null}
                </div>
              )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Show active filter badges */}
      {hasActiveFilter && currentFilter.type === "multi" && (
        <div className="flex flex-wrap gap-1">
          {currentFilter.values.map((value) => (
            <Badge
              key={value}
              variant="secondary"
              className="text-xs flex items-center"
            >
              <span>{value}</span>
              <Button
                variant="ghost"
                size="icon"
                className="ml-1"
                onClick={() => handleMultiSelect(value, false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
