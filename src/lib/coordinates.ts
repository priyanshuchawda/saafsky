const decimal = /^-?(?:\d+(?:\.\d+)?|\.\d+)$/;

export function parseCoordinates(
  params: URLSearchParams,
): { latitude: number; longitude: number } | null {
  const lat = params.get("lat")?.trim();
  const lon = params.get("lon")?.trim();
  if (!lat || !lon || !decimal.test(lat) || !decimal.test(lon)) return null;
  const latitude = Number(lat);
  const longitude = Number(lon);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  )
    return null;
  return {
    latitude: Math.round(latitude * 1000) / 1000,
    longitude: Math.round(longitude * 1000) / 1000,
  };
}
