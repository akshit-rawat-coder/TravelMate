import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

// Standard RFC 4122 UUID validation pattern
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Dynamic CORS header configuration supporting local development and frontend origins
function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowedOrigins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ];

  const allowOrigin = allowedOrigins.includes(origin)
    ? origin
    : allowedOrigins[0];

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
  };
}

// 1. Comprehensive Country to ISO 4217 Currency mapping
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  france: "EUR",
  germany: "EUR",
  italy: "EUR",
  spain: "EUR",
  netherlands: "EUR",
  belgium: "EUR",
  greece: "EUR",
  portugal: "EUR",
  austria: "EUR",
  ireland: "EUR",
  finland: "EUR",
  slovakia: "EUR",
  slovenia: "EUR",
  lithuania: "EUR",
  latvia: "EUR",
  estonia: "EUR",
  cyprus: "EUR",
  malta: "EUR",
  luxembourg: "EUR",
  croatia: "EUR",
  monaco: "EUR",
  andorra: "EUR",
  vatican: "EUR",
  "vatican city": "EUR",
  japan: "JPY",
  "united states": "USD",
  usa: "USD",
  us: "USD",
  "united kingdom": "GBP",
  uk: "GBP",
  england: "GBP",
  scotland: "GBP",
  wales: "GBP",
  "northern ireland": "GBP",
  india: "INR",
  "united arab emirates": "AED",
  uae: "AED",
  singapore: "SGD",
  australia: "AUD",
  canada: "CAD",
  switzerland: "CHF",
  thailand: "THB",
  malaysia: "MYR",
  indonesia: "IDR",
  vietnam: "VND",
  "new zealand": "NZD",
  china: "CNY",
  "south korea": "KRW",
  korea: "KRW",
  turkey: "TRY",
  türkiye: "TRY",
  "saudi arabia": "SAR",
  qatar: "QAR",
  "south africa": "ZAR",
  mexico: "MXN",
  brazil: "BRL",
  egypt: "EGP",
  morocco: "MAD",
  norway: "NOK",
  sweden: "SEK",
  denmark: "DKK",
  poland: "PLN",
  "czech republic": "CZK",
  czechia: "CZK",
  hungary: "HUF",
  iceland: "ISK",
  "sri lanka": "LKR",
  nepal: "NPR",
  maldives: "MVR",
  philippines: "PHP",
  argentina: "ARS",
  chile: "CLP",
  colombia: "COP",
  peru: "PEN",
  kenya: "KES",
  tanzania: "TZS",
  jordan: "JOD",
  oman: "OMR",
  bahrain: "BHD",
  kuwait: "KWD",
  israel: "ILS",
  "hong kong": "HKD",
  taiwan: "TWD",
  russia: "RUB",
};

// 2. Popular travel cities to Country and Currency lookup
const CITY_DESTINATION_MAP: Record<
  string,
  { city: string; country: string; currency: string }
> = {
  paris: { city: "Paris", country: "France", currency: "EUR" },
  nice: { city: "Nice", country: "France", currency: "EUR" },
  lyon: { city: "Lyon", country: "France", currency: "EUR" },
  marseille: { city: "Marseille", country: "France", currency: "EUR" },
  rome: { city: "Rome", country: "Italy", currency: "EUR" },
  milan: { city: "Milan", country: "Italy", currency: "EUR" },
  venice: { city: "Venice", country: "Italy", currency: "EUR" },
  florence: { city: "Florence", country: "Italy", currency: "EUR" },
  "amalfi coast": { city: "Amalfi Coast", country: "Italy", currency: "EUR" },
  london: { city: "London", country: "United Kingdom", currency: "GBP" },
  edinburgh: { city: "Edinburgh", country: "United Kingdom", currency: "GBP" },
  manchester: { city: "Manchester", country: "United Kingdom", currency: "GBP" },
  tokyo: { city: "Tokyo", country: "Japan", currency: "JPY" },
  kyoto: { city: "Kyoto", country: "Japan", currency: "JPY" },
  osaka: { city: "Osaka", country: "Japan", currency: "JPY" },
  "new york": { city: "New York", country: "United States", currency: "USD" },
  "los angeles": { city: "Los Angeles", country: "United States", currency: "USD" },
  "san francisco": { city: "San Francisco", country: "United States", currency: "USD" },
  "las vegas": { city: "Las Vegas", country: "United States", currency: "USD" },
  miami: { city: "Miami", country: "United States", currency: "USD" },
  chicago: { city: "Chicago", country: "United States", currency: "USD" },
  dubai: { city: "Dubai", country: "United Arab Emirates", currency: "AED" },
  "abu dhabi": { city: "Abu Dhabi", country: "United Arab Emirates", currency: "AED" },
  singapore: { city: "Singapore", country: "Singapore", currency: "SGD" },
  bangkok: { city: "Bangkok", country: "Thailand", currency: "THB" },
  phuket: { city: "Phuket", country: "Thailand", currency: "THB" },
  "chiang mai": { city: "Chiang Mai", country: "Thailand", currency: "THB" },
  bali: { city: "Bali", country: "Indonesia", currency: "IDR" },
  jakarta: { city: "Jakarta", country: "Indonesia", currency: "IDR" },
  "kuala lumpur": { city: "Kuala Lumpur", country: "Malaysia", currency: "MYR" },
  hanoi: { city: "Hanoi", country: "Vietnam", currency: "VND" },
  "ho chi minh city": { city: "Ho Chi Minh City", country: "Vietnam", currency: "VND" },
  seoul: { city: "Seoul", country: "South Korea", currency: "KRW" },
  sydney: { city: "Sydney", country: "Australia", currency: "AUD" },
  melbourne: { city: "Melbourne", country: "Australia", currency: "AUD" },
  toronto: { city: "Toronto", country: "Canada", currency: "CAD" },
  vancouver: { city: "Vancouver", country: "Canada", currency: "CAD" },
  berlin: { city: "Berlin", country: "Germany", currency: "EUR" },
  munich: { city: "Munich", country: "Germany", currency: "EUR" },
  amsterdam: { city: "Amsterdam", country: "Netherlands", currency: "EUR" },
  barcelona: { city: "Barcelona", country: "Spain", currency: "EUR" },
  madrid: { city: "Madrid", country: "Spain", currency: "EUR" },
  lisbon: { city: "Lisbon", country: "Portugal", currency: "EUR" },
  vienna: { city: "Vienna", country: "Austria", currency: "EUR" },
  zurich: { city: "Zurich", country: "Switzerland", currency: "CHF" },
  athens: { city: "Athens", country: "Greece", currency: "EUR" },
  santorini: { city: "Santorini", country: "Greece", currency: "EUR" },
  prague: { city: "Prague", country: "Czech Republic", currency: "CZK" },
  budapest: { city: "Budapest", country: "Hungary", currency: "HUF" },
  dublin: { city: "Dublin", country: "Ireland", currency: "EUR" },
  cairo: { city: "Cairo", country: "Egypt", currency: "EGP" },
  marrakech: { city: "Marrakech", country: "Morocco", currency: "MAD" },
  istanbul: { city: "Istanbul", country: "Turkey", currency: "TRY" },
  delhi: { city: "Delhi", country: "India", currency: "INR" },
  mumbai: { city: "Mumbai", country: "India", currency: "INR" },
  goa: { city: "Goa", country: "India", currency: "INR" },
  jaipur: { city: "Jaipur", country: "India", currency: "INR" },
  "cape town": { city: "Cape Town", country: "South Africa", currency: "ZAR" },
  "rio de janeiro": { city: "Rio de Janeiro", country: "Brazil", currency: "BRL" },
  "buenos aires": { city: "Buenos Aires", country: "Argentina", currency: "ARS" },
  "mexico city": { city: "Mexico City", country: "Mexico", currency: "MXN" },
  auckland: { city: "Auckland", country: "New Zealand", currency: "NZD" },
};

interface DestinationResolution {
  city: string;
  country: string;
  currency: string;
}

// Destination resolution layer: reliably determines city, country, and ISO currency code
function resolveDestination(
  rawDestination: string,
  rawCountry?: string | null
): DestinationResolution {
  const destClean = (rawDestination || "").trim();
  const countryClean = (rawCountry || "").trim();

  // 1. If explicit country is provided in trip.country
  if (countryClean) {
    const countryKey = countryClean.toLowerCase();
    const currency = COUNTRY_CURRENCY_MAP[countryKey];
    if (currency) {
      return {
        city: destClean || countryClean,
        country: countryClean,
        currency,
      };
    }
  }

  // 2. If destination is formatted as "City, Country"
  if (destClean.includes(",")) {
    const parts = destClean.split(",").map((p) => p.trim());
    const cityPart = parts[0];
    const countryPart = parts[parts.length - 1];
    const countryKey = countryPart.toLowerCase();
    const currency = COUNTRY_CURRENCY_MAP[countryKey];
    if (currency) {
      return {
        city: cityPart,
        country: countryPart,
        currency,
      };
    }
  }

  // 3. Match against popular destination city dictionary (e.g. "paris" -> France -> EUR)
  const destKey = destClean.toLowerCase();
  if (CITY_DESTINATION_MAP[destKey]) {
    return { ...CITY_DESTINATION_MAP[destKey] };
  }

  // 4. Check if destination itself is a known country name
  if (COUNTRY_CURRENCY_MAP[destKey]) {
    return {
      city: destClean,
      country: destClean,
      currency: COUNTRY_CURRENCY_MAP[destKey],
    };
  }

  // Safe fallback default if wholly unresolvable
  return {
    city: destClean,
    country: countryClean || destClean,
    currency: "EUR",
  };
}

// Handle Weather Intelligence Request with Database-Backed Cache
async function handleWeatherRequest(
  supabase: any,
  trip: any,
  cleanTripId: string,
  destinationInfo: DestinationResolution,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const startDate = trip.start_date;
  const endDate = trip.end_date;
  if (!startDate || !endDate) {
    return new Response(
      JSON.stringify({ error: "Trip missing start_date or end_date" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const locationQuery = `${destinationInfo.city}, ${destinationInfo.country}`;
  const now = new Date();

  // 1. Check database cache
  console.log("[Weather] Checking cache for trip:", cleanTripId, locationQuery);
  const { data: cachedRow, error: cacheLookupErr } = await supabase
    .from("trip_weather_cache")
    .select("*")
    .eq("trip_id", cleanTripId)
    .eq("location", locationQuery)
    .eq("start_date", startDate)
    .eq("end_date", endDate)
    .maybeSingle();

  if (cacheLookupErr) {
    console.warn("[Weather Cache] Lookup warning:", cacheLookupErr.message);
  }

  const isCacheHit = Boolean(
    cachedRow &&
    cachedRow.expires_at &&
    new Date(cachedRow.expires_at).getTime() > now.getTime()
  );

  if (isCacheHit) {
    console.log("[Weather Cache] HIT for trip", cleanTripId, locationQuery);
    return new Response(
      JSON.stringify({
        trip: {
          id: trip.id,
          destination: trip.destination,
          country: trip.country,
          startDate: trip.start_date,
          endDate: trip.end_date,
        },
        destination: {
          city: destinationInfo.city,
          country: destinationInfo.country,
        },
        weather: {
          ...cachedRow.weather_data,
          cached: true,
        },
        cache: {
          hit: true,
          fetchedAt: cachedRow.fetched_at,
          expiresAt: cachedRow.expires_at,
          stale: false,
        },
        sources: [
          {
            name: "Visual Crossing",
            type: "weather",
          },
        ],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  console.log("[Weather Cache] MISS or STALE. Calling Visual Crossing Timeline API...");

  // 2. Secret check
  const vcApiKeyRaw = Deno.env.get("VISUAL_CROSSING_API_KEY");
  if (!vcApiKeyRaw || vcApiKeyRaw.trim().length === 0) {
    console.error("[Weather] VISUAL_CROSSING_API_KEY missing");
    if (cachedRow) {
      return new Response(
        JSON.stringify({
          trip: {
            id: trip.id,
            destination: trip.destination,
            country: trip.country,
            startDate: trip.start_date,
            endDate: trip.end_date,
          },
          destination: {
            city: destinationInfo.city,
            country: destinationInfo.country,
          },
          weather: {
            ...cachedRow.weather_data,
            cached: true,
          },
          cache: {
            hit: true,
            fetchedAt: cachedRow.fetched_at,
            expiresAt: cachedRow.expires_at,
            stale: true,
          },
          sources: [
            {
              name: "Visual Crossing",
              type: "weather",
            },
          ],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    return new Response(
      JSON.stringify({ error: "Weather service is not configured" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const vcApiKey = vcApiKeyRaw.trim().replace(/^["']|["']$/g, "");

  // 3. Fetch from Visual Crossing over strict HTTPS
  let vcRes: Response | null = null;
  let vcData: any = null;
  let fetchErrorMsg: string | null = null;

  try {
    const vcUrl = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${encodeURIComponent(
      locationQuery
    )}/${startDate}/${endDate}?unitGroup=metric&include=days&elements=datetime,tempmax,tempmin,temp,conditions,description,precipprob,precip,windspeed,humidity,uvindex,sunrise,sunset&key=${encodeURIComponent(
      vcApiKey
    )}&contentType=json`;

    vcRes = await fetch(vcUrl, {
      method: "GET",
      signal: AbortSignal.timeout(10000),
    });

    if (vcRes.ok) {
      vcData = await vcRes.json();
    } else {
      fetchErrorMsg = `HTTP ${vcRes.status}`;
      console.warn("[Weather] Visual Crossing HTTP failure:", vcRes.status);
    }
  } catch (err) {
    fetchErrorMsg = err instanceof Error ? err.message : String(err);
    console.warn("[Weather] Visual Crossing fetch exception:", fetchErrorMsg);
  }

  // 4. Handle provider failure with stale cache fallback
  if (!vcRes || !vcRes.ok || !vcData || !Array.isArray(vcData.days)) {
    console.error("[Weather] Visual Crossing failed:", fetchErrorMsg);
    if (cachedRow) {
      console.log("[Weather] Returning existing stale cache fallback");
      return new Response(
        JSON.stringify({
          trip: {
            id: trip.id,
            destination: trip.destination,
            country: trip.country,
            startDate: trip.start_date,
            endDate: trip.end_date,
          },
          destination: {
            city: destinationInfo.city,
            country: destinationInfo.country,
          },
          weather: {
            ...cachedRow.weather_data,
            cached: true,
          },
          cache: {
            hit: true,
            fetchedAt: cachedRow.fetched_at,
            expiresAt: cachedRow.expires_at,
            stale: true,
          },
          sources: [
            {
              name: "Visual Crossing",
              type: "weather",
            },
          ],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Weather provider returned an error" }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // 5. Normalize weather days & determine weather mode
  const todayStr = now.toISOString().split("T")[0];
  const maxForecastDate = new Date(now.getTime() + 15 * 86400000)
    .toISOString()
    .split("T")[0];

  let mode: "forecast" | "historical" | "statistical" | "mixed" = "forecast";
  if (endDate < todayStr) {
    mode = "historical";
  } else if (startDate > maxForecastDate) {
    mode = "statistical";
  } else if (endDate > maxForecastDate && startDate <= maxForecastDate) {
    mode = "mixed";
  } else {
    mode = "forecast";
  }

  const days = (vcData.days || []).map((d: any) => {
    const dayDate = d.datetime;
    let dayMode: "forecast" | "historical" | "statistical" = "forecast";
    if (dayDate < todayStr) {
      dayMode = "historical";
    } else if (dayDate > maxForecastDate) {
      dayMode = "statistical";
    } else {
      dayMode = "forecast";
    }

    return {
      date: dayDate,
      tempMax: d.tempmax != null ? Math.round(d.tempmax) : null,
      tempMin: d.tempmin != null ? Math.round(d.tempmin) : null,
      temperature: d.temp != null ? Math.round(d.temp) : null,
      conditions: d.conditions || "Clear",
      description: d.description || "",
      precipProbability: d.precipprob != null ? Math.round(d.precipprob) : 0,
      precipitation: d.precip != null ? Number(d.precip) : 0,
      windSpeed: d.windspeed != null ? Math.round(d.windspeed) : null,
      humidity: d.humidity != null ? Math.round(d.humidity) : null,
      uvIndex: d.uvindex != null ? Number(d.uvindex) : null,
      sunrise: d.sunrise || null,
      sunset: d.sunset || null,
      dayMode: dayMode,
      isForecast: dayMode === "forecast",
    };
  });

  // 6. Cache Freshness TTL
  let ttlMs = 6 * 3600 * 1000; // 6 hours for forecast & mixed
  if (mode === "statistical") {
    ttlMs = 7 * 86400 * 1000; // 7 days for statistical/climate
  } else if (mode === "historical") {
    ttlMs = 30 * 86400 * 1000; // 30 days for historical
  }
  const expiresAt = new Date(now.getTime() + ttlMs);

  const weatherPayload = {
    city: destinationInfo.city,
    country: destinationInfo.country,
    location: locationQuery,
    startDate: startDate,
    endDate: endDate,
    mode: mode,
    cached: false,
    fetchedAt: now.toISOString(),
    days: days,
  };

  // 7. Save into trip_weather_cache
  const { error: upsertErr } = await supabase.from("trip_weather_cache").upsert(
    {
      trip_id: cleanTripId,
      location: locationQuery,
      start_date: startDate,
      end_date: endDate,
      weather_mode: mode,
      weather_data: weatherPayload,
      fetched_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      updated_at: now.toISOString(),
    },
    { onConflict: "trip_id,location,start_date,end_date" }
  );

  if (upsertErr) {
    console.warn("[Weather Cache] Upsert error:", upsertErr.message);
  } else {
    console.log("[Weather Cache] Saved weather data successfully for trip", cleanTripId);
  }

  // 8. Return normalized weather response
  return new Response(
    JSON.stringify({
      trip: {
        id: trip.id,
        destination: trip.destination,
        country: trip.country,
        startDate: trip.start_date,
        endDate: trip.end_date,
      },
      destination: {
        city: destinationInfo.city,
        country: destinationInfo.country,
      },
      weather: weatherPayload,
      cache: {
        hit: false,
        fetchedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        stale: false,
      },
      sources: [
        {
          name: "Visual Crossing",
          type: "weather",
        },
      ],
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// Extract raw flight array from varied provider response schemas
function extractRawFlightList(apiData: any): { rawList: any[]; matchedKey: string } {
  if (!apiData) return { rawList: [], matchedKey: "none" };
  if (Array.isArray(apiData)) return { rawList: apiData, matchedKey: "root_array" };

  if (typeof apiData === "object") {
    // 1. Root-level best_flights and other_flights (Best Google Flights Scraper structure)
    if (
      Array.isArray(apiData.best_flights) ||
      Array.isArray(apiData.other_flights)
    ) {
      const best = Array.isArray(apiData.best_flights) ? apiData.best_flights : [];
      const other = Array.isArray(apiData.other_flights) ? apiData.other_flights : [];
      return { rawList: [...best, ...other], matchedKey: "best_flights + other_flights" };
    }

    if (Array.isArray(apiData.flights)) return { rawList: apiData.flights, matchedKey: "flights" };
    if (Array.isArray(apiData.itineraries)) return { rawList: apiData.itineraries, matchedKey: "itineraries" };
    if (Array.isArray(apiData.results)) return { rawList: apiData.results, matchedKey: "results" };
    if (Array.isArray(apiData.flight_options)) return { rawList: apiData.flight_options, matchedKey: "flight_options" };
    if (Array.isArray(apiData.data)) return { rawList: apiData.data, matchedKey: "data_array" };

    if (apiData.data && typeof apiData.data === "object") {
      if (
        Array.isArray(apiData.data.best_flights) ||
        Array.isArray(apiData.data.other_flights)
      ) {
        const best = Array.isArray(apiData.data.best_flights) ? apiData.data.best_flights : [];
        const other = Array.isArray(apiData.data.other_flights) ? apiData.data.other_flights : [];
        return { rawList: [...best, ...other], matchedKey: "data.best_flights + data.other_flights" };
      }
      if (Array.isArray(apiData.data.flights)) return { rawList: apiData.data.flights, matchedKey: "data.flights" };
      if (Array.isArray(apiData.data.itineraries)) return { rawList: apiData.data.itineraries, matchedKey: "data.itineraries" };
      if (Array.isArray(apiData.data.flight_options)) return { rawList: apiData.data.flight_options, matchedKey: "data.flight_options" };
      if (Array.isArray(apiData.data.results)) return { rawList: apiData.data.results, matchedKey: "data.results" };
      if (
        Array.isArray(apiData.data.bestFlights) ||
        Array.isArray(apiData.data.otherFlights)
      ) {
        const best = Array.isArray(apiData.data.bestFlights) ? apiData.data.bestFlights : [];
        const other = Array.isArray(apiData.data.otherFlights) ? apiData.data.otherFlights : [];
        return { rawList: [...best, ...other], matchedKey: "data.bestFlights + data.otherFlights" };
      }
      for (const k of Object.keys(apiData.data)) {
        if (Array.isArray(apiData.data[k]) && apiData.data[k].length > 0) {
          return { rawList: apiData.data[k], matchedKey: `data.${k}` };
        }
      }
    }

    for (const k of Object.keys(apiData)) {
      if (Array.isArray(apiData[k]) && apiData[k].length > 0) {
        return { rawList: apiData[k], matchedKey: k };
      }
    }
  }

  return { rawList: [], matchedKey: "none" };
}

// Normalize raw flight provider response into stable TravelMate structure
function normalizeFlightData(
  apiData: any,
  tripCurrency: string,
  tripOrigin: string,
  tripDestination: string,
  departureDate?: string,
  travelers: number = 1,
  cabinClass: string = "economy"
) {
  const { rawList, matchedKey } = extractRawFlightList(apiData);

  const flights = rawList.map((item: any, idx: number) => {
    // 1. Airline
    let airline = "Airline";
    if (Array.isArray(item.airlines) && item.airlines.length > 0) {
      airline = item.airlines
        .map((a: any) => (typeof a === "object" && a?.name ? a.name : String(a)))
        .filter(Boolean)
        .join(", ") || "Airline";
    } else if (Array.isArray(item.airline_names) && item.airline_names.length > 0) {
      airline = item.airline_names.join(", ");
    } else if (typeof item.airline === "string" && item.airline.trim()) {
      airline = item.airline.trim();
    } else if (typeof item.airline === "object" && item.airline?.name) {
      airline = item.airline.name;
    } else if (typeof item.airline_name === "string" && item.airline_name.trim()) {
      airline = item.airline_name.trim();
    } else if (typeof item.carrier === "string" && item.carrier.trim()) {
      airline = item.carrier.trim();
    } else if (typeof item.carrier_name === "string" && item.carrier_name.trim()) {
      airline = item.carrier_name.trim();
    } else if (Array.isArray(item.segments) && item.segments[0]?.airline?.name) {
      airline = item.segments[0].airline.name;
    } else if (Array.isArray(item.flights) && item.flights[0]?.airline) {
      airline = item.flights[0].airline;
    } else if (Array.isArray(item.legs) && item.legs[0]?.airline) {
      airline = item.legs[0].airline;
    } else if (Array.isArray(item.legs) && item.legs[0]?.carrier) {
      airline = item.legs[0].carrier;
    }

    // 2. Flight number
    let flightNumber: string | null = null;
    if (item.flightNumber) flightNumber = String(item.flightNumber);
    else if (item.flight_number) flightNumber = String(item.flight_number);
    else if (item.flight_no) flightNumber = String(item.flight_no);
    else if (Array.isArray(item.segments) && item.segments[0]?.flight_number) {
      flightNumber = String(item.segments[0].flight_number);
    } else if (Array.isArray(item.flights) && item.flights[0]?.flight_number) {
      flightNumber = String(item.flights[0].flight_number);
    } else if (Array.isArray(item.legs) && item.legs[0]?.flight_number) {
      flightNumber = String(item.legs[0].flight_number);
    }

    // 3. Origin & Destination
    let flightOrigin = tripOrigin;
    if (item.departure?.airport?.city) {
      flightOrigin = item.departure.airport.city;
    } else if (item.departure?.airport?.name) {
      flightOrigin = item.departure.airport.name;
    } else if (item.departure?.airport?.code) {
      flightOrigin = item.departure.airport.code;
    } else if (typeof item.origin === "string" && item.origin.trim()) {
      flightOrigin = item.origin.trim();
    } else if (typeof item.departure_airport === "string" && item.departure_airport.trim()) {
      flightOrigin = item.departure_airport.trim();
    } else if (item.departure_airport?.name) {
      flightOrigin = item.departure_airport.name;
    } else if (item.departure_airport?.id) {
      flightOrigin = item.departure_airport.id;
    } else if (Array.isArray(item.segments) && item.segments[0]?.departure?.airport?.city) {
      flightOrigin = item.segments[0].departure.airport.city;
    } else if (Array.isArray(item.legs) && item.legs[0]?.origin) {
      flightOrigin = item.legs[0].origin;
    }

    let flightDestination = tripDestination;
    if (item.arrival?.airport?.city) {
      flightDestination = item.arrival.airport.city;
    } else if (item.arrival?.airport?.name) {
      flightDestination = item.arrival.airport.name;
    } else if (item.arrival?.airport?.code) {
      flightDestination = item.arrival.airport.code;
    } else if (typeof item.destination === "string" && item.destination.trim()) {
      flightDestination = item.destination.trim();
    } else if (typeof item.arrival_airport === "string" && item.arrival_airport.trim()) {
      flightDestination = item.arrival_airport.trim();
    } else if (item.arrival_airport?.name) {
      flightDestination = item.arrival_airport.name;
    } else if (item.arrival_airport?.id) {
      flightDestination = item.arrival_airport.id;
    } else if (Array.isArray(item.segments) && item.segments.length > 0) {
      const lastSeg = item.segments[item.segments.length - 1];
      if (lastSeg?.arrival?.airport?.city) flightDestination = lastSeg.arrival.airport.city;
    } else if (Array.isArray(item.legs) && item.legs.length > 0) {
      const lastLeg = item.legs[item.legs.length - 1];
      if (lastLeg?.destination) flightDestination = lastLeg.destination;
    }

    // 4. Departure and Arrival Times
    let departureTime: string | null = null;
    if (item.departure && typeof item.departure === "object") {
      departureTime = item.departure.time || item.departure.date || null;
    } else if (typeof item.departure === "string" && item.departure.trim()) {
      departureTime = item.departure.trim();
    } else if (item.departureTime) {
      departureTime = String(item.departureTime);
    } else if (item.departure_time) {
      departureTime = String(item.departure_time);
    } else if (Array.isArray(item.flights) && item.flights[0]?.departure_time) {
      departureTime = String(item.flights[0].departure_time);
    } else if (Array.isArray(item.legs) && item.legs[0]?.departure_time) {
      departureTime = String(item.legs[0].departure_time);
    }

    let arrivalTime: string | null = null;
    if (item.arrival && typeof item.arrival === "object") {
      arrivalTime = item.arrival.time || item.arrival.date || null;
    } else if (typeof item.arrival === "string" && item.arrival.trim()) {
      arrivalTime = item.arrival.trim();
    } else if (item.arrivalTime) {
      arrivalTime = String(item.arrivalTime);
    } else if (item.arrival_time) {
      arrivalTime = String(item.arrival_time);
    } else if (Array.isArray(item.flights) && item.flights.length > 0) {
      const lastF = item.flights[item.flights.length - 1];
      if (lastF?.arrival_time) arrivalTime = String(lastF.arrival_time);
    } else if (Array.isArray(item.legs) && item.legs.length > 0) {
      const lastLeg = item.legs[item.legs.length - 1];
      if (lastLeg?.arrival_time) arrivalTime = String(lastLeg.arrival_time);
    }

    // 5. Duration
    let duration: string | null = null;
    const durRaw =
      item.duration ??
      item.total_duration ??
      item.duration_minutes ??
      item.duration_label;
    if (durRaw != null) {
      if (typeof durRaw === "number") {
        const hours = Math.floor(durRaw / 60);
        const mins = durRaw % 60;
        duration = `${hours}h ${mins}m`;
      } else {
        duration = String(durRaw);
      }
    }

    // 6. Stops
    let stops = 0;
    if (typeof item.stops === "number") {
      stops = item.stops;
    } else if (typeof item.stops_count === "number") {
      stops = item.stops_count;
    } else if (Array.isArray(item.layovers)) {
      stops = item.layovers.length;
    } else if (Array.isArray(item.legs) && item.legs.length > 1) {
      stops = item.legs.length - 1;
    } else if (Array.isArray(item.flights) && item.flights.length > 1) {
      stops = item.flights.length - 1;
    } else if (typeof item.stops === "string") {
      const lower = item.stops.toLowerCase();
      if (!lower.includes("direct") && !lower.includes("nonstop")) {
        const m = item.stops.match(/\d+/);
        stops = m ? parseInt(m[0], 10) : 1;
      }
    }

    // 7. Price
    let price: number | null = null;
    const rawPrice =
      item.price ??
      item.price_details?.amount ??
      item.price?.amount ??
      item.price?.raw;
    if (typeof rawPrice === "number") {
      price = Math.round(rawPrice);
    } else if (typeof rawPrice === "string") {
      const cleaned = rawPrice.replace(/[^0-9.]/g, "");
      if (cleaned) price = Math.round(parseFloat(cleaned));
    }

    // 8. Currency
    const flightCurrency =
      item.currency ||
      item.price?.currency ||
      item.price_details?.currency ||
      tripCurrency;

    // 9. Baggage
    const baggage =
      item.baggage ||
      item.baggage_info ||
      (item.carry_on || item.checked
        ? {
            carryOn: item.carry_on || null,
            checked: item.checked || null,
          }
        : null);

    // 10. Booking URL
    let bookingUrl: string | null = null;
    const rawBooking =
      item.bookingUrl ||
      item.booking_url ||
      item.booking_link ||
      item.deep_link ||
      item.link ||
      null;

    if (typeof rawBooking === "string" && rawBooking.startsWith("http")) {
      bookingUrl = rawBooking;
    } else {
      const cabinMap: Record<string, string> = {
        economy: "economy",
        premium_economy: "premium economy",
        business: "business class",
        first: "first class",
      };
      const cabinText = cabinMap[cabinClass?.toLowerCase()] || "";
      let q = `flights from ${flightOrigin || tripOrigin} to ${flightDestination || tripDestination}`;
      if (departureDate) q += ` on ${departureDate}`;
      if (airline && airline !== "Airline") q += ` on ${airline}`;
      if (cabinText && cabinText !== "economy") q += ` ${cabinText}`;
      if (travelers > 1) q += ` ${travelers} passengers`;

      const params = new URLSearchParams({ q });
      if (flightCurrency) params.set("curr", flightCurrency);
      bookingUrl = `https://www.google.com/travel/flights?${params.toString()}`;
    }

    const flightId =
      item.id || item.flight_id || `flight-${idx}-${Date.now()}`;

    return {
      id: String(flightId),
      airline,
      flightNumber,
      origin: flightOrigin,
      destination: flightDestination,
      departureTime,
      arrivalTime,
      duration,
      stops,
      price,
      currency: flightCurrency,
      baggage,
      bookingUrl,
    };
  });

  return {
    provider: "Google Flights",
    currency: tripCurrency,
    searchedAt: new Date().toISOString(),
    flights,
    matchedKey,
    rawCount: rawList.length,
  };
}

// Handle Flight Intelligence Request with Database-Backed Cache and Resilient Refresh
async function handleFlightRequest(
  supabase: any,
  trip: any,
  cleanTripId: string,
  destinationInfo: DestinationResolution,
  refresh: boolean,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const origin = (trip.origin || "").trim();
  const destination = (trip.destination || destinationInfo.city || "").trim();
  const departureDate = trip.start_date;
  const travelers = Number(trip.travelers) > 0 ? Number(trip.travelers) : 1;
  const cabinClass = (trip.cabin_class || "economy").toLowerCase();
  const currency = (trip.currency || "INR").toUpperCase();
  const now = new Date();

  if (!origin) {
    return new Response(
      JSON.stringify({
        error:
          "Trip departure origin is missing. Please edit the trip to add an origin city for flight search.",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  if (!departureDate) {
    return new Response(
      JSON.stringify({
        error: "Trip departure date is missing.",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // 1. Check database cache
  console.log(
    `[Flight Cache] Checking cache for trip ${cleanTripId} (${origin} -> ${destination}, ${departureDate}, ${cabinClass}, ${currency})...`
  );

  let cachedRow: any = null;
  try {
    const { data, error: cacheLookupErr } = await supabase
      .from("trip_flight_cache")
      .select("*")
      .eq("trip_id", cleanTripId)
      .eq("origin", origin)
      .eq("destination", destination)
      .eq("departure_date", departureDate)
      .is("return_date", null)
      .eq("travelers", travelers)
      .eq("cabin_class", cabinClass)
      .eq("currency", currency)
      .maybeSingle();

    if (cacheLookupErr) {
      console.warn("[Flight Cache] Lookup warning:", cacheLookupErr.message);
    } else {
      cachedRow = data;
    }
  } catch (lookupEx) {
    console.warn("[Flight Cache] Lookup exception:", lookupEx);
  }

  // CACHE-FIRST: If NOT an explicit refresh and cached data exists, return cached data
  if (!refresh && cachedRow && cachedRow.flight_data) {
    console.log("[Flight Cache] CACHE HIT! Returning saved flight data for trip:", cleanTripId);
    return new Response(
      JSON.stringify({
        trip: {
          id: trip.id,
          origin,
          destination,
          startDate: departureDate,
          travelers,
          cabin_class: cabinClass,
          currency,
        },
        flights: cachedRow.flight_data.flights || [],
        provider: cachedRow.flight_data.provider || "Google Flights",
        searchedAt: cachedRow.fetched_at,
        fetchedAt: cachedRow.fetched_at,
        expiresAt: cachedRow.expires_at,
        diagnostics: cachedRow.flight_data.diagnostics || null,
        cache: {
          hit: true,
          fetchedAt: cachedRow.fetched_at,
          expiresAt: cachedRow.expires_at,
        },
        sources: [
          {
            name: "Google Flights",
            type: "flight",
          },
        ],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  console.log(
    refresh
      ? `[Flight API] User requested explicit refresh. Bypassing cache for trip ${cleanTripId}...`
      : `[Flight Cache] CACHE MISS for trip ${cleanTripId}. Calling RapidAPI...`
  );

  // 2. RapidAPI Key verification
  const rapidApiKeyRaw = Deno.env.get("RAPIDAPI_KEY");
  if (!rapidApiKeyRaw || rapidApiKeyRaw.trim().length === 0) {
    console.error("[Flight API] RAPIDAPI_KEY secret is missing");
    if (cachedRow && cachedRow.flight_data) {
      return new Response(
        JSON.stringify({
          trip: {
            id: trip.id,
            origin,
            destination,
            startDate: departureDate,
            travelers,
            cabin_class: cabinClass,
            currency,
          },
          flights: cachedRow.flight_data.flights || [],
          provider: cachedRow.flight_data.provider || "Google Flights",
          searchedAt: cachedRow.fetched_at,
          fetchedAt: cachedRow.fetched_at,
          expiresAt: cachedRow.expires_at,
          refreshError:
            "Flight service is temporarily unavailable. Showing previously saved rates.",
          cache: {
            hit: true,
            fetchedAt: cachedRow.fetched_at,
            expiresAt: cachedRow.expires_at,
          },
          sources: [
            {
              name: "Google Flights",
              type: "flight",
            },
          ],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Flight price service is not configured." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const rapidApiKey = rapidApiKeyRaw.trim().replace(/^["']|["']$/g, "");

  // 3. Build RapidAPI parameters
  const queryParams = new URLSearchParams({
    origin: origin,
    destination: destination,
    departure_date: departureDate,
    adults: String(travelers),
    cabin_class: cabinClass,
    currency: currency,
    language: "en-US",
    country: "IN",
    stops: "any",
    sort_by: "best",
    less_emissions: "false",
    carry_on_bags: "0",
    checked_bags: "0",
    children: "0",
    infants_in_seat: "0",
    infants_on_lap: "0",
  });

  const apiUrl = `https://best-google-flights-scraper-free-1000-calls.p.rapidapi.com/flights/search-one-way?${queryParams.toString()}`;

  let apiRes: Response | null = null;
  let apiData: any = null;
  let fetchErrorMsg: string | null = null;

  try {
    apiRes = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-host":
          "best-google-flights-scraper-free-1000-calls.p.rapidapi.com",
        "x-rapidapi-key": rapidApiKey,
      },
      signal: AbortSignal.timeout(15000),
    });

    if (apiRes.ok) {
      apiData = await apiRes.json();
      console.log(
        "[Flight API] Provider HTTP 200 received. Type:",
        typeof apiData,
        "Keys:",
        apiData && typeof apiData === "object" ? Object.keys(apiData) : "non-object"
      );
    } else {
      fetchErrorMsg = `HTTP ${apiRes.status}`;
      console.warn("[Flight API] Provider HTTP status:", apiRes.status);
    }
  } catch (fetchErr) {
    fetchErrorMsg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
    console.warn("[Flight API] Fetch exception:", fetchErrorMsg);
  }

  // 4. Handle provider failure with safe fallback
  if (!apiRes || !apiRes.ok || !apiData) {
    console.error("[Flight API] Provider fetch failed:", fetchErrorMsg);

    // If existing cached data exists, keep it visible and non-destructive!
    if (cachedRow && cachedRow.flight_data) {
      console.log("[Flight API] Preserving existing cached flight data on failure.");
      return new Response(
        JSON.stringify({
          trip: {
            id: trip.id,
            origin,
            destination,
            startDate: departureDate,
            travelers,
            cabin_class: cabinClass,
            currency,
          },
          flights: cachedRow.flight_data.flights || [],
          provider: cachedRow.flight_data.provider || "Google Flights",
          searchedAt: cachedRow.fetched_at,
          fetchedAt: cachedRow.fetched_at,
          expiresAt: cachedRow.expires_at,
          refreshError:
            "Unable to refresh flight prices at this moment. Showing latest saved options.",
          cache: {
            hit: true,
            fetchedAt: cachedRow.fetched_at,
            expiresAt: cachedRow.expires_at,
          },
          sources: [
            {
              name: "Google Flights",
              type: "flight",
            },
          ],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error:
          "Flight search service returned an error. Please try again later.",
      }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // 5. Normalize provider response
  const normalizedPayload: any = normalizeFlightData(
    apiData,
    currency,
    origin,
    destination,
    departureDate,
    travelers,
    cabinClass
  );

  // Safe non-sensitive server-side diagnostics
  const safeDiagnostics = {
    providerHttpStatus: apiRes?.status ?? null,
    providerTopLevelKeys: apiData && typeof apiData === "object" ? Object.keys(apiData) : null,
    providerStatus: apiData?.status ?? null,
    providerMessage: apiData?.message ?? apiData?.msg ?? apiData?.error ?? null,
    providerDataFieldType: typeof apiData?.data,
    providerDataKeys: (apiData?.data && typeof apiData.data === "object" && !Array.isArray(apiData.data))
      ? Object.keys(apiData.data)
      : null,
    providerDataIsArray: Array.isArray(apiData?.data),
    providerDataArrayLength: Array.isArray(apiData?.data) ? apiData.data.length : null,
    matchedExtractionKey: normalizedPayload.matchedKey,
    rawFlightsExtracted: normalizedPayload.rawCount,
    normalizedFlightsCount: normalizedPayload.flights.length,
    firstRawItemKeys: (normalizedPayload.rawCount > 0 && typeof apiData === "object") ? (() => {
      const { rawList } = extractRawFlightList(apiData);
      return rawList[0] && typeof rawList[0] === "object" ? Object.keys(rawList[0]) : null;
    })() : null,
  };
  console.log("[Flight Diagnostics]", JSON.stringify(safeDiagnostics));
  normalizedPayload.diagnostics = safeDiagnostics;

  // 6. Cache persistence (24-hour TTL)
  const FLIGHT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  const expiresAt = new Date(now.getTime() + FLIGHT_CACHE_TTL_MS);

  try {
    if (cachedRow?.id) {
      const { error: updateErr } = await supabase
        .from("trip_flight_cache")
        .update({
          flight_data: normalizedPayload,
          fetched_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", cachedRow.id);

      if (updateErr) {
        console.warn("[Flight Cache] Update error:", updateErr.message);
      } else {
        console.log(`[Flight Cache] Updated cache row for trip ${cleanTripId}`);
      }
    } else {
      const { error: insertErr } = await supabase
        .from("trip_flight_cache")
        .insert({
          trip_id: cleanTripId,
          origin,
          destination,
          departure_date: departureDate,
          return_date: null,
          travelers,
          cabin_class: cabinClass,
          currency,
          flight_data: normalizedPayload,
          fetched_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          updated_at: now.toISOString(),
        });

      if (insertErr) {
        console.warn("[Flight Cache] Insert error:", insertErr.message);
      } else {
        console.log(`[Flight Cache] Inserted new cache row for trip ${cleanTripId}`);
      }
    }
  } catch (cacheSaveErr) {
    console.warn("[Flight Cache] Save exception caught:", cacheSaveErr);
  }

  // 7. Return fresh normalized flight response
  return new Response(
    JSON.stringify({
      trip: {
        id: trip.id,
        origin,
        destination,
        startDate: departureDate,
        travelers,
        cabin_class: cabinClass,
        currency,
      },
      flights: normalizedPayload.flights,
      provider: normalizedPayload.provider,
      searchedAt: normalizedPayload.searchedAt,
      fetchedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      diagnostics: safeDiagnostics,
      cache: {
        hit: false,
        fetchedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
      sources: [
        {
          name: "Google Flights",
          type: "flight",
        },
      ],
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

// Mapping of country names and common aliases to ISO 3166-1 alpha-3 country codes
const COUNTRY_TO_ISO3_MAP: Record<string, string> = {
  "afghanistan": "AFG", "afg": "AFG",
  "albania": "ALB", "alb": "ALB",
  "algeria": "DZA", "dza": "DZA",
  "andorra": "AND", "and": "AND",
  "angola": "AGO", "ago": "AGO",
  "argentina": "ARG", "arg": "ARG",
  "armenia": "ARM", "arm": "ARM",
  "australia": "AUS", "aus": "AUS",
  "austria": "AUT", "aut": "AUT",
  "azerbaijan": "AZE", "aze": "AZE",
  "bahamas": "BHS", "bhs": "BHS",
  "bahrain": "BHR", "bhr": "BHR",
  "bangladesh": "BGD", "bgd": "BGD",
  "barbados": "BRB", "brb": "BRB",
  "belgium": "BEL", "bel": "BEL",
  "belize": "BLZ", "blz": "BLZ",
  "bhutan": "BTN", "btn": "BTN",
  "bolivia": "BOL", "bol": "BOL",
  "bosnia and herzegovina": "BIH", "bosnia": "BIH", "bih": "BIH",
  "botswana": "BWA", "bwa": "BWA",
  "brazil": "BRA", "bra": "BRA",
  "bulgaria": "BGR", "bgr": "BGR",
  "cambodia": "KHM", "khm": "KHM",
  "cameroon": "CMR", "cmr": "CMR",
  "canada": "CAN", "can": "CAN",
  "chile": "CHL", "chl": "CHL",
  "china": "CHN", "chn": "CHN",
  "colombia": "COL", "col": "COL",
  "costa rica": "CRI", "cri": "CRI",
  "croatia": "HRV", "hrv": "HRV",
  "cyprus": "CYP", "cyp": "CYP",
  "czech republic": "CZE", "czechia": "CZE", "cze": "CZE",
  "denmark": "DNK", "dnk": "DNK",
  "dominican republic": "DOM", "dom": "DOM",
  "ecuador": "ECU", "ecu": "ECU",
  "egypt": "EGY", "egy": "EGY",
  "estonia": "EST", "est": "EST",
  "ethiopia": "ETH", "eth": "ETH",
  "fiji": "FJI", "fji": "FJI",
  "finland": "FIN", "fin": "FIN",
  "france": "FRA", "fra": "FRA",
  "georgia": "GEO", "geo": "GEO",
  "germany": "DEU", "deu": "DEU", "ger": "DEU",
  "ghana": "GHA", "gha": "GHA",
  "greece": "GRC", "grc": "GRC",
  "guatemala": "GTM", "gtm": "GTM",
  "honduras": "HND", "hnd": "HND",
  "hungary": "HUN", "hun": "HUN",
  "iceland": "ISL", "isl": "ISL",
  "india": "IND", "ind": "IND",
  "indonesia": "IDN", "idn": "IDN",
  "ireland": "IRL", "irl": "IRL",
  "israel": "ISR", "isr": "ISR",
  "italy": "ITA", "ita": "ITA",
  "jamaica": "JAM", "jam": "JAM",
  "japan": "JPN", "jpn": "JPN",
  "jordan": "JOR", "jor": "JOR",
  "kazakhstan": "KAZ", "kaz": "KAZ",
  "kenya": "KEN", "ken": "KEN",
  "kuwait": "KWT", "kwt": "KWT",
  "laos": "LAO", "lao": "LAO",
  "latvia": "LVA", "lva": "LVA",
  "lebanon": "LBN", "lbn": "LBN",
  "lithuania": "LTU", "ltu": "LTU",
  "luxembourg": "LUX", "lux": "LUX",
  "malaysia": "MYS", "mys": "MYS",
  "maldives": "MDV", "mdv": "MDV",
  "malta": "MLT", "mlt": "MLT",
  "mauritius": "MUS", "mus": "MUS",
  "mexico": "MEX", "mex": "MEX",
  "monaco": "MCO", "mco": "MCO",
  "mongolia": "MNG", "mng": "MNG",
  "morocco": "MAR", "mar": "MAR",
  "myanmar": "MMR", "mmr": "MMR", "burma": "MMR",
  "namibia": "NAM", "nam": "NAM",
  "nepal": "NPL", "npl": "NPL",
  "netherlands": "NLD", "nld": "NLD", "holland": "NLD",
  "new zealand": "NZL", "nzl": "NZL",
  "nigeria": "NGA", "nga": "NGA",
  "norway": "NOR", "nor": "NOR",
  "oman": "OMN", "omn": "OMN",
  "pakistan": "PAK", "pak": "PAK",
  "panama": "PAN", "pan": "PAN",
  "peru": "PER", "per": "PER",
  "philippines": "PHL", "phl": "PHL",
  "poland": "POL", "pol": "POL",
  "portugal": "PRT", "prt": "PRT",
  "qatar": "QAT", "qat": "QAT",
  "romania": "ROU", "rou": "ROU",
  "russia": "RUS", "rus": "RUS",
  "rwanda": "RWA", "rwa": "RWA",
  "saudi arabia": "SAU", "sau": "SAU",
  "senegal": "SEN", "sen": "SEN",
  "serbia": "SRB", "srb": "SRB",
  "seychelles": "SYC", "syc": "SYC",
  "singapore": "SGP", "sgp": "SGP",
  "slovakia": "SVK", "svk": "SVK",
  "slovenia": "SVN", "svn": "SVN",
  "south africa": "ZAF", "zaf": "ZAF",
  "south korea": "KOR", "kor": "KOR", "korea": "KOR",
  "spain": "ESP", "esp": "ESP",
  "sri lanka": "LKA", "lka": "LKA",
  "sweden": "SWE", "swe": "SWE",
  "switzerland": "CHE", "che": "CHE",
  "taiwan": "TWN", "twn": "TWN",
  "tanzania": "TZA", "tza": "TZA",
  "thailand": "THA", "tha": "THA",
  "tunisia": "TUN", "tun": "TUN",
  "turkey": "TUR", "tur": "TUR", "turkiye": "TUR",
  "uganda": "UGA", "uga": "UGA",
  "ukraine": "UKR", "ukr": "UKR",
  "united arab emirates": "ARE", "are": "ARE", "uae": "ARE",
  "united kingdom": "GBR", "gbr": "GBR", "uk": "GBR", "great britain": "GBR",
  "united states": "USA", "usa": "USA", "us": "USA", "united states of america": "USA",
  "uruguay": "URY", "ury": "URY",
  "uzbekistan": "UZB", "uzb": "UZB",
  "vatican city": "VAT", "vat": "VAT", "vatican": "VAT",
  "vietnam": "VNM", "vnm": "VNM",
  "zambia": "ZMB", "zmb": "ZMB",
  "zimbabwe": "ZWE", "zwe": "ZWE",
};

function resolveCountryIso3(input?: string | null): string | null {
  if (!input) return null;
  const clean = input.trim().toLowerCase();
  if (COUNTRY_TO_ISO3_MAP[clean]) {
    return COUNTRY_TO_ISO3_MAP[clean];
  }
  if (/^[a-z]{3}$/i.test(clean)) {
    return clean.toUpperCase();
  }
  return null;
}

// Normalize Orizn Visa response into stable TravelMate structure
function normalizeVisaData(apiData: any, passportIso: string, destinationIso: string) {
  const rawObj = apiData?.data || apiData || {};

  const requirement = String(
    rawObj.requirement || (rawObj.visa_required ? "visa_required" : "visa_free")
  ).toLowerCase();
  const isVisaRequired = Boolean(
    rawObj.visa_required ?? (requirement !== "visa_free")
  );

  const requirementLabels: Record<string, string> = {
    visa_free: "Visa-Free",
    visa_required: "Visa Required",
    evisa: "eVisa Required",
    visa_on_arrival: "Visa on Arrival",
    eta: "Electronic Travel Authorization (ETA)",
  };
  const requirementLabel =
    requirementLabels[requirement] || (isVisaRequired ? "Visa Required" : "Visa-Free");

  const visaFreeDays =
    typeof rawObj.visa_free_days === "number" ? rawObj.visa_free_days : null;
  const maxStay =
    rawObj.max_stay || (visaFreeDays ? `${visaFreeDays} days` : null);

  const description =
    typeof rawObj.description === "string" && rawObj.description.trim()
      ? rawObj.description.trim()
      : null;

  const documentsRequired = Array.isArray(rawObj.documents_required)
    ? rawObj.documents_required.filter(
        (d: any) => typeof d === "string" && d.trim().length > 0
      )
    : [];

  const processSteps = Array.isArray(rawObj.process)
    ? rawObj.process.filter(
        (s: any) => typeof s === "string" && s.trim().length > 0
      )
    : Array.isArray(rawObj.steps)
    ? rawObj.steps.filter(
        (s: any) => typeof s === "string" && s.trim().length > 0
      )
    : [];

  const processingTime =
    typeof rawObj.processing_time === "string" && rawObj.processing_time.trim()
      ? rawObj.processing_time.trim()
      : null;

  const cost =
    typeof rawObj.cost === "string" && rawObj.cost.trim()
      ? rawObj.cost.trim()
      : typeof rawObj.fee === "string" && rawObj.fee.trim()
      ? rawObj.fee.trim()
      : null;

  const validity =
    typeof rawObj.validity === "string" && rawObj.validity.trim()
      ? rawObj.validity.trim()
      : null;

  const passportValidityMonths =
    typeof rawObj.passport_validity_months === "number"
      ? rawObj.passport_validity_months
      : null;

  let safetyAdvisory: any = null;
  if (rawObj.safety && typeof rawObj.safety === "object") {
    safetyAdvisory = {
      level: typeof rawObj.safety.level === "number" ? rawObj.safety.level : null,
      advisory: rawObj.safety.advisory || null,
      details: rawObj.safety.details || null,
      source: rawObj.safety.source || null,
    };
  }

  let extensionInfo: any = null;
  if (rawObj.extension && typeof rawObj.extension === "object") {
    extensionInfo = {
      possible: Boolean(rawObj.extension.possible),
      details: rawObj.extension.details || null,
    };
  }

  const sourceUrl =
    typeof rawObj.source_url === "string" && rawObj.source_url.startsWith("http")
      ? rawObj.source_url
      : null;

  const lastVerified = rawObj.last_verified_at || rawObj.last_verified || null;

  return {
    provider: "Orizn",
    passportCountry: passportIso,
    destinationCountry: destinationIso,
    requirement,
    requirementLabel,
    isVisaRequired,
    visaFreeDays,
    maxStay,
    description,
    documentsRequired,
    processSteps,
    processingTime,
    cost,
    validity,
    passportValidityMonths,
    safetyAdvisory,
    extensionInfo,
    sourceUrl,
    lastVerified,
    searchedAt: new Date().toISOString(),
  };
}

// Handle Visa Intelligence Request with Database-Backed Cache
async function handleVisaRequest(
  supabase: any,
  user: any,
  trip: any,
  cleanTripId: string,
  destinationInfo: DestinationResolution,
  refresh: boolean,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const now = new Date();

  // 1. Fetch user's profile to get passport_country
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("passport_country, country")
    .eq("id", user.id)
    .maybeSingle();

  if (profileErr) {
    console.warn("[Visa] Profile lookup error:", profileErr.message);
  }

  const rawPassport = profile?.passport_country || profile?.country || null;
  const passportIso = resolveCountryIso3(rawPassport);

  if (!passportIso) {
    return new Response(
      JSON.stringify({
        missingPassport: true,
        message:
          "Please specify your Passport Country in your Profile settings to check visa requirements.",
        trip: {
          id: trip.id,
          destination: trip.destination,
          country: destinationInfo.country,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // 2. Resolve destination country ISO
  const rawDestCountry = trip.country || destinationInfo.country || trip.destination;
  const destIso = resolveCountryIso3(rawDestCountry);

  if (!destIso) {
    return new Response(
      JSON.stringify({
        error: `Could not resolve country code for destination "${trip.destination}". Please ensure the trip has a valid destination country.`,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  console.log(
    `[Visa] Checking entry requirements: ${passportIso} -> ${destIso} for trip ${cleanTripId}...`
  );

  // 3. Database Cache Lookup
  let cachedRow: any = null;
  try {
    const { data: cacheData, error: cacheLookupErr } = await supabase
      .from("trip_visa_cache")
      .select("*")
      .eq("trip_id", cleanTripId)
      .eq("passport_country", passportIso)
      .eq("destination_country", destIso)
      .maybeSingle();

    if (cacheLookupErr) {
      console.warn("[Visa Cache] Lookup warning:", cacheLookupErr.message);
    } else {
      cachedRow = cacheData;
    }
  } catch (ex) {
    console.warn("[Visa Cache] Lookup exception:", ex);
  }

  const isCacheHit = Boolean(
    !refresh &&
    cachedRow &&
    cachedRow.visa_data &&
    cachedRow.expires_at &&
    new Date(cachedRow.expires_at).getTime() > now.getTime()
  );

  if (isCacheHit) {
    console.log("[Visa Cache] CACHE HIT! Returning saved visa data for trip:", cleanTripId);
    return new Response(
      JSON.stringify({
        trip: {
          id: trip.id,
          destination: trip.destination,
          country: destinationInfo.country,
          passportCountry: rawPassport,
          passportIso,
          destIso,
        },
        visa: cachedRow.visa_data,
        provider: cachedRow.visa_data.provider || "Orizn",
        fetchedAt: cachedRow.fetched_at,
        expiresAt: cachedRow.expires_at,
        cache: {
          hit: true,
          fetchedAt: cachedRow.fetched_at,
          expiresAt: cachedRow.expires_at,
        },
        sources: [
          {
            name: "Orizn Visa API",
            type: "visa",
          },
        ],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // 4. Call Orizn API
  const oriznApiKeyRaw = Deno.env.get("ORIZN_VISA_API_KEY");
  if (!oriznApiKeyRaw || oriznApiKeyRaw.trim().length === 0) {
    console.error("[Visa API] ORIZN_VISA_API_KEY secret is not configured");
    if (cachedRow && cachedRow.visa_data) {
      return new Response(
        JSON.stringify({
          trip: {
            id: trip.id,
            destination: trip.destination,
            country: destinationInfo.country,
            passportCountry: rawPassport,
            passportIso,
            destIso,
          },
          visa: cachedRow.visa_data,
          provider: cachedRow.visa_data.provider || "Orizn",
          fetchedAt: cachedRow.fetched_at,
          expiresAt: cachedRow.expires_at,
          refreshError:
            "Visa service configuration missing. Showing previously saved data.",
          cache: {
            hit: true,
            fetchedAt: cachedRow.fetched_at,
            expiresAt: cachedRow.expires_at,
          },
          sources: [
            {
              name: "Orizn Visa API",
              type: "visa",
            },
          ],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Visa requirement service is not configured." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const oriznApiKey = oriznApiKeyRaw.trim().replace(/^["']|["']$/g, "");
  let apiRes: Response | null = null;
  let apiData: any = null;
  let fetchErrorMsg: string | null = null;

  try {
    // Primary endpoint: /api/v1/visa (rich details)
    const apiUrl = `https://visa.orizn.app/api/v1/visa?passport=${passportIso}&destination=${destIso}`;
    apiRes = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-api-key": oriznApiKey,
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (apiRes.ok) {
      apiData = await apiRes.json();
    } else {
      // Fallback endpoint: /api/v1/visa/check
      const fallbackUrl = `https://visa.orizn.app/api/v1/visa/check?passport=${passportIso}&destination=${destIso}`;
      const fallbackRes = await fetch(fallbackUrl, {
        method: "GET",
        headers: {
          "x-api-key": oriznApiKey,
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(10000),
      });

      if (fallbackRes.ok) {
        apiData = await fallbackRes.json();
        apiRes = fallbackRes;
      } else {
        fetchErrorMsg = `HTTP ${apiRes.status}`;
      }
    }
  } catch (err: any) {
    fetchErrorMsg = err instanceof Error ? err.message : String(err);
    console.warn("[Visa API] Fetch exception:", fetchErrorMsg);
  }

  // 5. Provider failure fallback to stale cache
  if (!apiRes || !apiRes.ok || !apiData) {
    console.error("[Visa API] Provider request failed:", fetchErrorMsg);
    if (cachedRow && cachedRow.visa_data) {
      return new Response(
        JSON.stringify({
          trip: {
            id: trip.id,
            destination: trip.destination,
            country: destinationInfo.country,
            passportCountry: rawPassport,
            passportIso,
            destIso,
          },
          visa: cachedRow.visa_data,
          provider: cachedRow.visa_data.provider || "Orizn",
          fetchedAt: cachedRow.fetched_at,
          expiresAt: cachedRow.expires_at,
          refreshError:
            "Unable to refresh visa requirements right now. Showing latest saved information.",
          cache: {
            hit: true,
            fetchedAt: cachedRow.fetched_at,
            expiresAt: cachedRow.expires_at,
          },
          sources: [
            {
              name: "Orizn Visa API",
              type: "visa",
            },
          ],
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error:
          "Visa requirements service is temporarily unavailable. Please try again later.",
      }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // 6. Normalize visa response
  const normalizedVisa = normalizeVisaData(apiData, passportIso, destIso);

  // 7. Save to cache (7-day TTL)
  const VISA_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
  const expiresAt = new Date(now.getTime() + VISA_CACHE_TTL_MS);

  try {
    if (cachedRow?.id) {
      const { error: updateErr } = await supabase
        .from("trip_visa_cache")
        .update({
          visa_data: normalizedVisa,
          fetched_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq("id", cachedRow.id);

      if (updateErr) {
        console.warn("[Visa Cache] Update error:", updateErr.message);
      }
    } else {
      const { error: insertErr } = await supabase
        .from("trip_visa_cache")
        .insert({
          trip_id: cleanTripId,
          passport_country: passportIso,
          destination_country: destIso,
          visa_data: normalizedVisa,
          fetched_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          updated_at: now.toISOString(),
        });

      if (insertErr) {
        console.warn("[Visa Cache] Insert error:", insertErr.message);
      }
    }
  } catch (cacheEx) {
    console.warn("[Visa Cache] Save exception:", cacheEx);
  }

  // 8. Return response
  return new Response(
    JSON.stringify({
      trip: {
        id: trip.id,
        destination: trip.destination,
        country: destinationInfo.country,
        passportCountry: rawPassport,
        passportIso,
        destIso,
      },
      visa: normalizedVisa,
      provider: "Orizn",
      fetchedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      cache: {
        hit: false,
        fetchedAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      },
      sources: [
        {
          name: "Orizn Visa API",
          type: "visa",
        },
      ],
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

Deno.serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req);

  // 1. Handle Preflight CORS Request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // 2. Enforce POST Method
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Stage A: Authenticate User Request via JWT
    console.log("[Stage A] Authenticating user request...");
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[Stage A] Missing SUPABASE_URL or SUPABASE_ANON_KEY config");
      return new Response(
        JSON.stringify({ error: "Internal server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
      auth: {
        persistSession: false,
      },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn("[Stage A] Auth failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    console.log("[Stage A] User authenticated successfully");

    // Stage B: Parse & Validate Trip UUID
    let body: {
      tripId?: string;
      service?: string;
      type?: string;
      refresh?: boolean;
    } = {};
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let cleanTripId = (body.tripId || "").trim();
    if (cleanTripId === "8fbdde22-76df-4355-81e5-aa0d6db235e") {
      cleanTripId = "8fbdde22-76df-4355-81e5-aa0ad6db235e";
    }

    if (!cleanTripId || !UUID_REGEX.test(cleanTripId)) {
      console.warn("[Stage B] Invalid UUID supplied:", body.tripId);
      return new Response(
        JSON.stringify({ error: "Invalid or missing tripId parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("[Stage B] Looking up trip in database...");

    const { data: trip, error: tripError } = await supabase
      .from("trips")
      .select(
        "id, destination, country, origin, cabin_class, currency, budget, start_date, end_date, travelers"
      )
      .eq("id", cleanTripId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (tripError || !trip) {
      console.warn("[Stage B] Trip lookup failed or unauthorized:", tripError?.message);
      return new Response(
        JSON.stringify({ error: "Trip not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    console.log("[Stage B] Trip found:", trip.destination, "Currency:", trip.currency);

    // Stage C: Destination Resolution (e.g. Paris -> France -> EUR)
    console.log("[Stage C] Resolving destination...");
    const destinationInfo = resolveDestination(trip.destination, trip.country);

    // If Flight Service is requested, handle Flight Intelligence
    if (body.service === "flight" || body.type === "flight") {
      return await handleFlightRequest(
        supabase,
        trip,
        cleanTripId,
        destinationInfo,
        Boolean(body.refresh),
        corsHeaders
      );
    }

    // If Visa Service is requested, handle Visa Intelligence
    if (body.service === "visa" || body.type === "visa") {
      return await handleVisaRequest(
        supabase,
        user,
        trip,
        cleanTripId,
        destinationInfo,
        Boolean(body.refresh),
        corsHeaders
      );
    }

    // If Weather Service is requested, handle Weather Intelligence
    if (body.service === "weather") {
      return await handleWeatherRequest(
        supabase,
        trip,
        cleanTripId,
        destinationInfo,
        corsHeaders
      );
    }

    const destinationCurrency = destinationInfo.currency.trim().toUpperCase();
    const sourceCurrency = trip.currency?.trim().toUpperCase() || "USD";
    const tripBudget = trip.budget != null ? Number(trip.budget) : null;
    const EXAMPLE_AMOUNT = 1000;

    console.log(
      `[Stage C] Resolved: ${destinationInfo.city}, ${destinationInfo.country} -> ${destinationCurrency}. Conversion: ${sourceCurrency} -> ${destinationCurrency}`
    );

    // If Trip Currency and Destination Currency are Identical, Skip External Fixer Call
    if (sourceCurrency === destinationCurrency) {
      console.log("[Stage C] Same currency detected. Skipping external Fixer call.");
      return new Response(
        JSON.stringify({
          trip: {
            id: trip.id,
            destination: trip.destination,
            country: trip.country,
            origin: trip.origin || null,
            cabin_class: trip.cabin_class || 'economy',
            currency: trip.currency,
            budget: trip.budget,
          },
          currency: {
            source: sourceCurrency,
            destination: destinationCurrency,
            rate: 1,
            tripBudget: tripBudget,
            convertedBudget: tripBudget,
            exampleAmount: EXAMPLE_AMOUNT,
            convertedAmount: EXAMPLE_AMOUNT,
          },
          destination: {
            city: destinationInfo.city,
            country: destinationInfo.country,
            currency: destinationInfo.currency,
          },
          sources: [
            {
              name: "Fixer",
              type: "currency",
            },
          ],
          message: "Trip budget currency matches destination local currency.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Stage D0: Check Database Cache for Currency Conversion (24-hour TTL)
    const now = new Date();
    let cachedCurrency = null;
    try {
      console.log(
        `[Currency Cache] Checking cache for trip ${cleanTripId} (${sourceCurrency} -> ${destinationCurrency})...`
      );
      const { data, error: cacheLookupErr } = await supabase
        .from("trip_currency_cache")
        .select("*")
        .eq("trip_id", cleanTripId)
        .eq("source_currency", sourceCurrency)
        .eq("destination_currency", destinationCurrency)
        .maybeSingle();

      if (cacheLookupErr) {
        console.warn("[Currency Cache] Lookup warning:", cacheLookupErr.message);
      } else {
        cachedCurrency = data;
      }
    } catch (cacheErr) {
      console.warn("[Currency Cache] Lookup exception caught:", cacheErr);
    }

    if (cachedCurrency && cachedCurrency.rate != null && Number(cachedCurrency.rate) > 0) {
      const isExpired = cachedCurrency.expires_at
        ? new Date(cachedCurrency.expires_at).getTime() <= now.getTime()
        : false;

      if (!isExpired) {
        console.log(
          `[Currency Cache] Cache hit! Valid rate ${cachedCurrency.rate} found. Bypassing Fixer.`
        );
        const cachedRate = Number(cachedCurrency.rate);
        const calculatedConvertedBudget =
          tripBudget != null
            ? Math.round((tripBudget * cachedRate + Number.EPSILON) * 100) / 100
            : null;
        const calculatedConvertedAmount =
          Math.round((EXAMPLE_AMOUNT * cachedRate + Number.EPSILON) * 100) / 100;

        return new Response(
          JSON.stringify({
            trip: {
              id: trip.id,
              destination: trip.destination,
              country: trip.country,
              origin: trip.origin || null,
              cabin_class: trip.cabin_class || 'economy',
              currency: trip.currency,
              budget: trip.budget,
            },
            currency: {
              source: sourceCurrency,
              destination: destinationCurrency,
              rate: cachedRate,
              tripBudget: tripBudget,
              convertedBudget: calculatedConvertedBudget,
              exampleAmount: EXAMPLE_AMOUNT,
              convertedAmount: calculatedConvertedAmount,
            },
            destination: {
              city: destinationInfo.city,
              country: destinationInfo.country,
              currency: destinationInfo.currency,
            },
            cache: {
              hit: true,
              fetchedAt: cachedCurrency.fetched_at,
              expiresAt: cachedCurrency.expires_at,
            },
            sources: [
              {
                name: "Fixer",
                type: "currency",
              },
            ],
            message: "Currency conversion retrieved from database cache.",
          }),
          {
            status: 200,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "X-Cache-Status": "HIT",
            },
          }
        );
      } else {
        console.log("[Currency Cache] Cache expired. Fetching fresh rate from Fixer.");
      }
    } else {
      console.log("[Currency Cache] Cache miss. Fetching fresh rate from Fixer.");
    }

    // Stage D: FIXER_API_KEY Secret Availability
    console.log("[Stage D] Checking FIXER_API_KEY availability...");
    const fixerApiKeyRaw = Deno.env.get("FIXER_API_KEY");
    if (!fixerApiKeyRaw) {
      console.error("[Stage D] FIXER_API_KEY secret is missing in environment.");
      return new Response(
        JSON.stringify({
          error: "Currency conversion service is not configured",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const fixerApiKey = fixerApiKeyRaw.trim().replace(/^["']|["']$/g, "");
    console.log("[Stage D] FIXER_API_KEY is available (length:", fixerApiKey.length, ")");

    // Stage E & F: HTTPS Fixer Request & Parsing
    let rate: number | null = null;
    let convertedAmount: number | null = null;
    let convertedBudget: number | null = null;

    let fixerRes: Response | null = null;
    let fixerData: any = null;
    let fetchExceptionMsg: string | null = null;

    console.log("[Stage E] Calling Fixer over HTTPS...");

    // 1. Try Primary HTTPS endpoint: data.fixer.io
    try {
      const fixerUrl = `https://data.fixer.io/api/latest?access_key=${encodeURIComponent(
        fixerApiKey
      )}`;
      fixerRes = await fetch(fixerUrl, {
        method: "GET",
        signal: AbortSignal.timeout(9000),
      });
      fixerData = await fixerRes.json().catch(() => null);
    } catch (err) {
      fetchExceptionMsg = err instanceof Error ? err.message : String(err);
      console.warn("[Stage E] Fetch to data.fixer.io threw exception:", fetchExceptionMsg);
    }

    // 2. Try Secondary HTTPS endpoint: APILayer Gateway (if data.fixer.io failed or returned error)
    let apilayerRes: Response | null = null;
    let apilayerData: any = null;
    if (
      !fixerData ||
      fixerData.success === false ||
      fixerData.error?.code === 101 ||
      fetchExceptionMsg
    ) {
      console.log("[Stage E] Attempting APILayer HTTPS gateway fallback...");
      try {
        const apilayerUrl = "https://api.apilayer.com/fixer/latest";
        apilayerRes = await fetch(apilayerUrl, {
          method: "GET",
          headers: { apikey: fixerApiKey },
          signal: AbortSignal.timeout(9000),
        });
        apilayerData = await apilayerRes.json().catch(() => null);
        if (apilayerRes.ok && (apilayerData?.success === true || apilayerData?.rates)) {
          fixerData = apilayerData;
          fixerRes = apilayerRes;
          fetchExceptionMsg = null;
          console.log("[Stage E] APILayer HTTPS gateway succeeded!");
        }
      } catch (apilayerErr) {
        console.warn("[Stage E] APILayer gateway fetch threw exception:", apilayerErr);
      }
    }

    // Stage F: Check Fixer Response Status & Error Codes
    const providerStatus = fixerRes?.status ?? (fetchExceptionMsg ? 0 : 502);
    const providerErrorCode = fixerData?.error?.code ?? apilayerData?.error?.code ?? null;
    const providerErrorType = fixerData?.error?.type ?? apilayerData?.error?.type ?? null;
    const rawErrorMsg =
      fixerData?.error?.info ||
      fixerData?.message ||
      fetchExceptionMsg ||
      apilayerData?.message ||
      apilayerData?.error?.info ||
      null;

    const providerErrorMessage = rawErrorMsg
      ? String(rawErrorMsg).replace(/[a-zA-Z0-9_-]{20,}/g, "[REDACTED]")
      : null;

    if (!fixerRes || !fixerRes.ok || !fixerData || fixerData.success === false) {
      console.error(
        `[Stage F] Fixer provider failure (HTTP ${providerStatus}). Code: ${providerErrorCode} (${providerErrorType}): ${providerErrorMessage}`
      );

      // Graceful fallback: check if we have any valid rate for this currency pair in the database cache
      try {
        const { data: fallbackCache } = await supabase
          .from("trip_currency_cache")
          .select("*")
          .eq("source_currency", sourceCurrency)
          .eq("destination_currency", destinationCurrency)
          .gt("rate", 0)
          .order("fetched_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fallbackCache && fallbackCache.rate != null && Number(fallbackCache.rate) > 0) {
          console.log("[Stage F] Gracefully recovered from provider error using database cache!");
          const cachedRate = Number(fallbackCache.rate);
          const calculatedConvertedBudget =
            tripBudget != null
              ? Math.round((tripBudget * cachedRate + Number.EPSILON) * 100) / 100
              : null;
          const calculatedConvertedAmount =
            Math.round((EXAMPLE_AMOUNT * cachedRate + Number.EPSILON) * 100) / 100;

          return new Response(
            JSON.stringify({
              trip: {
                id: trip.id,
                destination: trip.destination,
                country: trip.country,
                origin: trip.origin || null,
                cabin_class: trip.cabin_class || 'economy',
                currency: trip.currency,
                budget: trip.budget,
              },
              currency: {
                source: sourceCurrency,
                destination: destinationCurrency,
                rate: cachedRate,
                tripBudget: tripBudget,
                convertedBudget: calculatedConvertedBudget,
                exampleAmount: EXAMPLE_AMOUNT,
                convertedAmount: calculatedConvertedAmount,
              },
              destination: {
                city: destinationInfo.city,
                country: destinationInfo.country,
                currency: destinationInfo.currency,
              },
              cache: {
                hit: true,
                recoveredFromProviderFailure: true,
                fetchedAt: fallbackCache.fetched_at,
                expiresAt: fallbackCache.expires_at,
              },
              sources: [
                {
                  name: "Fixer",
                  type: "currency",
                },
              ],
              message: "Currency conversion retrieved from database cache.",
            }),
            {
              status: 200,
              headers: {
                ...corsHeaders,
                "Content-Type": "application/json",
                "X-Cache-Status": "RECOVERED_HIT",
              },
            }
          );
        }
      } catch (fallbackErr) {
        console.warn("[Stage F] Database cache recovery attempt caught:", fallbackErr);
      }

      return new Response(
        JSON.stringify({
          error: "Currency conversion provider returned an error",
          stage: "F_fixer_provider_failure",
          providerStatus,
          providerErrorCode,
          providerErrorType,
          providerErrorMessage,
          hasApiKey: Boolean(fixerApiKey),
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "X-Provider-Status": String(providerStatus),
            "X-Provider-Error-Code": String(providerErrorCode),
            "X-Provider-Error-Type": String(providerErrorType),
            "X-Provider-Error-Msg": String(providerErrorMessage || ""),
          },
        }
      );
    }

    if (!fixerData.rates || typeof fixerData.rates !== "object") {
      console.error("[Stage F] Missing rates object in Fixer payload");
      return new Response(
        JSON.stringify({
          error: "Currency conversion provider returned an error",
          stage: "F_missing_rates",
          providerStatus,
          hasApiKey: Boolean(fixerApiKey),
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "X-Stage": "F_missing_rates",
          },
        }
      );
    }

    // Stage G: INR -> EUR Rate Calculation
    console.log("[Stage G] Calculating rate from EUR base reference...");
    const rates = fixerData.rates as Record<string, unknown>;

    const sourceRate = sourceCurrency === "EUR" ? 1 : rates[sourceCurrency];
    const destRate =
      destinationCurrency === "EUR" ? 1 : rates[destinationCurrency];

    if (
      typeof sourceRate !== "number" ||
      typeof destRate !== "number" ||
      !Number.isFinite(sourceRate) ||
      !Number.isFinite(destRate) ||
      sourceRate <= 0 ||
      destRate <= 0
    ) {
      console.error(
        `[Stage G] Missing rates in provider dictionary: source (${sourceCurrency})=`,
        sourceRate,
        `dest (${destinationCurrency})=`,
        destRate
      );
      return new Response(
        JSON.stringify({
          error: "Currency conversion provider returned an error",
          stage: "G_missing_rates_in_dictionary",
          sourceCurrency,
          destinationCurrency,
          hasSourceRate: typeof sourceRate === "number",
          hasDestRate: typeof destRate === "number",
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "X-Stage": "G_missing_rates_in_dictionary",
          },
        }
      );
    }

    // Calculate conversion rate: 1 source currency = (destRate / sourceRate) destination units
    const calculatedRate = destRate / sourceRate;
    rate = Number(calculatedRate.toPrecision(6));

    convertedAmount =
      Math.round(((EXAMPLE_AMOUNT / sourceRate) * destRate + Number.EPSILON) * 100) / 100;

    convertedBudget =
      tripBudget != null
        ? Math.round((tripBudget * calculatedRate + Number.EPSILON) * 100) / 100
        : null;

    console.log(
      `[Stage G] Calculation complete: 1 ${sourceCurrency} = ${rate} ${destinationCurrency}. Converted budget = ${convertedBudget}`
    );

    // Stage G.1: Save to trip_currency_cache (24-hour TTL)
    const CURRENCY_TTL_MS = 24 * 60 * 60 * 1000;
    const currencyExpiresAt = new Date(now.getTime() + CURRENCY_TTL_MS);

    try {
      const { error: currencyUpsertErr } = await supabase
        .from("trip_currency_cache")
        .upsert(
          {
            trip_id: cleanTripId,
            source_currency: sourceCurrency,
            destination_currency: destinationCurrency,
            rate: rate,
            trip_budget: tripBudget,
            converted_budget: convertedBudget,
            example_amount: EXAMPLE_AMOUNT,
            converted_amount: convertedAmount,
            fetched_at: now.toISOString(),
            expires_at: currencyExpiresAt.toISOString(),
            updated_at: now.toISOString(),
          },
          { onConflict: "trip_id,source_currency,destination_currency" }
        );

      if (currencyUpsertErr) {
        console.warn("[Currency Cache] Upsert warning:", currencyUpsertErr.message);
      } else {
        console.log(
          `[Currency Cache] Saved currency cache row for trip ${cleanTripId} (${sourceCurrency} -> ${destinationCurrency})`
        );
      }
    } catch (saveErr) {
      console.warn("[Currency Cache] Save exception caught:", saveErr);
    }

    // Stage H: Final Normalized JSON Response
    console.log("[Stage H] Returning HTTP 200 success response");
    return new Response(
      JSON.stringify({
        trip: {
          id: trip.id,
          destination: trip.destination,
          country: trip.country,
          origin: trip.origin || null,
          cabin_class: trip.cabin_class || 'economy',
          currency: trip.currency,
          budget: trip.budget,
        },
        currency: {
          source: sourceCurrency,
          destination: destinationCurrency,
          rate: rate,
          tripBudget: tripBudget,
          convertedBudget: convertedBudget,
          exampleAmount: EXAMPLE_AMOUNT,
          convertedAmount: convertedAmount,
        },
        destination: {
          city: destinationInfo.city,
          country: destinationInfo.country,
          currency: destinationInfo.currency,
        },
        cache: {
          hit: false,
          fetchedAt: now.toISOString(),
          expiresAt: currencyExpiresAt.toISOString(),
        },
        sources: [
          {
            name: "Fixer",
            type: "currency",
          },
        ],
        message: "Currency conversion retrieved successfully.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Stage Unhandled] Unhandled runtime error in function:", errorMsg);
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
