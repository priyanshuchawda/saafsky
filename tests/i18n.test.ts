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
import { localizeDailyStep } from "../src/features/i18n/daily.ts";

test("availability and fallback messages use localized stable keys", () => {
  assert.equal(translate("en", "dataUnavailable"), "unavailable");
  assert.equal(translate("hi", "dataUnavailable"), "उपलब्ध नहीं");
  assert.match(translate("hi", "fallbackNoAir"), /डेटा उपलब्ध नहीं/);
  assert.match(translate("hi", "fallbackNoAi"), /AI का स्पष्टीकरण/);
});
import { translateAqiCategory } from "../src/features/i18n/aqi.ts";

test("AQI categories use stable keys across boundaries and languages", () => {
  for (const [aqi, english, hindi] of [
    [null, "Unavailable", "उपलब्ध नहीं"],
    [50, "Good", "अच्छी"],
    [51, "Moderate", "मध्यम"],
    [101, "Unhealthy for sensitive groups", "संवेदनशील समूहों के लिए अस्वस्थ"],
    [151, "Unhealthy", "अस्वस्थ"],
    [201, "Very unhealthy", "बहुत अस्वस्थ"],
    [301, "Hazardous", "खतरनाक"],
  ] as const) {
    assert.equal(translateAqiCategory("en", aqi), english);
    assert.equal(translateAqiCategory("hi", aqi), hindi);
  }
});

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
        assert.deepEqual(localizeDailyStep("en", step), {
          period: step.period,
          title: step.title,
          detail: step.detail,
        });
        assert.notEqual(translateText("hi", step.period), step.period);
        assert.notEqual(translateText("hi", step.title), step.title);
        assert.notEqual(translateText("hi", step.detail), step.detail);
        assert.deepEqual(localizeDailyStep("hi", step), {
          period: translateText("hi", step.period),
          title: translateText("hi", step.title),
          detail: translateText("hi", step.detail),
        });
        assert.deepEqual(
          localizeDailyStep("hi", {
            ...step,
            period: "Changed",
            title: "Changed",
            detail: "Changed",
          }),
          localizeDailyStep("hi", step),
        );
      }
    }
  }
});

test("daily guidance retains a Hindi fallback when no linked action is available", () => {
  const profile = {
    sensitive: false,
    children: false,
    outdoorExercise: false,
    commute: "none" as const,
    cookingSmoke: false,
  };
  const fallback = generateDailyPlan(null, profile).map(
    (step) => localizeDailyStep("hi", { ...step, detailActions: [] }).detail,
  );
  assert.deepEqual(fallback, [
    "निकलने से पहले स्थानीय स्थिति देखें।",
    "लचीली यात्रा के लिए नीचे दिए समय-खंडों की तुलना करें; सबसे कम अनुमान का अर्थ सुरक्षित हवा नहीं है।",
    "हवादारी या गतिविधि बदलने से पहले स्थानीय मार्गदर्शन देखें।",
  ]);
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
