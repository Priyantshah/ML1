import argparse
import json
import joblib
import pandas as pd
import numpy as np
import os
import tempfile
import warnings
from urllib.request import urlopen

# Filter warnings
warnings.filterwarnings("ignore")

class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NpEncoder, self).default(obj)

def predict(model_url, input_data=None, input_file=None):
    try:
        # 1. Download/Locate Model
        if os.path.exists(model_url):
             tmp_path = model_url
             is_temp = False
        elif model_url.startswith("http"):
            with urlopen(model_url) as response:
                content = response.read()

            with tempfile.NamedTemporaryFile(delete=False, suffix=".pkl") as tmp:
                tmp.write(content)
                tmp_path = tmp.name
            is_temp = True
        else:
            model_url_clean = model_url.strip('"').strip("'")
            if os.path.exists(model_url_clean):
                 tmp_path = model_url_clean
                 is_temp = False
            else:
                 raise Exception(f"Invalid model path or URL: {model_url}")

        # 2. Load Artifact
        artifact = joblib.load(tmp_path)
        if is_temp:
            try: os.unlink(tmp_path) 
            except: pass
        
        model = artifact["model"]
        full_pipeline = artifact["preprocessor"] # This is the full pipeline (preprocessor + selection)
        task_type = artifact.get("task_type", "Unknown")
        target_encoder = artifact.get("target_encoder")
        
        # 3. Prepare Input
        if input_file:
            df = pd.read_csv(input_file)
        elif input_data:
            if isinstance(input_data, str):
                input_data = json.loads(input_data)
            df = pd.DataFrame(input_data)
            if df.empty:
                raise Exception("Input data is empty")
        else:
            raise Exception("No input provided")
        
        # 4. Preprocess (including Dynamic Feature Engineering replication)
        fe_metadata = artifact.get("fe_metadata", {})
        top_2 = fe_metadata.get('top_2')
        bins = fe_metadata.get('bins')
        dt_cols = fe_metadata.get('datetime_cols', [])
        
        # Reproduce exact Datetime features extracted during Training
        if dt_cols:
            for col in dt_cols:
                if col in df.columns:
                    parsed = pd.to_datetime(df[col], format='mixed', errors='coerce')
                    df[f'{col}_year'] = parsed.dt.year
                    df[f'{col}_month'] = parsed.dt.month
                    df[f'{col}_day'] = parsed.dt.day
                    df[f'{col}_weekday'] = parsed.dt.weekday
                    df[f'{col}_hour'] = parsed.dt.hour
            df = df.drop(columns=[c for c in dt_cols if c in df.columns])
        
        if top_2 and len(top_2) == 2:
            col1, col2 = top_2[0], top_2[1]
            try:
                # Force numeric evaluation to replicate original math
                if col1 in df.columns and col2 in df.columns:
                    df[col1] = pd.to_numeric(df[col1], errors='coerce')
                    df[col2] = pd.to_numeric(df[col2], errors='coerce')
                    
                    df[f'{col1}_plus_{col2}'] = df[col1] + df[col2]
                    df[f'{col1}_minus_{col2}'] = df[col1] - df[col2]
                    df[f'{col1}_div_{col2}'] = df[col1] / (df[col2].replace(0, 1e-5))
                    
                    if bins:
                        for col in top_2:
                            if col in bins and col in df.columns:
                                df[f'{col}_binned'] = pd.cut(df[col], bins=bins[col], labels=False)
            except Exception as fe_err:
                print(f"DEBUG: Feature engineering duplication failed: {fe_err}")

        # The ColumnTransformer in the pipeline expects specific columns.
        try:
            X_transformed = full_pipeline.transform(df)
        except Exception as e:
            raise Exception(f"Preprocessing failed. Ensure input contains the required features. Error: {str(e)}")

        # 5. Predict
        if task_type == "Classification" and hasattr(model, "predict_proba"):
            # Use a default threshold of 0.5 
            # (In a more advanced setup, this could be stored in the artifact)
            proba = model.predict_proba(X_transformed)
            if proba.shape[1] == 2:
                prediction = (proba[:, 1] >= 0.5).astype(int)
            else:
                prediction = np.argmax(proba, axis=1)
        else:
            prediction = model.predict(X_transformed)
        
        # Inverse transform if encoder exists
        if target_encoder and task_type == "Classification":
            try:
                prediction = target_encoder.inverse_transform(prediction)
            except:
                pass
        
        result = {
            "task_type": task_type,
            "status": "success"
        }

        if input_file:
            # Add prediction to dataframe
            df['Prediction'] = prediction
            
            # Save to new CSV
            output_filename = input_file.replace('.csv', '_predictions.csv')
            df.to_csv(output_filename, index=False)
            
            result["csv_path"] = os.path.abspath(output_filename)
            # Replace NaN with None for JSON compatibility
            preview_df = df.head(50).replace({np.nan: None, np.inf: None, -np.inf: None})
            result["preview"] = preview_df.to_dict(orient='records')
            result["prediction"] = prediction.tolist()[:50] # Short list for summary
        else:
            result["prediction"] = prediction.tolist()
        
        print(json.dumps(result, cls=NpEncoder))

    except Exception as e:
        import traceback
        print(json.dumps({"status": "error", "error": str(e), "traceback": traceback.format_exc()}))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", required=True, help="URL or path of the model file")
    parser.add_argument("--input", required=False, help="Input data as JSON string")
    parser.add_argument("--input_file", required=False, help="Path to input CSV file")
    args = parser.parse_args()
    
    predict(args.model, args.input, args.input_file)
