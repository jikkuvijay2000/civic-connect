@echo off
echo Starting Civic Connect AI Microservices...

echo Starting Video Analysis API (Port 5003)...
start powershell -NoExit -Command "cd ai-video-analysis; python video_analysis_api.py"

echo Starting Image Captioning API (Port 5002)...
start powershell -NoExit -Command "cd ai-image-detection; python image_caption_api.py"

echo Starting AI Complaint Prediction API (Port 5001)...
start powershell -NoExit -Command "cd ai-complaint-model; python predict_api.py"

echo Starting Fake Image/Video Detection API (Port 5004)...
start powershell -NoExit -Command "cd ai-fake-detection; python fake_detection_api.py"

echo All AI microservices have been launched in separate windows!

echo Starting Backend API (Port 5000)...
start powershell -NoExit -Command "cd civic-sense-backend; npm start"

echo Starting Frontend App...
start powershell -NoExit -Command "cd civic-sense; npm run dev"

echo All services are now running!
pause