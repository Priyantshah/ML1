import numpy as np
import pandas as pd

class RuleBasedModel:
    """
    A purely deterministic mathematical model used to instantly bypass ML algorithms 
    when data follows a perfect 1.0 accuracy logical rule (e.g. Parity, Modulo, explicit thresholds).
    """
    def __init__(self, rule_col, rule_type, rule_val=None, rule_description=""):
        self.rule_col = rule_col
        self.rule_type = rule_type
        self.rule_val = rule_val
        self.rule_description = rule_description
        self.classes_ = np.array([0, 1])

    def fit(self, X, y=None):
        return self

    def predict(self, X):
        # Expecting X to be a pandas DataFrame (preprocessor is bypassed for RuleBasedModel)
        if isinstance(X, pd.DataFrame):
            if self.rule_col in X.columns:
                # Fill missing with median/0 safely to avoid crash
                vals = X[self.rule_col].fillna(0).values
            else:
                vals = np.zeros(len(X))
        else:
            vals = X

        if self.rule_type == "modulo":
            return (np.floor(vals) % self.rule_val).astype(int)
        elif self.rule_type == "threshold":
            return (vals > self.rule_val).astype(int)
        else:
            return np.zeros(len(vals), dtype=int)

    def predict_proba(self, X):
        preds = self.predict(X)
        proba = np.zeros((len(preds), 2))
        for i, p in enumerate(preds):
            if p < 2: proba[i, p] = 1.0
            else: proba[i, 1] = 1.0 # fallback
        return proba
