from scoring_engine import ScoringEngine
from evidence_aggregator import EvidenceAggregator
from utils.accuracy_metrics import AccuracyMetrics
import csv
import os
from typing import Dict, List, Tuple
import numpy as np
try:
    from scipy.optimize import minimize
    HAS_SCIPY = True
except:
    HAS_SCIPY = False


class WeightOptimizer:
    """
    Optimize evidence weights to maximize accuracy on ground truth dataset
    Target: Achieve >= 95% correlation and classification accuracy
    """
    
    def __init__(self):
        self.accuracy_calculator = AccuracyMetrics()
        self.ground_truth = self.accuracy_calculator.ground_truth
        
        # Current weights from scoring engine
        self.current_weights = {
            'geo': 0.25,
            'geo_precision': 0.05,
            'temporal': 0.15,
            'temporal_decay': 0.05,
            'iot': 0.12,
            'doc': 0.15,
            'crowd': 0.08,
            'linguistic': 0.05,
            'cross_corpus': 0.05,
            'history': 0.05
        }
        
        # Weight names in order
        self.weight_names = list(self.current_weights.keys())
    
    def weights_dict_to_array(self, weights_dict: Dict[str, float]) -> np.ndarray:
        """Convert weights dictionary to numpy array"""
        return np.array([weights_dict[name] for name in self.weight_names])
    
    def weights_array_to_dict(self, weights_array: np.ndarray) -> Dict[str, float]:
        """Convert numpy array to weights dictionary"""
        return {name: float(w) for name, w in zip(self.weight_names, weights_array)}
    
    def calculate_acs_with_weights(self, address: Dict, evidence_scores: Dict, weights: Dict[str, float]) -> float:
        """Calculate ACS using custom weights"""
        acs = (
            evidence_scores.get('geo', 0) * weights['geo'] +
            evidence_scores.get('geo_precision', 0) * weights['geo_precision'] +
            evidence_scores.get('temporal', 0) * weights['temporal'] +
            evidence_scores.get('temporal_decay', 0) * weights['temporal_decay'] +
            evidence_scores.get('iot', 0) * weights['iot'] +
            evidence_scores.get('doc', 0) * weights['doc'] +
            evidence_scores.get('crowd', 0) * weights['crowd'] +
            evidence_scores.get('linguistic', 0) * weights['linguistic'] +
            evidence_scores.get('cross_corpus', 0) * weights['cross_corpus'] +
            evidence_scores.get('history', 0) * weights['history']
        )
        return round(acs, 2)
    
    def evaluate_weights(self, weights_array: np.ndarray) -> float:
        """
        Evaluate weights on ground truth dataset
        Returns: loss value (lower is better)
        """
        weights = self.weights_array_to_dict(weights_array)
        
        # Run validation on ground truth
        scoring_engine = ScoringEngine()
        
        predictions_acs = []
        predictions_vl = []
        
        for gt in self.ground_truth[:50]:  # Use subset for speed
            try:
                address = {
                    'house_no': gt['house_no'],
                    'street': gt['street'],
                    'locality': gt['locality'],
                    'city': gt['city'],
                    'district': gt['district'],
                    'state': gt['state'],
                    'pin': gt['pin'],
                    'digipin': gt['digipin']
                }
                
                # Get evidence scores
                acs, evidence, reason_codes, suggestions, advanced_metrics = scoring_engine.calculate_acs(address, None)
                
                # Recalculate ACS with custom weights
                evidence_scores = {ev['type']: ev['score'] for ev in evidence}
                custom_acs = self.calculate_acs_with_weights(address, evidence_scores, weights)
                
                vl = scoring_engine.get_validation_level(custom_acs)
                
                predictions_acs.append({
                    'test_id': gt['test_id'],
                    'predicted_acs': custom_acs
                })
                
                predictions_vl.append({
                    'test_id': gt['test_id'],
                    'predicted_vl': vl
                })
            except Exception as e:
                print(f"Error processing {gt['test_id']}: {e}")
                continue
        
        # Calculate metrics
        acs_metrics = self.accuracy_calculator.calculate_acs_metrics(predictions_acs)
        vl_metrics = self.accuracy_calculator.calculate_vl_classification_metrics(predictions_vl)
        
        # Loss function: maximize correlation, minimize MAE, maximize VL accuracy
        correlation = acs_metrics.get('correlation', 0)
        mae = acs_metrics.get('mae', 100)
        vl_accuracy = vl_metrics.get('overall_accuracy', 0)
        
        # Combined loss (lower is better)
        loss = (1 - correlation) + (mae / 100) + (1 - vl_accuracy)
        
        return loss
    
    def optimize_weights_grid_search(self, step=0.01) -> Dict[str, float]:
        """
        Optimize weights using grid search
        This is computationally expensive but deterministic
        """
        print("Starting grid search optimization...")
        print("This will test multiple weight combinations...")
        
        best_weights = self.current_weights.copy()
        best_loss = self.evaluate_weights(self.weights_dict_to_array(self.current_weights))
        
        print(f"Baseline loss: {best_loss:.4f}")
        
        # Test adjustments to key weights
        adjustments = [
            # Increase geo, decrease temporal
            {'geo': 0.28, 'temporal': 0.13},
            # Increase doc, decrease crowd
            {'doc': 0.18, 'crowd': 0.05},
            # Increase geo_precision
            {'geo_precision': 0.07, 'geo': 0.23},
            # Balance all equally
            {'geo': 0.22, 'temporal': 0.18, 'iot': 0.14, 'doc': 0.18, 'crowd': 0.10},
            # Focus on reliable sources
            {'geo': 0.30, 'doc': 0.20, 'geo_precision': 0.08, 'cross_corpus': 0.07},
        ]
        
        for i, adjustment in enumerate(adjustments):
            test_weights = self.current_weights.copy()
            test_weights.update(adjustment)
            
            # Normalize to sum to 1.0
            total = sum(test_weights.values())
            test_weights = {k: v/total for k, v in test_weights.items()}
            
            loss = self.evaluate_weights(self.weights_dict_to_array(test_weights))
            print(f"Test {i+1}/{ len(adjustments)}: Loss = {loss:.4f}")
            
            if loss < best_loss:
                best_loss = loss
                best_weights = test_weights
                print(f"  -> New best! Loss improved to {best_loss:.4f}")
        
        return best_weights
    
    def optimize_weights_scipy(self) -> Dict[str, float]:
        """
        Optimize weights using scipy.optimize
        Faster but may get stuck in local minima
        """
        if not HAS_SCIPY:
            print("scipy not available, falling back to grid search")
            return self.optimize_weights_grid_search()
        
        print("Starting scipy optimization...")
        
        # Initial weights
        x0 = self.weights_dict_to_array(self.current_weights)
        
        # Constraints: all weights >= 0, sum to 1
        constraints = [
            {'type': 'eq', 'fun': lambda x: np.sum(x) - 1.0}  # Sum to 1
        ]
        bounds = [(0.01, 0.50) for _ in range(len(self.weight_names))]  # Each weight 1-50%
        
        result = minimize(
            self.evaluate_weights,
            x0,
            method='SLSQP',
            bounds=bounds,
            constraints=constraints,
            options={'maxiter': 20, 'disp': True}
        )
        
        if result.success:
            optimized_weights = self.weights_array_to_dict(result.x)
            print(f"\nOptimization successful!")
            print(f"Final loss: {result.fun:.4f}")
            return optimized_weights
        else:
            print(f"\nOptimization failed: {result.message}")
            return self.current_weights
    
    def run_optimization(self, method='grid') -> Dict[str, float]:
        """
        Run weight optimization
        method: 'grid' or 'scipy'
        """
        print(f"\n{'='*70}")
        print(f" WEIGHT OPTIMIZATION - Target: 95%+ Accuracy".center(68))
        print(f"{'='*70}\n")
        
        print(f"Current weights:")
        for name, weight in self.current_weights.items():
            print(f"  {name:20s}: {weight:.3f} ({weight*100:.1f}%)")
        
        if method == 'grid':
            optimized = self.optimize_weights_grid_search()
        else:
            optimized = self.optimize_weights_scipy()
        
        print(f"\n{'='*70}")
        print(f" OPTIMIZED WEIGHTS:".center(68))
        print(f"{'='*70}\n")
        
        for name in self.weight_names:
            old = self.current_weights[name]
            new = optimized[name]
            change = new - old
            print(f"  {name:20s}: {new:.3f} ({new*100:.1f}%) [{'+'if change >= 0 else ''}{change*100:.1f}%]")
        
        print(f"\nTotal: {sum(optimized.values()):.3f}")
        
        return optimized
    
    def save_optimized_weights(self, weights: Dict[str, float], filename='optimized_weights.txt'):
        """Save optimized weights to file"""
        filepath = os.path.join(os.path.dirname(__file__), filename)
        with open(filepath, 'w') as f:
            f.write("# Optimized Evidence Weights for DigiTrust-AVP\n")
            f.write("# Generated by Weight Optimizer\n\n")
            for name, weight in weights.items():
                f.write(f"{name} = {weight:.4f}\n")
        print(f"\nOptimized weights saved to: {filepath}")


if __name__ == "__main__":
    optimizer = WeightOptimizer()
    optimized_weights = optimizer.run_optimization(method='grid')
    optimizer.save_optimized_weights(optimized_weights)
