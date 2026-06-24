import { Row } from "@tanstack/react-table";
import { FilterState, FilterValue } from "@/components/inventory/filter";

/**
 * Custom global filter function for TanStack Table.
 * Applies filters based on the provided FilterState object.
 */
export const globalFilterFn = <TData>(
  row: Row<TData>,
  columnId: string,
  filterState: FilterState,
): boolean => {
  for (const [fieldName, filter] of Object.entries(filterState)) {
    const cellValue = row.getValue(fieldName);

    if (filter.type === "multi" && filter.values) {
      if (!filter.values.includes(String(cellValue))) {
        return false;
      }
    } else if (
      filter.type === "numeric" &&
      filter.numericOperator &&
      filter.numericValue !== undefined
    ) {
      const numValue = Number(cellValue);
      const filterValue = filter.numericValue;

      switch (filter.numericOperator) {
        case ">":
          if (!(numValue > filterValue)) return false;
          break;
        case ">=":
          if (!(numValue >= filterValue)) return false;
          break;
        case "<=":
          if (!(numValue <= filterValue)) return false;
          break;
        case "=":
          if (numValue !== filterValue) return false;
          break;
        case "range":
          if (filter.numericValue2 !== undefined) {
            if (!(numValue >= filterValue && numValue <= filter.numericValue2))
              return false;
          }
          break;
      }
    } else if (
      filter.type === "string" &&
      filter.stringOperator &&
      filter.stringValue !== undefined
    ) {
      const strValue = String(cellValue || "");
      const filterValue = filter.stringValue;
      switch (filter.stringOperator) {
        case ">":
          if (!(strValue > filterValue)) return false;
          break;
        case ">=":
          if (!(strValue >= filterValue)) return false;
          break;
        case "<":
          if (!(strValue < filterValue)) return false;
          break;
        case "<=":
          if (!(strValue <= filterValue)) return false;
          break;
        case "=":
          if (strValue !== filterValue) return false;
          break;
        case "range":
          if (filter.stringValue2 !== undefined) {
            if (!(strValue >= filterValue && strValue <= filter.stringValue2))
              return false;
          }
          break;
      }
    } else if (filter.type === "text" && filter.textValue) {
      if (
        !String(cellValue)
          .toLowerCase()
          .includes(filter.textValue.toLowerCase())
      ) {
        return false;
      }
    }
  }
  return true;
};

/**
 * Helper function to manage filter state changes.
 */
export const updateFilterState = (
  prev: FilterState,
  fieldName: string,
  value: FilterValue | FilterValue[] | null,
): FilterState => {
  const newState = { ...prev };
  if (value === null) {
    delete newState[fieldName];
  } else if (Array.isArray(value)) {
    // Handle array of FilterValue by taking the first one
    // This is a simplified approach - you might want to implement more complex logic
    newState[fieldName] = value[0];
  } else {
    newState[fieldName] = value;
  }
  return newState;
};
