"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/backend/firebase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Eye, Calendar, User } from "lucide-react";
import { InventoryFormValues } from "@/backend/schemas/inventory";

interface HistoryEntry {
  id: string;
  editedBy: string;
  editedAt: {
    seconds: number;
    nanoseconds: number;
  };
  changes?: Record<string, { from: any; to: any }>;
}

interface InventoryViewDialogProps<TData = any> {
  entry: TData;
  trigger?: React.ReactNode;
}

export function InventoryViewDialog<TData = any>({
  entry,
  trigger,
}: InventoryViewDialogProps<TData>) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchHistory = async () => {
    if (!(entry as any).id) return;

    setLoadingHistory(true);
    try {
      const historyRef = collection(
        db,
        "inventory",
        (entry as any).id,
        "history",
      );
      const q = query(historyRef, orderBy("editedAt", "desc"));
      const snapshot = await getDocs(q);
      const historyData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as HistoryEntry[];
      setHistory(historyData);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchHistory();
    }
  }, [open, (entry as any).id]);

  const formatDate = (
    timestamp: { seconds: number; nanoseconds: number } | undefined,
  ) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp.seconds * 1000);
    return date.toLocaleString();
  };

  const formatFieldName = (fieldName: string) => {
    return fieldName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">View</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inventory Entry Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Entry Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Entry Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Box Number
                  </label>
                  <p className="text-sm">{(entry as any).box_number}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Shelf Code
                  </label>
                  <p className="text-sm">{(entry as any).shelf_code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Type
                  </label>
                  <p className="text-sm">
                    <Badge variant="secondary">{(entry as any).type}</Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Area Planted
                  </label>
                  <p className="text-sm">
                    <Badge variant="outline">
                      {(entry as any).area_planted}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Year
                  </label>
                  <p className="text-sm">{(entry as any).year}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Season
                  </label>
                  <p className="text-sm">
                    <Badge variant="outline">{(entry as any).season}</Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Weight (kg)
                  </label>
                  <p className="text-sm font-semibold">
                    {(entry as any).weight}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Location
                  </label>
                  <p className="text-sm">{(entry as any).location}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Description
                  </label>
                  <p className="text-sm">{(entry as any).description}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Pedigree
                  </label>
                  <p className="text-sm">{(entry as any).pedigree}</p>
                </div>
                {(entry as any).remarks && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Remarks
                    </label>
                    <p className="text-sm">{(entry as any).remarks}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                {(entry as any).addedBy && (
                  <div>
                    <label className="font-medium">Added By</label>
                    <p>{(entry as any).addedBy}</p>
                  </div>
                )}
                {(entry as any).addedAt && (
                  <div>
                    <label className="font-medium">Added At</label>
                    <p>{formatDate((entry as any).addedAt)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Edit History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <p className="text-sm text-muted-foreground">
                  Loading history...
                </p>
              ) : history.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No edit history found.
                </p>
              ) : (
                <div className="space-y-3">
                  {history.map((historyItem) => (
                    <div
                      key={historyItem.id}
                      className="flex flex-col gap-2 p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {historyItem.editedBy}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(historyItem.editedAt)}
                          </p>
                        </div>
                      </div>
                      {historyItem.changes &&
                        Object.keys(historyItem.changes).length > 0 && (
                          <div className="mt-2 ml-7">
                            <div className="text-xs font-semibold text-muted-foreground mb-1">
                              Edited Fields:
                            </div>
                            <ul className="list-disc ml-4">
                              {Object.entries(historyItem.changes).map(
                                ([field, change]) => (
                                  <li key={field} className="text-xs">
                                    <span className="font-medium">
                                      {formatFieldName(field)}:
                                    </span>
                                    &nbsp;
                                    <span className="text-red-700">
                                      {String((change as any).from)}
                                    </span>
                                    &nbsp;
                                    <span className="text-muted-foreground">
                                      →
                                    </span>
                                    &nbsp;
                                    <span className="text-green-700">
                                      {String((change as any).to)}
                                    </span>
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

