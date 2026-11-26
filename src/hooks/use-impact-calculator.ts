"use client";

import { useState } from "react";
import {
  monthlyImpact,
  petrolCarPassengerFactor,
  type Mode,
} from "@/features/sustainability/calculate";

export function useImpactCalculator() {
  const [distance, setDistance] = useState("10");
  const [days, setDays] = useState("20");
  const [baseline, setBaseline] = useState("");
  const [baselineMode, setBaselineMode] = useState<"car" | "custom">("car");
  const [occupants, setOccupants] = useState("1");
  const [custom, setCustom] = useState("");
  const [mode, setMode] = useState<Mode>("bus");
  const baselineFactor =
    baselineMode === "car"
      ? occupants.trim()
        ? petrolCarPassengerFactor(Number(occupants))
        : null
      : baseline.trim()
        ? Number(baseline)
        : null;
  const complete =
    distance.trim() !== "" &&
    days.trim() !== "" &&
    baselineFactor !== null &&
    (mode !== "custom" || custom.trim() !== "");
  const result =
    complete && baselineFactor !== null
      ? monthlyImpact({
          distanceKm: Number(distance),
          days: Number(days),
          baselineFactor,
          mode,
          customFactor: mode === "custom" ? Number(custom) : 0,
        })
      : null;
  return {
    distance,
    setDistance,
    days,
    setDays,
    baseline,
    setBaseline,
    baselineMode,
    setBaselineMode,
    occupants,
    setOccupants,
    custom,
    setCustom,
    mode,
    setMode,
    result,
  };
}
