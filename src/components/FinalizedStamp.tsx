/** A "SOLD"-style diagonal stamp over the photo of the listing the group finalized. */
export function FinalizedStamp() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="w-[150%] -rotate-12 border-y-2 border-white bg-red-600 py-1.5 text-center text-sm font-extrabold uppercase tracking-widest text-white shadow-lg">
        Our Choice
      </div>
    </div>
  );
}
