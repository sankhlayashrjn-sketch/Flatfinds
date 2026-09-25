"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

export function QrShare({ url }: { url: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, { width: 220, margin: 1 })
      .then(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.toBlob((blob) => {
          if (!blob) return;
          const file = new File([blob], "flatfinds-invite.png", { type: "image/png" });
          const supportsFileShare =
            typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [file] });
          setCanShareFiles(supportsFileShare);
        }, "image/png");
      })
      .catch((err) => {
        console.error("[FlatFinds] failed to render QR code", err);
      });
  }, [url]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareError("Couldn't copy — select and copy the link manually.");
    }
  };

  const shareQr = async () => {
    setShareError(null);
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("no image");
      const file = new File([blob], "flatfinds-invite.png", { type: "image/png" });
      await navigator.share({
        files: [file],
        title: "Join our FlatFinds group",
        text: `Fill in your flat preferences: ${url}`,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return; // user cancelled the share sheet
      setShareError("Sharing didn't work — try downloading or copying the link instead.");
    }
  };

  const downloadQr = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "flatfinds-invite.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 text-center dark:border-slate-700 dark:bg-slate-900">
      <canvas ref={canvasRef} className="rounded-lg" />
      <p className="max-w-xs text-xs text-slate-500 dark:text-slate-400">
        Scan this with your phone camera, or use the link below if scanning doesn&apos;t work.
      </p>

      <div className="flex w-full max-w-sm items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
        <span className="flex-1 truncate text-xs text-slate-600 dark:text-slate-300">{url}</span>
        <button
          type="button"
          onClick={copyLink}
          className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-medium text-rose-700 shadow-sm hover:bg-rose-50 dark:bg-slate-700 dark:text-rose-300 dark:hover:bg-slate-600"
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
      </div>

      {canShareFiles ? (
        <button
          type="button"
          onClick={shareQr}
          className="brand-bg w-full max-w-sm rounded-md px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
        >
          Share to a messaging app
        </button>
      ) : (
        <button
          type="button"
          onClick={downloadQr}
          className="w-full max-w-sm rounded-md border border-rose-300 bg-white px-5 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:bg-slate-800 dark:text-rose-300 dark:hover:bg-slate-700"
        >
          Download QR image
        </button>
      )}
      {shareError && <p className="text-xs text-red-600 dark:text-red-400">{shareError}</p>}
    </div>
  );
}
