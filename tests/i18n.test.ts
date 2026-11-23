import { test } from "node:test";
import assert from "node:assert/strict";
import {
  messages,
  translate,
  translateText,
  type MessageKey,
} from "../src/features/i18n/messages.ts";
import { generateRecommendations } from "../src/features/recommendations/engine.ts";
import { reasonDescriptions } from "../src/features/recommendations/evidence.ts";
import { translateReason } from "../src/features/i18n/reasons.ts";

test("reason translations use stable IDs in both languages", () => {
  for (const code of Object.keys(
    reasonDescriptions,
  ) as (keyof typeof reasonDescriptions)[]) {
    assert.equal(translateReason("en", code), reasonDescriptions[code]);
    assert.notEqual(translateReason("hi", code), reasonDescriptions[code]);
  }
});
import { generateDailyPlan } from "../src/features/planner/daily.ts";
import { generateIndoorAdvice } from "../src/features/indoor/advice.ts";

test("English and Hindi dictionaries define the same interface", () => {
  assert.deepEqual(
    Object.keys(messages.hi).sort(),
    Object.keys(messages.en).sort(),
  );
  for (const key of Object.keys(messages.en) as MessageKey[]) {
    assert.ok(messages.en[key].length > 0, `${key} has English copy`);
    assert.ok(messages.hi[key].length > 0, `${key} has Hindi copy`);
  }
});

test("Hindi mode translates product navigation and core air guidance", () => {
  assert.equal(translate("hi", "planner"), "दिन की योजना");
  assert.equal(
    translate("hi", "generalInformation"),
    "यह सामान्य जानकारी है, चिकित्सीय निदान नहीं। ज़रूरत पड़ने पर अपने चिकित्सक की सलाह मानें।",
  );
  assert.equal(
    translateText("hi", "Reduce outdoor exertion"),
    "बाहर की शारीरिक मेहनत घटाएँ",
  );
  assert.equal(
    translateText("en", "Reduce outdoor exertion"),
    "Reduce outdoor exertion",
  );
});

test("every rule-generated recommendation and explanation has Hindi copy", () => {
  const profiles = [
    {
      sensitive: false,
      children: false,
      outdoorExercise: false,
      commute: "none" as const,
      cookingSmoke: false,
    },
    {
      sensitive: true,
      children: true,
      outdoorExercise: true,
      commute: "bike" as const,
      cookingSmoke: true,
    },
  ];
  for (const aqi of [null, 40, 120, 180, 250]) {
    for (const profile of profiles) {
      const recommendations = generateRecommendations(aqi, profile);
      for (const item of recommendations) {
        assert.notEqual(translateText("hi", item.title), item.title);
        assert.notEqual(
          translateText("hi", item.description),
          item.description,
        );
        for (const code of item.reasonCodes) {
          const reason = reasonDescriptions[code];
          if (reason) assert.notEqual(translateText("hi", reason), reason);
        }
      }
      for (const step of generateDailyPlan(aqi, profile)) {
        assert.notEqual(translateText("hi", step.period), step.period);
        assert.notEqual(translateText("hi", step.title), step.title);
        assert.notEqual(translateText("hi", step.detail), step.detail);
      }
    }
  }
});

test("all indoor advisor branches have Hindi copy", () => {
  for (const smoke of [false, true]) {
    for (const purifier of [false, true]) {
      for (const outdoor of ["elevated", "lower", "unknown"] as const) {
        for (const action of generateIndoorAdvice(smoke, purifier, outdoor)) {
          assert.notEqual(translateText("hi", action.title), action.title);
          assert.notEqual(translateText("hi", action.detail), action.detail);
        }
      }
    }
  }
});
