import csv
import os
import numpy as np
from typing import Dict, List, Tuple
try:
    from sklearn.metrics import confusion_matrix, precision_recall_fscore_support, roc_auc_score
    HAS_SKLEARN = True
except:
    HAS_SKLEARN = False
import math


class AccuracyMetrics:
    """
    Calculate comprehensive accuracy metrics for DigiTrust-AVP validation system
    Target: >= 95% accuracy across all parameters
    """
    
    def __init__(self):
        self.data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
        self.ground_truth = []
        self.load_ground_truth()
    
    def load_ground_truth(self):
        """Load ground truth test dataset"""
        gt_path = os.path.join(self.data_dir, "ground_truth_test_set.csv")
        if os.path.exists(gt_path):
            with open(gt_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                self.ground_truth = list(reader)
            print(f"Loaded {len(self.ground_truth)} ground truth test cases")
        else:
            print("Warning: Ground truth test set not found")
    
    def haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two coordinates in meters"""
        R = 6371000  # Earth radius in meters
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)
        
        a = (math.sin(delta_phi / 2) ** 2 +
             math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    def pearson_correlation(self, x: List[float], y: List[float]) -> Tuple[float, float]:
        """Calculate Pearson correlation coefficient manually"""
        n = len(x)
        if n < 2:
            return 0.0, 1.0
        
        # Calculate means
        mean_x = sum(x) / n
        mean_y = sum(y) / n
        
        # Calculate correlation
        numerator = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y))
        denominator_x = math.sqrt(sum((xi - mean_x) ** 2 for xi in x))
        denominator_y = math.sqrt(sum((yi - mean_y) ** 2 for yi in y))
        
        if denominator_x == 0 or denominator_y == 0:
            return 0.0, 1.0
        
        correlation = numerator / (denominator_x * denominator_y)
        
        # Simple p-value approximation (not exact but good enough)
        t_stat = correlation * math.sqrt(n - 2) / math.sqrt(1 - correlation ** 2) if abs(correlation) < 1 else 0
        p_value = 2 * (1 - 0.5 * (1 + math.erf(abs(t_stat) / math.sqrt(2))))  # Rough approximation
        
        return correlation, p_value
    
    def calculate_acs_metrics(self, predictions: List[Dict]) -> Dict:
        """
        Calculate ACS accuracy metrics
        Input: List of predictions with {test_id, predicted_acs}
        Returns: Correlation, MAE, RMSE
        """
        if not self.ground_truth or not predictions:
            return {"error": "No data"}
        
        # Match predictions to ground truth
        gt_dict = {gt['test_id']: float(gt['verified_acs']) for gt in self.ground_truth}
        
        true_acs = []
        pred_acs = []
        
        for pred in predictions:
            test_id = pred['test_id']
            if test_id in gt_dict:
                true_acs.append(gt_dict[test_id])
                pred_acs.append(pred['predicted_acs'])
        
        if len(true_acs) < 2:
            return {"error": "Insufficient matched predictions"}
        
        # Calculate metrics using manual correlation
        correlation, p_value = self.pearson_correlation(true_acs, pred_acs)
        
        errors = [abs(t - p) for t, p in zip(true_acs, pred_acs)]
        mae = np.mean(errors)
        rmse = np.sqrt(np.mean([(t - p) ** 2 for t, p in zip(true_acs, pred_acs)]))
        
        # Error percentiles
        errors_sorted = sorted(errors)
        p50 = np.percentile(errors, 50)
        p90 = np.percentile(errors, 90)
        p95 = np.percentile(errors, 95)
        
        return {
            'correlation': round(correlation, 4),
            'p_value': round(p_value, 6),
            'mae': round(mae, 2),
            'rmse': round(rmse, 2),
            'median_error': round(p50, 2),
            'p90_error': round(p90, 2),
            'p95_error': round(p95, 2),
            'n_samples': len(true_acs),
            'target_correlation': 0.95,
            'target_mae': 5.0,
            'meets_target': correlation >= 0.95 and mae <= 5.0
        }
    
    def calculate_vl_classification_metrics(self, predictions: List[Dict]) -> Dict:
        """
        Calculate VL classification accuracy
        Input: List of predictions with {test_id, predicted_vl}
        Returns: Accuracy, precision, recall, F1, confusion matrix
        """
        if not self.ground_truth or not predictions:
            return {"error": "No data"}
        
        #Match predictions to ground truth
        gt_dict = {gt['test_id']: gt['verified_vl'] for gt in self.ground_truth}
        
        true_vl = []
        pred_vl = []
        
        for pred in predictions:
            test_id = pred['test_id']
            if test_id in gt_dict:
                true_vl.append(gt_dict[test_id])
                pred_vl.append(pred['predicted_vl'])
        
        if len(true_vl) == 0:
            return {"error": "No matched predictions"}
        
        # Overall accuracy
        correct = sum(1 for t, p in zip(true_vl, pred_vl) if t == p)
        accuracy = correct / len(true_vl)
        
        labels = ['VL0', 'VL1', 'VL2', 'VL3']
        
        if HAS_SKLEARN:
            # Use sklearn if available
            precision, recall, f1, support = precision_recall_fscore_support(
                true_vl, pred_vl, labels=labels, average=None, zero_division=0
            )
            cm = confusion_matrix(true_vl, pred_vl, labels=labels)
        else:
            # Manual calculation
            precision = []
            recall = []
            f1 = []
            support = []
            cm = [[0]*4 for _ in range(4)]
            
            for i, label in enumerate(labels):
                tp = sum(1 for t, p in zip(true_vl, pred_vl) if t == label and p == label)
                fp = sum(1 for t, p in zip(true_vl, pred_vl) if t != label and p == label)
                fn = sum(1 for t, p in zip(true_vl, pred_vl) if t == label and p != label)
                
                prec = tp / (tp + fp) if (tp + fp) > 0 else 0
                rec = tp / (tp + fn) if (tp + fn) > 0 else 0
                f1_score = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0
                
                precision.append(prec)
                recall.append(rec)
                f1.append(f1_score)
                support.append(sum(1 for t in true_vl if t == label))
                
                # Build confusion matrix
                for j, pred_label in enumerate(labels):
                    cm[i][j] = sum(1 for t, p in zip(true_vl, pred_vl) if t == label and p == pred_label)
        
        # Macro averages
        macro_precision = np.mean(precision)
        macro_recall = np.mean(recall)
        macro_f1 = np.mean(f1)
        
        per_class_metrics = {}
        for i, label in enumerate(labels):
            per_class_metrics[label] = {
                'precision': round(precision[i], 4),
                'recall': round(recall[i], 4),
                'f1': round(f1[i], 4),
                'support': int(support[i])
            }
        
        return {
            'overall_accuracy': round(accuracy, 4),
            'macro_precision': round(macro_precision, 4),
            'macro_recall': round(macro_recall, 4),
            'macro_f1': round(macro_f1, 4),
            'per_class': per_class_metrics,
            'confusion_matrix': cm.tolist() if HAS_SKLEARN else cm,
            'n_samples': len(true_vl),
            'target_accuracy': 0.95,
            'target_precision_per_class': 0.93,
            'meets_target': accuracy >= 0.95 and macro_precision >= 0.93
        }
    
    def calculate_position_accuracy(self, predictions: List[Dict]) -> Dict:
        """
        Calculate position accuracy in meters
        Input: List of predictions with {test_id, predicted_lat, predicted_long, predicted_vl}
        Returns: Error metrics per VL
        """
        if not self.ground_truth or not predictions:
            return {"error": "No data"}
        
        # Match predictions to ground truth
        gt_dict = {gt['test_id']: {
            'lat': float(gt['verified_lat']),
            'long': float(gt['verified_long']),
            'vl': gt['verified_vl']
        } for gt in self.ground_truth}
        
        errors_by_vl = {'VL0': [], 'VL1': [], 'VL2': [], 'VL3': []}
        
        for pred in predictions:
            test_id = pred['test_id']
            if test_id in gt_dict:
                gt = gt_dict[test_id]
                distance = self.haversine_distance(
                    gt['lat'], gt['long'],
                    pred['predicted_lat'], pred['predicted_long']
                )
                errors_by_vl[gt['vl']].append(distance)
        
        results = {}
        for vl in ['VL0', 'VL1', 'VL2', 'VL3']:
            if errors_by_vl[vl]:
                errors = errors_by_vl[vl]
                results[vl] = {
                    'median_error_m': round(np.median(errors), 1),
                    'mean_error_m': round(np.mean(errors), 1),
                    'p90_error_m': round(np.percentile(errors, 90), 1),
                    'p95_error_m': round(np.percentile(errors, 95), 1),
                    'n_samples': len(errors)
                }
            else:
                results[vl] = {'median_error_m': 0, 'n_samples': 0}
        
        # Target: VL3 median <= 100m, p90 <= 200m
        vl3_meets_target = (
            results['VL3']['n_samples'] > 0 and
            results['VL3']['median_error_m'] <= 100 and
            results['VL3']['p90_error_m'] <= 200
        )
        
        return {
            'by_vl': results,
            'target_vl3_median': 100,
            'target_vl3_p90': 200,
            'meets_target': vl3_meets_target
        }
    
    def calculate_fraud_detection_metrics(self, predictions: List[Dict]) -> Dict:
        """
        Calculate fraud detection accuracy
        Input: List of predictions with {test_id, fraud_predicted}
        Returns: TPR, FPR, Precision, ROC-AUC
        """
        if not self.ground_truth or not predictions:
            return {"error": "No data"}
        
        # Match predictions to ground truth
        gt_dict = {gt['test_id']: gt['fraud_label'] == 'True' for gt in self.ground_truth}
        
        true_labels = []
        pred_labels = []
        
        for pred in predictions:
            test_id = pred['test_id']
            if test_id in gt_dict:
                true_labels.append(1 if gt_dict[test_id] else 0)
                pred_labels.append(1 if pred['fraud_predicted'] else 0)
        
        if len(true_labels) == 0:
            return {"error": "No matched predictions"}
        
        # Calculate confusion matrix elements
        tp = sum(1 for t, p in zip(true_labels, pred_labels) if t == 1 and p == 1)
        fp = sum(1 for t, p in zip(true_labels, pred_labels) if t == 0 and p == 1)
        tn = sum(1 for t, p in zip(true_labels, pred_labels) if t == 0 and p == 0)
        fn = sum(1 for t, p in zip(true_labels, pred_labels) if t == 1 and p == 0)
        
        # Calculate metrics
        tpr = tp / (tp + fn) if (tp + fn) > 0 else 0  # True Positive Rate (Recall)
        fpr = fp / (fp + tn) if (fp + tn) > 0 else 0  # False Positive Rate
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0
        f1 = 2 * (precision * tpr) / (precision + tpr) if (precision + tpr) > 0 else 0
        accuracy = (tp + tn) / len(true_labels)
        
        # ROC-AUC (if fraud scores available)
        try:
            if all('fraud_score' in pred for pred in predictions):
                fraud_scores = [pred.get('fraud_score', 0) for pred in predictions 
                               if pred['test_id'] in gt_dict]
                if len(set(true_labels)) > 1:  # Need both classes for AUC
                    auc = roc_auc_score(true_labels, fraud_scores)
                else:
                    auc = 1.0
            else:
                auc = None
        except:
            auc = None
        
        return {
            'true_positive_rate': round(tpr, 4),
            'false_positive_rate': round(fpr, 4),
            'precision': round(precision, 4),
            'f1_score': round(f1, 4),
            'accuracy': round(accuracy, 4),
            'roc_auc': round(auc, 4) if auc else None,
            'confusion_matrix': {
                'tp': tp,
                'fp': fp,
                'tn': tn,
                'fn': fn
            },
            'n_samples': len(true_labels),
            'n_fraud': sum(true_labels),
            'target_tpr': 0.95,
            'target_fpr': 0.05,
            'target_precision': 0.93,
            'meets_target': tpr >= 0.95 and fpr <= 0.05 and precision >= 0.93
        }
    
    def generate_comprehensive_report(self, predictions: Dict[str, List[Dict]]) -> Dict:
        """
        Generate comprehensive accuracy reportInput: {
            'acs': [...],  # ACS predictions
            'vl': [...],   # VL predictions
            'position': [...],  # Position predictions
            'fraud': [...]  # Fraud predictions
        }
        Returns: Complete accuracy metrics report
        """
        report = {
            'timestamp': None,
            'total_ground_truth_samples': len(self.ground_truth),
            'acs_metrics': self.calculate_acs_metrics(predictions.get('acs', [])),
            'vl_classification': self.calculate_vl_classification_metrics(predictions.get('vl', [])),
            'position_accuracy': self.calculate_position_accuracy(predictions.get('position', [])),
            'fraud_detection': self.calculate_fraud_detection_metrics(predictions.get('fraud', []))
        }
        
        # Overall assessment
        targets_met = []
        if report['acs_metrics'].get('meets_target'):
            targets_met.append('ACS Correlation')
        if report['vl_classification'].get('meets_target'):
            targets_met.append('VL Classification')
        if report['position_accuracy'].get('meets_target'):
            targets_met.append('Position Accuracy')
        if report['fraud_detection'].get('meets_target'):
            targets_met.append('Fraud Detection')
        
        report['summary'] = {
            'targets_met': targets_met,
            'targets_count': len(targets_met),
            'targets_total': 4,
            'overall_success': len(targets_met) >= 4,
            'accuracy_grade': 'A+' if len(targets_met) == 4 else 'A' if len(targets_met) == 3 else 'B+'
        }
        
        return report
    
    def print_summary(self, report: Dict):
        """Pretty print accuracy report"""
        print("\n" + "="*70)
        print(" " + "DigiTrust-AVP ACCURACY METRICS REPORT".center(68))
        print("="*70)
        
        # ACS Metrics
        acs = report['acs_metrics']
        print(f"\n[ACS CORRELATION METRICS]:")
        print(f"   Correlation:     {acs.get('correlation', 0):.4f} (Target: >= 0.95) {'[OK]' if acs.get('correlation', 0) >= 0.95 else '[FAIL]'}")
        print(f"   MAE:             {acs.get('mae', 0):.2f} points (Target: <= 5.0)")
        print(f"   RMSE:            {acs.get('rmse', 0):.2f} points")
        print(f"   Median Error:    {acs.get('median_error', 0):.2f} points")
        
        # VL Classification
        vl = report['vl_classification']
        print(f"\n[VL CLASSIFICATION ACCURACY]:")
        print(f"   Overall:         {vl.get('overall_accuracy', 0)*100:.2f}% (Target: >= 95%) {'[OK]' if vl.get('overall_accuracy', 0) >= 0.95 else '[FAIL]'}")
        print(f"   Macro Precision: {vl.get('macro_precision', 0)*100:.2f}%")
        print(f"   Macro F1:        {vl.get('macro_f1', 0)*100:.2f}%")
        
        if 'per_class' in vl:
            print(f"\n   Per-Class Precision:")
            for vl_class in ['VL3', 'VL2', 'VL1', 'VL0']:
                if vl_class in vl['per_class']:
                    prec = vl['per_class'][vl_class]['precision'] * 100
                    support = vl['per_class'][vl_class]['support']
                    print(f"     {vl_class}: {prec:.2f}% (n={support}) {'[OK]' if prec >= 93 else '[FAIL]'}")
        
        # Position Accuracy
        pos = report['position_accuracy']
        print(f"\n[POSITION ACCURACY (Median Error)]:")
        if 'by_vl' in pos:
            for vl_class in ['VL3', 'VL2', 'VL1', 'VL0']:
                if vl_class in pos['by_vl'] and pos['by_vl'][vl_class]['n_samples'] > 0:
                    median = pos['by_vl'][vl_class]['median_error_m']
                    p90 = pos['by_vl'][vl_class]['p90_error_m']
                    n = pos['by_vl'][vl_class]['n_samples']
                    target_met = '[OK]' if (vl_class == 'VL3' and median <= 100 and p90 <= 200) else ''
                    print(f"   {vl_class}: +/-{median:.0f}m median, +/-{p90:.0f}m p90 (n={n}) {target_met}")
        
        # Fraud Detection
        fraud = report['fraud_detection']
        print(f"\n[FRAUD DETECTION]:")
        print(f"   True Positive Rate:  {fraud.get('true_positive_rate', 0)*100:.2f}% (Target: >= 95%) {'[OK]' if fraud.get('true_positive_rate', 0) >= 0.95 else '[FAIL]'}")
        print(f"   False Positive Rate: {fraud.get('false_positive_rate', 0)*100:.2f}% (Target: <= 5%) {'[OK]' if fraud.get('false_positive_rate', 0) <= 0.05 else '[FAIL]'}")
        print(f"   Precision:           {fraud.get('precision', 0)*100:.2f}%")
        if fraud.get('roc_auc'):
            print(f"   ROC-AUC:             {fraud.get('roc_auc', 0):.4f}")
        
        # Summary
        summary = report['summary']
        print(f"\n{'='*70}")
        print(f" OVERALL GRADE: {summary['accuracy_grade']} ({summary['targets_count']}/{summary['targets_total']} targets met)")
        print(f" Status: {'SUCCESS' if summary['overall_success'] else 'NEEDS IMPROVEMENT'}")
        print(f"{'='*70}\n")
