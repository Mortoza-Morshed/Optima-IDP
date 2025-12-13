"""
Resource Ranker Module
----------------------
Ranks learning resources based on multiple factors:
- Skill relevance to user
- Skill gap (how much improvement is needed)
- Resource difficulty matching user level
- Resource type preferences
- Skill similarity scores
"""

import json
from pathlib import Path
from typing import Dict, Any, Optional, List

import numpy as np


class ResourceRanker:
    """
    Ranks learning resources for recommendation based on multiple scoring factors.
    
    This class implements a multi-factor ranking algorithm that considers:
    1. Skill gap: How much the user needs to improve the skill
    2. Skill relevance: How relevant the skill is to user's existing skills
    3. Difficulty match: How well the resource difficulty matches user's level
    4. Resource type: Preference for different resource types
    5. Skill similarity: Similarity to skills user wants to improve
    
    The final score is a weighted combination of these factors.
    """
    
    def __init__(self):
        """
        Initialize the resource ranker with default weights.
        
        Weights determine the importance of each factor in the final score.
        These can be adjusted based on business requirements or A/B testing.
        """
        self.weights = {
            'skill_gap': 0.35,          # Highest weight: prioritize skills with big gaps
            'skill_relevance': 0.25,    # High weight: skills similar to user's existing skills
            'difficulty_match': 0.20,   # Medium weight: match user's skill level
            'collaborative': 0.20,      # NEW: Resources used by similar peers
            'resource_type': 0.00,      # Reduced to make room for collaborative (was 0.10)
            'skill_similarity': 0.00    # Reduced to make room for collaborative (was 0.10)
        }
        # Note: Weights sum to 1.0 (0.35 + 0.25 + 0.20 + 0.20 = 1.0)
        
        self.persona_overrides = {}
        self.default_persona = {
            "weight_multipliers": {
                "skill_gap": 1.0,
                "skill_relevance": 1.0,
                "difficulty_match": 1.0,
                "collaborative": 1.0,
                "resource_type": 1.0,
                "skill_similarity": 1.0
            },
            "difficulty_offset": 0.3
        }
        self._load_persona_config()

    def _load_persona_config(self):
        """
        Load persona configuration from JSON file if present.

        Persona configs allow different weight multipliers and difficulty offsets
        for distinct user archetypes (individual contributor, tech lead, manager, etc.).
        """
        config_path = Path(__file__).parent.parent / "config" / "personas.json"
        if config_path.exists():
            try:
                self.persona_overrides = json.loads(config_path.read_text(encoding="utf-8"))
            except Exception as exc:
                print(f"Warning: failed to load persona config: {exc}")
                self.persona_overrides = {}
        else:
            self.persona_overrides = {}
    
    def rank_resources(self,
                      resources: List[Dict[str, Any]],
                      user_skills: List[Dict[str, Any]],
                      skills_to_improve: List[Dict[str, Any]],
                      resource_features: Dict[str, Any],
                      similarity_matrix: Optional[np.ndarray] = None,
                      skill_to_idx: Optional[Dict[str, int]] = None,
                      peer_data: Optional[List[Dict[str, Any]]] = None,
                      custom_weights: Optional[Dict[str, float]] = None,
                      persona: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Rank resources based on multiple scoring factors.
        """
        ranked_resources = []
        applied_weights, difficulty_offset = self._resolve_persona_settings(persona, custom_weights)
        
        # Build user skill level map for quick lookup
        user_skill_levels = self._build_user_skill_map(user_skills)
        user_skill_ids = set(user_skill_levels.keys())
        
        # Build improvement map
        improvement_map = self._build_improvement_map(skills_to_improve)
        
        # Pre-compute peer scores if peer data is available
        resource_peer_scores = {}
        if peer_data:
            resource_peer_scores = self._calculate_collaborative_scores(
                user_skill_ids, peer_data
            )
        
        for resource in resources:
            resource_id = str(resource.get('_id', ''))
            skill_id = str(resource.get('skill', {}).get('_id', ''))
            
            if resource_id not in resource_features:
                continue
            
            features = resource_features[resource_id]
            
            # Calculate individual scores
            skill_gap_score = self._calculate_skill_gap_score(
                skill_id, improvement_map
            )
            
            skill_relevance_score = self._calculate_skill_relevance_score(
                skill_id, user_skill_levels, similarity_matrix, skill_to_idx
            )
            
            difficulty_match_score = self._calculate_difficulty_match_score(
                skill_id, features, user_skill_levels, improvement_map, difficulty_offset
            )
            
            # Collaborative Score
            collaborative_score = resource_peer_scores.get(resource_id, 0.0)
            
            # Legacy scores (kept low/zero weight for now)
            resource_type_score = features.get('type', 0.7)
            skill_similarity_score = self._calculate_skill_similarity_score(
                skill_id, skills_to_improve, similarity_matrix, skill_to_idx
            )
            
            # Calculate weighted total score
            total_score = (
                applied_weights['skill_gap'] * skill_gap_score +
                applied_weights['skill_relevance'] * skill_relevance_score +
                applied_weights['difficulty_match'] * difficulty_match_score +
                applied_weights.get('collaborative', 0.20) * collaborative_score +
                applied_weights.get('resource_type', 0.0) * resource_type_score +
                applied_weights.get('skill_similarity', 0.0) * skill_similarity_score
            )
            
            ranked_resources.append({
                'resource': resource,
                'score': total_score,
                'breakdown': {
                    'skill_gap': skill_gap_score,
                    'skill_relevance': skill_relevance_score,
                    'difficulty_match': difficulty_match_score,
                    'collaborative': collaborative_score,
                    'resource_type': resource_type_score,
                    'skill_similarity': skill_similarity_score
                }
            })
            
            ranked_resources.append({
                'resource': resource,
                'score': total_score,
                'breakdown': {
                    'skill_gap': skill_gap_score,
                    'skill_relevance': skill_relevance_score,
                    'difficulty_match': difficulty_match_score,
                    'resource_type': resource_type_score,
                    'skill_similarity': skill_similarity_score
                }
            })
        
        # Sort by score (descending)
        ranked_resources.sort(key=lambda x: x['score'], reverse=True)
        
        return ranked_resources
    
    def _build_user_skill_map(self, user_skills: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Build a map of user's skill IDs to normalized levels.
        
        Creates a dictionary for quick lookup of user's skill levels.
        Levels are normalized to 0-1 range for consistent scoring.
        
        Args:
            user_skills: List of user skills, each containing:
                - skillId: ID of the skill
                - level: Skill level (typically 1-10)
        
        Returns:
            Dictionary mapping skill ID (string) to normalized level (0.0-1.0)
            Example: {'skill_id_1': 0.5, 'skill_id_2': 0.8, ...}
        """
        skill_map = {}
        for skill in user_skills:
            skill_id = str(skill.get('skillId') or skill.get('skill', {}).get('_id', ''))
            level = skill.get('level', 1)  # Default to level 1 if not specified
            # Normalize level to 0-1 range (assuming 1-10 scale)
            # Level 1 -> 0.0, Level 10 -> 1.0
            normalized_level = (level - 1) / 9.0
            skill_map[skill_id] = normalized_level
        return skill_map
    
    def _build_improvement_map(self, skills_to_improve: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
        """
        Build a map of skills that need improvement for quick lookup.
        
        This map is used to quickly check if a resource's target skill
        is something the user wants to improve, and what the gap is.
        
        Args:
            skills_to_improve: List of skill dictionaries, each containing:
                - skillId: ID of the skill to improve
                - gap: Gap score (0.0-1.0)
                - currentLevel: Current skill level
                - targetLevel: Target skill level
        
        Returns:
            Dictionary mapping skill ID to improvement information:
            {
                'skill_id': {
                    'gap': float,
                    'currentLevel': int,
                    'targetLevel': int
                }
            }
        """
        improvement_map = {}
        for skill_info in skills_to_improve:
            skill_id = skill_info.get('skillId', '')
            improvement_map[skill_id] = {
                'gap': skill_info.get('gap', 0.0),
                'currentLevel': skill_info.get('currentLevel', 1),
                'targetLevel': skill_info.get('targetLevel', 5)
            }
        return improvement_map

    def _resolve_persona_settings(self, persona: Optional[str], custom_weights: Optional[Dict[str, float]] = None):
        """
        Determine weights and difficulty offset for the requested persona.

        Args:
            persona: Optional persona identifier provided by the client.
            custom_weights: Optional weights provided by admin to override everything.

        Returns:
            Tuple (weights, difficulty_offset)
        """
        # 1. Custom Weights (Highest Priority) - Admin Override
        if custom_weights:
            # Validate keys interact with known weights
            valid_weights = {}
            for k in self.weights:
                if k in custom_weights:
                     valid_weights[k] = custom_weights[k]
                else:
                     valid_weights[k] = self.weights[k]
                     
            difficulty_offset = self.default_persona["difficulty_offset"]
            if persona and persona in self.persona_overrides:
                 difficulty_offset = self.persona_overrides[persona].get("difficulty_offset", difficulty_offset)
                 
            return valid_weights, difficulty_offset

        # 2. Persona Overrides (Normal Priority)
        if persona and persona in self.persona_overrides:
            override = self.persona_overrides[persona]
        else:
            override = self.default_persona

        multipliers = override.get("weight_multipliers", {})
        adjusted_weights = {}
        for key in self.weights:
            adjusted_weights[key] = self.weights[key] * multipliers.get(key, 1.0)

        # Normalize adjusted weights to sum to 1 for stability
        total = sum(adjusted_weights.values())
        if total > 0:
            adjusted_weights = {k: v / total for k, v in adjusted_weights.items()}

        difficulty_offset = override.get("difficulty_offset", self.default_persona["difficulty_offset"])
        return adjusted_weights, difficulty_offset
    
    def _calculate_skill_gap_score(self, skill_id: str,
                                   improvement_map: Dict[str, Dict[str, Any]]) -> float:
        """
        Calculate score based on how much the skill needs improvement.
        Higher gap = higher priority.
        
        Args:
            skill_id: ID of the skill the resource targets
            improvement_map: Map of skills that need improvement
            
        Returns:
            Score between 0.0 and 1.0
        """
        if skill_id in improvement_map:
            gap = improvement_map[skill_id].get('gap', 0.0)
            return min(gap, 1.0)  # Ensure it's between 0 and 1
        return 0.0  # No gap means lower priority
    
    def _calculate_skill_relevance_score(self, skill_id: str,
                                        user_skill_levels: Dict[str, float],
                                        similarity_matrix: Optional[np.ndarray],
                                        skill_to_idx: Optional[Dict[str, int]]) -> float:
        """
        Calculate how relevant this skill is to user's existing skills.
        Skills similar to what user already knows are more relevant.
        
        Args:
            skill_id: ID of the skill the resource targets
            user_skill_levels: Map of user's skill IDs to levels
            similarity_matrix: Optional precomputed similarity matrix
            skill_to_idx: Optional mapping from skill ID to matrix index
            
        Returns:
            Relevance score between 0.0 and 1.0
        """
        if not similarity_matrix or not skill_to_idx:
            # Fallback: simple check if user has similar skills
            return 0.5 if user_skill_levels else 0.0
        
        if skill_id not in skill_to_idx:
            return 0.0
        
        # Find maximum similarity to any of user's skills
        max_similarity = 0.0
        target_idx = skill_to_idx[skill_id]
        
        for user_skill_id, user_level in user_skill_levels.items():
            if user_skill_id in skill_to_idx:
                user_idx = skill_to_idx[user_skill_id]
                similarity = similarity_matrix[target_idx][user_idx]
                # Weight by user's skill level (higher level = more relevant)
                weighted_similarity = similarity * (0.5 + user_level * 0.5)
                max_similarity = max(max_similarity, weighted_similarity)
        
        return max_similarity
    
    def _calculate_difficulty_match_score(self, skill_id: str,
                                         resource_features: Dict[str, Any],
                                         user_skill_levels: Dict[str, float],
                                         improvement_map: Dict[str, Dict[str, Any]],
                                         persona_offset: float) -> float:
        """
        Calculate how well the resource difficulty matches user's skill level.
        
        Uses the "zone of proximal development" principle: resources should be
        slightly above the user's current level for optimal learning. Too easy
        = boring, too hard = discouraging.
        
        Args:
            skill_id: ID of the skill the resource targets
            resource_features: Features dictionary containing 'difficulty' (1.0-3.0)
            user_skill_levels: Map of user's skill IDs to normalized levels (0-1)
            improvement_map: Map of skills that need improvement
        
        Returns:
            Difficulty match score (0.0-1.0), where:
            - 1.0 = perfect match (resource difficulty = ideal)
            - Lower scores = resource is too easy or too hard
        """
        resource_difficulty = resource_features.get('difficulty', 1.0)  # Default to beginner
        
        # Determine user's current level for this skill
        if skill_id in user_skill_levels:
            # User has this skill, use their level
            user_level = user_skill_levels[skill_id]
        elif skill_id in improvement_map:
            # User wants to improve this skill, use current level from IDP
            current_level = improvement_map[skill_id].get('currentLevel', 1)
            user_level = (current_level - 1) / 9.0  # Normalize to 0-1
        else:
            # User doesn't have this skill, assume beginner level (0.0)
            user_level = 0.0
        
        # Ideal difficulty is slightly above user level (for learning)
        # This encourages growth without being overwhelming
        ideal_difficulty = user_level + persona_offset
        
        # Calculate how close resource difficulty is to ideal
        # Penalize resources that are too far from ideal
        diff = abs(resource_difficulty - ideal_difficulty)
        match_score = max(0.0, 1.0 - diff * 2)  # Linear penalty for distance
        
        return match_score
    
    def _calculate_skill_similarity_score(self, skill_id: str,
                                         skills_to_improve: List[Dict[str, Any]],
                                         similarity_matrix: Optional[np.ndarray],
                                         skill_to_idx: Optional[Dict[str, int]]) -> float:
        """
        Calculate score based on similarity to skills user wants to improve.
        
        Resources for skills similar to target skills are also valuable.
        For example, if user wants to learn "React", resources for "JavaScript"
        (a similar skill) are also relevant.
        
        Args:
            skill_id: ID of the skill the resource targets
            skills_to_improve: List of skills user wants to improve (from IDP)
            similarity_matrix: Optional precomputed skill similarity matrix
            skill_to_idx: Optional mapping from skill ID to matrix index
            
        Returns:
            Similarity score (0.0-1.0), where:
            - 1.0 = resource targets a skill directly in improvement list
            - Lower scores = resource targets similar skills
            - 0.0 = no similarity or missing data
        """
        # If we don't have similarity data, can't calculate this score
        if not similarity_matrix or not skill_to_idx:
            return 0.0
        
        # If skill not in our system, can't calculate
        if skill_id not in skill_to_idx:
            return 0.0
        
        # Check if this skill is directly in the improvement list
        # Direct matches get the highest score
        for skill_info in skills_to_improve:
            if skill_info.get('skillId') == skill_id:
                return 1.0  # Direct match gets full score
        
        # Find maximum similarity to any skill in improvement list
        # Resources for similar skills are also valuable
        max_similarity = 0.0
        target_idx = skill_to_idx[skill_id]
        
        for skill_info in skills_to_improve:
            improvement_skill_id = skill_info.get('skillId', '')
            if improvement_skill_id in skill_to_idx:
                improvement_idx = skill_to_idx[improvement_skill_id]
                # Get similarity from precomputed matrix
                similarity = similarity_matrix[target_idx][improvement_idx]
                # Weight by gap: skills with bigger gaps are more important
                # This ensures we prioritize similar skills to high-priority targets
                gap = skill_info.get('gap', 0.0)
                weighted_similarity = similarity * (0.5 + gap * 0.5)
                max_similarity = max(max_similarity, weighted_similarity)
        
        return max_similarity

    def _calculate_collaborative_scores(self, 
                                      user_skill_ids: set, 
                                      peer_data: List[Dict[str, Any]]) -> Dict[str, float]:
        """
        Calculate collaborative scores for resources based on peer similarity.
        
        Logic:
        1. Find peers who have similar skills to the user (Jaccard Similarity).
        2. Identify resources those similar peers have used.
        3. Score resources based on peer similarity strength.
        
        Args:
            user_skill_ids: Set of skill IDs the current user possesses.
            peer_data: List of peer objects {userId, skills: [], resources: []}
            
        Returns:
            Dictionary mapping resource_id -> score (0.0 to 1.0)
        """
        resource_scores = {}
        
        if not user_skill_ids or not peer_data:
            return resource_scores
            
        for peer in peer_data:
            peer_skill_ids = set(s.get('skillId') for s in peer.get('skills', []))
            used_resources = peer.get('resources', [])
            
            if not peer_skill_ids or not used_resources:
                continue
                
            # Jaccard Similarity: Intersection / Union
            intersection = len(user_skill_ids.intersection(peer_skill_ids))
            union = len(user_skill_ids.union(peer_skill_ids))
            
            if union == 0:
                similarity = 0.0
            else:
                similarity = intersection / union
                
            # Only consider peers with some similarity
            if similarity > 0.1:
                for resource_id in used_resources:
                    if resource_id not in resource_scores:
                        resource_scores[resource_id] = 0.0
                    # Add similarity score to resource
                    # More similar peers = higher score
                    resource_scores[resource_id] += similarity
        
        # Normalize scores to 0-1 range
        if resource_scores:
            max_score = max(resource_scores.values())
            if max_score > 0:
                for rid in resource_scores:
                    resource_scores[rid] = resource_scores[rid] / max_score
                    
        return resource_scores

