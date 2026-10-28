"""
TruthLens — Python AI/ML REST API Server (app.py)

Exposes high-performance REST API endpoints for TruthLens Fake News detection,
allowing the web frontend and external microservices to query the trained
Scikit-learn model in real-time.
"""

import os
import sys
import json
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS

# Import detector from ml_model
from ml_model import detector, evaluate_domain_credibility
import train

BASE_DIR = Path(__file__).resolve().parent

app = Flask(__name__)
# Enable Cross-Origin Resource Sharing (CORS) across all routes
CORS(app, resources={r"/*": {"origins": "*"}})


@app.route("/", methods=["GET"])
@app.route("/health", methods=["GET"])
def health_check():
    """Health check and model status metadata."""
    is_loaded = detector.pipeline is not None
    return jsonify({
        "status": "healthy",
        "service": "TruthLens Python ML Veracity Engine",
        "version": "2.1.0",
        "model_loaded": is_loaded,
        "model_type": detector.metadata.get("model_name", "Heuristic Baseline") if is_loaded else "Heuristic Baseline",
        "accuracy": detector.metadata.get("accuracy", None),
        "f1_score": detector.metadata.get("f1_score", None),
        "total_training_samples": detector.metadata.get("total_samples", None),
        "last_trained_at": detector.metadata.get("trained_at", None),
        "top_fake_features": detector.metadata.get("top_fake_features", [])[:6],
        "top_real_features": detector.metadata.get("top_real_features", [])[:6]
    }), 200


@app.route("/predict", methods=["POST"])
def predict_claim():
    """
    Main veracity prediction endpoint.
    Payload: { "text": "headline or claim text", "sourceUrl": "https://..." }
    """
    data = request.get_json(silent=True) or {}
    text = data.get("text", "") or data.get("claim", "") or data.get("statement", "")
    source_url = data.get("sourceUrl", "") or data.get("url", "")
    options = data.get("options", {})

    result = detector.predict(text, source_url=source_url, options=options)
    return jsonify(result), 200


@app.route("/batch-predict", methods=["POST"])
def batch_predict():
    """
    Batch prediction endpoint for multi-claim analysis.
    Payload: { "claims": [ {"text": "...", "sourceUrl": "..."}, ... ] }
    """
    data = request.get_json(silent=True) or {}
    claims = data.get("claims", [])
    if not isinstance(claims, list):
        return jsonify({"error": "Invalid format. 'claims' must be an array."}), 400

    results = []
    for item in claims:
        if isinstance(item, str):
            res = detector.predict(item)
        elif isinstance(item, dict):
            res = detector.predict(
                item.get("text", "") or item.get("claim", ""),
                source_url=item.get("sourceUrl", "") or item.get("url", "")
            )
        else:
            continue
        results.append(res)

    return jsonify({"count": len(results), "predictions": results}), 200


@app.route("/evaluate-domain", methods=["POST", "GET"])
def evaluate_domain():
    """
    Domain credibility assessment endpoint.
    Payload: { "url": "https://..." } or query param ?url=...
    """
    if request.method == "POST":
        data = request.get_json(silent=True) or {}
        url = data.get("url", "")
    else:
        url = request.args.get("url", "")

    eval_result = evaluate_domain_credibility(url)
    return jsonify(eval_result), 200


@app.route("/train", methods=["POST"])
def retrain_model():
    """
    Triggers re-training of the ML model on demand.
    Optional Payload: { "datasetPath": "path/to/custom.csv", "augment": true }
    """
    data = request.get_json(silent=True) or {}
    dataset_path_str = data.get("datasetPath", None)
    augment = data.get("augment", True)

    dataset_path = Path(dataset_path_str) if dataset_path_str else train.DEFAULT_DATASET_PATH

    try:
        pipeline, metadata = train.train_and_evaluate(dataset_path=dataset_path, augment=augment)
        # Reload detector in-memory
        detector.load_model()
        return jsonify({
            "success": True,
            "message": "Model retrained and reloaded successfully.",
            "metadata": metadata
        }), 200
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print("=" * 70)
    print("  TRUTHLENS AI  PYTHON ML REST API SERVICE")
    print(f"  Listening on: http://127.0.0.1:{port}")
    print("=" * 70)
    app.run(host="127.0.0.1", port=port, debug=False)
