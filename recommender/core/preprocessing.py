"""
Data Preprocessing Module
-------------------------
Handles preprocessing of user skills, resources, and performance data
for the recommendation system.
"""

import numpy as np
from typing import List, Dict, Any, Optional
from collections import defaultdict


class DataPreprocessor:
    """
    Preprocesses data for recommendation algorithms.
    
    This class handles:
    - Normalizing skill levels
    - Calculating skill gaps
    - Building user skill vectors
    - Extracting improvement needs from IDPs
    - Preparing resource features for ranking
    """
    
    def __init__(self):
        """Initialize the preprocessor with empty mappings."""
        self.skill_to_index = {}  # Maps skill IDs to indices
        self.index_to_skill = {}  # Reverse mapping: indices to skill IDs
        self.skill_vectors = {}   # Stores precomputed skill vectors
    
    def normalize_skill_level(self, level: int, min_level: int = 1, max_level: int = 10) -> float:
        """
        Normalize skill level to 0-1 range.
        
        This is useful for machine learning algorithms that work better with
        normalized values. For example, a level 5 skill (out of 10) becomes 0.44.
        
        Args:
            level: Current skill level (typically 1-10 scale)
            min_level: Minimum possible skill level (default: 1)
            max_level: Maximum possible skill level (default: 10)
            
        Returns:
            Normalized skill level (0.0-1.0), where 0.0 = min_level and 1.0 = max_level
        """
        # Clamp level to valid range
        if level < min_level:
            level = min_level
        if level > max_level:
            level = max_level
        # Linear normalization: (value - min) / (max - min)
        return (level - min_level) / (max_level - min_level)
    
    def calculate_skill_gap(self, current_level: int, target_level: int) -> float:
        """
        Calculate the gap between current and target skill level.
        
        This metric is crucial for recommendations - larger gaps indicate
        skills that need more attention and should be prioritized.
        
        Args:
            current_level: Employee's current skill level (1-10)
            target_level: Desired target skill level (1-10)
            
        Returns:
            Skill gap score (0.0-1.0), where:
            - 0.0 = no gap (target <= current)
            - Higher values = bigger gap (more improvement needed)
        """
        # If target is not higher than current, there's no gap
        if target_level <= current_level:
            return 0.0
        # Calculate gap and normalize to 0-1 range
        gap = target_level - current_level
        return min(gap / 10.0, 1.0)  # Cap at 1.0 for very large gaps
    
    def build_user_skill_vector(self, user_skills: List[Dict[str, Any]], 
                                skill_mapping: Dict[str, int]) -> np.ndarray:
        """
        Build a skill vector for a user.
        
        Creates a normalized vector representation of a user's skills where:
        - Each position in the vector corresponds to a skill
        - The value at each position is the normalized skill level (0-1)
        - Skills the user doesn't have are represented as 0.0
        
        Args:
            user_skills: List of user skills, each with 'skillId' and 'level'
            skill_mapping: Dictionary mapping skill ID strings to vector indices
            
        Returns:
            NumPy array of normalized skill levels, one per skill in the mapping
        """
        # Initialize vector with zeros (no skills)
        vector = np.zeros(len(skill_mapping))
        
        # Fill in the user's actual skill levels
        for skill in user_skills:
            skill_id = str(skill.get('skillId', ''))
            level = skill.get('level', 1)  # Default to level 1 if not specified
            
            # Only process skills that exist in our mapping
            if skill_id in skill_mapping:
                idx = skill_mapping[skill_id]
                # Normalize the level to 0-1 range
                vector[idx] = self.normalize_skill_level(level)
        
        return vector
    
    def extract_skills_to_improve(self, idp_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Extract skills that need improvement from IDP (Individual Development Plan) data.
        
        This method processes IDP objects to identify which skills an employee
        wants to improve, calculates the gap between current and target levels,
        and returns a structured list for use in recommendations.
        
        Args:
            idp_data: List of IDP objects, each containing:
                - skillsToImprove: List of skills with currentLevel and targetLevel
                - Each skill entry has a 'skill' object with _id and name
        
        Returns:
            List of dictionaries, each containing:
            - skillId: ID of the skill to improve
            - skillName: Name of the skill
            - currentLevel: Employee's current skill level
            - targetLevel: Desired skill level
            - gap: Calculated gap score (0.0-1.0)
        """
        skills_to_improve = []
        
        # Process each IDP
        for idp in idp_data:
            skills = idp.get('skillsToImprove', [])
            
            # Process each skill in the IDP
            for skill_info in skills:
                # Extract skill ID (handle both populated and unpopulated skill objects)
                skill_id = str(skill_info.get('skill', {}).get('_id', ''))
                current_level = skill_info.get('currentLevel', 1)  # Default to 1
                target_level = skill_info.get('targetLevel', 5)    # Default to 5
                
                # Calculate the gap between current and target
                gap = self.calculate_skill_gap(current_level, target_level)
                
                # Only include skills with a positive gap (needs improvement)
                if gap > 0:
                    skills_to_improve.append({
                        'skillId': skill_id,
                        'skillName': skill_info.get('skill', {}).get('name', ''),
                        'currentLevel': current_level,
                        'targetLevel': target_level,
                        'gap': gap
                    })
        
        return skills_to_improve
    
    def extract_weaknesses_from_performance(self, performance_reports: List[Dict[str, Any]]) -> List[str]:
        """
        Extract skill-related weaknesses from performance reports.
        
        This method identifies skills that managers have flagged as weaknesses
        in performance reviews. These skills should be prioritized for recommendations.
        
        Args:
            performance_reports: List of performance report objects, each containing:
                - weaknesses: Text description of weaknesses (not directly used here)
                - relatedSkills: Array of skill objects related to the weaknesses
        
        Returns:
            List of unique skill IDs that were mentioned as weaknesses
            (duplicates are removed)
        """
        skill_ids = []
        
        # Process each performance report
        for report in performance_reports:
            weaknesses = report.get('weaknesses', '')  # Text field (for future NLP)
            related_skills = report.get('relatedSkills', [])  # Array of skill objects
            
            # Extract skill IDs from relatedSkills array
            for skill in related_skills:
                skill_id = str(skill.get('_id', ''))
                if skill_id:  # Only add non-empty skill IDs
                    skill_ids.append(skill_id)
        
        # Remove duplicates and return
        return list(set(skill_ids))
    
    def prepare_resource_features(self, resources: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Prepare resource features for ranking algorithm.
        
        Converts resource metadata into numerical features that can be used
        by the ranking algorithm. This includes:
        - Difficulty level (converted to numeric score)
        - Resource type (converted to preference score)
        - Associated skill ID
        - Title and provider (for display)
        
        Args:
            resources: List of resource objects, each containing:
                - _id: Resource ID
                - skill: Skill object (with _id)
                - difficulty: 'beginner', 'intermediate', or 'advanced'
                - type: 'course', 'video', 'article', 'certification', 'document', 'other'
                - title: Resource title
                - provider: Resource provider name
        
        Returns:
            Dictionary mapping resource ID to feature dictionary:
            {
                'skillId': str,
                'difficulty': float (1.0-3.0),
                'type': float (0.5-1.2),
                'title': str,
                'provider': str
            }
        """
        resource_features = {}
        
        # Map difficulty levels to numeric scores
        # Higher score = more advanced
        difficulty_scores = {
            'beginner': 1.0,
            'intermediate': 2.0,
            'advanced': 3.0
        }
        
        # Map resource types to preference scores
        # Higher score = generally more valuable for learning
        type_scores = {
            'course': 1.0,          # Standard courses
            'video': 0.8,            # Video tutorials
            'article': 0.6,          # Articles/blog posts
            'certification': 1.2,    # Certifications (highest value)
            'document': 0.5,         # Documents/PDFs
            'other': 0.7             # Other types
        }
        
        # Process each resource
        for resource in resources:
            resource_id = str(resource.get('_id', ''))
            skill_id = str(resource.get('skill', {}).get('_id', ''))
            difficulty = resource.get('difficulty', 'beginner')
            resource_type = resource.get('type', 'other')
            
            # Store features for this resource
            resource_features[resource_id] = {
                'skillId': skill_id,
                'difficulty': difficulty_scores.get(difficulty, 1.0),  # Default to beginner
                'type': type_scores.get(resource_type, 0.7),          # Default to 'other'
                'title': resource.get('title', ''),
                'provider': resource.get('provider', 'Unknown')
            }
        
        return resource_features
    
    def create_skill_mapping(self, skills: List[Dict[str, Any]]) -> Dict[str, int]:
        """
        Create a mapping from skill ID to index for matrix operations.
        
        This mapping is used to convert skill IDs (strings) to array indices
        for similarity matrices and vector operations. Essential for efficient
        lookups in numpy arrays.
        
        Args:
            skills: List of skill objects, each with an '_id' field
        
        Returns:
            Dictionary mapping skill ID (as string) to integer index (0-based)
            Example: {'skill_id_1': 0, 'skill_id_2': 1, ...}
        """
        mapping = {}
        for idx, skill in enumerate(skills):
            skill_id = str(skill.get('_id', ''))
            mapping[skill_id] = idx
        return mapping

