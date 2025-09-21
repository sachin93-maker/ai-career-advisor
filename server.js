const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Career recommendation endpoint
app.post('/api/recommend', async (req, res) => {
    console.log('\n--- NEW RECOMMENDATION REQUEST ---');
    try {
        const { skills, interests } = req.body;
        console.log('1. Received request with Skills:', skills, 'and Interests:', interests);

        if (!skills || !interests) {
            return res.status(400).json({ error: 'Both skills and interests are required' });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        
        // --- IMPROVED PROMPT WITH FEW-SHOT EXAMPLE ---
        const prompt = `
        You are an expert career advisor. Your task is to provide personalized career recommendations based on the user's skills and interests.
        
        Analyze the user's input and generate a valid JSON object containing three keys: "careerPaths", "requiredSkills", and "courses".
        - Do not include any markdown formatting like \`\`\`json.
        - The response must be a single, valid JSON object and nothing else.
        - Ensure all arrays contain at least 3-5 relevant items and no fields are empty strings.

        Here is an example of the required output structure:
        {
          "careerPaths": [
            {
              "title": "AI/ML Engineer",
              "description": "Designs and develops machine learning and deep learning systems.",
              "matchReason": "Your interest in 'AI/ML' and 'Data Science' combined with your 'Python' skill makes this an excellent fit."
            }
          ],
          "requiredSkills": [
            {
              "skill": "Advanced Python",
              "importance": "High",
              "description": "Essential for building and training machine learning models."
            }
          ],
          "courses": [
            {
              "title": "Machine Learning by Andrew Ng",
              "provider": "Coursera",
              "url": "https://www.coursera.org/learn/machine-learning",
              "description": "A foundational course covering the core concepts of machine learning."
            }
          ]
        }
        
        --- USER'S DATA ---
        User Skills: ${skills}
        User Interests: ${interests}
        
        Now, generate the JSON response based on the user's data.
        `;

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
        
        console.log('2. Model initialized. Sending improved prompt to Gemini API...');
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        console.log('3. Received raw response from Gemini. Raw Text:', text);

        let recommendations;
        try {
            recommendations = JSON.parse(text);
        } catch (parseError) {
            throw new Error('Failed to parse JSON response from AI. The AI returned malformed data.');
        }

        console.log('4. Successfully parsed JSON. Now validating content...');

        // --- IMPROVED SERVER-SIDE VALIDATION ---
        if (!recommendations.careerPaths || recommendations.careerPaths.length === 0) {
            throw new Error('The AI returned an empty list of career paths. Please try rephrasing your input.');
        }
        if (!recommendations.careerPaths[0].title) {
             throw new Error('The AI returned career paths with no title. Please try again.');
        }

        console.log('5. JSON content is valid. Sending recommendations to frontend.');
        res.json(recommendations);

    } catch (error) {
        console.error('--- AN ERROR OCCURRED ---');
        console.error('Full error details:', error.message);
        
        res.status(500).json({
            error: 'Sorry, I encountered an issue while generating recommendations. Check the server terminal for details.',
            details: error.message
        });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Career Advisor API is running' });
});

app.listen(PORT, () => {
    console.log(`🚀 Career Advisor Server running on http://localhost:${PORT}`);
});
