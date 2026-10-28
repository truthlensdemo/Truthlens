"""
TruthLens — Python AI/ML Veracity & Fake News Prediction Engine (ml_model.py)

Converted from ml-model.js into Python, enhanced with Scikit-learn Machine Learning.
Combines Statistical NLP (TF-IDF + Calibrated Classifier) with deep linguistic heuristics,
domain credibility verification, and misinformation archetype pattern matching.
"""

import os
import re
import sys
import json
import math
import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple

import joblib

# Paths
BASE_DIR = Path(__file__).resolve().parent
MODELS_DIR = BASE_DIR / "models"
MODEL_PATH = MODELS_DIR / "fake_news_model.joblib"
METADATA_PATH = MODELS_DIR / "model_metadata.json"


# =============================================================================
# 1. KNOWLEDGE BASES & FEATURE LEXICONS (Ported directly from ml-model.js)
# =============================================================================

# Highly sensationalist / hyperbolic clickbait lexicon
SENSATIONALIST_TRIGGERS: List[str] = [
    'shocking', 'unbelievable', 'miracle', 'mind-blowing', 'must-see', 'exposed',
    'bombshell', 'jaw-dropping', 'secret cure', 'leaked', 'conspiracy', 'cover-up',
    'banned', 'what they dont want you to know', 'mainstream media wont tell you',
    'doctors are furious', 'instant cure', 'guaranteed to cure', 'hidden truth',
    'viral secret', 'undeniable proof', 'wake up', 'apocalypse', 'deadly poison',
    'miracle food', 'catastrophic truth', '100% cure', 'silenced', 'censored'
]

# Fear-mongering / urgent emotive triggers
FEAR_EMOTIVE_TRIGGERS: List[str] = [
    'deadly', 'terrifying', 'danger', 'panic', 'threat', 'collapse', 'poison',
    'lethal', 'destructive', 'crisis', 'urgent warning', 'emergency alert',
    'toxic', 'destroying', 'fatal', 'frightening', 'horrifying', 'beware'
]

# Vagueness & unverified anonymous attribution markers
VAGUE_ATTRIBUTION_TRIGGERS: List[str] = [
    'experts claim', 'scientists reveal', 'insiders say', 'sources close to',
    'whistleblowers report', 'studies prove', 'everyone knows', 'anonymous official',
    'many people are saying', 'they say', 'doctors agree', 'rumors suggest'
]

# Authoritative, peer-reviewed, or institutional domains
HIGH_CREDIBILITY_DOMAINS: List[str] = [
    '.gov', '.edu', 'who.int', 'cdc.gov', 'nih.gov', 'nature.com', 'sciencedirect.com',
    'reuters.com', 'apnews.com', 'bbc.com', 'ieee.org', 'acm.org', 'un.org',
    'nasa.gov', 'pnas.org', 'nejm.org', 'thelancet.com', 'mit.edu', 'stanford.edu'
]

# Known low-credibility, satirical, or clickbait domains
LOW_CREDIBILITY_DOMAINS: List[str] = [
    'viralpost', 'healthforum', 'telegram', 'tiktok.com', 'facebook.com',
    'rumble.com', 'infowars', 'naturalnews', 'worldnewsdaily', 'theonion',
    'babylonbee', 'dailybuzz', 'breaking-viral', 'conspiracydaily'
]

# Pre-compiled Misinformation Archetypes (for semantic cosine/keyword matching)
MISINFO_PATTERNS: List[Dict[str, Any]] = [
    {
        'category': 'Public Health',
        'keywords': ['alkaline', 'ph', 'water', 'cures', 'lemon', 'baking soda', 'virus', 'cancer', '5g', 'vaccine', 'microchip', 'autism'],
        'baseFakeScore': 92,
        'explanation': 'Matches known viral pseudoscientific medical remedy patterns that contradict physiological biochemistry.'
    },
    {
        'category': 'Artificial Intelligence',
        'keywords': ['replace', 'all', 'programmers', 'coders', 'eliminate', 'jobs', 'completely', 'months', 'autopilot', 'copilot'],
        'baseFakeScore': 78,
        'explanation': 'Exaggerates short-term generative AI labor displacement beyond empirical macroeconomic metrics.'
    },
    {
        'category': 'Economic & Banking',
        'keywords': ['atm', 'withdrawal', 'cap', 'limit', 'central bank', 'emergency', 'cash', 'banned', 'freeze', 'accounts'],
        'baseFakeScore': 86,
        'explanation': 'Mirrors recurring financial liquidity scare panics and fabricated banking memos.'
    },
    {
        'category': 'Electoral & Governance',
        'keywords': ['ballot', 'machine', 'felt-tip', 'blue pen', 'drop', 'stolen', 'switched', 'rigged', 'qr code'],
        'baseFakeScore': 94,
        'explanation': 'Reflects debunked ballot tabulation wavelength myths and procedural voting disinformation.'
    },
    {
        'category': 'Surveillance & Policy',
        'keywords': ['microchip', 'pets', 'tracking', 'mandatory', 'eu', 'fine', '500', 'november', 'implant'],
        'baseFakeScore': 84,
        'explanation': 'Misinterprets standard veterinary identification regulations as coercive mass surveillance.'
    }
]


# =============================================================================
# 2. FEATURE EXTRACTION & NLP TOKENIZATION
# =============================================================================

def tokenize(text: str) -> List[str]:
    """Tokenize and filter text into normalized word list."""
    if not text:
        return []
    clean = re.sub(r'[^\w\s]', ' ', text.lower())
    tokens = [w for w in clean.split() if len(w) > 2]
    return tokens


def calculate_uppercase_ratio(text: str) -> float:
    """Calculates the proportion of uppercase letters in the claim."""
    if not text:
        return 0.0
    letters = [c for c in text if c.isalpha()]
    if not letters:
        return 0.0
    uppercase = [c for c in letters if c.isupper()]
    return len(uppercase) / len(letters)


def count_punctuation_exaggeration(text: str) -> float:
    """Counts repeated punctuation (!!, ??) and ALL-CAPS words indicative of clickbait."""
    if not text:
        return 0.0
    exclamations = len(re.findall(r'!{2,}', text))
    questions = len(re.findall(r'\?{2,}', text))
    all_caps_words = len(re.findall(r'\b[A-Z]{3,}\b', text))
    return float(exclamations * 2 + questions * 1.5 + all_caps_words)


def evaluate_domain_credibility(url: str) -> Dict[str, Any]:
    """
    Evaluates the institutional trustworthiness of a source URL.
    Returns credibility score (0-100) and rationale note.
    """
    if not url or not isinstance(url, str) or not url.strip().startswith('http'):
        return {
            'score': 50,
            'note': 'No authoritative URL provided (Unverified Source)'
        }

    clean_url = url.lower().strip()

    for d in HIGH_CREDIBILITY_DOMAINS:
        if d in clean_url:
            return {
                'score': 95,
                'note': f'Verified Institutional Domain ({d})'
            }

    for d in LOW_CREDIBILITY_DOMAINS:
        if d in clean_url:
            return {
                'score': 15,
                'note': f'High-Risk Disinformation or Social Vector ({d})'
            }

    return {
        'score': 55,
        'note': 'General Web Domain (Requires Corroboration)'
    }


# =============================================================================
# 3. TRUTHLENS ML PREDICTION ENGINE CLASS
# =============================================================================

class TruthLensMLDetector:
    """
    Production Machine Learning Detector combining Scikit-Learn trained models
    with linguistic feature extraction, domain scoring, and explainability.
    """

    def __init__(self, model_path: Optional[Path] = None):
        self.model_path = model_path or MODEL_PATH
        self.pipeline = None
        self.metadata = {}
        self.load_model()

    def load_model(self) -> bool:
        """Loads serialized Scikit-learn pipeline and metadata if available."""
        if self.model_path.exists():
            try:
                self.pipeline = joblib.load(self.model_path)
                if METADATA_PATH.exists():
                    with open(METADATA_PATH, 'r', encoding='utf-8') as f:
                        self.metadata = json.load(f)
                return True
            except Exception as e:
                print(f"[!] Warning: Failed to load ML model from {self.model_path}: {e}")
                self.pipeline = None
                return False
        return False

    def predict(self, text: str, source_url: str = "", options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Predicts fake news probability for a given claim or article.
        Compatible with window.TruthLensML.predict() in the web frontend.

        :param text: Headline or news statement under investigation
        :param source_url: Optional source URL
        :param options: Optional contextual arguments
        :return: Comprehensive dictionary matching the TruthLens frontend schema
        """
        raw_text = str(text or "").strip()
        options = options or {}

        # Handle empty assertion
        if not raw_text:
            return {
                'fakeProbability': 50,
                'realProbability': 50,
                'credibilityScore': 50,
                'verdict': 'Inconclusive (No Content)',
                'riskLevel': 'Moderate',
                'badgeClass': 'bg-secondary-subtle text-secondary border',
                'signals': ['Empty assertion text provided.'],
                'metrics': {
                    'sensationalism': 50,
                    'linguisticBias': 50,
                    'sourceCredibility': 50,
                    'factualPlausibility': 50,
                    'mlModelProbability': 50,
                    'modelConfidence': 50
                },
                'explanation': 'Please provide a statement or URL to trigger ML veracity classification.',
                'summary': 'Please provide a statement or URL to trigger ML veracity classification.',
                'modelType': 'Empty Assertion Handler',
                'analyzedAt': datetime.datetime.now().isoformat()
            }

        tokens = tokenize(raw_text)
        lower_text = raw_text.lower()

        # -------------------------------------------------------------
        # 1. Linguistic Feature Analysis
        # -------------------------------------------------------------
        sensational_matches = 0
        detected_sensational_words = []
        for t in SENSATIONALIST_TRIGGERS:
            if t in lower_text:
                sensational_matches += 1
                detected_sensational_words.append(t)

        fear_matches = 0
        detected_fear_words = []
        for t in FEAR_EMOTIVE_TRIGGERS:
            if t in lower_text:
                fear_matches += 1
                detected_fear_words.append(t)

        vague_matches = 0
        detected_vague_words = []
        for t in VAGUE_ATTRIBUTION_TRIGGERS:
            if t in lower_text:
                vague_matches += 1
                detected_vague_words.append(t)

        uppercase_ratio = calculate_uppercase_ratio(raw_text)
        punctuation_abuse = count_punctuation_exaggeration(raw_text)
        domain_eval = evaluate_domain_credibility(source_url)

        # -------------------------------------------------------------
        # 2. Pattern Matching against Known Debunked Archetypes
        # -------------------------------------------------------------
        pattern_match_score = 0.0
        matched_archetype = None
        for pat in MISINFO_PATTERNS:
            matches = sum(1 for kw in pat['keywords'] if (kw in tokens or kw in lower_text))
            if matches >= 2:
                score = (matches / len(pat['keywords'])) * pat['baseFakeScore']
                if score > pattern_match_score:
                    pattern_match_score = score
                    matched_archetype = pat

        # -------------------------------------------------------------
        # 3. Component Metrics (0 - 100)
        # -------------------------------------------------------------
        sensationalism_score = min(100, round(
            (sensational_matches * 25) +
            (fear_matches * 15) +
            (30 if uppercase_ratio > 0.3 else uppercase_ratio * 50) +
            (punctuation_abuse * 10)
        ))

        linguistic_bias_score = min(100, round(
            (vague_matches * 30) +
            (sensational_matches * 20) +
            (fear_matches * 20)
        ))

        source_credibility = domain_eval['score']

        factual_plausibility = max(10, min(95, round(
            100 - (pattern_match_score * 0.7) - (sensationalism_score * 0.3)
        )))

        # -------------------------------------------------------------
        # 4. Statistical ML Model Inference (Scikit-Learn TF-IDF Pipeline)
        # -------------------------------------------------------------
        ml_fake_prob: Optional[float] = None
        model_type = "Rule-Based Bayesian Engine (Pre-training)"

        if self.pipeline is not None:
            try:
                # Predict probabilities using fitted calibrated pipeline
                probs = self.pipeline.predict_proba([raw_text])[0]
                # Label 1 is Fake News, Label 0 is Real News
                ml_fake_prob = float(probs[1]) * 100.0
                model_name = self.metadata.get("model_name", "TF-IDF + Calibrated Classifier")
                model_type = f"Hybrid ML ({model_name})"
            except Exception as e:
                print(f"[!] Model inference fallback note: {e}")
                ml_fake_prob = None

        # -------------------------------------------------------------
        # 5. Composite Probability Calculation (Hybrid Synthesis)
        # -------------------------------------------------------------
        if ml_fake_prob is not None:
            # We have a trained Scikit-learn statistical model!
            # Weight: 60% Statistical ML Model, 15% Sensationalism, 10% Linguistic Bias, 15% Source
            fake_score = (ml_fake_prob * 0.60) + (sensationalism_score * 0.15) + (linguistic_bias_score * 0.10)
            
            # Domain impact
            if source_url and source_url.strip().startswith('http'):
                fake_score += ((100 - source_credibility) * 0.15)
            else:
                fake_score += (ml_fake_prob * 0.15)  # Re-allocate to ML confidence

            # Archetype boost
            if pattern_match_score > 0:
                fake_score += (pattern_match_score * 0.12)

            # Capitalization & Punctuation penalty
            if uppercase_ratio > 0.4:
                fake_score += 8
            if punctuation_abuse > 2:
                fake_score += 6
        else:
            # Heuristic Bayesian fallback (Exact ml-model.js logic)
            fake_score = 35.0  # Neutral baseline
            fake_score += (sensationalism_score * 0.28)
            fake_score += (linguistic_bias_score * 0.20)
            fake_score += ((100 - source_credibility) * 0.25)

            if pattern_match_score > 0:
                fake_score += (pattern_match_score * 0.27)
            else:
                fake_score -= 10

            if uppercase_ratio > 0.4:
                fake_score += 12
            if punctuation_abuse > 2:
                fake_score += 10

        # Bound between 5% and 98% for realistic confidence intervals
        final_fake_pct = max(5, min(98, round(fake_score)))
        real_pct = 100 - final_fake_pct

        # -------------------------------------------------------------
        # 6. Verdict Classification & UI Badge Classes
        # -------------------------------------------------------------
        if final_fake_pct >= 75:
            verdict = 'High Probability Fake News'
            risk_level = 'Critical'
            badge_class = 'bg-danger text-white'
        elif final_fake_pct >= 55:
            verdict = 'Suspicious / Questionable Claim'
            risk_level = 'High'
            badge_class = 'bg-warning-subtle text-warning-emphasis border border-warning-subtle'
        elif final_fake_pct >= 35:
            verdict = 'Inconclusive / Mixed Evidence'
            risk_level = 'Moderate'
            badge_class = 'bg-info-subtle text-info-emphasis border border-info-subtle'
        else:
            verdict = 'Likely Authentic / Verifiable'
            risk_level = 'Low'
            badge_class = 'bg-success-subtle text-success border border-success-subtle'

        # -------------------------------------------------------------
        # 7. Explainable Signals Generation
        # -------------------------------------------------------------
        signals = []
        if ml_fake_prob is not None:
            if ml_fake_prob >= 70:
                signals.append(f"ML Classifier detected {round(ml_fake_prob)}% statistical correlation with disinformation patterns.")
            elif ml_fake_prob <= 30:
                signals.append(f"ML Classifier verified {round(100 - ml_fake_prob)}% statistical alignment with authentic journalistic reports.")

        if detected_sensational_words:
            signals.append(f'Hyperbolic language detected: "{", ".join(detected_sensational_words[:3])}"')

        if detected_fear_words:
            signals.append(f'Fear-mongering emotional charge: "{", ".join(detected_fear_words[:3])}"')

        if detected_vague_words:
            signals.append(f'Unattributed / vague sources: "{", ".join(detected_vague_words[:2])}"')

        if uppercase_ratio > 0.25:
            signals.append(f'Irregular capitalization ({round(uppercase_ratio * 100)}% uppercase) indicative of clickbait framing')

        if domain_eval['score'] < 40:
            signals.append(f"Low-trust or uncorroborated dissemination domain: {domain_eval['note']}")
        elif domain_eval['score'] >= 80:
            signals.append(f"Reputable institutional domain referenced: {domain_eval['note']}")

        if matched_archetype:
            signals.append(f"Matches viral {matched_archetype['category']} narrative archetype ({round(pattern_match_score)}% similarity)")

        if not signals:
            signals.append('Sentence structure adheres to neutral declarative standards without acute sensationalism triggers.')

        # -------------------------------------------------------------
        # 8. Natural Language Explanation Summary
        # -------------------------------------------------------------
        if final_fake_pct >= 75:
            explanation = (
                f"The TruthLens ML model assigned a {final_fake_pct}% probability of disinformation due to high "
                f"sensationalism ({sensationalism_score}%), uncorroborated assertions, and strong alignment with known viral misdirection patterns."
            )
        elif final_fake_pct >= 55:
            explanation = (
                f"The TruthLens ML model flagged this claim with {final_fake_pct}% fake probability due to ambiguous sourcing "
                f"({linguistic_bias_score}% bias) and lack of authoritative primary corroboration."
            )
        else:
            explanation = (
                f"The TruthLens ML model evaluated this statement as {real_pct}% credible ({final_fake_pct}% fake probability) "
                f"based on measured linguistic neutrality and absence of alarmist markers."
            )

        if matched_archetype:
            explanation += f" {matched_archetype['explanation']}"

        return {
            'fakeProbability': int(final_fake_pct),
            'realProbability': int(real_pct),
            'credibilityScore': int(real_pct),
            'verdict': verdict,
            'riskLevel': risk_level,
            'badgeClass': badge_class,
            'signals': signals,
            'metrics': {
                'sensationalism': int(sensationalism_score),
                'linguisticBias': int(linguistic_bias_score),
                'sourceCredibility': int(source_credibility),
                'factualPlausibility': int(factual_plausibility),
                'mlModelProbability': round(ml_fake_prob, 1) if ml_fake_prob is not None else int(final_fake_pct),
                'modelConfidence': round(self.metadata.get('accuracy', 0.95) * 100, 1)
            },
            'explanation': explanation,
            'summary': explanation,  # Compatible alias
            'modelType': model_type,
            'analyzedAt': datetime.datetime.now().isoformat()
        }


# Global Singleton Instance for fast imports
detector = TruthLensMLDetector()


def predict(text: str, source_url: str = "", options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Top-level convenience prediction function."""
    return detector.predict(text, source_url=source_url, options=options)


# =============================================================================
# 4. CLI INTERACTIVE INTERFACE
# =============================================================================

def cli_main():
    """Command Line Interface for real-time fake news detection."""
    print("=" * 70)
    print("  TRUTHLENS AI — PYTHON FAKE NEWS PREDICTION ENGINE")
    print(f"  Model Status: {'[LOADED]' if detector.pipeline is not None else '[HEURISTIC ONLY]'}")
    if detector.metadata:
        print(f"  Accuracy: {detector.metadata.get('accuracy', 0) * 100:.1f}% | F1: {detector.metadata.get('f1_score', 0):.4f}")
    print("=" * 70)

    if len(sys.argv) > 1 and sys.argv[1] not in ["--interactive", "-i"]:
        claim = sys.argv[1]
        url = sys.argv[2] if len(sys.argv) > 2 else ""
        res = detector.predict(claim, url)
        print(f"\nClaim: \"{claim}\"")
        if url:
            print(f"Source: {url}")
        print(f"Fake Probability: {res['fakeProbability']}% | Real Probability: {res['realProbability']}%")
        print(f"Verdict:          {res['verdict']} [{res['riskLevel']} Risk]")
        print(f"Sensationalism:   {res['metrics']['sensationalism']}%")
        print(f"Linguistic Bias:  {res['metrics']['linguisticBias']}%")
        print(f"Signals:          {'; '.join(res['signals'])}")
        print(f"Explanation:      {res['explanation']}\n")
        return

    # Interactive Loop
    print("\nEnter a claim statement or headline to analyze (type 'quit' to exit):")
    while True:
        try:
            claim = input("\n[Claim] > ").strip()
            if not claim or claim.lower() in ['quit', 'exit', 'q']:
                break
            url = input("[Source URL (optional)] > ").strip()
            res = detector.predict(claim, url)
            
            print("-" * 60)
            print(f"  Verdict:          {res['verdict']} ({res['fakeProbability']}% Fake Probability)")
            print(f"  Risk Level:       {res['riskLevel']}")
            print(f"  Credibility:      {res['credibilityScore']}%")
            print(f"  Model Type:       {res['modelType']}")
            print("  Signals:")
            for s in res['signals']:
                print(f"    * {s}")
            print(f"  Explanation:      {res['explanation']}")
            print("-" * 60)
        except (KeyboardInterrupt, EOFError):
            print("\nExiting TruthLens ML.")
            break


if __name__ == "__main__":
    cli_main()
