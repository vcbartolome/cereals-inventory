// components/data-table/table-content.tsx
import { flexRender, Table as RTTable } from "@tanstack/react-table";
import { IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import { Pencil } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { InventoryViewDialog } from "@/components/inventory/inventory-view-dialog";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table"; // Import ColumnDef here
import { useState } from "react";
import { db } from "@/backend/firebase";
import {
  updateDoc,
  deleteDoc,
  doc,
  addDoc,
  collection,
} from "firebase/firestore";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import type { Row } from "@tanstack/react-table";
import {
  typeOptions,
  areaPlantedOptions,
  seasonOptions,
} from "@/backend/schemas/inventory";
import { useUser } from "@/context/UserContext";

// import { useRole } from "@/hooks/use-role";


interface TableContentProps<TData extends Record<string, unknown>> {
  table: RTTable<TData>;
  columns: ColumnDef<TData, unknown>[]; // Use ColumnDef from tanstack
  loading?: boolean;
  /** Callback invoked after a row is updated */
  onRowUpdate?: (updated: TData) => void;
  stickyActions?: boolean;
  disableDelete?: boolean;
}

export function TableContent<TData extends Record<string, unknown>>({
  table,
  columns,
  loading,
  onRowUpdate,
  stickyActions = false,
  disableDelete = false,
}: TableContentProps<TData>) {

  const renderRows =
    table.getRowModel().rows?.length > 0 ? (
      table
        .getRowModel()
        .rows.map((row) => (
          <RowDialog
            key={row.id}
            row={row}
            onRowUpdate={onRowUpdate}
            stickyActions={stickyActions}
            disableDelete={disableDelete}
          />
        ))
    ) : (
      <TableRow>
        <TableCell
          colSpan={onRowUpdate ? columns.length + 1 : columns.length}
          className="h-24 text-center"
        >
          No results.
        </TableCell>
      </TableRow>
    );

  return (
    <div className="rounded-lg border">
      <Table className="table-auto overflow-scroll">
        <TableHeader className="bg-muted sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const isSorted = header.column.getIsSorted();
                return (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-2 ${
                          canSort
                            ? "cursor-pointer select-none hover:bg-muted-foreground/10 rounded p-1 -m-1"
                            : ""
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <span>
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </span>
                        {canSort && (
                          <span className="ml-1">
                            {isSorted === "asc" ? (
                              <IconChevronUp className="h-4 w-4" />
                            ) : isSorted === "desc" ? (
                              <IconChevronDown className="h-4 w-4" />
                            ) : (
                              <div className="flex flex-col">
                                <IconChevronUp className="h-3 w-3 opacity-40" />
                                <IconChevronDown className="h-3 w-3 opacity-40 -mt-1" />
                              </div>
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </TableHead>
                );
              })}
              {onRowUpdate && (
                <TableHead
                  key="actions"
                  className={stickyActions ? "sticky right-0 bg-muted" : ""}
                >
                  Actions
                </TableHead>
              )}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody className="**:data-[slot=table-cell]:first:w-8">
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={columns.length + (onRowUpdate ? 1 : 0)}
                className="h-24 text-center"
              >
                <div className="flex items-center justify-center gap-2">
                  <Spinner size="sm" />
                  <span className="text-muted-foreground">Loading...</span>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            renderRows
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// Component to handle row editing
function RowDialog<TData extends Record<string, any>>({
  row,
  onRowUpdate,
  stickyActions = false,
  disableDelete = false,
}: {
  row: Row<TData>;
  onRowUpdate?: (updated: TData) => void;
  stickyActions?: boolean;
  disableDelete?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // Store weight as string for input, convert to number on submit
  const initialEditValues = { ...row.original };
  if (
    typeof (initialEditValues as any).weight === "number" ||
    typeof (initialEditValues as any).weight === "undefined"
  ) {
    (initialEditValues as any).weight =
      (initialEditValues as any).weight?.toString() ?? "";
  }
  const [editValues, setEditValues] = useState(initialEditValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [weightError, setWeightError] = useState<string | null>(null);
  const [requiredError, setRequiredError] = useState<string | null>(null);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [justEdited, setJustEdited] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { profile} = useUser();
  


  // Get editable fields from column metadata
  const getEditableFields = () => {
    const allFields = [
      "box_number",
      "shelf_code",
      "type",
      "area_planted",
      "year",
      "season",
      "location",
      "description",
      "pedigree",
      "weight",
      "remarks",
    ];

    const weightremarks = [
      "weight",
      "remarks",
    ];

    // Check if any columns have editable metadata
    const hasEditableMetadata = row
      .getVisibleCells()
      .some(
        (cell) => (cell.column.columnDef as any).meta?.editable !== undefined,
      );

    if (hasEditableMetadata) {
      // Only return fields that are marked as editable
      return allFields.filter((field) => {
        const column = row
          .getVisibleCells()
          .find((cell) => cell.column.id === field);
        return (
          column && (column.column.columnDef as any).meta?.editable === true
        );
      });
    }

    if (profile?.role == "agtech") {
      return weightremarks;
    } else if (profile?.role == "admin") {
      return allFields;
    } 


    // Default behavior - all fields are editable
    return [];
  };

  const handleChange = (key: string, value: any) => {
    setEditValues((prev) => ({ ...prev, [key]: value }));
  };

  const formatLogValue = (value: unknown, fallback = "Unknown") => {
    if (value === undefined || value === null || value === "") {
      return fallback;
    }
    return String(value);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setWeightError(null);
    setRequiredError(null);
    const weightValue = (editValues as any).weight;
    const parsedWeight =
      typeof weightValue === "string" ? parseFloat(weightValue) : weightValue;
    if (
      weightValue !== undefined &&
      weightValue !== null &&
      weightValue !== "" &&
      isNaN(parsedWeight)
    ) {
      setWeightError("Weight must be a valid number.");
      setIsSubmitting(false);
      return;
    }
    // Only box_number is required now; other fields may be blank
    const requiredFields = ["box_number"];
    const missing: string[] = [];
    for (const field of requiredFields) {
      const val = (editValues as any)[field];
      if (val === undefined || val === null || val === "") {
        missing.push(field);
      }
    }
    if (missing.length > 0) {
      setRequiredError("Please fill in all required fields.");
      setMissingFields(missing);
      return;
    } else {
      setMissingFields([]);
    }
    try {
      // Prepare values for saving: convert weight to number if possible
      const valuesToSave = { ...editValues };
      if (typeof (valuesToSave as any).weight === "string") {
        const weightString = (valuesToSave as any).weight.trim();
        if (weightString === "") {
          delete (valuesToSave as any).weight;
        } else {
          const parsed = parseFloat(weightString);
          (valuesToSave as any).weight = isNaN(parsed) ? null : parsed;
        }
      }
      if (typeof (valuesToSave as any).box_number === "string") {
        const parsedBox = parseFloat((valuesToSave as any).box_number);
        (valuesToSave as any).box_number = isNaN(parsedBox) ? null : parsedBox;
      }
      // Compare original and new values to detect changes
      const changes: string[] = [];
      const originalData = row.original;
      Object.keys(valuesToSave).forEach((key) => {
        if (key === "id") return;
        const originalValue = originalData[key];
        const newValue = valuesToSave[key];
        if (originalValue !== newValue) {
          const fieldName = key
            .replace("_", " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());
          changes.push(`${fieldName}: "${originalValue}" → "${newValue}"`);
        }
      });
      // Only update if there are changes
      if (changes.length === 0) {
        toast.info("No changes detected.");
        setIsSubmitting(false);
        return;
      }
      const docRef = doc(db, "inventory", String(editValues.id));
      await updateDoc(docRef, valuesToSave);
      // Log activity after successful update
      if (profile) {
        const baseMessage = `Updated inventory item (Box ${formatLogValue(valuesToSave.box_number)} - ${formatLogValue(valuesToSave.type)})`;
        const changesMessage = `. Changes: ${changes.join(", ")}`;
        await addDoc(collection(db, "activity"), {
          message: baseMessage + changesMessage,
          loggedAt: new Date(),
          loggedBy: profile.email,
        });
      }
      toast.success("Inventory updated successfully!");
      setOpen(false);
      setJustEdited(true);
      setTimeout(() => setJustEdited(false), 1200);
      onRowUpdate?.(valuesToSave as TData);
    } catch (error) {
      console.error("Error updating document: ", error);
      toast.error("Error updating inventory");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open confirmation dialog for delete
  const handleDelete = () => {
    setShowConfirmDelete(true);
  };
  // Perform confirmed deletion
  const handleConfirmedDelete = async () => {
    setIsDeleting(true);
    try {
      const docRef = doc(db, "inventory", String(editValues.id));
      await deleteDoc(docRef);
      toast.success("Inventory entry deleted!");
      setOpen(false);
      // Log deletion activity
      if (profile) {
        await addDoc(collection(db, "activity"), {
          message: `Deleted inventory entry:\n  • Box Number: ${formatLogValue(editValues.box_number, "N/A")}\n  • Type: ${formatLogValue(editValues.type)}\n  • Area Planted: ${formatLogValue(editValues.area_planted)}\n  • Year: ${formatLogValue(editValues.year)}\n  • Season: ${formatLogValue(editValues.season)}\n  • Storage Location: ${formatLogValue(editValues.location)}\n  • Description: ${formatLogValue(editValues.description)}\n  • Pedigree: ${formatLogValue(editValues.pedigree)}\n  • Weight: ${formatLogValue(editValues.weight, "N/A")} kg\n  • Remarks: ${formatLogValue(editValues.remarks)}`,
          loggedAt: new Date(),
          loggedBy: profile.email,
        });
      }
      // Notify parent to refresh data after delete, pass deleted row info
      onRowUpdate?.({ ...editValues, deleted: true } as TData);
    } catch (error) {
      console.error("Error deleting document: ", error);
      toast.error("Error deleting inventory");
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  if (!onRowUpdate) {
    return (
      <TableRow>
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    );
  }

  const currentYear: number = new Date().getFullYear();
  let ocol = '#e9e6e6';
  let bcol = '#ffff';
  // const rdata = ...row.original;
  let nexpire = currentYear - row.original.year;
  if (nexpire >= 5) {
    ocol = "#ff0000";
    bcol = "#fab6b6"
  } else if (nexpire == 4) {
    ocol = "#ff8000";
    bcol = "#ffc68e"
  }
  
  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <TableRow outcol={ocol} bgcol={bcol}
          className={`relative z-0 transition-all ${justEdited ? "animate-pulse bg-green-100" : ""}`}
        >
          {row.getVisibleCells().map((cell) => (
            
            <TableCell key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
          <TableCell
            className={stickyActions ? "sticky right-0 bg-background" : ""}
          >
            <div className="flex items-center gap-2">
              <InventoryViewDialog entry={row.original} />
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Pencil className="h-4 w-4 sm:hidden" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
              </DialogTrigger>
            </div>
          </TableCell>
        </TableRow>
        <DialogContent className="max-h-[70vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium">Edit Row</DialogTitle>
          </DialogHeader>
          <div className="text-sm space-y-4">
            {getEditableFields()
              .map((key) => {
                const value = editValues[key];
                if (key === "id") return null;

                // Render appropriate input based on field type
                if (key === "type") {
                  return (
                    <div key={key} className="flex flex-col space-y-2">
                      <Label className="font-medium">Type</Label>
                      <Select
                        value={String(value)}
                        onValueChange={(newValue) =>
                          handleChange(key, newValue)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {typeOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }

                if (key === "area_planted") {
                  return (
                    <div key={key} className="flex flex-col space-y-2">
                      <Label className="font-medium">Area Planted</Label>
                      <Input
                        value={value ?? ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                        placeholder="Enter area planted"
                      />
                    </div>
                  );
                }
                if (key === "location") {
                  // location should be a select with enum values
                  const locationOptions = ["LBTR", "LBPD", "CMU"];
                  return (
                    <div key={key} className="flex flex-col space-y-2">
                      <Label className="font-medium">Location</Label>
                      <Select
                        value={String(value)}
                        onValueChange={(newValue) =>
                          handleChange(key, newValue)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          {locationOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option.toUpperCase()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }

                if (key === "season") {
                  return (
                    <div key={key} className="flex flex-col space-y-2">
                      <Label className="font-medium">Season</Label>
                      <RadioGroup
                        value={String(value)}
                        onValueChange={(newValue) =>
                          handleChange(key, newValue)
                        }
                        className="flex flex-row space-x-4"
                      >
                        {seasonOptions.map((option) => (
                          <div
                            key={option}
                            className="flex items-center space-x-2"
                          >
                            <RadioGroupItem
                              value={option}
                              id={`${key}-${option}`}
                            />
                            <Label
                              htmlFor={`${key}-${option}`}
                              className="capitalize"
                            >
                              {option}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  );
                }

                // For numeric fields, use number input
                if (key === "box_number") {
                  return (
                    <div key={key} className="flex flex-col space-y-2">
                      <Label className="font-medium capitalize">
                        {key.replace("_", " ")}
                      </Label>
                      <Input
                        type="number"
                        value={String(value)}
                        onChange={(e) => handleChange(key, e.target.value)}
                      />
                    </div>
                  );
                }
                if (key === "weight") {
                  return (
                    <div key={key} className="flex flex-col space-y-2">
                      <Label className="font-medium capitalize">
                        {key.replace("_", " ")}
                      </Label>
                      <Input
                        type="number"
                        step="any"
                        value={value ?? ""}
                        onChange={(e) => handleChange(key, e.target.value)}
                        inputMode="decimal"
                        aria-invalid={!!weightError}
                      />
                      {weightError && (
                        <span className="text-red-500 text-xs mt-1">
                          {weightError}
                        </span>
                      )}
                    </div>
                  );
                }

                // Default to text input for other fields
                return (
                  <div key={key} className="flex flex-col space-y-2">
                    <Label className="font-medium capitalize">
                      {key.replace("_", " ")}
                    </Label>
                    <Input
                      value={value ?? ""}
                      onChange={(e) => handleChange(key, e.target.value)}
                    />
                  </div>
                );
              })
              .filter(Boolean)}
          </div>
          <div className="space-y-3">
            {requiredError && (
              <div className="text-red-500 text-xs">{requiredError}</div>
            )}
            <DialogFooter className="flex w-full items-center">
              {!disableDelete && (
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isSubmitting || isDeleting}
                  className="mr-auto"
                >
                  {isDeleting ? (
                    <>
                      <Spinner size="sm" /> Deleting
                    </>
                  ) : (
                    "Delete"
                  )}
                </Button>
              )}
              <div
                className={`flex space-x-2 ${disableDelete ? "ml-auto" : "ml-auto"}`}
              >
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isDeleting}
                >
                  {isSubmitting ? (
                    <>
                      <Spinner size="sm" /> Saving
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      {/* Confirmation dialog */}
      <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entry?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDelete(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmedDelete}
              disabled={isSubmitting || isDeleting}
            >
              {isDeleting ? (
                <>
                  <Spinner size="sm" /> Deleting
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

