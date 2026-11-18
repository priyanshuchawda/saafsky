"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { City } from "@/types/air";
import { locationSchema } from "@/lib/schemas";
import { RateLimitError, throwIfHttpError } from "@/lib/api-errors";
import { translate, translateText } from "@/features/i18n/messages";
import { useLanguage } from "@/hooks/use-preferences";

export function LocationSearch({
  onSelect,
}: {
  onSelect: (city: City) => void;
}) {
  const [language] = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<City[]>([]);
  const [status, setStatus] = useState("");
  const request = useRef<AbortController | null>(null);
  const input = useRef<HTMLInputElement | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim().length < 2) {
      setStatus(translate(language, "enterTwoCharacters"));
      return;
    }
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setResults([]);
    setStatus(translate(language, "searchingCities"));
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
      setStatus(
        count
          ? `${count} ${translate(language, count === 1 ? "cityFound" : "citiesFound")} ${translate(language, "chooseResult")}`
          : translate(language, "noCities"),
      );
    } catch (error) {
      if (!controller.signal.aborted)
        setStatus(
          error instanceof RateLimitError
            ? translateText(language, error.message)
            : translate(language, "citySearchUnavailable"),
        );
    }
  }
  return (
    <form onSubmit={search} aria-label={translate(language, "citySearchLabel")}>
      <label htmlFor="city">{translate(language, "location")}</label>
      <div className="search">
        <input
          id="city"
          ref={input}
          value={query}
          onChange={(event) => {
            request.current?.abort();
            setResults([]);
            setStatus("");
            setQuery(event.target.value);
          }}
          placeholder={translate(language, "searchCity")}
          minLength={2}
          maxLength={80}
        />
        <button type="submit">{translate(language, "search")}</button>
      </div>
      <p role="status">{status}</p>
      {results.length > 0 && (
        <ul className="results">
          {results.map((city, index) => (
            <li key={`${city.latitude}-${city.longitude}-${index}`}>
              <button
                type="button"
                onClick={() => {
                  onSelect(city);
                  setResults([]);
                  setStatus(`${city.name} ${translate(language, "citySelected")}`);
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
