"use client";
import { useState } from "react";
import { QRScanner } from "@/components/scanner/scanner";
import { Button } from "@/components/ui/button";
import { Camera, Printer } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner"; // Assuming a Spinner component exists
import QRCode from "react-qr-code";
import QRCodeLib from "qrcode";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
import { v4 as uuidv4 } from "uuid";
import { db } from "@/backend/firebase"; // Assuming firebase config is exported as db
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

export default function Update() {
  const [showScanner, setShowScanner] = useState(false);
  const [showGenerateQrDialog, setShowGenerateQrDialog] = useState(false);
  const [boxNumberInput, setBoxNumberInput] = useState("");
  const [generatedUuid, setGeneratedUuid] = useState("");
  const [lastGeneratedBoxNumber, setLastGeneratedBoxNumber] = useState("");
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [isLoadingPrintAll, setIsLoadingPrintAll] = useState(false);
  const [error, setError] = useState("");

  const handleGenerateQr = async () => {
    setError("");
    setGeneratedUuid("");
    setIsLoadingQr(true);

    const boxNumber = parseInt(boxNumberInput, 10);

    if (isNaN(boxNumber) || boxNumber <= 0) {
      setError("Please enter a valid   box number.");
      setIsLoadingQr(false);
      return;
    }

    try {
      const qrcodesRef = collection(db, "qrcodes");
      const q = query(qrcodesRef, where("box_number", "==", boxNumber));
      const querySnapshot = await getDocs(q);

      let uuid;
      if (!querySnapshot.empty) {
        // Box number exists, retrieve UUID
        uuid = querySnapshot.docs[0].data().uuid;
      } else {
        // Box number does not exist, generate new UUID and add to collection
        uuid = uuidv4();
        await addDoc(qrcodesRef, {
          box_number: boxNumber,
          uuid: uuid,
        });
      }
      setGeneratedUuid(uuid);
      setLastGeneratedBoxNumber(boxNumberInput);
    } catch (e) {
      console.error("Error generating QR code:", e);
      setError("An error occurred while generating the QR code.");
    } finally {
      setIsLoadingQr(false);
    }
  };

  const handlePrint = () => {
    // Add print styles to hide everything except QR code
    const printStyles = `
      <style id="print-styles">
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
          }
          .print-box-number {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .print-area svg {
            width: 80px !important;
            height: 80px !important;
          }
        }
      </style>
    `;

    // Add styles to head
    document.head.insertAdjacentHTML("beforeend", printStyles);

    // Add print-area class to the QR code container
    const qrContainer = document.querySelector(".qr-code-container");
    if (qrContainer) {
      qrContainer.classList.add("print-area");
    }

    // Print
    window.print();

    // Clean up
    const printStylesElement = document.getElementById("print-styles");
    if (printStylesElement) {
      printStylesElement.remove();
    }
    if (qrContainer) {
      qrContainer.classList.remove("print-area");
    }
  };

  // Add handler for printing all QR codes
  const handlePrintAll = async () => {
    setError("");
    setIsLoadingPrintAll(true);
    try {
      // 1. fetch all unique box numbers from inventory
      const invSnap = await getDocs(collection(db, "inventory"));
      const boxNumbers = Array.from(
        new Set(invSnap.docs.map((d) => d.data().box_number)),
      );

      // 2. fetch all existing QR code entries
      const qrCodesRef = collection(db, "qrcodes");
      const qrSnap = await getDocs(qrCodesRef);
      const existingMap = new Map(); // box_number -> uuid
      const toDeleteIds: string[] = [];
      qrSnap.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const bn = data.box_number;
        if (boxNumbers.includes(bn)) {
          existingMap.set(bn, data.uuid);
        } else {
          toDeleteIds.push(docSnap.id);
        }
      });

      // 3. add missing QR codes
      for (const bn of boxNumbers) {
        if (!existingMap.has(bn)) {
          const newUuid = uuidv4();
          await addDoc(qrCodesRef, { box_number: bn, uuid: newUuid });
          existingMap.set(bn, newUuid);
        }
      }

      // 4. remove orphaned QR codes
      for (const id of toDeleteIds) {
        await deleteDoc(doc(db, "qrcodes", id));
      }

      // prepare print window with client-generated QR codes
      const entries = Array.from(existingMap.entries()).sort(
        (a, b) => a[0] - b[0],
      );
      // generate data-URIs for each QR code on the client
      const entriesData = await Promise.all(
        entries.map(async ([bn, uuid]) => ({
          bn,
          dataUrl: await QRCodeLib.toDataURL(`${SITE_URL}/box/${uuid}`, {
            width: 80,
            margin: 0,
          }),
        })),
      );
      const html = `
        <html><head><title>Print All QR Codes</title>
        <style>
          body { margin: 20px; }
          .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 16px; }
          .item { text-align: center; padding: 8px; margin: 4px; }
          .item img { width: 80px; height: 80px; }
          .caption { margin-top: 4px; font-size: 18px; font-weight: bold; }
        </style>
        </head><body>
        <div class="grid">
          ${entriesData
            .map(
              ({ bn, dataUrl }) => `
            <div class="item">
              <img src="${dataUrl}" alt="QR code for box ${bn}" />
              <div class="caption">Box #${bn}</div>
            </div>
          `,
            )
            .join("")}
        </div>
        <script>
          window.onload = () => { window.print(); };
          window.onafterprint = () => { window.close(); };
        </script>
        </body></html>
      `;
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
      }
    } catch (e) {
      console.error("Error printing all QR codes:", e);
      setError("An error occurred while printing all QR codes.");
    } finally {
      setIsLoadingPrintAll(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      {!showScanner ? (
        <>
          <Button
            variant="default"
            onClick={() => setShowScanner(true)}
            className="mr-2"
          >
            <Camera className="mr-2 h-4 w-4" />
            Scan QR
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowGenerateQrDialog(true)}
          >
            Generate QR
          </Button>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center w-full">
          <div className="w-full flex justify-center mb-4">
            <Button
              variant="default"
              onClick={() => setShowScanner(false)}
              className="mx-auto"
            >
              ← Back
            </Button>
          </div>
          <QRScanner />
        </div>
      )}

      <Dialog
        open={showGenerateQrDialog}
        onOpenChange={setShowGenerateQrDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate QR Code</DialogTitle>
            <DialogDescription>
              Enter the box number to generate a QR code.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="boxNumber" className="text-right">
                <span className="sm:hidden">Box #</span>
                <span className="hidden sm:inline">Box Number</span>
              </Label>
              <Input
                id="boxNumber"
                type="number"
                value={boxNumberInput}
                onChange={(e) => setBoxNumberInput(e.target.value)}
                className="col-span-2"
              />
              <Button
                onClick={handleGenerateQr}
                disabled={isLoadingQr}
                className="col-span-1"
              >
                Generate
              </Button>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {generatedUuid && (
              <div className="qr-code-container flex flex-col items-center justify-center">
                <QRCode
                  value={`${SITE_URL}/box/${generatedUuid}`}
                  size={256}
                  level="H"
                />
                <div className="mt-1 text-xl font-bold">
                  Box #{lastGeneratedBoxNumber}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            {/* Button to print all QR codes */}
            <Button
              onClick={handlePrintAll}
              variant="outline"
              className="mr-2"
              disabled={isLoadingPrintAll}
            >
              {isLoadingPrintAll ? <Spinner size="sm" /> : null}
              Print All QR
            </Button>
            {generatedUuid && (
              <Button onClick={handlePrint} variant="outline">
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

