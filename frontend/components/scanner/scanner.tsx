"use client";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Add: fetch allowed hosts from environment variable
const ALLOWED_HOSTS = process.env.NEXT_PUBLIC_ALLOWED_HOSTS
  ? process.env.NEXT_PUBLIC_ALLOWED_HOSTS.split(",")
  : [];

const isLocalLink = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return (
      ALLOWED_HOSTS.includes(urlObj.hostname) ||
      urlObj.protocol === "file:" ||
      urlObj.hostname === window.location.hostname
    );
  } catch {
    // If it's not a valid URL, check if it's a relative path
    return url.startsWith("/") || !url.includes("://");
  }
};
export function QRScanner() {
  const router = useRouter();

  const handleScan = (result: any) => {
    console.log(result);

    if (result && result[0]?.rawValue) {
      const scannedValue = result[0].rawValue;

      if (isLocalLink(scannedValue)) {
        // If it's a local link, navigate to it
        let targetUrl = scannedValue;

        // If it's a full URL with localhost/127.0.0.1, extract the path
        if (scannedValue.includes("://")) {
          try {
            const urlObj = new URL(scannedValue);
            targetUrl = urlObj.pathname + urlObj.search + urlObj.hash;
          } catch {
            // Fallback to original value
          }
        }

        router.push(targetUrl);
        toast.success(`Navigating to: ${targetUrl}`);
      } else {
        // Show error toast for non-local links
        toast.error("Only local links are allowed");
      }
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <Scanner
        onScan={handleScan}
        constraints={{
          width: { ideal: 320 },
          height: { ideal: 240 },
        }}
        styles={{
          container: {
            width: "100%",
            maxWidth: "320px",
            height: "auto",
          },
          video: {
            width: "100%",
            height: "auto",
          },
        }}
      />
    </div>
  );
}
