"use client";

import { useState, useEffect } from "react";
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

export default function ForecastDashboard() {
  const [regions, setRegions] = useState<string[]>([]);
  const [commodities, setCommodities] = useState<string[]>([]);

  const [region, setRegion] = useState("");
  const [commodity, setCommodity] = useState("");

  const [forecastData, setForecastData] = useState<any>(null);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // -----------------------------
  // Load Metadata
  // -----------------------------
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/forecasts/meta`
        );

        const data = await res.json();

        setRegions(data.regions || []);
        setCommodities(data.commodities || []);

        if (data.regions?.length > 0) setRegion(data.regions[0]);
        if (data.commodities?.length > 0)
          setCommodity(data.commodities[0]);
      } catch (err) {
        console.error("Metadata loading error", err);
      }
    };

    fetchMeta();
  }, []);

  // -----------------------------
  // Auto Forecast Fetch
  // -----------------------------
  useEffect(() => {
    if (region && commodity) {
      fetchForecast();
    }
  }, [region, commodity]);

  const fetchForecast = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/forecasts?region=${region}&commodity=${commodity}`
      );

      if (!res.ok) throw new Error("No forecast available.");

      const data = await res.json();

      setForecastData(data);
      setSelectedWeekIndex(0);
    } catch (err: any) {
      setError(err.message);
      setForecastData(null);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------
  // Research Intelligence Engine
  // -----------------------------

  const selectedWeek =
    forecastData?.forecast?.[selectedWeekIndex];

  if (!selectedWeek || !forecastData) return (
    <div className="p-10 text-center text-gray-500">
      Select region and vegetable to view forecast.
    </div>
  );

  // Market Signal Classifier
  const calculateMarketSignal = () => {
    const prices = forecastData.forecast.map(
      (f: any) => f.yhat_lkr
    );

    const avgPrice =
      prices.reduce((a: number, b: number) => a + b, 0) /
      prices.length;

    const selectedPrice = selectedWeek.yhat_lkr;

    if (selectedPrice > avgPrice * 1.05) return "GOOD_SELL";
    if (selectedPrice < avgPrice * 0.95) return "RISK";
    return "NEUTRAL";
  };

  const marketSignal = calculateMarketSignal();

  const generateRecommendation = () => {
    if (marketSignal === "GOOD_SELL")
      return "✅ Market price is higher than average. Consider selling harvest.";

    if (marketSignal === "RISK")
      return "⚠ Market price is slightly low compared to average.";

    return "🌾 Market is stable this week.";
  };

  // -----------------------------
  // UI Rendering
  // -----------------------------

  return (
    <div className="min-h-screen bg-gray-50 p-8">

      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">
            🌾 FarmLink Market Intelligence AI
          </h1>
          <p className="text-gray-500">
            Explainable Weekly Price Prediction System
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-white p-6 rounded-xl shadow grid md:grid-cols-3 gap-4">

          <div>
            <label className="block text-sm mb-2">Region</label>
            <select
              className="w-full border rounded p-2"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              {regions.map((r) => (
                <option key={r}>{r}</option>
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
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm mb-2">
              Prediction Week
            </label>

            <select
              className="w-full border rounded p-2"
              value={selectedWeekIndex}
              onChange={(e) =>
                setSelectedWeekIndex(Number(e.target.value))
              }
            >
              {forecastData.forecast.map(
                (week: any, index: number) => (
                  <option key={index} value={index}>
                    {new Date(week.ds).toLocaleDateString("en-GB", {
                      dateStyle: "medium",
                    })}
                  </option>
                )
              )}
            </select>
          </div>

        </div>

        {/* Loading */}
        {loading && (
          <div className="text-green-600 font-medium">
            Analyzing market intelligence...
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-100 text-red-600 p-4 rounded">
            {error}
          </div>
        )}

        {/* Forecast Visualization */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded shadow">

            <h2 className="text-lg font-semibold mb-4">
              🌾 Price Prediction Trend (LKR/kg)
            </h2>

            <div className="h-[400px]">

              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastData.forecast}>

                  <CartesianGrid strokeDasharray="3 3" />

                  <XAxis dataKey="ds" />

                  <YAxis tickFormatter={(v) => `Rs ${v}`} />

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

          {/* Insight Panel */}
          <div className="space-y-6">

            {/* Price Card */}
            <div className="bg-green-50 p-6 rounded-xl border border-green-200">
              <h3 className="text-sm text-green-700 mb-2">
                Expected Market Price
              </h3>

              <div className="text-3xl font-bold text-green-900">
                Rs {selectedWeek.yhat_lkr.toFixed(2)} / kg
              </div>
            </div>

            {/* AI Insight */}
            <div className="p-6 rounded-xl border bg-blue-50 border-blue-200">
              <h3 className="font-semibold mb-3">
                🤖 Explainable AI Insight
              </h3>

              <p className="text-sm leading-relaxed">
                {selectedWeek.xai_farmer.explanation}
              </p>

              <div className="mt-4 text-sm text-blue-800">
                🌡 Temperature:{" "}
                {selectedWeek.climate_assumed.temperature.toFixed(1)}°C
                <br />
                🌧 Rainfall:{" "}
                {selectedWeek.climate_assumed.rainfall.toFixed(1)} mm
              </div>
            </div>

            {/* Decision Support Panel */}
            <div
              className={`p-5 rounded-xl border ${
                marketSignal === "GOOD_SELL"
                  ? "bg-green-50 border-green-300"
                  : marketSignal === "RISK"
                  ? "bg-red-50 border-red-300"
                  : "bg-yellow-50 border-yellow-300"
              }`}
            >
              <h3 className="font-semibold mb-2">
                🌾 Farmer Decision AI
              </h3>

              <p className="text-sm">
                {generateRecommendation()}
              </p>

              <div className="mt-3 text-xs text-gray-600">
                Market Signal:
                <span className="ml-2 font-bold">
                  {marketSignal.replace("_", " ")}
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}