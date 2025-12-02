const axios = require("axios");

const PYTHON_API = process.env.PYTHON_SERVICE_URL || "http://127.0.0.1:8000";

module.exports = {
    // Get recommended resources
    async getRecommendedResources(data) {
        try {
            const res = await axios.post(`${PYTHON_API}/recommend/resources`, data);
            return res.data;
        } catch (error) {
            console.error("Error calling Python /recommend/resources:", error.message);
            throw new Error("Python service unavailable");
        }
    },

    // Get similar skills
    async getSimilarSkills(data) {
        try {
            const res = await axios.post(`${PYTHON_API}/recommend/similar-skills`, data);
            return res.data;
        } catch (error) {
            console.error("Error calling Python /recommend/similar-skills:", error.message);
            throw new Error("Python service unavailable");
        }
    }
};
