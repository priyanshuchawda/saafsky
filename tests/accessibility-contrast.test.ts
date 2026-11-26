import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const stylesheet = readFileSync(
  new URL("../src/app/globals.css", import.meta.url),
  "utf8",
);

function colorFrom(pattern: RegExp, name: string): string {
  const color = stylesheet.match(pattern)?.[1];
  assert.ok(color, `Expected ${name} color to remain defined in globals.css`);
  return color;
}

function luminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    ?.map((part) => Number.parseInt(part, 16) / 255);
  assert.equal(channels?.length, 3);
  const linear = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * linear[0]! + 0.7152 * linear[1]! + 0.0722 * linear[2]!;
}

function contrastRatio(foreground: string, background: string): number {
  const values = [luminance(foreground), luminance(background)].sort(
    (left, right) => right - left,
  );
  return (values[0]! + 0.05) / (values[1]! + 0.05);
}

test("core text and control color pairs meet WCAG AA contrast thresholds", () => {
  const ink = colorFrom(/--ink:\s*(#[\da-f]{6})/i, "primary text");
  const muted = colorFrom(/--muted:\s*(#[\da-f]{6})/i, "supporting text");
  const page = colorFrom(/body\s*\{[^}]*background:\s*(#[\da-f]{6})/i, "page");
  const button = colorFrom(
    /\.action-button\s*\{[^}]*background:\s*(#[\da-f]{6})/i,
    "button",
  );
  const border = colorFrom(
    /\.plan textarea\s*\{[^}]*border:\s*1px solid (#[\da-f]{6})/i,
    "form border",
  );
  const focus = colorFrom(
    /textarea:focus-visible\s*\{[^}]*outline:\s*3px solid (#[\da-f]{6})/i,
    "focus outline",
  );

  assert.ok(contrastRatio(ink, page) >= 4.5, "primary text contrast");
  assert.ok(contrastRatio(muted, page) >= 4.5, "supporting text contrast");
  assert.ok(contrastRatio("#ffffff", button) >= 4.5, "button label contrast");
  assert.ok(contrastRatio(border, "#ffffff") >= 3, "form boundary contrast");
  assert.ok(contrastRatio(focus, page) >= 3, "focus indicator contrast");
});
