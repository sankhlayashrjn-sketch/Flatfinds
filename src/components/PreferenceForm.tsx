"use client";

import { useMemo, useState } from "react";
import {
  FURNISHING_TYPES,
  HOUSE_TYPES,
  PROPERTY_TYPES,
  type Furnishing,
  type HouseType,
  type MustHaveFilters,
  type PropertyType,
  type SoftPreferences,
} from "@/types/flatfinds";
import { listingPool } from "@/lib/listingPool";
import { LocalityMultiSelect } from "./LocalityMultiSelect";
import { YesNoToggle } from "./YesNoToggle";

const defaultMusts: MustHaveFilters = {
  maxRentInr: 30000,
  minBathrooms: 1,
  liftRequired: false,
  parkingRequired: false,
  petFriendlyRequired: false,
  excludedLocalities: [],
};

const defaultPreferences: SoftPreferences = {
  houseType: "2BHK",
  propertyType: "Apartment",
  furnishing: "Semi Furnished",
  areasToExplore: [],
  maxCommuteMinutes: 45,
  commuteReferencePoint: "",
};

const MAX_RENT_CEILING = 500000;

function ChipSelect<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            aria-pressed={value === opt}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              value === opt
                ? "border-rose-500 bg-rose-100 text-rose-800 dark:border-rose-600 dark:bg-rose-900/40 dark:text-rose-200"
                : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function PreferenceForm({
  initialName = "",
  submitLabel = "Save my preferences",
  onSubmit,
}: {
  initialName?: string;
  submitLabel?: string;
  onSubmit: (name: string, musts: MustHaveFilters, preferences: SoftPreferences) => Promise<void>;
}) {
  const [name, setName] = useState(initialName);
  const [musts, setMusts] = useState<MustHaveFilters>(defaultMusts);
  const [preferences, setPreferences] = useState<SoftPreferences>(defaultPreferences);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localityOptions = useMemo(
    () => Array.from(new Set(listingPool.map((l) => l.locality))).sort(),
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit(name.trim(), musts, preferences);
    } catch {
      setError("Couldn't save your preferences — check your connection and try again.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      <section>
        <label className="block">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Your name
          </span>
          <input
            type="text"
            required
            placeholder="e.g. Riya"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full max-w-sm rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-800"
          />
          <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
            Shown to the group next to your answers, so everyone knows whose preferences are
            whose.
          </span>
        </label>
      </section>

      <section className="space-y-5 border-t border-slate-200 pt-8 dark:border-slate-700">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Musts — dealbreakers
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            If a listing fails any of these, it&apos;s excluded entirely — never shown to the
            group.
          </p>
        </div>

        <div>
          <label className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Max monthly rent
            </span>
            <span className="text-sm font-semibold text-rose-700 dark:text-rose-400">
              ₹{musts.maxRentInr.toLocaleString("en-IN")}
            </span>
          </label>
          <input
            type="range"
            min={0}
            max={MAX_RENT_CEILING}
            step={1000}
            value={musts.maxRentInr}
            onChange={(e) => setMusts({ ...musts, maxRentInr: Number(e.target.value) })}
            className="mt-2 w-full accent-rose-600"
          />
          <input
            type="number"
            min={0}
            max={MAX_RENT_CEILING}
            step={500}
            value={musts.maxRentInr}
            onChange={(e) => setMusts({ ...musts, maxRentInr: Number(e.target.value) })}
            className="mt-2 w-full max-w-[160px] rounded-md border border-slate-300 px-3 py-1.5 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-800"
          />
        </div>

        <label className="block max-w-[160px]">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Minimum bathrooms
          </span>
          <input
            type="number"
            min={1}
            max={5}
            required
            value={musts.minBathrooms}
            onChange={(e) => setMusts({ ...musts, minBathrooms: Number(e.target.value) })}
            className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-800"
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <YesNoToggle
            label="Lift required"
            value={musts.liftRequired}
            onChange={(liftRequired) => setMusts({ ...musts, liftRequired })}
          />
          <YesNoToggle
            label="Parking required"
            value={musts.parkingRequired}
            onChange={(parkingRequired) => setMusts({ ...musts, parkingRequired })}
          />
          <YesNoToggle
            label="Pet-friendly required"
            value={musts.petFriendlyRequired}
            onChange={(petFriendlyRequired) => setMusts({ ...musts, petFriendlyRequired })}
          />
        </div>
        <p className="-mt-2 text-xs text-slate-500 dark:text-slate-400">
          Lift only matters for listings above the ground floor.
        </p>

        <LocalityMultiSelect
          label="Areas I won't consider"
          options={localityOptions}
          selected={musts.excludedLocalities}
          onChange={(excludedLocalities) => setMusts({ ...musts, excludedLocalities })}
          variant="exclude"
          summaryPrefix="Won't consider"
        />
      </section>

      <section className="space-y-5 border-t border-slate-200 pt-8 dark:border-slate-700">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Preferences — scored, not dealbreakers
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            A listing won&apos;t get ruled out over these, but the group will see how many of
            your five preferences it clears.
          </p>
        </div>

        <ChipSelect<HouseType>
          label="House type"
          options={HOUSE_TYPES}
          value={preferences.houseType}
          onChange={(houseType) => setPreferences({ ...preferences, houseType })}
        />

        <ChipSelect<PropertyType>
          label="Property type"
          options={PROPERTY_TYPES}
          value={preferences.propertyType}
          onChange={(propertyType) => setPreferences({ ...preferences, propertyType })}
        />

        <ChipSelect<Furnishing>
          label="Furnishing"
          options={FURNISHING_TYPES}
          value={preferences.furnishing}
          onChange={(furnishing) => setPreferences({ ...preferences, furnishing })}
        />

        <LocalityMultiSelect
          label="Areas I'd like to explore"
          options={localityOptions}
          selected={preferences.areasToExplore}
          onChange={(areasToExplore) => setPreferences({ ...preferences, areasToExplore })}
          variant="explore"
          summaryPrefix="Would like"
        />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Max commute time (minutes)
            </span>
            <input
              type="number"
              min={0}
              step={5}
              required
              value={preferences.maxCommuteMinutes}
              onChange={(e) =>
                setPreferences({ ...preferences, maxCommuteMinutes: Number(e.target.value) })
              }
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-800"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Commute reference point
            </span>
            <input
              type="text"
              required
              placeholder="e.g. my office in Hinjewadi Phase 1"
              value={preferences.commuteReferencePoint}
              onChange={(e) =>
                setPreferences({ ...preferences, commuteReferencePoint: e.target.value })
              }
              className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 dark:border-slate-600 dark:bg-slate-800"
            />
          </label>
        </div>
      </section>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-6 dark:border-slate-700">
        <button
          type="submit"
          disabled={submitting}
          className="brand-bg rounded-md px-5 py-2.5 text-sm font-semibold text-white shadow-sm disabled:opacity-60"
        >
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
