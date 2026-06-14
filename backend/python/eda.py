import pandas as pd
import json
import argparse
import numpy as np
import warnings

warnings.filterwarnings("ignore")

class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer): return int(obj)
        if hasattr(obj, 'item') and callable(obj.item): return obj.item()
        if isinstance(obj, np.floating):
            if np.isnan(obj) or np.isinf(obj): return None
            return float(obj)
        if isinstance(obj, np.ndarray): return obj.tolist()
        return super(NpEncoder, self).default(obj)

def clean_nan(d):
    if isinstance(d, dict): return {k: clean_nan(v) for k, v in d.items()}
    if isinstance(d, list): return [clean_nan(i) for i in d]
    if isinstance(d, float) and (np.isnan(d) or np.isinf(d)): return None
    return d

def perform_eda(file_path, target_column=None):
    if not target_column:
        print(json.dumps({"status": "error", "error": "Target column is strictly required for analysis."}))
        return

    try:
        df = pd.read_csv(file_path, nrows=10000)

        # ── Classify columns ────────────────────────────────────────────
        num_cols, cat_cols, dt_cols = [], [], []
        for col in df.columns:
            if df[col].dtype == 'object':
                try:
                    parsed = pd.to_datetime(df[col], format='mixed', errors='coerce')
                    if parsed.notna().sum() / len(df) > 0.5:
                        dt_cols.append(col)
                        continue
                except: pass
                cat_cols.append(col)
            elif pd.api.types.is_numeric_dtype(df[col]):
                num_cols.append(col)

        # ════════════════════════════════════════════════════════════════
        # SECTION 1 — DATA OVERVIEW
        # ════════════════════════════════════════════════════════════════

        # 1a. Dataset shape
        shape = {"rows": int(len(df)), "columns": int(len(df.columns))}

        # 1b. Data types table
        dtype_table = []
        for col in df.columns:
            if col in dt_cols:   cat = "Datetime"
            elif col in num_cols: cat = "Numerical"
            else:                cat = "Categorical"
            dtype_table.append({"column": col, "dtype": str(df[col].dtype), "category": cat})

        # 1c. Summary statistics (numeric only – one clean table)
        stats_table = []
        for col in num_cols:
            s = df[col].dropna()
            if s.empty: continue
            stats_table.append({
                "column": col,
                "mean":   round(float(s.mean()),   4),
                "median": round(float(s.median()), 4),
                "std":    round(float(s.std()),    4),
                "min":    round(float(s.min()),    4),
                "max":    round(float(s.max()),    4)
            })

        # 1d. Missing values table + bar chart data
        missing_table = []
        for col in df.columns:
            cnt = int(df[col].isnull().sum())
            if cnt == 0: continue
            pct = round(cnt / len(df) * 100, 2)
            severity = "High" if pct > 30 else ("Medium" if pct > 10 else "Low")
            missing_table.append({"column": col, "count": cnt, "percentage": pct, "severity": severity})
        missing_table = sorted(missing_table, key=lambda x: x["percentage"], reverse=True)

        data_overview = {
            "shape": shape,
            "dtype_table": dtype_table,
            "stats_table": stats_table,
            "missing_table": missing_table       # doubles as chart data on the frontend
        }

        # ════════════════════════════════════════════════════════════════
        # SECTION 2 — FEATURE DISTRIBUTION & OUTLIERS
        # ════════════════════════════════════════════════════════════════

        distributions = []   # per numeric column: histogram + boxplot data
        skewness_table = []  # Column | Skewness | Interpretation
        outlier_table  = []  # Column | Count | %

        for col in num_cols:
            s = df[col].dropna()
            if s.empty: continue

            skew_val = float(s.skew())
            kurt_val = float(s.kurtosis())

            # Histogram (10 bins)
            counts, edges = np.histogram(s, bins=10)
            histogram = [{"range": f"{edges[i]:.2f}–{edges[i+1]:.2f}", "count": int(counts[i])} for i in range(len(counts))]

            # 5-number summary for boxplot
            q1, q3 = float(s.quantile(0.25)), float(s.quantile(0.75))
            iqr = q3 - q1
            lb, ub = q1 - 1.5 * iqr, q3 + 1.5 * iqr
            boxplot = {"min": float(s.min()), "q1": q1, "median": float(s.median()),
                       "q3": q3, "max": float(s.max()), "lower_whisker": lb, "upper_whisker": ub}

            # Outlier detection (IQR – report only, never remove)
            n_out = int(((s < lb) | (s > ub)).sum())
            if n_out > 0:
                pct_out = round(n_out / len(s) * 100, 2)
                outlier_table.append({"column": col, "count": n_out, "percentage": pct_out})

            # Skewness table row
            interp = "Normal" if abs(skew_val) < 0.5 else ("Moderately Skewed" if abs(skew_val) < 1.0 else "Highly Skewed")
            skewness_table.append({"column": col, "skewness": round(skew_val, 3), "kurtosis": round(kurt_val, 3), "interpretation": interp})

            distributions.append({"column": col, "skewness": round(skew_val, 3), "kurtosis": round(kurt_val, 3),
                                   "histogram": histogram, "boxplot": boxplot})

        outlier_table = sorted(outlier_table, key=lambda x: x["percentage"], reverse=True)

        feature_distributions = {
            "distributions":  distributions,   # histograms + boxplot payloads
            "skewness_table": skewness_table,
            "outlier_table":  outlier_table
        }

        # ════════════════════════════════════════════════════════════════
        # SECTION 3 — RELATIONSHIPS & CORRELATION
        # ════════════════════════════════════════════════════════════════

        # Build median-imputed numeric frame for correlation
        df_corr = df[num_cols].apply(lambda c: c.fillna(c.median()))
        corr_matrix = {}
        strong_pairs = []

        if len(num_cols) > 1:
            cm = df_corr.corr().round(3)
            cm = cm.dropna(how='all', axis=0).dropna(how='all', axis=1)

            for c1 in cm.columns:
                corr_matrix[c1] = {}
                for c2 in cm.index:
                    v = cm.loc[c2, c1]
                    corr_matrix[c1][c2] = None if pd.isna(v) else float(v)

            # Strong pairs (|r| > 0.7, upper triangle)
            cols_list = list(cm.columns)
            for i in range(len(cols_list)):
                for j in range(i + 1, len(cols_list)):
                    v = cm.iloc[i, j]
                    if not pd.isna(v) and abs(v) > 0.7:
                        strong_pairs.append({"feature_a": cols_list[i], "feature_b": cols_list[j], "correlation": round(float(v), 3)})
            strong_pairs = sorted(strong_pairs, key=lambda x: abs(x["correlation"]), reverse=True)

        # Target relationship data
        target_relationships = []
        target_relationships_cat = []
        if target_column and target_column in df.columns:
            ts = df[target_column].dropna()
            is_num_target = False
            if pd.api.types.is_numeric_dtype(ts):
                if ts.nunique() > 20: is_num_target = True
            else:
                ts_conv = pd.to_numeric(ts, errors='coerce')
                if ts_conv.notna().sum() / len(ts) > 0.9: 
                    is_num_target = True

            # 1. Numeric features vs Target (Scatter)
            for col in num_cols[:5]:   # limit to 5
                if col == target_column: continue
                try:
                    sample = df[[col, target_column]].dropna().sample(min(200, len(df)), random_state=42)
                    target_relationships.append({
                        "feature": col,
                        "points": [{"x": float(r[col]), "y": float(r[target_column])} for _, r in sample.iterrows()]
                    })
                except: pass

            # 2. Categorical features vs Target 
            for col in cat_cols[:5]: # limit to 5
                if col == target_column: continue
                try:
                    df_clean = df[[col, target_column]].dropna()
                    if is_num_target:
                        # Boxplot stats per category
                        grouped = []
                        for cat_val, group in df_clean.groupby(col):
                            if len(group) < 5: continue
                            s = group[target_column]
                            q1, q3 = float(s.quantile(0.25)), float(s.quantile(0.75))
                            iqr = q3 - q1
                            grouped.append({
                                "category": str(cat_val),
                                "min": float(s.min()),
                                "q1": q1,
                                "median": float(s.median()),
                                "q3": q3,
                                "max": float(s.max()),
                                "lower_whisker": q1 - 1.5 * iqr,
                                "upper_whisker": q3 + 1.5 * iqr
                            })
                        target_relationships_cat.append({"feature": col, "type": "regression", "data": grouped})
                    else:
                        # Stacked/Grouped bar for classification
                        ct = pd.crosstab(df_clean[col], df_clean[target_column]).head(10)
                        data = []
                        for idx, row in ct.iterrows():
                            entry = {"category": str(idx)}
                            for tgt_cls, val in row.items():
                                entry[str(tgt_cls)] = int(val)
                            data.append(entry)
                        target_relationships_cat.append({
                            "feature": col, 
                            "type": "classification", 
                            "classes": [str(c) for c in ct.columns],
                            "data": data
                        })
                except: pass

        correlations = {
            "matrix":              corr_matrix,   # heatmap data
            "strong_pairs":        strong_pairs,  # |corr| > 0.7 table
            "target_relationships":target_relationships,
            "target_relationships_cat": target_relationships_cat
        }

        # ════════════════════════════════════════════════════════════════
        # SECTION 4 — INSIGHTS & RECOMMENDATIONS
        # ════════════════════════════════════════════════════════════════

        insights      = []  # auto-generated human-readable findings
        recommendations = []  # actionable suggestions

        # Missing value insights
        for m in missing_table:
            insights.append({"type": "missing", "severity": m["severity"],
                             "text": f"Column '{m['column']}' has {m['percentage']}% missing values ({m['severity']} severity)."})
            if m["percentage"] > 30:
                recommendations.append({"action": "Drop or impute column", "detail": f"'{m['column']}' exceeds 30% missing — consider dropping or advanced imputation."})
            else:
                recommendations.append({"action": "Impute missing values", "detail": f"Fill '{m['column']}' using median (numeric) or mode (categorical)."})

        # Skewness insights
        for sk in skewness_table:
            if sk["interpretation"] == "Highly Skewed":
                insights.append({"type": "skew", "severity": "Medium",
                                 "text": f"Feature '{sk['column']}' is highly skewed (skew={sk['skewness']})."})
                recommendations.append({"action": "Apply log or power transformation", "detail": f"Use np.log1p or PowerTransformer on '{sk['column']}'."})

        # Outlier insights
        for o in outlier_table:
            sev = "High" if o["percentage"] > 10 else "Low"
            insights.append({"type": "outlier", "severity": sev,
                             "text": f"Feature '{o['column']}' has {o['percentage']}% outliers ({o['count']} rows) by IQR."})
            if o["percentage"] > 5:
                recommendations.append({"action": "Investigate or cap outliers", "detail": f"Either winsorise '{o['column']}' or verify data source."})

        # Correlation insights
        for sp in strong_pairs[:5]:
            direction = "positive" if sp["correlation"] > 0 else "negative"
            insights.append({"type": "correlation", "severity": "Low",
                             "text": f"Strong {direction} correlation ({sp['correlation']}) between '{sp['feature_a']}' and '{sp['feature_b']}'."})
        if strong_pairs:
            recommendations.append({"action": "Remove redundant features", "detail": "Highly correlated features (|r|>0.7) add multicollinearity. Consider dropping one from each pair."})

        # Target / class imbalance
        model_recommendation = {}
        if target_column and target_column in df.columns:
            ts = df[target_column].dropna()
            is_num = pd.api.types.is_numeric_dtype(ts)
            if not is_num:
                ts_conv = pd.to_numeric(ts, errors='coerce')
                if ts_conv.notna().sum() / len(ts) > 0.9:
                    is_num, ts = True, ts_conv.dropna()

            if is_num and ts.nunique() > 20:
                task = "Regression"
                model_recommendation = {"model": "XGBoost Regressor", "task": task, "reason": "Robust gradient-boosted trees work well for continuous targets on structured data."}
            else:
                task = "Classification"
                cc = ts.value_counts()
                if len(cc) == 2:
                    ratio = round(cc.max() / cc.min(), 2)
                    if ratio > 3:
                        insights.append({"type": "imbalance", "severity": "High",
                                        "text": f"Target variable is imbalanced (ratio ≈ {ratio}:1). Minority class may be underrepresented."})
                        recommendations.append({"action": "Balance the dataset", "detail": "Use SMOTE, class_weight='balanced', or under-sampling strategies."})
                model_recommendation = {"model": "XGBoost / Random Forest", "task": task, "reason": "Tree-based ensembles handle class imbalance and nonlinear boundaries effectively."}

        insights_recommendations = {
            "insights":             insights,
            "recommendations":      recommendations,
            "model_recommendation": model_recommendation
        }

        # ── Final structured response (exactly 4 keys) ─────────────────
        response = {
            "status":                 "success",
            "data_overview":          data_overview,
            "feature_distributions":  feature_distributions,
            "correlations":           correlations,
            "insights_recommendations": insights_recommendations
        }

        print(json.dumps(clean_nan(response), cls=NpEncoder))

    except Exception as e:
        import traceback
        print(json.dumps({"status": "error", "error": str(e), "trace": traceback.format_exc()}))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--file",   required=True)
    parser.add_argument("--target", required=False)
    args = parser.parse_args()
    perform_eda(args.file, args.target)
