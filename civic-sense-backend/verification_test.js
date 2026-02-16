const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Use existing asset
const IMAGE_PATH = path.join(__dirname, '../civic-sense/src/assets/civic_sense_symbolic_logo.png');
const VIDEO_PATH = path.join(__dirname, 'test_video.mp4');

const runTests = async () => {
    // Check if image exists
    let imageStream;
    try {
        if (fs.existsSync(IMAGE_PATH)) {
            console.log("Found image asset at:", IMAGE_PATH);
            imageStream = fs.createReadStream(IMAGE_PATH);
        } else {
            console.error("Image asset NOT found at:", IMAGE_PATH);
            // Create dummy image just to test (will error in model but test endpoint)
            fs.writeFileSync('dummy_image.jpg', 'dummy data');
            imageStream = fs.createReadStream('dummy_image.jpg');
        }
    } catch (e) {
        console.error("File access error:", e.message);
        return;
    }

    // Create dummy video
    if (!fs.existsSync(VIDEO_PATH)) {
        fs.writeFileSync(VIDEO_PATH, 'dummy video content');
    }

    try {
        console.log("--- Testing AI Image Fake Detection (Microservice Port 5004) ---");
        const aiForm = new FormData();
        aiForm.append('image', imageStream);

        try {
            // Port 5004 is fake detection api
            const aiResponse = await axios.post('http://localhost:5004/detect_fake_image', aiForm, {
                headers: aiForm.getHeaders()
            });
            console.log("AI Image Response:", JSON.stringify(aiResponse.data, null, 2));
        } catch (e) {
            console.error("AI Image Check Failed:", e.message);
            if (e.response) console.error("Response:", e.response.data);
        }

        console.log("\n--- Testing AI Video Fake Detection (Microservice Port 5004) ---");
        const aiVideoForm = new FormData();
        aiVideoForm.append('video', fs.createReadStream(VIDEO_PATH));

        try {
            // Port 5004 is fake detection api
            const aiVideoResponse = await axios.post('http://localhost:5004/detect_fake_video', aiVideoForm, {
                headers: aiVideoForm.getHeaders()
            });
            console.log("AI Video Response:", JSON.stringify(aiVideoResponse.data, null, 2));
        } catch (e) {
            console.error("AI Video Check Failed (Expected if dummy file/OpenCV error):", e.message);
            if (e.response) console.error("Response:", e.response.data);
        }

    } catch (error) {
        console.error("Test execution error:", error.message);
    }
};

runTests();
