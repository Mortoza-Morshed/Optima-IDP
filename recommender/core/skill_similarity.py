"""
Skill Similarity Module
-----------------------
Calculates similarity between skills using various methods:
- Category-based similarity
- Text-based similarity (using skill names/descriptions)
- Co-occurrence patterns
"""

import numpy as np
from typing import List, Dict, Any, Optional
from collections import defaultdict
import re


class SkillSimilarityCalculator:
    """
    Calculates similarity between skills using multiple methods.
    
    Uses three similarity metrics:
    1. Category-based: Skills in the same category are more similar
    2. Keyword-based: Skills with similar names/descriptions are more similar
    3. Co-occurrence: Skills that appear together in user profiles are more similar
    """
    
    def __init__(self):
        """Initialize the similarity calculator with empty data structures."""
        self.skill_graph = defaultdict(set)  # Graph of skill co-occurrences
        self.skill_categories = {}           # Maps skill ID to category
        self.skill_keywords = {}              # Maps skill ID to keyword set
    
    def build_similarity_matrix(self, skills: List[Dict[str, Any]], 
                               user_skills_data: List[List[Dict[str, Any]]]) -> np.ndarray:
        """
        Build a similarity matrix for all skills.
        
        Args:
            skills: List of all skill objects
            user_skills_data: List of user skill lists (for co-occurrence)
            
        Returns:
            Similarity matrix (n_skills x n_skills)
        """
        n_skills = len(skills)
        similarity_matrix = np.zeros((n_skills, n_skills))
        
        # Build skill index mapping
        skill_to_idx = {}
        for idx, skill in enumerate(skills):
            skill_id = str(skill.get('_id', ''))
            skill_to_idx[skill_id] = idx
            self.skill_categories[skill_id] = skill.get('category', '')
            self.skill_keywords[skill_id] = self._extract_keywords(skill)
        
        # Calculate co-occurrence from user data
        self._build_cooccurrence_graph(user_skills_data, skill_to_idx)
        
        # Calculate similarity for each pair
        for i, skill1 in enumerate(skills):
            for j, skill2 in enumerate(skills):
                if i == j:
                    similarity_matrix[i][j] = 1.0
                else:
                    similarity = self._calculate_pair_similarity(
                        skill1, skill2, skill_to_idx
                    )
                    similarity_matrix[i][j] = similarity
        
        return similarity_matrix
    
    def _extract_keywords(self, skill: Dict[str, Any]) -> set:
        """
        Extract keywords from skill name and description for text similarity.
        
        Uses simple word tokenization and removes common stop words.
        This enables keyword-based similarity matching (e.g., "JavaScript" and
        "JS" would share keywords).
        
        Args:
            skill: Skill object with 'name' and 'description' fields
        
        Returns:
            Set of keyword strings (lowercase, no stop words)
        """
        # Get text content and convert to lowercase
        name = skill.get('name', '').lower()
        description = skill.get('description', '').lower()
        
        # Combine and extract words using regex
        # \b\w+\b matches word boundaries and word characters
        text = f"{name} {description}"
        keywords = set(re.findall(r'\b\w+\b', text))
        
        # Remove common stop words that don't add semantic meaning
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 
                     'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were'}
        keywords = keywords - stop_words
        
        return keywords
    
    def _build_cooccurrence_graph(self, user_skills_data: List[List[Dict[str, Any]]], 
                                 skill_to_idx: Dict[str, int]):
        """
        Build co-occurrence graph from user skill data.
        
        If two skills frequently appear together in user profiles, they are
        likely related. For example, users who know "React" often also know
        "JavaScript", so these skills are similar.
        
        Args:
            user_skills_data: List of user skill lists (each inner list is one user's skills)
            skill_to_idx: Mapping from skill ID to index (for filtering valid skills)
        """
        # Process each user's skill set
        for user_skills in user_skills_data:
            skill_ids = []
            
            # Extract valid skill IDs for this user
            for skill in user_skills:
                skill_id = str(skill.get('skillId', ''))
                if skill_id in skill_to_idx:  # Only include skills in our system
                    skill_ids.append(skill_id)
            
            # Create edges between all pairs of skills for this user
            # This indicates these skills co-occur (user has both)
            for i, skill_id1 in enumerate(skill_ids):
                for skill_id2 in skill_ids[i+1:]:  # Avoid duplicate pairs
                    # Add bidirectional edges (undirected graph)
                    self.skill_graph[skill_id1].add(skill_id2)
                    self.skill_graph[skill_id2].add(skill_id1)
    
    def _calculate_pair_similarity(self, skill1: Dict[str, Any], 
                                   skill2: Dict[str, Any],
                                   skill_to_idx: Dict[str, int]) -> float:
        """
        Calculate similarity between two skills using multiple metrics.
        
        Combines three similarity measures:
        1. Category similarity: Binary (same category = 1.0, different = 0.0)
        2. Keyword similarity: Jaccard similarity of keyword sets
        3. Co-occurrence similarity: Binary (co-occur in user profiles = 1.0)
        
        Final similarity is a weighted average of these three metrics.
        
        Args:
            skill1: First skill object
            skill2: Second skill object
            skill_to_idx: Mapping from skill ID to index (unused here but kept for consistency)
        
        Returns:
            Similarity score between 0.0 and 1.0
        """
        skill_id1 = str(skill1.get('_id', ''))
        skill_id2 = str(skill2.get('_id', ''))
        
        # 1. Category similarity: Binary check
        # Skills in the same category (e.g., both "Technical") are more similar
        category_sim = 1.0 if self.skill_categories.get(skill_id1) == self.skill_categories.get(skill_id2) else 0.0
        
        # 2. Keyword similarity: Jaccard similarity
        # Measures overlap of keywords between skills
        keywords1 = self.skill_keywords.get(skill_id1, set())
        keywords2 = self.skill_keywords.get(skill_id2, set())
        
        if keywords1 or keywords2:
            # Jaccard = intersection / union
            intersection = len(keywords1 & keywords2)  # Common keywords
            union = len(keywords1 | keywords2)          # All unique keywords
            keyword_sim = intersection / union if union > 0 else 0.0
        else:
            keyword_sim = 0.0
        
        # 3. Co-occurrence similarity: Binary check
        # If skills appear together in user profiles, they're similar
        cooccurrence_sim = 0.0
        if skill_id1 in self.skill_graph and skill_id2 in self.skill_graph[skill_id1]:
            cooccurrence_sim = 1.0
        
        # Weighted combination of all three metrics
        # Weights: category=30%, keywords=40%, co-occurrence=30%
        similarity = (
            0.3 * category_sim +
            0.4 * keyword_sim +
            0.3 * cooccurrence_sim
        )
        
        return similarity
    
    def get_similar_skills(self, skill_id: str, similarity_matrix: np.ndarray,
                          skill_to_idx: Dict[str, int], top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Get top K most similar skills to a given skill.
        
        Args:
            skill_id: ID of the target skill
            similarity_matrix: Precomputed similarity matrix
            skill_to_idx: Mapping from skill ID to matrix index
            top_k: Number of similar skills to return
            
        Returns:
            List of similar skills with similarity scores
        """
        if skill_id not in skill_to_idx:
            return []
        
        idx = skill_to_idx[skill_id]
        similarities = similarity_matrix[idx]
        
        # Get top K indices (excluding self)
        top_indices = np.argsort(similarities)[::-1][1:top_k+1]
        
        # Reverse mapping
        idx_to_skill = {v: k for k, v in skill_to_idx.items()}
        
        similar_skills = []
        for top_idx in top_indices:
            similar_skill_id = idx_to_skill[top_idx]
            score = similarities[top_idx]
            similar_skills.append({
                'skillId': similar_skill_id,
                'similarity': float(score)
            })
        
        return similar_skills
    
    def calculate_skill_relevance(self, target_skill_id: str, 
                                 user_skill_ids: List[str],
                                 similarity_matrix: np.ndarray,
                                 skill_to_idx: Dict[str, int]) -> float:
        """
        Calculate how relevant a skill is to a user based on their existing skills.
        
        Args:
            target_skill_id: Skill to evaluate
            user_skill_ids: List of user's current skill IDs
            similarity_matrix: Precomputed similarity matrix
            skill_to_idx: Mapping from skill ID to matrix index
            
        Returns:
            Relevance score (0.0-1.0)
        """
        if target_skill_id not in skill_to_idx:
            return 0.0
        
        target_idx = skill_to_idx[target_skill_id]
        max_similarity = 0.0
        
        for user_skill_id in user_skill_ids:
            if user_skill_id in skill_to_idx:
                user_idx = skill_to_idx[user_skill_id]
                similarity = similarity_matrix[target_idx][user_idx]
                max_similarity = max(max_similarity, similarity)
        
        return max_similarity

