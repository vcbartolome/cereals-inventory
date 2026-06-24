"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScanLine, RotateCcw } from "lucide-react";
import { QRScanner } from "@/components/scanner/scanner";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/backend/firebase";
import { DataTable } from "@/components/data-table/index";
import { columns } from "@/backend/schemas/columns";
import { DashboardAnalytics } from "@/components/dashboard";
import type { InventoryFormValues } from "@/backend/schemas/inventory";
import type { ColumnDef } from "@tanstack/react-table";
import { useUser } from "@/context/UserContext";
import { InventoryForm } from "@/components/inventory/inventory-form";


export default function Home() {
  const { profile } = useUser();
  const [data, setData] = useState<InventoryFormValues[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChart, setSelectedChart] = useState<string>("type");
  const [chartWeightMode, setChartWeightMode] = useState<boolean>(false);
  const [showScanner, setShowScanner] = useState(false);
  const tableColumns = columns as ColumnDef<InventoryFormValues, unknown>[];

  // Helper to fetch and cache data
  const fetchAndCacheData = async () => {
    setLoading(true);
    const snapshot = await getDocs(collection(db, "inventory"));
    const rows = snapshot.docs.map((doc) => {
      return {
        ...(doc.data() as InventoryFormValues),
        id: doc.id,
      };
    });
    const sortedRows = rows.sort((a, b) => {
      return Number(a.box_number ?? 0) - Number(b.box_number ?? 0);
    });
    setData(sortedRows);
    localStorage.setItem("inventoryData", JSON.stringify(sortedRows));
    localStorage.setItem("inventoryDataUpdatedAt", new Date().toISOString());
    setLastUpdated(new Date());
    setLoading(false);
  };

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  useEffect(() => {
    const cached = localStorage.getItem("inventoryData");
    const cachedAt = localStorage.getItem("inventoryDataUpdatedAt");
    if (cached) {
      setData(JSON.parse(cached));
      if (cachedAt) setLastUpdated(new Date(cachedAt));
      setLoading(false);
    } else {
      fetchAndCacheData();
    }
  }, []);

  // Advanced search function with support for operators
  const filterData = (
    items: InventoryFormValues[],
    query: string,
  ): InventoryFormValues[] => {
    if (!query.trim()) return items;

    // Pre-process the query to handle multi-word patterns like "box 1" or "box 1-20"
    let processedQuery = query.toLowerCase().trim();

    // Replace "box " patterns with "box=" to normalize them
    processedQuery = processedQuery.replace(
      /\bbox\s+(\d+(?:-\d+)?)/g,
      "box=$1",
    );

    const searchTerms = processedQuery.split(/\s+/);

    return items.filter((item) => {
      return searchTerms.every((term) => {
        // Handle year comparisons (year<20, year>=2020, etc.)
        if (term.match(/^year\s*([<>=!]+)\s*(\d+)$/)) {
          const match = term.match(/^year\s*([<>=!]+)\s*(\d+)$/);
          if (match) {
            const operator = match[1];
            const value = parseInt(match[2]);
            const itemYear = item.year ? parseInt(item.year) : NaN;

            switch (operator) {
              case "<":
                return itemYear < value;
              case "<=":
                return itemYear <= value;
              case ">":
                return itemYear > value;
              case ">=":
                return itemYear >= value;
              case "=":
              case "==":
                return itemYear === value;
              case "!=":
                return itemYear !== value;
              default:
                return false;
            }
          }
        }

        // Handle weight comparisons (weight<1, weight>=0.5, etc.)
        if (term.match(/^weight\s*([<>=!]+)\s*(\d*\.?\d+)$/)) {
          const match = term.match(/^weight\s*([<>=!]+)\s*(\d*\.?\d+)$/);
          if (match) {
            const operator = match[1];
            const value = parseFloat(match[2]);
            const itemWeight = item.weight ?? NaN;

            switch (operator) {
              case "<":
                return itemWeight < value;
              case "<=":
                return itemWeight <= value;
              case ">":
                return itemWeight > value;
              case ">=":
                return itemWeight >= value;
              case "=":
              case "==":
                return itemWeight === value;
              case "!=":
                return itemWeight !== value;
              default:
                return false;
            }
          }
        }

        // Handle box searches (box=1, box=10-20)
        if (term.match(/^box=(\d+)-(\d+)$/)) {
          const match = term.match(/^box=(\d+)-(\d+)$/);
          if (match) {
            const start = parseInt(match[1]);
            const end = parseInt(match[2]);
            const itemBox = item.box_number;
            return itemBox >= start && itemBox <= end;
          }
        }
        if (term.match(/^box=(\d+)$/)) {
          const match = term.match(/^box=(\d+)$/);
          if (match) {
            const boxNum = parseInt(match[1]);
            return item.box_number === boxNum;
          }
        }

        // Regular text search across all fields
        const searchableFields = [
          item.type,
          item.area_planted,
          item.year,
          item.season,
          item.location,
          item.shelf_code,
          item.description,
          item.pedigree,
          item.box_number?.toString(),
          item.weight?.toString(),
          item.remarks || "",
        ];

        return searchableFields.some((field) =>
          field?.toLowerCase().includes(term),
        );
      });
    });
  };

  // Apply search filter to data
  const filteredData = filterData(data, searchQuery);

  return (
    <div className="p-6">
      {/* Toggleable Scanner for small screens */}
      <div className="mb-4 block md:hidden">
        <Button
          variant={showScanner ? "secondary" : "outline"}
          className="w-full flex items-center justify-center gap-2 mb-2 h-30 text-base"
          onClick={() => setShowScanner((prev) => !prev)}
        >
          <ScanLine className="h-5 w-5" />
          {showScanner ? "Hide QR Scanner" : "Scan QR"}
        </Button>
        {showScanner && (
          <>
            <div className="mb-2 text-center text-sm text-gray-700 font-medium">
              Scan QR Code
            </div>
            <QRScanner />
          </>
        )}
      </div>

      <div className="mb-6 flex flex-row items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <span className="text-xs text-gray-500 mt-1">
            {lastUpdated
              ? `Data last updated at: ${lastUpdated.toLocaleString()}`
              : ""}
          </span>
        </div>
        <Button
          variant="outline"
          className="flex items-center justify-center gap-2"
          onClick={() => {
            localStorage.removeItem("inventoryData");
            localStorage.removeItem("inventoryDataUpdatedAt");
            fetchAndCacheData();
          }}
          disabled={loading}
        >
          <RotateCcw className="h-4 w-4" />
          <span className="hidden md:inline">Refresh</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Input
            placeholder="box 1 white year=2020 weight<1"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setSearchQuery("")}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="mb-8">
        {searchQuery && (
          <div className="mb-4 text-sm text-gray-600">
            Found {filteredData.length} of {data.length} items
          </div>
        )}
        <DataTable<InventoryFormValues>
          data={filteredData}
          columns={tableColumns}
          loading={loading}
          filterableFields={[
            { label: "Type", fieldName: "type" },
            { label: "Area Planted", fieldName: "area_planted" },
            { label: "Year", fieldName: "year" },
            { label: "Season", fieldName: "season" },
            { label: "Location", fieldName: "location" },
            { label: "Shelf Code", fieldName: "shelf_code" },
            { label: "Description", fieldName: "description" },
            { label: "Pedigree", fieldName: "pedigree" },
            { label: "Weight", fieldName: "weight" },
          ]}
          onRowUpdate={async (updated: InventoryFormValues) => {
            if (!updated) return;
            if ((updated as any).deleted) {
              setData((prev) => {
                const newData = prev.filter((item) => item.id !== updated.id);
                localStorage.setItem("inventoryData", JSON.stringify(newData));
                return newData;
              });
            } else {
              setData((prev) => {
                const newData = prev.map((item) =>
                  item.id === updated.id ? updated : item,
                );
                localStorage.setItem("inventoryData", JSON.stringify(newData));
                return newData;
              });
              try {
                const { id, ...fields } = updated;
                const docRef = doc(db, "inventory", id!);
                const prev = data.find((item) => item.id === id);
                await updateDoc(docRef, fields as any);
                let changes: Record<string, { from: any; to: any }> = {};
                if (prev) {
                  Object.keys(fields).forEach((key) => {
                    if ((prev as any)[key] !== (fields as any)[key]) {
                      changes[key] = {
                        from: (prev as any)[key],
                        to: (fields as any)[key],
                      };
                    }
                  });
                }
                const histCol = collection(db, "inventory", id!, "history");
                await addDoc(histCol, {
                  editedBy: profile?.displayName || profile?.email || "Unknown",
                  editedAt: serverTimestamp(),
                  creatorId: profile?.uid,
                  changes,
                });
              } catch (error) {
                console.error(
                  "Error updating document or writing history:",
                  error,
                );
              }
            }
          }}
        />
      </div>

      {/* Add Inventory Form */}
      {/* Accessible only to admin or agtech role */}
      {profile?.role === "admin" && (
      <div className="mb-8 rounded-lg border-2 border-gray-300 overflow-hidden">
        <div className="m-4">
          <h2 className="text-xl font-semibold">Add Inventory</h2>
          <p className="text-gray-600"> 
            Use this form to add a new inventory item.
          </p>
        </div>
        <InventoryForm
          onAdd={(newItem) => {
            setData((prev) => {
              const newData = [newItem, ...prev];
              localStorage.setItem("inventoryData", JSON.stringify(newData));
              localStorage.setItem(
                "inventoryDataUpdatedAt",
                new Date().toISOString(),
              );
              return newData;
            });
            setLastUpdated(new Date());
          }}
        />
      </div>
      )}
      {profile?.role === "agtech" && (
      <div className="mb-8 rounded-lg border-2 border-gray-300 overflow-hidden">
        <div className="m-4">
          <h2 className="text-xl font-semibold">Add Inventory</h2>
          <p className="text-gray-600"> 
            Use this form to add a new inventory item.
          </p>
        </div>
        <InventoryForm
          onAdd={(newItem) => {
            setData((prev) => {
              const newData = [newItem, ...prev];
              localStorage.setItem("inventoryData", JSON.stringify(newData));
              localStorage.setItem(
                "inventoryDataUpdatedAt",
                new Date().toISOString(),
              );
              return newData;
            });
            setLastUpdated(new Date());
          }}
        />
      </div>
      )}


      {/* Analytics */}
      <div className="hidden md:block">
        <DashboardAnalytics
          data={searchQuery ? filteredData : data}
          selectedChart={selectedChart}
          onChartChange={setSelectedChart}
          chartWeightMode={chartWeightMode}
          onWeightModeChange={setChartWeightMode}
        />
      </div>
    </div>
  );
}

