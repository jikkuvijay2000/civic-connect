const { GoogleGenerativeAI } = require("@google/generative-ai");

const chatWithAi = async (req, res) => {
    try {
        const { prompt, history } = req.body;

        if (!prompt) {
            return res.status(400).json({ success: false, message: "Prompt is required" });
        }

        // Initialize Google Generative AI
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ success: false, message: "Server configuration error: Gemini API key missing" });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel(
            { model: "gemini-1.5-flash" },
            { apiVersion: "v1" }
        );

        // Transform history to Gemini format if provided
        let formattedHistory = [];
        if (history && Array.isArray(history) && history.length > 0) {
            formattedHistory = history
                // Gemini requires the first message in history to be from the 'user'. 
                // We'll filter out consecutive bot messages at start of history if they exist
                .filter((msg, index, arr) => {
                    // If it's the very first message and it's from the model, skip it
                    if (index === 0 && (msg.role === 'model' || msg.sender === 'bot')) return false;
                    return true;
                })
                .map(msg => ({
                    role: (msg.role === 'user' || msg.sender === 'user') ? 'user' : 'model',
                    parts: [{ text: msg.text }]
                }));
        }

        let responseText = "";

        if (formattedHistory.length > 0) {
            // Use chat session
            const chat = model.startChat({
                history: formattedHistory,
            });
            const result = await chat.sendMessage(prompt);
            const response = await result.response;
            responseText = response.text();
        } else {
            // Basic prompt
            // Add a system-like context to the prompt
            const contextualPrompt = `You are a helpful Civic AI Assistant for the 'Civic Connect' platform. Your goal is to help citizens with civic issues, platform navigation, or friendly conversation. Be concise and polite. \n\nUser: ${prompt}`;
            const result = await model.generateContent(contextualPrompt);
            const response = await result.response;
            responseText = response.text();
        }

        res.status(200).json({
            success: true,
            response: responseText
        });

    } catch (error) {
        console.error("AI Chat Error:", error);
        res.status(500).json({ success: false, message: "Failed to communicate with AI", error: error.message });
    }
};

module.exports = {
    chatWithAi
};
