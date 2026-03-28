# src/train_xgb_weekly_final.py

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
import warnings

import joblib
import numpy as np
import pandas as pd

import xgboost as xgb
from xgboost import XGBRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# Safe plotting backend for terminals/servers
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

# Explainability
import shap

warnings.filterwarnings("ignore")


# =========================================================
# METRICS
# =========================================================
def mape(y_true, y_pred, eps: float = 1e-8) -> float:
    y_true = np.asarray(y_true, dtype=float)
    y_pred = np.asarray(y_pred, dtype=float)
    denom = np.maximum(np.abs(y_true), eps)
    return float(np.mean(np.abs((y_true - y_pred) / denom)) * 100.0)


def regression_metrics(y_true, y_pred) -> dict:
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    mape_val = float(mape(y_true, y_pred))
    r2 = float(r2_score(y_true, y_pred))
    return {
        "MAE_LKR": round(mae, 2),
        "RMSE_LKR": round(rmse, 2),
        "MAPE_Percent": round(mape_val, 2),
        "R_Squared": round(r2, 3),
    }


# =========================================================
# PLOTS
# =========================================================
def generate_eda_plots(df: pd.DataFrame, plots_dir: Path) -> None:
    sns.set_theme(style="whitegrid")

    plt.figure(figsize=(10, 6))
    sns.histplot(df["Price"], bins=50, kde=True, color="green")
    plt.title("Weekly Vegetable Price Distribution (LKR/kg)")
    plt.xlabel("Price (LKR)")
    plt.ylabel("Frequency")
    plt.tight_layout()
    plt.savefig(plots_dir / "01_price_distribution.png", dpi=300)
    plt.close()

    avg_price = df.groupby("Commodity")["Price"].mean().sort_values(ascending=False)
    plt.figure(figsize=(12, 8))
    sns.barplot(x=avg_price.values, y=avg_price.index, palette="viridis")
    plt.title("Average Price by Commodity (2020-2024)")
    plt.xlabel("Average Price (LKR)")
    plt.ylabel("Commodity")
    plt.tight_layout()
    plt.savefig(plots_dir / "02_avg_price_by_commodity.png", dpi=300)
    plt.close()

    monthly = df.set_index("WeekStart").resample("ME")["Price"].mean()
    plt.figure(figsize=(14, 6))
    monthly.plot(color="darkgreen", linewidth=2)
    plt.title("Monthly Average Market Price Trend")
    plt.xlabel("Date")
    plt.ylabel("Average Price (LKR)")
    plt.tight_layout()
    plt.savefig(plots_dir / "03_monthly_price_trend.png", dpi=300)
    plt.close()


def plot_actual_vs_predicted(y_true, y_pred, plots_dir: Path) -> None:
    plt.figure(figsize=(8, 8))
    plt.scatter(y_true, y_pred, alpha=0.4, color="blue", s=15)
    mn = min(np.min(y_true), np.min(y_pred))
    mx = max(np.max(y_true), np.max(y_pred))
    plt.plot([mn, mx], [mn, mx], "r--", linewidth=2)
    plt.title("Model Evaluation: Actual vs Predicted Prices (2024 Holdout)")
    plt.xlabel("Actual Price (LKR)")
    plt.ylabel("Predicted Price (LKR)")
    plt.tight_layout()
    plt.savefig(plots_dir / "04_actual_vs_predicted.png", dpi=300)
    plt.close()


def plot_feature_importance(model: XGBRegressor, feature_names: list[str], plots_dir: Path) -> None:
    imp_df = pd.DataFrame(
        {"feature": feature_names, "importance": model.feature_importances_}
    ).sort_values("importance", ascending=False).head(20)

    plt.figure(figsize=(12, 8))
    sns.barplot(data=imp_df, x="importance", y="feature", palette="magma")
    plt.title("Top 20 XGBoost Feature Importances")
    plt.xlabel("Importance")
    plt.ylabel("Feature")
    plt.tight_layout()
    plt.savefig(plots_dir / "05_feature_importance_top20.png", dpi=300)
    plt.close()


def generate_shap_plots(model: XGBRegressor, X_test: pd.DataFrame, plots_dir: Path) -> None:
    print("Generating SHAP explainability plots...")

    sample_size = min(2000, len(X_test))
    if sample_size == 0:
        print("No test data available for SHAP plots.")
        return

    X_sample = X_test.sample(n=sample_size, random_state=42)

    explainer = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_sample)

    plt.figure()
    shap.summary_plot(shap_values, X_sample, show=False)
    plt.tight_layout()
    plt.savefig(plots_dir / "06_shap_summary_plot.png", dpi=300, bbox_inches="tight")
    plt.close()

    plt.figure()
    shap.summary_plot(shap_values, X_sample, plot_type="bar", show=False)
    plt.tight_layout()
    plt.savefig(plots_dir / "07_shap_bar_plot.png", dpi=300, bbox_inches="tight")
    plt.close()

    print("SHAP plots saved.")


# =========================================================
# HELPERS
# =========================================================
def safe_float(x, default=np.nan):
    try:
        return float(x)
    except Exception:
        return default


def find_column_by_keyword(columns: list[str], keyword: str) -> str:
    for c in columns:
        if keyword.lower() in c.lower():
            return c
    raise ValueError(f"Could not find column containing keyword: {keyword}")


# =========================================================
# DATA PREPARATION
# =========================================================
def load_raw_data(raw_csv: Path) -> pd.DataFrame:
    return pd.read_csv(raw_csv, encoding="latin1", low_memory=False)


def clean_and_standardize(df_raw: pd.DataFrame) -> pd.DataFrame:
    temp_raw_col = find_column_by_keyword(df_raw.columns.tolist(), "temperature")
    rain_raw_col = find_column_by_keyword(df_raw.columns.tolist(), "rainfall")
    humidity_raw_col = find_column_by_keyword(df_raw.columns.tolist(), "humidity")

    keep_cols = [
        "Date",
        "Region",
        temp_raw_col,
        rain_raw_col,
        humidity_raw_col,
        "vegitable_Commodity",
        "vegitable_Price per Unit (LKR/kg)",
    ]

    missing = [c for c in keep_cols if c not in df_raw.columns]
    if missing:
        raise ValueError(f"Missing expected columns: {missing}")

    df = df_raw[keep_cols].copy()
    df.columns = [
        "Date",
        "Region",
        "Temperature_C",
        "Rainfall_mm",
        "Humidity_pct",
        "Commodity",
        "Price",
    ]

    df["Region"] = df["Region"].astype(str).str.strip()
    df["Commodity"] = df["Commodity"].astype(str).str.strip()

    df["Price"] = pd.to_numeric(df["Price"], errors="coerce")
    df["Temperature_C"] = pd.to_numeric(df["Temperature_C"], errors="coerce")
    df["Rainfall_mm"] = pd.to_numeric(df["Rainfall_mm"], errors="coerce")
    df["Humidity_pct"] = pd.to_numeric(df["Humidity_pct"], errors="coerce")

    df["Date"] = pd.to_datetime(df["Date"], errors="coerce", dayfirst=False)

    df = df.dropna(subset=["Date", "Region", "Commodity", "Price"]).copy()
    df = df[(df["Date"].dt.year.between(2020, 2024)) & (df["Price"] > 0)].copy()

    return df


def aggregate_weekly_and_engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    # Weekly aggregation using Monday as week start
    df["WeekStart"] = df["Date"] - pd.to_timedelta(df["Date"].dt.weekday, unit="D")
    df["WeekStart"] = pd.to_datetime(df["WeekStart"]).dt.normalize()

    weekly = (
        df.groupby(["WeekStart", "Region", "Commodity"], as_index=False)
        .agg(
            {
                "Price": "mean",
                "Temperature_C": "mean",
                "Rainfall_mm": "mean",
                "Humidity_pct": "mean",
            }
        )
        .sort_values(["Region", "Commodity", "WeekStart"])
        .reset_index(drop=True)
    )

    weekly["Year"] = weekly["WeekStart"].dt.year
    weekly["Month"] = weekly["WeekStart"].dt.month
    weekly["WeekOfYear"] = weekly["WeekStart"].dt.isocalendar().week.astype(int)
    weekly["DayOfWeek"] = weekly["WeekStart"].dt.dayofweek
    weekly["DayOfYear"] = weekly["WeekStart"].dt.dayofyear

    for col in ["Temperature_C", "Rainfall_mm", "Humidity_pct"]:
        weekly[col] = weekly.groupby(["Region", "WeekOfYear"])[col].transform(
            lambda s: s.fillna(s.median())
        )
        weekly[col] = weekly.groupby("Region")[col].transform(
            lambda s: s.fillna(s.median())
        )
        weekly[col] = weekly[col].fillna(weekly[col].median())

    return weekly


def time_split(df: pd.DataFrame):
    train_df = df[df["Year"].between(2020, 2023)].copy()
    test_df = df[df["Year"].eq(2024)].copy()
    return train_df, test_df


def one_hot_encode(train_df: pd.DataFrame, test_df: pd.DataFrame):
    feature_cols = [
        "Year",
        "Month",
        "WeekOfYear",
        "DayOfWeek",
        "DayOfYear",
        "Temperature_C",
        "Rainfall_mm",
        "Humidity_pct",
        "Region",
        "Commodity",
    ]

    X_train = train_df[feature_cols].copy()
    X_test = test_df[feature_cols].copy()

    X_train = pd.get_dummies(X_train, columns=["Region", "Commodity"], drop_first=True)
    X_test = pd.get_dummies(X_test, columns=["Region", "Commodity"], drop_first=True)
    X_test = X_test.reindex(columns=X_train.columns, fill_value=0)

    y_train = train_df["Price"].astype(float).copy()
    y_test = test_df["Price"].astype(float).copy()

    return X_train, X_test, y_train, y_test, list(X_train.columns)


def compute_weekly_climate(df: pd.DataFrame) -> pd.DataFrame:
    climate_cols = ["Temperature_C", "Rainfall_mm", "Humidity_pct"]
    return df.groupby(["Region", "WeekOfYear"], as_index=False)[climate_cols].mean()


def build_forecast_frame_2026(
    regions: list[str],
    commodities: list[str],
    weekly_climate: pd.DataFrame,
) -> pd.DataFrame:
    forecast_dates = pd.date_range("2026-01-05", "2026-12-28", freq="W-MON")

    rows = []
    for region in regions:
        for commodity in commodities:
            for d in forecast_dates:
                rows.append(
                    {
                        "WeekStart": d,
                        "Region": region,
                        "Commodity": commodity,
                        "Year": d.year,
                        "Month": d.month,
                        "WeekOfYear": int(d.isocalendar().week),
                        "DayOfWeek": d.dayofweek,
                        "DayOfYear": d.timetuple().tm_yday,
                    }
                )

    fdf = pd.DataFrame(rows)
    fdf = fdf.merge(weekly_climate, on=["Region", "WeekOfYear"], how="left")

    if fdf[["Temperature_C", "Rainfall_mm", "Humidity_pct"]].isna().any().any():
        overall_weekly = (
            weekly_climate.groupby("WeekOfYear", as_index=False)[
                ["Temperature_C", "Rainfall_mm", "Humidity_pct"]
            ].mean()
        )
        fdf = fdf.merge(overall_weekly, on="WeekOfYear", how="left", suffixes=("", "_global"))

        for col in ["Temperature_C", "Rainfall_mm", "Humidity_pct"]:
            fdf[col] = fdf[col].fillna(fdf[f"{col}_global"])
            fdf.drop(columns=[f"{col}_global"], inplace=True)

    return fdf


def encode_forecast_frame(fdf: pd.DataFrame, feature_columns: list[str]) -> pd.DataFrame:
    base = fdf[
        [
            "Year",
            "Month",
            "WeekOfYear",
            "DayOfWeek",
            "DayOfYear",
            "Temperature_C",
            "Rainfall_mm",
            "Humidity_pct",
            "Region",
            "Commodity",
        ]
    ].copy()

    enc = pd.get_dummies(base, columns=["Region", "Commodity"], drop_first=True)
    return enc.reindex(columns=feature_columns, fill_value=0)


# =========================================================
# XAI
# =========================================================
def top_contrib_features(feature_columns: list[str], contrib_row: np.ndarray, top_k=6):
    vals = contrib_row[:-1]
    idx = np.argsort(np.abs(vals))[::-1][:top_k]
    return [(feature_columns[i], float(vals[i])) for i in idx], float(contrib_row[-1])


def farmer_explanation_from_contribs(top_feats: list[tuple[str, float]], region: str | None = None) -> str:
    time_keys = {"Year", "Month", "WeekOfYear", "DayOfWeek", "DayOfYear"}
    climate_keys = {"Temperature_C", "Rainfall_mm", "Humidity_pct"}

    time_effect = 0.0
    climate_effect = 0.0
    location_effect = 0.0
    veg_effect = 0.0

    for name, val in top_feats:
        if name in time_keys:
            time_effect += val
        elif name in climate_keys:
            climate_effect += val
        elif name.startswith("Region_"):
            location_effect += val
        elif name.startswith("Commodity_"):
            veg_effect += val

    def phrase(effect: float, topic: str):
        if abs(effect) < 1.0:
            return None
        if effect > 0:
            return f"{topic} may push the price up by around Rs {abs(effect):.0f}"
        return f"{topic} may push the price down by around Rs {abs(effect):.0f}"

    location_topic = f"Market conditions in {region}" if region else "Market conditions in this area"

    parts = [
        phrase(veg_effect, "The usual market value of this vegetable"),
        phrase(location_effect, location_topic),
        phrase(time_effect, "Seasonal demand this week"),
        phrase(climate_effect, "This week's weather"),
    ]
    parts = [p for p in parts if p]

    if not parts:
        return "Prices are expected to stay fairly stable this week."

    return "Market drivers: " + ", and ".join(parts[:3]) + "."


# =========================================================
# MODEL
# =========================================================
def build_model() -> XGBRegressor:
    return XGBRegressor(
        n_estimators=1000,
        learning_rate=0.05,
        max_depth=10,
        subsample=0.9,
        colsample_bytree=0.9,
        random_state=42,
        n_jobs=-1,
        objective="reg:squarederror",
        tree_method="hist",
    )


# =========================================================
# MAIN
# =========================================================
def main():
    base_dir = Path(__file__).resolve().parent.parent
    raw_csv = base_dir / "data" / "raw" / "Kaggle_Vegetables_fruit_prices_with_climate_130000_2020_to_2025.csv"

    processed_dir, outputs_dir, models_dir, plots_dir = [
        base_dir / "data" / folder for folder in ["processed", "outputs", "models", "plots"]
    ]
    for d in [processed_dir, outputs_dir, models_dir, plots_dir]:
        d.mkdir(parents=True, exist_ok=True)

    print("Step 1: Load raw dataset...")
    df_raw = load_raw_data(raw_csv)
    print(f"Raw shape: {df_raw.shape}")

    print("Step 2: Clean data and standardize columns...")
    df_clean = clean_and_standardize(df_raw)
    print(f"Cleaned daily shape: {df_clean.shape}")

    print("Step 3: Weekly aggregation and feature engineering...")
    weekly = aggregate_weekly_and_engineer_features(df_clean)
    print(f"Weekly dataset shape: {weekly.shape}")
    print(f"Unique regions: {weekly['Region'].nunique()}")
    print(f"Unique commodities: {weekly['Commodity'].nunique()}")

    print("Step 4: Save processed dataset...")
    weekly.to_csv(processed_dir / "final_vegetables_clean_weekly_2020_2024.csv", index=False)

    print("Step 5: Generate EDA plots...")
    generate_eda_plots(weekly, plots_dir)

    print("Step 6: Time-based split (Train=2020-2023, Test=2024)...")
    train_df, test_df = time_split(weekly)
    if train_df.empty or test_df.empty:
        raise ValueError("Train or test split is empty. Check dataset year coverage.")

    print("Step 7: Feature matrix + one-hot encoding...")
    X_train, X_test, y_train, y_test, feature_columns = one_hot_encode(train_df, test_df)
    print(f"X_train shape: {X_train.shape}")
    print(f"X_test shape: {X_test.shape}")
    print(f"Number of model features: {len(feature_columns)}")

    print("Step 8: Train XGBoost evaluation model...")
    model = build_model()
    model.fit(X_train, y_train)

    print("Step 9: Evaluate model on 2024 holdout...")
    pred_test = model.predict(X_test)
    metrics = regression_metrics(y_test, pred_test)
    print(json.dumps(metrics, indent=2))

    print("Step 10: Evaluation visualizations + SHAP...")
    plot_actual_vs_predicted(y_test, pred_test, plots_dir)
    plot_feature_importance(model, feature_columns, plots_dir)
    generate_shap_plots(model, X_test, plots_dir)

    print("Step 11: Save evaluation artifacts...")
    eval_df = test_df[["WeekStart", "Region", "Commodity", "Price"]].copy()
    eval_df["PredictedPrice"] = pred_test
    eval_df.to_csv(outputs_dir / "final_test_predictions_2024.csv", index=False)
    joblib.dump(model, models_dir / "final_xgb_vegetable_model_eval_2020_2023.pkl")

    print("Step 12: Retrain final model on full history (2020-2024)...")
    full_df = weekly[weekly["Year"].between(2020, 2024)].copy()
    full_feature_cols = [
        "Year",
        "Month",
        "WeekOfYear",
        "DayOfWeek",
        "DayOfYear",
        "Temperature_C",
        "Rainfall_mm",
        "Humidity_pct",
        "Region",
        "Commodity",
    ]
    X_full = full_df[full_feature_cols].copy()
    X_full = pd.get_dummies(X_full, columns=["Region", "Commodity"], drop_first=True)
    X_full = X_full.reindex(columns=feature_columns, fill_value=0)
    y_full = full_df["Price"].astype(float).copy()

    final_model = build_model()
    final_model.fit(X_full, y_full)
    joblib.dump(final_model, models_dir / "final_xgb_vegetable_model_final.pkl")

    weekly_climate = compute_weekly_climate(full_df)

    print("Step 13: Save metadata...")
    meta = {
        "feature_columns": feature_columns,
        "regions": sorted(full_df["Region"].unique().tolist()),
        "commodities": sorted(full_df["Commodity"].unique().tolist()),
        "test_metrics": metrics,
        "train_period": "2020-2023",
        "test_period": "2024",
        "final_training_period": "2020-2024",
        "forecast_method": "Direct weekly forecast using calendar, climate, region, and commodity features",
        "future_climate_method": "Historical weekly region-wise averages",
        "xai_methods": [
            "XGBoost pred_contribs for farmer-friendly explanations",
            "SHAP for thesis-level global explainability plots",
        ],
    }
    (models_dir / "xgb_model_meta.json").write_text(
        json.dumps(meta, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print("Step 14: Build 2026 forecast frame...")
    fdf = build_forecast_frame_2026(meta["regions"], meta["commodities"], weekly_climate)

    print("Step 15: Encode forecast frame and predict...")
    forecast_enc = encode_forecast_frame(fdf, feature_columns)
    preds = final_model.predict(forecast_enc)

    print("Step 16: Compute XGBoost contribution scores...")
    contribs = final_model.get_booster().predict(
        xgb.DMatrix(forecast_enc, feature_names=feature_columns),
        pred_contribs=True,
        approx_contribs=True,
    )

    print("Step 17: Assemble forecast payload...")
    ci = 1.5 * metrics["MAE_LKR"]
    fdf["yhat_lkr"] = preds

    pairs_out = []
    for (region, commodity), group in fdf.groupby(["Region", "Commodity"], sort=True):
        forecasts = []
        group = group.sort_values("WeekStart")

        for i in group.index:
            pred = float(group.loc[i, "yhat_lkr"])
            top_feats, _ = top_contrib_features(feature_columns, contribs[i], top_k=6)
            forecasts.append(
                {
                    "ds": group.loc[i, "WeekStart"].strftime("%Y-%m-%d"),
                    "yhat_lkr": round(pred, 2),
                    "yhat_lower_lkr": round(max(0.0, pred - ci), 2),
                    "yhat_upper_lkr": round(pred + ci, 2),
                    "climate_assumed": {
                        "temperature": round(safe_float(group.loc[i, "Temperature_C"]), 2),
                        "rainfall": round(safe_float(group.loc[i, "Rainfall_mm"]), 2),
                        "humidity": round(safe_float(group.loc[i, "Humidity_pct"]), 2),
                    },
                    "xai_farmer": {
                        "explanation": farmer_explanation_from_contribs(top_feats, region=region)
                    },
                }
            )

        pairs_out.append(
            {
                "region": region,
                "commodity": commodity,
                "forecast": forecasts,
            }
        )

    output = {
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "resolution": "Weekly",
        "model": "XGBoost Weekly Calendar-Climate Forecast Model with XAI",
        "notes": {
            "evaluation_period": "2024 holdout",
            "final_training_period": "2020-2024",
            "future_forecast_method": "Direct weekly forecast",
            "future_external_variables": "Estimated from historical region-week averages",
            "prediction_interval": "Heuristic interval based on 1.5 x MAE",
        },
        "test_metrics": metrics,
        "pairs": pairs_out,
    }

    print("Step 18: Save final artifacts...")
    forecast_json = outputs_dir / "final_forecasts_2026_weekly_xgb_final.json"
    forecast_json.write_text(
        json.dumps(output, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    forecast_csv = fdf.copy()
    forecast_csv.rename(columns={"WeekStart": "Date"}, inplace=True)
    forecast_csv.to_csv(outputs_dir / "final_forecasts_2026_weekly_xgb_final.csv", index=False)

    summary = {
        "rows_total_weekly": int(len(weekly)),
        "rows_train": int(len(train_df)),
        "rows_test": int(len(test_df)),
        "regions": int(full_df["Region"].nunique()),
        "commodities": int(full_df["Commodity"].nunique()),
        "forecast_pairs": int(len(pairs_out)),
        "forecast_rows_2026": int(len(fdf)),
        "metrics": metrics,
    }
    (outputs_dir / "training_summary.json").write_text(
        json.dumps(summary, indent=2),
        encoding="utf-8",
    )

    print("Step 19: Final output check...")
    print(f"Success: Generated 2026 forecasts for {len(pairs_out)} region-commodity pairs.")
    print(f"Forecast JSON saved to: {forecast_json}")
    print(f"Training summary saved to: {outputs_dir / 'training_summary.json'}")


if __name__ == "__main__":
    main()
