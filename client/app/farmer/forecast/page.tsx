"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRole } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Legend,
} from "recharts";

type ForecastWeek = {
  ds: string;
  yhat_lkr: number;
  yhat_lower_lkr: number;
  yhat_upper_lkr: number;
  climate_assumed: {
    temperature: number;
    rainfall: number;
    humidity: number;
  };
  xai_farmer?: {
    explanation?: string;
  };
};

type ForecastResponse = {
  region: string;
  commodity: string;
  forecast: ForecastWeek[];
};

type MetaResponse = {
  regions?: string[];
  commodities?: string[];
};

export default function FarmerForecastPage() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [regions, setRegions] = useState<string[]>([]);
  const [commodities, setCommodities] = useState<string[]>([]);
  const [region, setRegion] = useState("");
  const [commodity, setCommodity] = useState("");
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const role = getRole();

    if (role !== "FARMER") {
      router.replace("/login");
      return;
    }

    setAuthorized(true);
  }, [router]);

  useEffect(() => {
    if (!authorized) return;

    const fetchMeta = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/forecasts/meta`
        );

        if (!res.ok) {
          throw new Error("Unable to load forecast options.");
        }

        const data: MetaResponse = await res.json();

        const loadedRegions = data.regions ?? [];
        const loadedCommodities = data.commodities ?? [];

        setRegions(loadedRegions);
        setCommodities(loadedCommodities);

        if (loadedRegions.length > 0) setRegion(loadedRegions[0]);
        if (loadedCommodities.length > 0) setCommodity(loadedCommodities[0]);
      } catch (err) {
        console.error("Metadata loading error", err);
        setError("Unable to load forecast options.");
      }
    };

    void fetchMeta();
  }, [authorized]);

  useEffect(() => {
    if (!authorized || !region || !commodity) return;
    void fetchForecast();
  }, [authorized, region, commodity]);

  const fetchForecast = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/forecasts?region=${encodeURIComponent(
          region
        )}&commodity=${encodeURIComponent(commodity)}`
      );

      if (!res.ok) throw new Error("No forecast available.");

      const data: ForecastResponse = await res.json();
      setForecastData(data);
      setSelectedWeekIndex(0);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to load forecast.";
      setError(message);
      setForecastData(null);
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) return null;

  const selectedWeek = forecastData?.forecast?.[selectedWeekIndex];

  const calculateMarketSignal = () => {
    if (!forecastData || !selectedWeek) return "STABLE MARKET";

    const prices = forecastData.forecast.map((f) => f.yhat_lkr);
    const avgPrice =
      prices.reduce((a: number, b: number) => a + b, 0) / prices.length;

    const selectedPrice = selectedWeek.yhat_lkr;

    if (selectedPrice > avgPrice * 1.05) return "GOOD SELLING WEEK";
    if (selectedPrice < avgPrice * 0.95) return "LOW PRICE RISK";
    return "STABLE MARKET";
  };

  const generateRecommendation = (marketSignal: string) => {
    if (marketSignal === "GOOD SELLING WEEK") {
      return "Prices are higher than usual this week. This may be a good week to sell.";
    }

    if (marketSignal === "LOW PRICE RISK") {
      return "Prices are a bit lower this week. If possible, you may wait before selling.";
    }

    return "Prices look stable this week. There is no urgent market change.";
  };

  if (!selectedWeek || !forecastData) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="outline"
            onClick={() => router.push("/farmer/dashboard")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="text-center text-gray-500 pt-20">
            {loading
              ? "Analyzing market forecast..."
              : "Select a region and vegetable to view the forecast."}
          </div>
          {error && (
            <div className="mt-6 bg-red-100 text-red-600 p-4 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  const marketSignal = calculateMarketSignal();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/farmer/dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div>
            <h1 className="text-3xl font-bold">FarmLink Market Intelligence</h1>
            <p className="text-gray-500">Weekly price forecast for farmers</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-2">Region</label>
            <select
              className="w-full border rounded p-2"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">Vegetable</label>
            <select
              className="w-full border rounded p-2"
              value={commodity}
              onChange={(e) => setCommodity(e.target.value)}
            >
              {commodities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">Prediction Week</label>
            <select
              className="w-full border rounded p-2"
              value={selectedWeekIndex}
              onChange={(e) => setSelectedWeekIndex(Number(e.target.value))}
            >
              {forecastData.forecast.map((week, index) => (
                <option key={week.ds} value={index}>
                  {new Date(week.ds).toLocaleDateString("en-GB", {
                    dateStyle: "medium",
                  })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && (
          <div className="text-green-600 font-medium">
            Analyzing market forecast...
          </div>
        )}

        {error && (
          <div className="bg-red-100 text-red-600 p-4 rounded">{error}</div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded shadow">
            <h2 className="text-lg font-semibold mb-4">
              Price Prediction Trend (LKR/kg)
            </h2>

            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastData.forecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ds" />
                  <YAxis tickFormatter={(v: number) => `Rs ${v}`} />
                  <Tooltip />
                  <Legend />

                  <Area
                    dataKey="yhat_upper_lkr"
                    fill="#86efac"
                    fillOpacity={0.3}
                    name="Highest Price Range"
                  />

                  <Area
                    dataKey="yhat_lower_lkr"
                    fill="#ffffff"
                    name="Lowest Price Range"
                  />

                  <Line
                    dataKey="yhat_lkr"
                    stroke="#16a34a"
                    strokeWidth={3}
                    dot
                    name="Expected Price"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-green-50 p-6 rounded-xl border border-green-200">
              <h3 className="text-sm text-green-700 mb-2">Expected Price</h3>
              <div className="text-3xl font-bold text-green-900">
                Rs {selectedWeek.yhat_lkr.toFixed(2)} / kg
              </div>
            </div>

            <div className="p-6 rounded-xl border bg-blue-50 border-blue-200">
              <h3 className="font-semibold mb-3">Simple Market Insight</h3>

              <p className="text-sm leading-relaxed">
                {selectedWeek.xai_farmer?.explanation ||
                  "This week's forecast is based on market and seasonal patterns."}
              </p>

              <div className="mt-4 text-sm text-blue-800">
                <div className="font-medium mb-2">Estimated climate assumptions</div>
                Estimated temperature:{" "}
                {selectedWeek.climate_assumed.temperature.toFixed(1)}°C
                <br />
                Estimated rainfall:{" "}
                {selectedWeek.climate_assumed.rainfall.toFixed(1)} mm
                <br />
                Estimated humidity:{" "}
                {selectedWeek.climate_assumed.humidity.toFixed(1)}%
              </div>

              <p className="mt-3 text-xs text-blue-700 leading-5">
                These values are based on historical weekly averages and are used
                as forecast assumptions, not actual future weather observations.
              </p>
            </div>

            <div
              className={`p-5 rounded-xl border ${
                marketSignal === "GOOD SELLING WEEK"
                  ? "bg-green-50 border-green-300"
                  : marketSignal === "LOW PRICE RISK"
                  ? "bg-red-50 border-red-300"
                  : "bg-yellow-50 border-yellow-300"
              }`}
            >
              <h3 className="font-semibold mb-2">Farmer Advice</h3>
              <p className="text-sm">{generateRecommendation(marketSignal)}</p>

              <div className="mt-3 text-xs text-gray-600">
                Market Signal:
                <span className="ml-2 font-bold">{marketSignal}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border bg-gray-100 text-xs text-gray-600 leading-5">
              Advisory only. Actual market prices may change due to supply,
              demand, weather, and transport conditions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}