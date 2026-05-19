const GOOGLE_DIRECTIONS_URL = 'https://maps.googleapis.com/maps/api/directions/json';

function decodePolyline(encoded) {
  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += (result & 1) ? ~(result >> 1) : (result >> 1);
    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += (result & 1) ? ~(result >> 1) : (result >> 1);
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }

  return points;
}

async function fetchRouteLine({ origin, destination, mode, apiKey }) {
  const params = new URLSearchParams({
    key: apiKey,
    origin: `${origin.latitude},${origin.longitude}`,
    destination: `${destination.latitude},${destination.longitude}`,
    mode,
  });

  const response = await fetch(`${GOOGLE_DIRECTIONS_URL}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return null;

  const data = await response.json();
  const encoded = data.routes?.[0]?.overview_polyline?.points;
  if (data.status !== 'OK' || !encoded) return null;

  return {
    source: 'google-directions',
    distanceMeters: data.routes?.[0]?.legs?.[0]?.distance?.value ?? null,
    durationSeconds: data.routes?.[0]?.legs?.[0]?.duration?.value ?? null,
    coordinates: decodePolyline(encoded),
  };
}

export async function buildRouteLines({ members, destination, mode, debug = {} }) {
  const locatedMembers = members.filter((member) =>
    Number.isFinite(member.location?.latitude) && Number.isFinite(member.location?.longitude)
  );
  if (!destination || !locatedMembers.length) return [];

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  debug.directionsEnabled = Boolean(apiKey);

  const fallbackLines = locatedMembers.map((member, index) => ({
    userId: member.userId,
    name: member.name,
    index,
    source: 'direct-line-fallback',
    coordinates: [member.location, destination],
  }));

  if (!apiKey) return fallbackLines;

  const routeLines = await Promise.all(locatedMembers.map(async (member, index) => {
    try {
      const route = await fetchRouteLine({
        origin: member.location,
        destination,
        mode: member.travelMode || mode,
        apiKey,
      });
      return route
        ? { userId: member.userId, name: member.name, index, ...route }
        : fallbackLines[index];
    } catch (err) {
      debug.directionsErrors = debug.directionsErrors || [];
      debug.directionsErrors.push(err.message);
      return fallbackLines[index];
    }
  }));

  debug.directionsRouteCount = routeLines.filter((line) => line.source === 'google-directions').length;
  return routeLines;
}
