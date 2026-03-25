# src/train_rf_baseline.py

from __future__ import annotations

import json
from pathlib import Path
import warnings

import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns

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
def plot_actual_vs_predicted(y_true, y_pred, plots_dir: Path) -> None:
    plt.figure(figsize=(8, 8))
    plt.scatter(y_true, y_pred, alpha=0.4, color="darkorange", s=15)
    mn = min(np.min(y_true), np.min(y_pred))
    mx = max(np.max(y_true), np.max(y_pred))
    plt.plot([mn, mx], [mn, mx], "r--", linewidth=2)
    plt.title("Random Forest: Actual vs Predicted Prices (2024 Holdout)")
    plt.xlabel("Actual Price (LKR)")
    plt.ylabel("Predicted Price (LKR)")
    plt.tight_layout()
    plt.savefig(plots_dir / "rf_actual_vs_predicted.png", dpi=300)
    plt.close()


def plot_feature_importance(model: RandomForestRegressor, feature_names: list[str], plots_dir: Path) -> None:
    imp_df = pd.DataFrame(
        {
            "feature": feature_names,
            "importance": model.feature_importances_,
        }
    ).sort_values("importance", ascending=False).head(20)

    plt.figure(figsize=(12, 8))
    sns.barplot(data=imp_df, x="importance", y="feature", palette="rocket")
    plt.title("Top 20 Random Forest Feature Importances")
    plt.xlabel("Importance")
    plt.ylabel("Feature")
    plt.tight_layout()
    plt.savefig(plots_dir / "rf_feature_importance_top20.png", dpi=300)
    plt.close()


# =========================================================
# DATA PREPARATION
# =========================================================
def clean_and_prepare(raw_csv: Path) -> pd.DataFrame:
    df_raw = pd.read_csv(raw_csv, encoding="latin1", low_memory=False)

    keep_cols = [
        "Date",
        "Region",
        "Temperature (°C)",
        "Rainfall (mm)",
        "Humidity (%)",
        "vegitable_Commodity",
        "vegitable_Price per Unit (LKR/kg)",
    ]

    df = df_raw[keep_cols].copy()
    df.columns = [
        "Date",
        "Region",
        "Temperature (°C)",
        "Rainfall (mm)",
        "Humidity (%)",
        "Commodity",
        "Price",
    ]

    df["Region"] = df["Region"].astype(str).str.strip()
    df["Commodity"] = df["Commodity"].astype(str).str.strip()

    df["Price"] = pd.to_numeric(df["Price"], errors="coerce")
    df["Temperature (°C)"] = pd.to_numeric(df["Temperature (°C)"], errors="coerce")
    df["Rainfall (mm)"] = pd.to_numeric(df["Rainfall (mm)"], errors="coerce")
    df["Humidity (%)"] = pd.to_numeric(df["Humidity (%)"], errors="coerce")

    df["Date"] = pd.to_datetime(df["Date"], errors="coerce", dayfirst=False)

    df = df.dropna(subset=["Date", "Region", "Commodity", "Price"]).copy()
    df = df[(df["Date"].dt.year.between(2020, 2024)) & (df["Price"] > 0)].copy()

    df["WeekStart"] = df["Date"] - pd.to_timedelta(df["Date"].dt.weekday, unit="D")
    df["WeekStart"] = pd.to_datetime(df["WeekStart"]).dt.normalize()

    weekly = (
        df.groupby(["WeekStart", "Region", "Commodity"], as_index=False)
        .agg(
            {
                "Price": "mean",
                "Temperature (°C)": "mean",
                "Rainfall (mm)": "mean",
                "Humidity (%)": "mean",
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

    for col in ["Temperature (°C)", "Rainfall (mm)", "Humidity (%)"]:
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
        "Temperature (°C)",
        "Rainfall (mm)",
        "Humidity (%)",
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


# =========================================================
# MODEL
# =========================================================
def build_rf_model() -> RandomForestRegressor:
    return RandomForestRegressor(
        n_estimators=300,
        max_depth=20,
        random_state=42,
        n_jobs=-1,
    )


# =========================================================
# MAIN
# =========================================================
def main():
    base_dir = Path(__file__).resolve().parent.parent
    raw_csv = base_dir / "data" / "raw" / "Kaggle_Vegetables_fruit_prices_with_climate_130000_2020_to_2025.csv"

    outputs_dir = base_dir / "data" / "outputs"
    models_dir = base_dir / "data" / "models"
    plots_dir = base_dir / "data" / "plots"

    for d in [outputs_dir, models_dir, plots_dir]:
        d.mkdir(parents=True, exist_ok=True)

    print("1) Preparing weekly dataset...")
    df = clean_and_prepare(raw_csv)

    print("2) Time split: train=2020-2023, test=2024")
    train_df, test_df = time_split(df)

    X_train, X_test, y_train, y_test, feature_columns = one_hot_encode(train_df, test_df)

    print("3) Training Random Forest baseline...")
    model = build_rf_model()
    model.fit(X_train, y_train)

    print("4) Evaluating 2024 holdout...")
    pred_test = model.predict(X_test)
    metrics = regression_metrics(y_test, pred_test)
    print(json.dumps(metrics, indent=2))

    plot_actual_vs_predicted(y_test, pred_test, plots_dir)
    plot_feature_importance(model, feature_columns, plots_dir)

    eval_df = test_df[["WeekStart", "Region", "Commodity", "Price"]].copy()
    eval_df["PredictedPrice"] = pred_test
    eval_df.to_csv(outputs_dir / "rf_test_predictions_2024.csv", index=False)

    joblib.dump(model, models_dir / "rf_baseline_model_2020_2023.pkl")

    summary = {
        "model": "Random Forest Baseline",
        "train_period": "2020-2023",
        "test_period": "2024",
        "metrics": metrics,
    }

    (outputs_dir / "rf_training_summary.json").write_text(
        json.dumps(summary, indent=2),
        encoding="utf-8",
    )

    print("✅ Random Forest baseline completed.")


if __name__ == "__main__":
    main()