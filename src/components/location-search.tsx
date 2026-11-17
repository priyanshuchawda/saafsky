"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { City } from "@/types/air";
import { locationSchema } from "@/lib/schemas";
import { RateLimitError, throwIfHttpError } from "@/lib/api-errors";

export function LocationSearch({
  onSelect,
}: {
  onSelect: (city: City) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [status, setStatus] = useState("");
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim().length < 2) return;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setResults([]);
    setStatus("Searching for cities…");
    try {
      const response = await fetch(
        `/api/locations?q=${encodeURIComponent(query)}`,
        { signal: controller.signal },
      );
      throwIfHttpError(response);
      const data = locationSchema.parse(await response.json());
      if (controller.signal.aborted) return;
      setResults(data.results ?? []);
      setStatus(
        data.results?.length ? "" : "No cities found. Try another search.",
      );
    } catch (error) {
      if (!controller.signal.aborted)
        setStatus(
          error instanceof RateLimitError
            ? error.message
            : "City search is unavailable. Please try again.",
        );
    }
  }
  return (
    <form onSubmit={search} aria-label="Search for a city">
      <label htmlFor="city">YOUR LOCATION</label>
      <div className="search">
        <input
          id="city"
          value={query}
          onChange={(event) => {
            request.current?.abort();
            setResults([]);
            setStatus("");
            setQuery(event.target.value);
          }}
          placeholder="Search for a city"
          minLength={2}
          maxLength={80}
        />
        <button type="submit">Search</button>
      </div>
      {status && <p role="status">{status}</p>}
      {results.length > 0 && (
        <ul className="results">
          {results.map((city, index) => (
            <li key={`${city.latitude}-${city.longitude}-${index}`}>
              <button
                type="button"
                onClick={() => {
                  onSelect(city);
                  setResults([]);
                  setStatus("");
                  setQuery("");
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
