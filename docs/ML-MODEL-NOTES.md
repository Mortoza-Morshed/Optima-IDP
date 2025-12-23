# ML Model & Recommendation Logic

The Optima IDP Recommender Service uses a content-based filtering approach combined with heuristic ranking to suggest learning resources.

## Core Components

### 1. Data Preprocessor
*   **Purpose**: Cleans and formats input data (skills, resources, performance reports).
*   **Key Functions**:
    *   `extract_weaknesses_from_performance`: Identifies skill gaps from manager reviews.
    *   `create_skill_mapping`: Maps skill IDs to matrix indices.
    *   `prepare_resource_features`: Vectorizes resource attributes for comparison.

### 2. Skill Similarity Calculator
*   **Purpose**: Determines how related two skills are (e.g., "React" and "JavaScript").
*   **Methods**:
    *   **Embeddings (Sentence-Transformers)**: Converts skill names and descriptions into 384-dimensional vectors using `all-MiniLM-L6-v2`.
    *   **Vector Search (FAISS)**: Uses Facebook AI Similarity Search for fast O(1) retrieval of nearest neighbors.
    *   **Cosine Similarity**: Measures semantic distance between skill vectors.
*   **Output**: A similarity matrix or list of similar skills used to recommend resources for *related* skills.

### 3. Resource Ranker
*   **Purpose**: Scores and sorts resources for a specific user.
*   **Scoring Factors**:
    *   **Skill Gap**: Higher priority for skills where the user has a large gap (Target - Current).
    *   **Relevance**: How well the resource matches the target skill.
    *   **Difficulty Match**: Matches resource difficulty (Beginner/Intermediate/Advanced) to user's current level.
    *   **Resource Type**: Preferences for certain types (e.g., Courses > Articles) can be weighted.
    *   **Similarity**: Boosts resources for highly similar skills.

## Workflow
1.  **Input**: User's current skills, IDP target skills, and available resources.
2.  **Gap Analysis**: Calculate the gap for each target skill.
3.  **Candidate Selection**: Find resources matching target skills or similar skills.
4.  **Scoring**: Apply the ranking algorithm to assign a score (0-1) to each resource.
5.  **Output**: Return top N resources with the highest scores.
