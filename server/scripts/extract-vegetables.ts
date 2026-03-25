import * as fs from "fs";
import * as path from "path";

const filePath = path.join(
  process.cwd(),
  "src",
  "data",
  "final_forecasts_2026_weekly_xgb_final.json"
);

const raw = fs.readFileSync(filePath, "utf-8");
const json = JSON.parse(raw);

// Extract unique commodities
const commodities = [
  ...new Set(json.pairs.map((p: any) => p.commodity)),
];

// Convert to seed format
const vegetables = commodities.map((name: string) => ({
  name,
  slug: name.toLowerCase().replace(/\s+/g, "-"),
}));

console.log("Vegetables for seed:\n");
console.log(JSON.stringify(vegetables, null, 2));