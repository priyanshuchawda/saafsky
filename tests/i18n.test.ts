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
import { localizeRecommendation } from "../src/features/i18n/recommendations.ts";
import { localizeIndoorAction } from "../src/features/i18n/indoor.ts";

test("recommendation translations follow action identity, including exercise variants", () => {
  const seen = new Set<string>();
  for (const sensitive of [false, true]) {
    for (const outdoorExercise of [false, true]) {
      const profile = {
        sensitive,
        children: sensitive,
        outdoorExercise,
        commute: "bike" as const,
        cookingSmoke: true,
      };
      for (const aqi of [null, 40, 120, 180, 250]) {
        for (const action of generateRecommendations(aqi, profile)) {
          seen.add(action.id);
          const localized = localizeRecommendation("hi", action);
          assert.equal(localized.title, translateText("hi", action.title));
          assert.equal(
            localized.description,
            translateText("hi", action.description),
          );
          assert.deepEqual(
            localizeRecommendation("hi", {
              ...action,
              title: "Changed English",
              description: "Changed English",
            }),
            localized,
          );
        }
      }
    }
  }
  assert.equal(seen.size, 7);
});

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
          const localized = localizeIndoorAction("hi", action);
          assert.deepEqual(localized, {
            title: translateText("hi", action.title),
            detail: translateText("hi", action.detail),
          });
          assert.deepEqual(
            localizeIndoorAction("hi", {
              ...action,
              title: "Changed English",
              detail: "Changed English",
            }),
            localized,
          );
        }
      }
    }
  }
});
