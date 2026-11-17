import { expect, test } from "@playwright/test";

test("public API fails closed when shared protection is unconfigured", async ({
  request,
}) => {
  const results = await Promise.all([
    request.get("/api/air?lat=28.61&lon=77.23"),
    request.get("/api/locations?q=Delhi"),
    request.post("/api/chat", {
      data: {
        question: "How can I plan an outing?",
        latitude: 28.61,
        longitude: 77.23,
        profile: {
          sensitive: false,
          children: false,
          outdoorExercise: false,
          commute: "none",
          cookingSmoke: false,
        },
        history: [],
      },
    }),
  ]);
  for (const response of results) {
    expect(response.status()).toBe(503);
    expect(await response.json()).toEqual({
      error: "Request protection is temporarily unavailable.",
    });
  }
});

test("invalid inputs and cross-origin chat are rejected before provider access", async ({
  request,
}) => {
  expect((await request.get("/api/air?lat=&lon=77")).status()).toBe(400);
  expect(
    (
      await request.post("/api/chat", {
        headers: { origin: "https://other.example" },
        data: {},
      })
    ).status(),
  ).toBe(403);
  expect(
    (await request.post("/api/chat", { data: { question: "" } })).status(),
  ).toBe(400);
});
