# TruthLens — Python AI/ML Veracity & Fake News Detection Engine

This directory contains the complete **Python Machine Learning pipeline** for TruthLens fake news detection, converted from `js/ml-model.js` and upgraded with Scikit-learn statistical NLP models.

---

## 🌟 What Was Built

1. **`ml_model.py` (Core Python Prediction Engine)**:
   - Full Python conversion of `ml-model.js`.
   - Combines statistical NLP (`TF-IDF + Calibrated Classifier`) with linguistic heuristics (sensationalism, fear triggers, vague attribution, uppercase/punctuation abuse, domain credibility, and rumor archetypes).
   - Generates granular scores: `fakeProbability`, `realProbability`, `credibilityScore`, `verdict`, `riskLevel`, `signals`, and academic natural language explanations.
   - Includes interactive CLI: `python ml_model.py "Your claim statement"`.

2. **`train.py` (Model Training & Evaluation Pipeline)**:
   - Trains and compares multiple ML algorithms:
     - Calibrated Logistic Regression (L2 regularization, balanced weights)
     - Complement & Multinomial Naive Bayes
     - Calibrated SGD Linear Classifier
     - Random Forest Classifier
   - Automatically benchmarks accuracy, precision, recall, and F1 score.
   - Saves the winning model pipeline to `models/fake_news_model.joblib`.
   - Exports training metrics and top informative lexical features to `models/model_metadata.json`.

3. **`generate_large_dataset.py` (High-Capacity Dataset Generator)**:
   - Programmatically synthesizes over 11,000+ diverse real and fake news claims across 12 domains with subtle edge cases and hard negatives.
   - Run `python generate_large_dataset.py` to regenerate or scale the dataset further.

4. **`app.py` (Flask REST API Microservice)**:
   - Cross-Origin (CORS) enabled REST API allowing the web frontend to query the Python model in real time.
   - Endpoints:
     - `GET /health`: Engine status, model type, accuracy, and vocabulary features.
     - `POST /predict`: Real-time veracity prediction for headlines/claims.
     - `POST /batch-predict`: Multi-claim verification.
     - `POST /evaluate-domain`: Source domain credibility assessment.
     - `POST /train`: On-demand retraining trigger.

4. **`js/ml-model.js` (Web Frontend Bridge)**:
   - Updated with asynchronous bridge to `http://127.0.0.1:5000`.
   - Maintains 100% backward compatibility with synchronous callers while seamlessly prioritizing real Python ML predictions when the server is online.

5. **Launcher Scripts**:
   - `train_model.bat`: 1-click model retraining.
   - `run_ml_server.bat`: 1-click REST API server startup.

---

## 🚀 Quick Start Guide

### 1. Train the ML Model
To train (or retrain) the model on the curated dataset:
```powershell
python train.py
```
*(Or double-click `train_model.bat`)*

You will see:
- Candidate classifiers benchmarked (Accuracy, F1, Precision, Recall).
- Confusion matrix and classification report.
- Top predictive keywords for Fake vs. Real news.
- Serialized artifacts saved in `models/fake_news_model.joblib`.

### 2. Run Instant CLI Predictions
Test any headline or statement right from PowerShell:
```powershell
python ml_model.py "SHOCKING: Miracle fruit cures cancer in 24 hours!" "https://viralpost.com"
```
Or start an interactive terminal session:
```powershell
python ml_model.py --interactive
```

### 3. Start the Python REST API Server
Launch the Flask microservice:
```powershell
python app.py
```
*(Or double-click `run_ml_server.bat`)*

Server will start on `http://127.0.0.1:5000`. The frontend will automatically detect it and use the Python ML engine!

---

## 📊 Training with Custom External Datasets (e.g. Kaggle)

You can train on any custom CSV dataset (such as the Kaggle Fake News Dataset, LIAR dataset, or ISOT):
```powershell
python train.py --data "path/to/your_dataset.csv"
```

The script automatically detects text columns (`text`, `title`, `claim`, `headline`) and label columns (`label`, `verdict`, `is_fake`), where `1 = Fake` and `0 = Real`.

---

## 📡 API Endpoint Reference

### `POST /predict`
**Request:**
```json
{
  "text": "Central bank announces emergency cash freeze capping ATM withdrawals",
  "sourceUrl": "https://rumorsite.com"
}
```

**Response:**
```json
{
  "fakeProbability": 92,
  "realProbability": 8,
  "credibilityScore": 8,
  "verdict": "High Probability Fake News",
  "riskLevel": "Critical",
  "badgeClass": "bg-danger text-white",
  "signals": [
    "ML Classifier detected 98% statistical correlation with disinformation patterns.",
    "Matches viral Economic & Banking narrative archetype (86% similarity)"
  ],
  "metrics": {
    "sensationalism": 55,
    "linguisticBias": 30,
    "sourceCredibility": 50,
    "factualPlausibility": 20,
    "mlModelProbability": 98.0,
    "modelConfidence": 100.0
  },
  "explanation": "The TruthLens ML model assigned a 92% probability of disinformation...",
  "modelType": "Hybrid ML (Calibrated Logistic Regression)"
}
```

### `GET /health`
Returns system status, active model name, training timestamp, and test accuracy.
