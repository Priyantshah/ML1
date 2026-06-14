print("[TRAIN] PYTHON STARTED", flush=True)
import sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')
import os
import time
import platform
import sys
import argparse
import json
import joblib
import warnings
import pandas as pd
import numpy as np
try:
    import psutil
    _HAS_PSUTIL = True
except ImportError:
    _HAS_PSUTIL = False
print(f"DEBUG: Imports successful. Python {sys.version}", flush=True)

from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import (
    LabelEncoder, StandardScaler, MinMaxScaler, 
    OneHotEncoder, PowerTransformer, PolynomialFeatures
)
from sklearn.metrics import (
    r2_score, mean_absolute_error, mean_squared_error, 
    accuracy_score, precision_score, recall_score, f1_score, confusion_matrix,
    roc_curve
)
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.feature_selection import SelectFromModel, VarianceThreshold

# Filter warnings
warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")
warnings.filterwarnings("ignore")

# Models
from sklearn.linear_model import LinearRegression, Ridge, Lasso, LogisticRegression
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, RandomForestClassifier, GradientBoostingClassifier
from xgboost import XGBRegressor, XGBClassifier
from sklearn.svm import SVR, SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.neighbors import KNeighborsClassifier

class NpEncoder(json.JSONEncoder):
    """Custom JSON encoder for NumPy types."""
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NpEncoder, self).default(obj)

def clean_nans(obj):
    """Helper to replace NaNs/Infs with None for valid JSON."""
    if isinstance(obj, float):
        return None if np.isnan(obj) or np.isinf(obj) else obj
    if isinstance(obj, dict):
        return {k: clean_nans(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [clean_nans(v) for v in obj]
    return obj

def train_models(file_path, target_column, scaler_type='standard', limit_rows=False, eda_json=None):
    print("PROGRESS: 1", flush=True)
    start_time = time.time()
    try:
        # Load EDA config
        eda = {}
        if eda_json and os.path.exists(eda_json):
            with open(eda_json, 'r') as f:
                eda = json.load(f)
                
        eda_drop_cols = []
        eda_skewed_cols = []
        use_smote = False
        
        if eda:
            missing_table = eda.get('data_overview', {}).get('missing_table', [])
            for m in missing_table:
                if m['percentage'] > 30:
                    eda_drop_cols.append(m['column'])
                    print(f"INFO: Dropping column '{m['column']}' due to {m['percentage']}% missing values", flush=True)

            skewness_table = eda.get('feature_distributions', {}).get('skewness_table', [])
            for sk in skewness_table:
                if sk.get('interpretation') in ['Highly Skewed', 'Moderately Skewed']:
                    eda_skewed_cols.append(sk['column'])
                    print(f"INFO: Applying PowerTransformer on '{sk['column']}' due to skewness", flush=True)

            insights = eda.get('insights_recommendations', {}).get('insights', [])
            for ins in insights:
                if ins.get('type') == 'imbalance' and ins.get('severity') == 'High':
                    use_smote = True
                    print("INFO: Applying class_weight='balanced' due to class imbalance", flush=True)

            strong_pairs = eda.get('correlations', {}).get('strong_pairs', [])
            for sp in strong_pairs:
                if abs(sp['correlation']) > 0.85:
                    if sp['feature_b'] not in eda_drop_cols and sp['feature_a'] not in eda_drop_cols:
                        eda_drop_cols.append(sp['feature_a'])
                        print(f"INFO: Dropping '{sp['feature_a']}' due to high correlation ({sp['correlation']}) with '{sp['feature_b']}'", flush=True)

        # 1. DATA LOADING & PREPROCESSING
        df = pd.read_csv(file_path)
        
        # FIX 5: Remove duplicates at the very beginning
        df = df.drop_duplicates()
        
        # Drop rows where target is missing
        df = df.dropna(subset=[target_column])

        # FIX 8: Remove Hard Sampling Limit 
        if limit_rows and len(df) > 3000:
            df = df.sample(n=3000, random_state=42)
        
        # Separate features and target
        X = df.drop(columns=[target_column])

        # --- DATASET METADATA (captured before any engineering) ---
        dataset_info = {
            "total_rows": len(df),
            "original_columns": int(X.shape[1]),
            "rows_after_clean": len(df)
        }
        
        # Apply EDA Drops immediately
        actual_eda_drops = [c for c in eda_drop_cols if c in X.columns]
        if actual_eda_drops:
            X = X.drop(columns=actual_eda_drops)
            
        y = df[target_column]

        # --- IMPROVED TASK DETECTION ---
        y_numeric = pd.to_numeric(y, errors='coerce')
        numeric_ratio = y_numeric.notna().sum() / len(y)
        
        is_regression = False
        if numeric_ratio > 0.9:
            valid_indices = y_numeric.notna()
            y = y_numeric[valid_indices]
            X = X.loc[valid_indices]
            
            if y.nunique() > 20: 
                is_regression = True
        
        task_type = "Regression" if is_regression else "Classification"
        
        # Metadata payload for predict.py to replicate features
        fe_metadata = {}

        # FIX 3: Datetime Processing (Automatically detect and engineer features)
        datetime_cols = []
        for col in X.columns:
            if X[col].dtype == 'object':
                try:
                    parsed = pd.to_datetime(X[col], format='mixed', errors='coerce')
                    # If more than 50% are valid dates, treat it as a datetime feature
                    if parsed.notna().sum() / len(X) > 0.5:
                        datetime_cols.append(col)
                        X[f'{col}_year'] = parsed.dt.year
                        X[f'{col}_month'] = parsed.dt.month
                        X[f'{col}_day'] = parsed.dt.day
                        X[f'{col}_weekday'] = parsed.dt.weekday
                        X[f'{col}_hour'] = parsed.dt.hour
                except Exception:
                    pass
        
        # Save dt columns to metadata for predict.py reconstruction
        fe_metadata['datetime_cols'] = datetime_cols
        
        # Drop original datetime columns
        if datetime_cols:
            X = X.drop(columns=datetime_cols)


        # Target Preprocessing
        le_target = None
        if not is_regression:
            le_target = LabelEncoder()
            y = le_target.fit_transform(y.astype(str))

        # FIX 4 (Part 1): Train-Test Split FIRST to strictly prevent data leakage
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

        # FIX 1 (Part 1): Post-Split Feature Creation (Safely handling distribution boundaries)
        num_cols_initial = X_train.select_dtypes(include=[np.number]).columns.tolist()
        if len(num_cols_initial) >= 2:
            try:
                # Top variant columns learned ONLY from Training data
                top_2 = X_train[num_cols_initial].var().nlargest(2).index.tolist()
                col1, col2 = top_2[0], top_2[1]
                fe_metadata['top_2'] = [col1, col2]
                fe_metadata['bins'] = {}
                
                # Apply standard math individually
                for X_set in [X_train, X_test]:
                    X_set[f'{col1}_plus_{col2}'] = X_set[col1] + X_set[col2]
                    X_set[f'{col1}_minus_{col2}'] = X_set[col1] - X_set[col2]
                    X_set[f'{col1}_div_{col2}'] = X_set[col1] / (X_set[col2].replace(0, 1e-5))
                
                # Fit binning explicitly on Train data ONLY
                for col in top_2:
                    _, bins = pd.cut(X_train[col], bins=5, retbins=True)
                    # Extend outer edges to support out-of-bounds in Test set
                    bins[0] = -np.inf
                    bins[-1] = np.inf
                    fe_metadata['bins'][col] = bins.tolist()
                    
                    # Apply pre-fitted bins to both sets
                    X_train[f'{col}_binned'] = pd.cut(X_train[col], bins=bins, labels=False)
                    X_test[f'{col}_binned'] = pd.cut(X_test[col], bins=bins, labels=False)
            except Exception as e:
                print(f"DEBUG: Exception in FE: {e}", flush=True)

        # FIX 4 (Part 2): Outlier Filter learned ONLY on training data, applied to both
        if len(X_train) > 100:
            numeric_features = X_train.select_dtypes(include=[np.number]).columns
            if len(numeric_features) > 0:
                # Robust IQR learned from Train set only
                Q1 = X_train[numeric_features].quantile(0.25)
                Q3 = X_train[numeric_features].quantile(0.75)
                IQR = Q3 - Q1
                
                lower_bound = Q1 - 3.0 * IQR
                upper_bound = Q3 + 3.0 * IQR
                
                mask_train = ~((X_train[numeric_features] < lower_bound) | (X_train[numeric_features] > upper_bound)).any(axis=1)
                
                # Keep if we aren't decimating the dataset
                if mask_train.sum() / len(X_train) > 0.8:
                    X_train = X_train[mask_train]
                    
                    if isinstance(y_train, np.ndarray):
                        y_train = y_train[mask_train.values]
                    else:
                        y_train = y_train[mask_train]
                    
                    # Apply EXACT same boundary conditions to test data
                    mask_test = ~((X_test[numeric_features] < lower_bound) | (X_test[numeric_features] > upper_bound)).any(axis=1)
                    X_test = X_test[mask_test]
                    
                    if isinstance(y_test, np.ndarray):
                        y_test = y_test[mask_test.values]
                    else:
                        y_test = y_test[mask_test]

        # FIX 6: Correlation-Based Feature Pruning (Fallback if EDA not fully covering)
        if not eda:
            num_cols_for_corr = X_train.select_dtypes(include=[np.number]).columns
            if len(num_cols_for_corr) > 0:
                corr_matrix = X_train[num_cols_for_corr].corr().abs()
                upper = corr_matrix.where(np.triu(np.ones(corr_matrix.shape), k=1).astype(bool))
                redundant_cols = [col for col in upper.columns if any(upper[col] > 0.95)]
                
                if redundant_cols:
                    X_train = X_train.drop(columns=redundant_cols)
                    X_test = X_test.drop(columns=redundant_cols)

        # --- FEATURE PREPROCESSING ---
        num_cols = X_train.select_dtypes(include=[np.number]).columns.tolist()
        cat_cols = X_train.select_dtypes(include=['object']).columns.tolist()

        # Drop truly high cardinality categorical columns (> 50 unique values)
        cols_to_drop = [col for col in cat_cols if X_train[col].nunique() > 50]
        if cols_to_drop:
            X_train = X_train.drop(columns=cols_to_drop)
            X_test = X_test.drop(columns=cols_to_drop)
            cat_cols = [c for c in cat_cols if c not in cols_to_drop]

        # FIX 7: Configurable Scaling Setup
        scaler = MinMaxScaler() if scaler_type.lower() == 'minmax' else StandardScaler()

        # FIX 2 & FIX 1 (Part 2): Dynamic Skewness handling with PowerTransformer & PolynomialFeatures
        skewed_num_cols = [c for c in num_cols if c in eda_skewed_cols] if eda else num_cols
        normal_num_cols = [c for c in num_cols if c not in skewed_num_cols]

        skewed_steps = [
            ('imputer', SimpleImputer(strategy='median')),
            ('skewness_handler', PowerTransformer(method='yeo-johnson', standardize=False)),
            ('scaler', scaler)
        ]
        
        normal_steps = [
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', scaler)
        ]

        if len(num_cols) <= 30:
            skewed_steps.append(('poly', PolynomialFeatures(degree=2, interaction_only=True, include_bias=False)))
            normal_steps.append(('poly', PolynomialFeatures(degree=2, interaction_only=True, include_bias=False)))

        skewed_transformer = Pipeline(steps=skewed_steps)
        normal_transformer = Pipeline(steps=normal_steps)
        
        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='most_frequent')),
            ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])
        
        preprocessor = ColumnTransformer(
            transformers=[
                ('skewed_num', skewed_transformer, skewed_num_cols),
                ('normal_num', normal_transformer, normal_num_cols),
                ('cat', categorical_transformer, cat_cols)
            ],
            verbose_feature_names_out=False
        )

        # --- FEATURE SELECTION ---
        selection_step = None
        if is_regression:
             selection_step = SelectFromModel(Lasso(alpha=0.01, random_state=42))
        else:
             selection_step = SelectFromModel(RandomForestClassifier(n_estimators=50, random_state=42))
             
        full_pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('variance_threshold', VarianceThreshold(threshold=0.0)),
            ('feature_selection', selection_step)
        ])

        # --- MODEL DEFINITIONS ---
        cw = 'balanced' if use_smote else None
        
        if is_regression:
            models = {
                "Linear Regression": LinearRegression(),
                "Ridge Regression": Ridge(),
                "Lasso Regression": Lasso(),
                "Random Forest Regressor": RandomForestRegressor(n_estimators=50, max_depth=10, n_jobs=1, random_state=42),
                "Gradient Boosting Regressor": GradientBoostingRegressor(n_estimators=50, max_depth=5, random_state=42),
                "XGBoost Regressor": XGBRegressor(n_estimators=50, max_depth=6, n_jobs=1, random_state=42),
                "Support Vector Regressor (SVR)": SVR(kernel='rbf', max_iter=2000)
            }
        else:
            models = {
                "Logistic Regression": LogisticRegression(max_iter=500, n_jobs=1, class_weight=cw),
                "Decision Tree Classifier": DecisionTreeClassifier(max_depth=10, class_weight=cw),
                "Random Forest Classifier": RandomForestClassifier(n_estimators=50, max_depth=10, n_jobs=1, random_state=42, class_weight=cw),
                "Gradient Boosting Classifier": GradientBoostingClassifier(n_estimators=50, max_depth=5, random_state=42),
                "XGBoost Classifier": XGBClassifier(eval_metric='logloss', n_estimators=50, max_depth=6, n_jobs=1, random_state=42),
                "KNN Classifier": KNeighborsClassifier(n_neighbors=5, n_jobs=1),
                "Support Vector Classifier (SVC)": SVC(kernel='rbf', probability=True, max_iter=2000, class_weight=cw)
            }

        # Fit Pipeline Operations
        print("PROGRESS: 10", flush=True)
        # Process dynamically engineered pipeline over strictly Training constraints
        X_train_transformed = full_pipeline.fit_transform(X_train, y_train)
        X_test_transformed = full_pipeline.transform(X_test)

        # Final feature count after full pipeline
        dataset_info["final_feature_count"] = int(X_train_transformed.shape[1])
        dataset_info["train_samples"] = int(X_train_transformed.shape[0])
        dataset_info["test_samples"] = int(X_test_transformed.shape[0])

        # --- HARDWARE INFO ---
        hardware_info = {
            "cpu": platform.processor() or platform.machine(),
            "cpu_brand": platform.node(),
            "cores": psutil.cpu_count(logical=True) if _HAS_PSUTIL else "N/A",
            "physical_cores": psutil.cpu_count(logical=False) if _HAS_PSUTIL else "N/A",
            "ram_gb": round(psutil.virtual_memory().total / (1024 ** 3), 2) if _HAS_PSUTIL else "N/A",
            "ram_available_gb": round(psutil.virtual_memory().available / (1024 ** 3), 2) if _HAS_PSUTIL else "N/A",
            "os": f"{platform.system()} {platform.release()}",
            "python": platform.python_version(),
            "gpu_used": False
        }
        
        results = {}
        best_model_name = ""
        best_score = -float('inf')
        best_model_obj = None
        
        # --- TRAINING LOOP ---
        total_models = len(models)
        for i, (name, model) in enumerate(models.items()):
            progress = int(10 + (i / total_models) * 80)
            print(f"PROGRESS: {progress}", flush=True)
            
            try:
                # Per-model timing
                model_start = time.time()
                model.fit(X_train_transformed, y_train)
                model_train_time = round(time.time() - model_start, 4)
                
                y_pred = model.predict(X_test_transformed)
                
                # Train-set score for overfitting detection
                try:
                    train_score = float(model.score(X_train_transformed, y_train))
                    test_score_raw = float(model.score(X_test_transformed, y_test))
                    overfitting_gap = round(abs(train_score - test_score_raw), 4)
                except Exception:
                    train_score = None
                    test_score_raw = None
                    overfitting_gap = None

                metrics = {}
                if task_type == "Regression":
                    r2 = r2_score(y_test, y_pred)
                    metrics["R2"] = r2
                    metrics["MAE"] = mean_absolute_error(y_test, y_pred)
                    metrics["MSE"] = mean_squared_error(y_test, y_pred)
                    metrics["RMSE"] = np.sqrt(metrics["MSE"])
                    score = r2
                else:
                    acc = accuracy_score(y_test, y_pred)
                    metrics["Accuracy"] = acc
                    metrics["Precision"] = precision_score(y_test, y_pred, average='weighted', zero_division=0)
                    metrics["Recall"] = recall_score(y_test, y_pred, average='weighted', zero_division=0)
                    metrics["F1"] = f1_score(y_test, y_pred, average='weighted', zero_division=0)
                    score = acc
                
                # Attach efficiency & overfitting data
                metrics["training_time_s"] = model_train_time
                metrics["train_score"] = train_score
                metrics["test_score"] = test_score_raw
                metrics["overfitting_gap"] = overfitting_gap
                
                results[name] = metrics
                
                if score > best_score:
                    best_score = score
                    best_model_name = name
                    best_model_obj = model
                    
            except Exception as e:
                results[name] = {"error": str(e)}

        print("PROGRESS: 90", flush=True)

        # --- ARTIFACT SAVING ---
        model_filename = f"best_model_{task_type}.pkl"
        
        # Determine rigorous feature layout footprint explicitly
        try:
            feature_names = full_pipeline.named_steps['preprocessor'].get_feature_names_out().tolist()
            vt_mask = full_pipeline.named_steps['variance_threshold'].get_support()
            feature_names = [f for f, m in zip(feature_names, vt_mask) if m]
            fs_mask = full_pipeline.named_steps['feature_selection'].get_support()
            feature_names = [f for f, m in zip(feature_names, fs_mask) if m]
        except Exception:
            feature_names = [f"feature_{i}" for i in range(X_train_transformed.shape[1])]

        final_artifact = {
            "model": best_model_obj,
            "preprocessor": full_pipeline,
            "task_type": task_type,
            "target_encoder": le_target,
            "model_name": best_model_name,
            "results": results,
            "feature_columns": feature_names,
            "fe_metadata": fe_metadata
        }
        joblib.dump(final_artifact, model_filename)
        joblib.dump(full_pipeline, "preprocessor.pkl") 

        # --- DASHBOARD METRICS ---
        conf_matrix_val = None
        if task_type == "Classification":
            conf_matrix_val = confusion_matrix(y_test, best_model_obj.predict(X_test_transformed)).tolist()

        roc_data = []
        try:
            if task_type == "Classification" and hasattr(best_model_obj, "predict_proba"):
                probs = best_model_obj.predict_proba(X_test_transformed)[:, 1]
                fpr, tpr, _ = roc_curve(y_test, probs)
                indices = np.linspace(0, len(fpr) - 1, 20).astype(int)
                roc_data = [{"fpr": fpr[i], "tpr": tpr[i]} for i in indices]
        except Exception: pass

        feature_importances = []
        try:
            if hasattr(best_model_obj, 'feature_importances_'):
                importances = best_model_obj.feature_importances_
                feature_importances = sorted([{"name": n, "value": float(i)} for n, i in zip(feature_names, importances)], key=lambda x: x["value"], reverse=True)
            elif hasattr(best_model_obj, 'coef_'):
                coefs = np.abs(best_model_obj.coef_[0]) if task_type == "Classification" and len(best_model_obj.coef_.shape) > 1 else np.abs(best_model_obj.coef_)
                feature_importances = sorted([{"name": n, "value": float(i)} for n, i in zip(feature_names, coefs)], key=lambda x: x["value"], reverse=True)
        except Exception: pass

        visualization_data = []
        try:
            best_preds = best_model_obj.predict(X_test_transformed)
            # viz_df maps ground truths for dashboard actual/predicted charts
            viz_df = pd.DataFrame({'Actual': y_test, 'Predicted': best_preds})
            if len(viz_df) > 100:
                viz_df = viz_df.sample(n=100, random_state=42)
            visualization_data = viz_df.to_dict(orient='records')
        except Exception: pass

        # Final Output Payload
        output = {
            "status": "success",
            "task_type": task_type,
            "results": results,
            "best_model": best_model_name,
            "best_score": best_score,
            "model_path": os.path.abspath(model_filename),
            "accuracy": best_score if task_type == "Classification" else None,
            "r2": best_score if task_type == "Regression" else None,
            "training_time": f"{time.time() - start_time:.2f}s",
            "conf_matrix": conf_matrix_val,
            "feature_importances": feature_importances,
            "roc_curve": roc_data,
            "visualization_data": visualization_data,
            "dataset_info": dataset_info,
            "hardware_info": hardware_info
        }
        
        print("PROGRESS: 100", flush=True)
        print(json.dumps(clean_nans(output), cls=NpEncoder), flush=True)
        sys.stdout.flush()
        
    except Exception as e:
        import traceback
        error_msg = {"status": "error", "error": str(e), "traceback": traceback.format_exc()}
        print(json.dumps(error_msg), flush=True)
        sys.stdout.flush()

if __name__ == "__main__":
    try:
        parser = argparse.ArgumentParser()
        parser.add_argument("--file", required=True, help="Path or URL to the CSV file")
        parser.add_argument("--target", required=True, help="Target column name")
        parser.add_argument("--scaler", required=False, default="standard", choices=["standard", "minmax"], help="Scaling strategy (standard or minmax)")
        parser.add_argument("--limit_rows", required=False, action='store_true', help="Cap processed rows to 3000")
        parser.add_argument("--eda_json", required=False, default=None, help="Path to EDA insights JSON for dynamic pipeline configuration")
        args = parser.parse_args()
        
        train_models(args.file, args.target, args.scaler, args.limit_rows, args.eda_json)
        print("[TRAIN] PYTHON ENDED", flush=True)
        sys.stdout.flush()
    except Exception as e:
        import traceback
        error_msg = {"status": "error", "error": f"Top-level failure: {str(e)}", "traceback": traceback.format_exc()}
        print(json.dumps(error_msg), flush=True)
        sys.stdout.flush()
