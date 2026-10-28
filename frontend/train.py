"""
TruthLens — Fake News ML Model Training Pipeline (train.py)

Trains an advanced Natural Language Processing (NLP) & Statistical Machine Learning
model using TF-IDF n-gram vectorization and calibrated classification algorithms.
Evaluates model accuracy, precision, recall, and F1 score, and exports the serialized
model artifacts for real-time inference.
"""

import os
import sys
import json
import random
import argparse
import datetime
from pathlib import Path

import numpy as np
import pandas as pd
import joblib

from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression, SGDClassifier
from sklearn.naive_bayes import MultinomialNB, ComplementNB
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)
from sklearn.pipeline import Pipeline

# Base paths
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

MODEL_OUTPUT_PATH = MODELS_DIR / "fake_news_model.joblib"
METADATA_OUTPUT_PATH = MODELS_DIR / "model_metadata.json"
DEFAULT_DATASET_PATH = DATA_DIR / "dataset.csv"


def clean_text(text: str) -> str:
    """Normalize and clean input text for NLP vectorization."""
    if not isinstance(text, str):
        return ""
    text = text.strip()
    return text


def augment_dataset(df: pd.DataFrame, target_min_samples: int = 400) -> pd.DataFrame:
    """
    Augments the training data using linguistic variations to increase
    diversity, robustness, and statistical generalization.
    """
    if len(df) >= target_min_samples:
        return df

    augmented_rows = []
    
    # Prefixes common in fake/clickbait news vs verified reporting
    fake_prefixes = [
        "BREAKING: ", "SHOCKING: ", "MUST SEE: ", "BOMBSHELL REPORT: ",
        "LEAKED: ", "THEY DONT WANT YOU TO KNOW: ", "EXPOSED: ", "VIRAL ALERT: "
    ]
    fake_suffixes = [
        " -- doctors furious!", " (Classified evidence)", " [WAKE UP]",
        " -- Mainstream media refuses to report this!", " (Undeniable proof)"
    ]
    real_prefixes = [
        "Official Release: ", "Reuters Reports: ", "Scientific Investigation: ",
        "Peer-reviewed study confirms: ", "Government Gazette: ", "AP News: "
    ]
    real_suffixes = [
        " according to official findings.", " published in academic journal.",
        " following comprehensive regulatory review.", " verified by independent auditors."
    ]

    for _, row in df.iterrows():
        text = str(row['text'])
        label = int(row['label'])
        cat = row.get('category', 'General')

        # Add original
        augmented_rows.append({'text': text, 'label': label, 'category': cat})

        # Variation 1: Add stylized prefixes / suffixes
        if label == 1:
            p = random.choice(fake_prefixes)
            augmented_rows.append({'text': f"{p}{text}", 'label': 1, 'category': cat})
            if random.random() > 0.4:
                s = random.choice(fake_suffixes)
                augmented_rows.append({'text': f"{text}{s}", 'label': 1, 'category': cat})
                augmented_rows.append({'text': text.upper(), 'label': 1, 'category': cat})
        else:
            p = random.choice(real_prefixes)
            augmented_rows.append({'text': f"{p}{text}", 'label': 0, 'category': cat})
            if random.random() > 0.4:
                s = random.choice(real_suffixes)
                augmented_rows.append({'text': f"{text}{s}", 'label': 0, 'category': cat})

    aug_df = pd.DataFrame(augmented_rows).drop_duplicates(subset=['text']).reset_index(drop=True)
    return aug_df


def load_dataset(csv_path: Path) -> pd.DataFrame:
    """Load dataset from CSV with flexible column mapping."""
    if not csv_path.exists():
        raise FileNotFoundError(f"Dataset not found at: {csv_path}")

    df = pd.read_csv(csv_path)
    
    # Detect text column
    text_col = None
    for candidate in ['text', 'claim', 'title', 'headline', 'statement', 'content']:
        if candidate in df.columns:
            text_col = candidate
            break
    if not text_col:
        raise ValueError(f"Could not identify a text column in CSV. Found: {list(df.columns)}")

    # Detect label column
    label_col = None
    for candidate in ['label', 'verdict', 'is_fake', 'fake', 'target', 'class']:
        if candidate in df.columns:
            label_col = candidate
            break
    if not label_col:
        raise ValueError(f"Could not identify a label column in CSV. Found: {list(df.columns)}")

    # Standardize dataframe
    clean_df = pd.DataFrame()
    clean_df['text'] = df[text_col].astype(str).apply(clean_text)
    
    # Map label to binary (1 = Fake, 0 = Real)
    def parse_label(val):
        if isinstance(val, (int, float, np.integer)):
            return 1 if int(val) == 1 else 0
        s = str(val).strip().lower()
        if s in ['1', 'fake', 'false', 'pants-on-fire', 'barely-true', 'misinformation']:
            return 1
        return 0

    clean_df['label'] = df[label_col].apply(parse_label)
    if 'category' in df.columns:
        clean_df['category'] = df['category'].astype(str)
    else:
        clean_df['category'] = 'General'

    # Filter invalid
    clean_df = clean_df[clean_df['text'].str.len() > 10].dropna()
    clean_df = clean_df.drop_duplicates(subset=['text']).reset_index(drop=True)
    return clean_df


def train_and_evaluate(dataset_path: Path = DEFAULT_DATASET_PATH, augment: bool = True):
    """
    Main training workflow:
    1. Loads and validates dataset
    2. Builds TF-IDF feature pipeline
    3. Trains and benchmarks multiple ML classifiers
    4. Evaluates precision, recall, f1, and roc-auc
    5. Calibrates probabilities and serializes best model
    """
    print("=" * 70)
    print("  TRUTHLENS AI — MACHINE LEARNING TRAINING PIPELINE")
    print("=" * 70)
    print(f"[*] Loading dataset from: {dataset_path}")
    
    df = load_dataset(dataset_path)
    print(f"[*] Initial loaded samples: {len(df)} (Fake: {(df['label'] == 1).sum()}, Real: {(df['label'] == 0).sum()})")

    if augment:
        print("[*] Applying smart NLP linguistic data augmentation...")
        df = augment_dataset(df, target_min_samples=350)
        print(f"[*] Post-augmentation dataset size: {len(df)} (Fake: {(df['label'] == 1).sum()}, Real: {(df['label'] == 0).sum()})")

    X = df['text']
    y = df['label']

    # Stratified Train-Test Split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    print(f"[*] Train set: {len(X_train)} samples | Test set: {len(X_test)} samples")
    print("-" * 70)

    # TF-IDF Vectorizer configuration (Optimized for Massive Corpus)
    vectorizer = TfidfVectorizer(
        ngram_range=(1, 2),
        max_features=35000,
        sublinear_tf=True,
        min_df=2,
        stop_words='english'
    )

    # Candidate Classifiers (All calibrated for accurate probability output)
    candidate_models = {
        "Calibrated Logistic Regression": CalibratedClassifierCV(
            estimator=LogisticRegression(C=3.0, max_iter=2000, class_weight='balanced', random_state=42),
            cv=3
        ),
        "Calibrated Complement NB": CalibratedClassifierCV(
            estimator=ComplementNB(alpha=0.5, norm=True),
            cv=3
        ),
        "Calibrated Multinomial NB": CalibratedClassifierCV(
            estimator=MultinomialNB(alpha=0.4),
            cv=3
        ),
        "Calibrated SGD Classifier": CalibratedClassifierCV(
            estimator=SGDClassifier(loss='log_loss', max_iter=2000, random_state=42),
            cv=3
        ),
        "Random Forest Classifier": RandomForestClassifier(n_estimators=50, random_state=42, max_depth=20, n_jobs=-1)
    }

    print("[*] Benchmarking Candidate Classifiers:")
    model_results = {}
    best_model_name = None
    best_f1 = -1.0
    best_pipeline = None

    for name, clf in candidate_models.items():
        pipeline = Pipeline([
            ('vectorizer', vectorizer),
            ('classifier', clf)
        ])

        # Fit on training data
        pipeline.fit(X_train, y_train)

        # Predict test data
        y_pred = pipeline.predict(X_test)
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)

        model_results[name] = {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4)
        }

        print(f"  -> {name:32s} | Acc: {acc*100:5.2f}% | F1: {f1:0.4f} | Prec: {prec:0.4f} | Rec: {rec:0.4f}")

        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name
            best_pipeline = pipeline

    print("-" * 70)
    print(f"[+] Winner Champion Model: '{best_model_name}' (F1 Score: {best_f1:.4f})")
    print("-" * 70)

    # Full evaluation of best model
    best_y_pred = best_pipeline.predict(X_test)
    if hasattr(best_pipeline, "predict_proba"):
        best_y_prob = best_pipeline.predict_proba(X_test)[:, 1]
        roc_auc = float(roc_auc_score(y_test, best_y_prob))
    else:
        roc_auc = float(best_f1)

    cm = confusion_matrix(y_test, best_y_pred).tolist()
    final_acc = float(accuracy_score(y_test, best_y_pred))
    final_prec = float(precision_score(y_test, best_y_pred, zero_division=0))
    final_rec = float(recall_score(y_test, best_y_pred, zero_division=0))

    print("\n[*] Detailed Classification Report:")
    print(classification_report(y_test, best_y_pred, target_names=["Real News (0)", "Fake News (1)"]))

    print(f"[*] Confusion Matrix: [TN: {cm[0][0]}, FP: {cm[0][1]}], [FN: {cm[1][0]}, TP: {cm[1][1]}]")
    print(f"[*] ROC-AUC Score:    {roc_auc:.4f}")

    # Extract Top Informative Lexical Features
    top_fake_features = []
    top_real_features = []
    try:
        vec_fitted = best_pipeline.named_steps['vectorizer']
        feature_names = np.array(vec_fitted.get_feature_names_out())
        clf_step = best_pipeline.named_steps['classifier']

        # Determine coefficients
        coef = None
        if hasattr(clf_step, 'coef_'):
            coef = clf_step.coef_[0]
        elif hasattr(clf_step, 'calibrated_classifiers_'):
            base = clf_step.calibrated_classifiers_[0].estimator
            if hasattr(base, 'coef_'):
                base_coefs = [cc.estimator.coef_[0] for cc in clf_step.calibrated_classifiers_ if hasattr(cc.estimator, 'coef_')]
                if base_coefs:
                    coef = np.mean(base_coefs, axis=0)
            elif hasattr(base, 'feature_log_prob_'):
                if base.feature_log_prob_.shape[0] > 1:
                    coef = base.feature_log_prob_[1] - base.feature_log_prob_[0]
                else:
                    coef = -base.feature_log_prob_[0]

        if coef is not None:
            top_fake_idx = np.argsort(coef)[-15:][::-1]
            top_real_idx = np.argsort(coef)[:15]
            top_fake_features = feature_names[top_fake_idx].tolist()
            top_real_features = feature_names[top_real_idx].tolist()
            print(f"\n[+] Top Linguistic Features for Fake News: {', '.join(top_fake_features[:8])}")
            print(f"[+] Top Linguistic Features for Real News: {', '.join(top_real_features[:8])}")
    except Exception as e:
        print(f"[!] Feature extraction note: {e}")

    # Serialize Model Artifact
    print(f"\n[*] Exporting trained model artifact to: {MODEL_OUTPUT_PATH}")
    joblib.dump(best_pipeline, MODEL_OUTPUT_PATH)

    # Save Model Metadata
    metadata = {
        "model_name": best_model_name,
        "trained_at": datetime.datetime.now().isoformat(),
        "dataset_path": str(dataset_path),
        "total_samples": int(len(df)),
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "accuracy": round(final_acc, 4),
        "f1_score": round(best_f1, 4),
        "precision": round(final_prec, 4),
        "recall": round(final_rec, 4),
        "roc_auc": round(roc_auc, 4),
        "confusion_matrix": cm,
        "top_fake_features": top_fake_features,
        "top_real_features": top_real_features,
        "candidate_benchmarks": model_results
    }

    with open(METADATA_OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(metadata, f, indent=2)

    print(f"[+] Model metadata exported to: {METADATA_OUTPUT_PATH}")
    print("\n" + "=" * 70)
    print("  MODEL TRAINING COMPLETED SUCCESSFULLY!")
    print("=" * 70)

    # Verification Sanity Tests
    print("\n[*] Running Validation Verification Tests Across Multiple Domains:")
    sample_tests = [
        ("SHOCKING: 100% miracle cure for cancer suppressed by corrupt pharmaceutical companies!", "Expected: High Fake"),
        ("Clinical trials published in The Lancet indicate new vaccine achieves 92% efficacy in peer-reviewed trials", "Expected: Likely Real"),
        ("Central bank declares emergency cash freeze limiting ATM withdrawals to $20", "Expected: High Fake"),
        ("NASA James Webb Space Telescope transmits infrared spectrometry observations of distant star system", "Expected: Likely Real"),
        ("Thousands of uncounted ballots with felt-tip pen marks found dumped in river behind voting center", "Expected: High Fake"),
        ("Bipartisan canvassing board certifies official election results following mandatory statutory canvass", "Expected: Likely Real"),
        ("Autonomous AI system breaks containment and permanently takes over global telecommunications grid", "Expected: High Fake"),
        ("Computer scientists at MIT develop energy-efficient transformer architecture reducing compute requirements", "Expected: Likely Real"),
        ("Fact-check: Viral claim alleging government ban on gas appliances nationwide is completely false", "Expected: Likely Real (Debunk)"),
        ("Whistleblower leaks classified memo proving routine pediatric vaccines contain liquid microchips", "Expected: High Fake"),
    ]

    for test_text, expected in sample_tests:
        prob = best_pipeline.predict_proba([test_text])[0]
        fake_pct = round(prob[1] * 100, 1)
        print(f"  * '{test_text[:68]}...' -> Fake Prob: {fake_pct:5.1f}% ({expected})")

    print("\n[SUCCESS] TruthLens ML model is ready for real-time inference via ml_model.py & app.py.")
    return best_pipeline, metadata


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="TruthLens Fake News ML Training Pipeline")
    parser.add_argument("--data", type=str, default=str(DEFAULT_DATASET_PATH), help="Path to CSV dataset")
    parser.add_argument("--no-augment", action="store_true", help="Disable synthetic data augmentation")
    args = parser.parse_args()

    train_and_evaluate(dataset_path=Path(args.data), augment=not args.no_augment)
