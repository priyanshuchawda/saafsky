"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { City } from "@/types/air";
import { locationSchema } from "@/lib/schemas";
import { RateLimitError, throwIfHttpError } from "@/lib/api-errors";
import { translate } from "@/features/i18n/messages";
import { localizeRateLimit } from "@/features/i18n/errors";
import { useLanguage } from "@/hooks/use-preferences";

type SearchStatus =
  | { kind: "idle" | "short-query" | "searching" | "empty" | "unavailable" }
  | { kind: "results"; count: number }
  | { kind: "selected"; name: string }
  | { kind: "limited"; error: RateLimitError };

export function LocationSearch({
  onSelect,
}: {
  onSelect: (city: City) => void;
}) {
  const [language] = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [status, setStatus] = useState<SearchStatus>({ kind: "idle" });
  const request = useRef<AbortController | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim().length < 2) {
      setStatus({ kind: "short-query" });
      return;
    }
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setResults([]);
    setStatus({ kind: "searching" });
    try {
      const response = await fetch(
        `/api/locations?q=${encodeURIComponent(query)}`,
        { signal: controller.signal },
      );
      throwIfHttpError(response);
      const data = locationSchema.parse(await response.json());
      if (controller.signal.aborted) return;
      setResults(data.results ?? []);
      const count = data.results?.length ?? 0;
      setStatus(count ? { kind: "results", count } : { kind: "empty" });
    } catch (error) {
      if (!controller.signal.aborted)
        setStatus(
          error instanceof RateLimitError
            ? { kind: "limited", error }
            : { kind: "unavailable" },
        );
    }
  }
  let statusText = "";
  switch (status.kind) {
    case "short-query":
      statusText = translate(language, "enterTwoCharacters");
      break;
    case "searching":
      statusText = translate(language, "searchingCities");
      break;
    case "empty":
      statusText = translate(language, "noCities");
      break;
    case "unavailable":
      statusText = translate(language, "citySearchUnavailable");
      break;
    case "limited":
      statusText = localizeRateLimit(language, status.error);
      break;
    case "results":
      statusText = `${status.count} ${translate(language, status.count === 1 ? "cityFound" : "citiesFound")} ${translate(language, "chooseResult")}`;
      break;
    case "selected":
      statusText = `${status.name} ${translate(language, "citySelected")}`;
      break;
  }
  return (
    <form
      onSubmit={(event) => {
        void search(event);
      }}
      aria-label={translate(language, "citySearchLabel")}
    >
      <label htmlFor="city">{translate(language, "location")}</label>
      <div className="search">
        <input
          id="city"
          ref={input}
          value={query}
          onChange={(event) => {
            request.current?.abort();
            setResults([]);
            setStatus({ kind: "idle" });
            setQuery(event.target.value);
          }}
          placeholder={translate(language, "searchCity")}
          minLength={2}
          maxLength={80}
        />
        <button type="submit">{translate(language, "search")}</button>
      </div>
      <p role="status" lang={language}>
        {statusText}
      </p>
      {results.length > 0 && (
        <ul className="results">
          {results.map((city, index) => (
            <li key={`${city.latitude}-${city.longitude}-${index}`}>
              <button
                type="button"
                onClick={() => {
                  onSelect(city);
                  setResults([]);
                  setStatus({ kind: "selected", name: city.name });
                  setQuery("");
                  input.current?.focus();
                }}
              >
                {city.name}
                {city.admin1 ? `, ${city.admin1}` : ""}
                {city.country ? `, ${city.country}` : ""}
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
