# src/train_xgb_weekly.py

from __future__ import annotations
import json
from pathlib import Path
from datetime import datetime
import numpy as np
import pandas as pd
import joblib

import xgboost as xgb
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# -----------------------------
# HELPERS (No global variables here to prevent Windows deadlock!)
# -----------------------------
def safe_float(x, default=np.nan):
    try:
        return float(x)
    except Exception:
        return default

def clean_and_prepare(raw_csv: Path) -> pd.DataFrame:
    if not raw_csv.exists():
        raise FileNotFoundError(f"Raw CSV not found: {raw_csv}")

    df_raw = pd.read_csv(raw_csv, encoding="latin1", low_memory=False)

    keep_cols = [
        "Date", "Region", "Temperature (°C)", "Rainfall (mm)", "Humidity (%)",
        "vegitable_Commodity", "vegitable_Price per Unit (LKR/kg)",
    ]
    df = df_raw[keep_cols].copy()
    df.rename(columns={
        "vegitable_Commodity": "Commodity",
        "vegitable_Price per Unit (LKR/kg)": "Price",
    }, inplace=True)

    df["Region"] = df["Region"].astype(str).str.strip()
    df["Commodity"] = df["Commodity"].astype(str).str.strip()
    df["Price"] = pd.to_numeric(df["Price"], errors="coerce")
    df["Temperature (°C)"] = pd.to_numeric(df["Temperature (°C)"], errors="coerce")
    df["Rainfall (mm)"] = pd.to_numeric(df["Rainfall (mm)"], errors="coerce")
    df["Humidity (%)"] = pd.to_numeric(df["Humidity (%)"], errors="coerce")

    df["Date"] = pd.to_datetime(df["Date"], errors="coerce", dayfirst=False)
    df = df.dropna(subset=["Date", "Region", "Commodity", "Price"])

    df = df[df["Date"].dt.year < 2025].copy()
    df = df[df["Price"] > 0].copy()

    df["Month"] = df["Date"].dt.month
    for col in ["Temperature (°C)", "Rainfall (mm)", "Humidity (%)"]:
        df[col] = df.groupby(["Region", "Month"])[col].transform(lambda s: s.interpolate().bfill().ffill())

    df["Year"] = df["Date"].dt.year
    df["WeekOfYear"] = df["Date"].dt.isocalendar().week.astype(int)
    df["DayOfWeek"] = df["Date"].dt.dayofweek
    df["DayOfYear"] = df["Date"].dt.dayofyear

    cols = ["Date", "Region", "Commodity", "Price", "Temperature (°C)", "Rainfall (mm)", "Humidity (%)", "Year", "Month", "WeekOfYear", "DayOfWeek", "DayOfYear"]
    return df[cols].copy()

def time_split(df: pd.DataFrame):
    train_df = df[df["Year"].between(2020, 2023)].copy()
    test_df = df[df["Year"].eq(2024)].copy()
    return train_df, test_df

def one_hot_encode(train_df: pd.DataFrame, test_df: pd.DataFrame):
    feature_cols = ["Year", "Month", "WeekOfYear", "DayOfWeek", "DayOfYear", "Temperature (°C)", "Rainfall (mm)", "Humidity (%)", "Region", "Commodity"]
    train_x = train_df[feature_cols].copy()
    test_x = test_df[feature_cols].copy()
    train_y = train_df["Price"].astype(float).copy()
    test_y = test_df["Price"].astype(float).copy()

    combined = pd.concat([train_x, test_x], axis=0, ignore_index=True)
    combined_enc = pd.get_dummies(combined, columns=["Region", "Commodity"], drop_first=True)

    X_train = combined_enc.iloc[: len(train_x), :].copy()
    X_test = combined_enc.iloc[len(train_x) :, :].copy()
    feature_columns = list(X_train.columns)
    X_test = X_test.reindex(columns=feature_columns, fill_value=0)

    return X_train, X_test, train_y, test_y, feature_columns

def compute_monthly_climate(df: pd.DataFrame) -> pd.DataFrame:
    climate_cols = ["Temperature (°C)", "Rainfall (mm)", "Humidity (%)"]
    return df.groupby(["Region", "Month"])[climate_cols].mean().reset_index().sort_values(["Region", "Month"]).reset_index(drop=True)

def build_forecast_frame_2026(regions, commodities, monthly_climate: pd.DataFrame) -> pd.DataFrame:
    forecast_dates = pd.date_range("2026-01-05", "2026-12-28", freq="W-MON")
    climate_lookup = monthly_climate.copy()

    rows = []
    for region in regions:
        for commodity in commodities:
            for d in forecast_dates:
                rows.append({"Date": d, "Region": region, "Commodity": commodity, "Year": d.year, "Month": d.month, "WeekOfYear": int(d.isocalendar().week), "DayOfWeek": d.dayofweek, "DayOfYear": d.timetuple().tm_yday})

    fdf = pd.DataFrame(rows)
    fdf = fdf.merge(climate_lookup, on=["Region", "Month"], how="left")

    if fdf[["Temperature (°C)", "Rainfall (mm)", "Humidity (%)"]].isna().any().any():
        overall_monthly = climate_lookup.groupby("Month")[["Temperature (°C)", "Rainfall (mm)", "Humidity (%)"]].mean().reset_index()
        fdf = fdf.drop(columns=["Temperature (°C)", "Rainfall (mm)", "Humidity (%)"]).merge(climate_lookup, on=["Region", "Month"], how="left")
        mask = fdf["Temperature (°C)"].isna() | fdf["Rainfall (mm)"].isna() | fdf["Humidity (%)"].isna()
        if mask.any():
            tmp = fdf.loc[mask, ["Month"]].merge(overall_monthly, on="Month", how="left")
            fdf.loc[mask, "Temperature (°C)"] = tmp["Temperature (°C)"].values
            fdf.loc[mask, "Rainfall (mm)"] = tmp["Rainfall (mm)"].values
            fdf.loc[mask, "Humidity (%)"] = tmp["Humidity (%)"].values

    return fdf

def encode_forecast_frame(fdf: pd.DataFrame, feature_columns: list[str]) -> pd.DataFrame:
    feature_cols = ["Year", "Month", "WeekOfYear", "DayOfWeek", "DayOfYear", "Temperature (°C)", "Rainfall (mm)", "Humidity (%)", "Region", "Commodity"]
    base = fdf[feature_cols].copy()
    enc = pd.get_dummies(base, columns=["Region", "Commodity"], drop_first=True)
    return enc.reindex(columns=feature_columns, fill_value=0)

def top_contrib_features(feature_columns: list[str], contrib_row: np.ndarray, top_k=6):
    vals = contrib_row[:-1]
    idx = np.argsort(np.abs(vals))[::-1][:top_k]
    out = [(feature_columns[i], float(vals[i])) for i in idx]
    bias = float(contrib_row[-1])
    return out, bias

def farmer_explanation_from_contribs(top_feats: list[tuple[str, float]]) -> str:
    time_keys = {"Year", "Month", "WeekOfYear", "DayOfWeek", "DayOfYear"}
    climate_keys = {"Temperature (°C)", "Rainfall (mm)", "Humidity (%)"}
    time_effect, climate_effect, location_effect, veg_effect = 0.0, 0.0, 0.0, 0.0

    for name, val in top_feats:
        if name in time_keys: time_effect += val
        elif name in climate_keys: climate_effect += val
        elif name.startswith("Region_"): location_effect += val
        elif name.startswith("Commodity_"): veg_effect += val

    def phrase(effect: float, label: str):
        if abs(effect) < 1.0: return None
        direction = "increases" if effect > 0 else "reduces"
        return f"{label} {direction} the price by about {abs(effect):.0f} LKR"

    parts = [p for p in [phrase(veg_effect, "This vegetable's usual price level"), phrase(location_effect, "Your region's market pattern"), phrase(time_effect, "This time of year"), phrase(climate_effect, "Typical weather conditions")] if p]
    
    if not parts:
        return "Prices are close to the usual average for this time and weather conditions."
    return "Because " + ", and ".join(parts[:3]) + "."

# -----------------------------
# MAIN
# -----------------------------
def main():
    BASE_DIR = Path(__file__).resolve().parent.parent
    RAW_CSV = BASE_DIR / "data" / "raw" / "Kaggle_Vegetables_fruit_prices_with_climate_130000_2020_to_2025.csv"

    PROCESSED_DIR = BASE_DIR / "data" / "processed"
    OUTPUTS_DIR = BASE_DIR / "data" / "outputs"
    MODELS_DIR = BASE_DIR / "data" / "models"

    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    CLEAN_CSV = PROCESSED_DIR / "vegetables_clean_2020_2024.csv"
    METRICS_CSV = OUTPUTS_DIR / "metrics_time_split.csv"
    FORECAST_JSON = OUTPUTS_DIR / "forecasts_2026_weekly_xgb_fastxai.json"
    MODEL_PKL = MODELS_DIR / "xgb_vegetable_model.pkl"
    CLIMATE_CSV = MODELS_DIR / "monthly_climate_averages.csv"
    META_JSON = MODELS_DIR / "model_metadata.json"

    print("Loading and cleaning...")
    df = clean_and_prepare(RAW_CSV)
    df.to_csv(CLEAN_CSV, index=False)

    print("Time split (Train=2020-2023, Test=2024)...")
    train_df, test_df = time_split(df)

    print("Encoding...")
    X_train, X_test, y_train, y_test, feature_columns = one_hot_encode(train_df, test_df)

    print("Training XGBoost...")
    model = XGBRegressor(
        n_estimators=1000,
        learning_rate=0.05,
        max_depth=10,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=42,
        n_jobs=-1,
        tree_method="hist",
        reg_lambda=1.0,
    )
    model.fit(X_train, y_train)

    print("Evaluating...")
    pred_test = model.predict(X_test)
    r2 = r2_score(y_test, pred_test)
    mae = mean_absolute_error(y_test, pred_test)
    rmse = float(np.sqrt(mean_squared_error(y_test, pred_test)))
    
    print(f"R2: {r2:.3f} | MAE: {mae:.2f} | RMSE: {rmse:.2f}")

    joblib.dump(model, MODEL_PKL)
    monthly_climate = compute_monthly_climate(df)
    monthly_climate.to_csv(CLIMATE_CSV, index=False)

    meta = {
        "feature_columns": feature_columns,
        "regions": sorted(df["Region"].unique().tolist()),
        "commodities": sorted(df["Commodity"].unique().tolist()),
        "test_metrics": {"R2": float(r2), "MAE": float(mae), "RMSE": float(rmse)},
    }
    META_JSON.write_text(json.dumps(meta, indent=2, ensure_ascii=False), encoding="utf-8")

    print("Building 2026 weekly forecast frame...")
    fdf = build_forecast_frame_2026(meta["regions"], meta["commodities"], monthly_climate)
    forecast_enc = encode_forecast_frame(fdf, feature_columns)

    print("Predicting forecasts...")
    preds = model.predict(forecast_enc)

    print("Computing fast SHAP-style contributions...")
    booster = model.get_booster()
    dmat = xgb.DMatrix(forecast_enc, feature_names=feature_columns)
    
    # ✅ FIX: pred_contribs=True AND approx_contribs=True
    contribs = booster.predict(dmat, pred_contribs=True, approx_contribs=True)  

    print("Assembling JSON...")
    ci = 1.5 * float(mae)
    fdf["yhat_lkr"] = preds

    pair_key = list(zip(fdf["Region"].tolist(), fdf["Commodity"].tolist()))
    unique_pairs = sorted(set(pair_key))

    pair_to_idx = {}
    for i, k in enumerate(pair_key):
        pair_to_idx.setdefault(k, []).append(i)

    pairs_out = []
    for (region, commodity) in unique_pairs:
        idxs = pair_to_idx[(region, commodity)]
        forecasts = []
        for i in idxs:
            ds = fdf.loc[i, "Date"]
            pred = float(fdf.loc[i, "yhat_lkr"])
            top_feats, bias = top_contrib_features(feature_columns, contribs[i], top_k=6)
            explanation = farmer_explanation_from_contribs(top_feats)

            forecasts.append({
                "ds": ds.strftime("%Y-%m-%d"),
                "yhat_lkr": round(pred, 2),
                "yhat_lower_lkr": round(max(0.0, pred - ci), 2),
                "yhat_upper_lkr": round(pred + ci, 2),
                "climate_assumed": {
                    "temperature": round(safe_float(fdf.loc[i, "Temperature (°C)"]), 4),
                    "rainfall": round(safe_float(fdf.loc[i, "Rainfall (mm)"]), 4),
                    "humidity": round(safe_float(fdf.loc[i, "Humidity (%)"]), 4),
                },
                "xai_farmer": {"explanation": explanation},
            })

        pairs_out.append({"region": region, "commodity": commodity, "forecast": forecasts})

    output = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "resolution": "Weekly",
        "model": "XGBoost (time split)",
        "test_metrics": meta["test_metrics"],
        "pairs": pairs_out,
    }

    FORECAST_JSON.write_text(json.dumps(output, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"✅ Saved forecast JSON: {FORECAST_JSON}")
    print(f"Done. Pairs: {len(pairs_out)} | Rows forecasted: {len(fdf)}")

if __name__ == "__main__":
    main()