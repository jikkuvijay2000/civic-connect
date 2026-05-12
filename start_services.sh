#!/bin/bash

BASE_DIR="/Users/sandeep/Desktop/jv/civic-connect"

# Kill existing processes on ports
echo "Cleaning up ports..."
for port in 3000 5000 5001 5002 5003 5004 5173
do
    pid=$(lsof -t -i:$port)
    if [ ! -z "$pid" ]; then
        echo "Killing process $pid on port $port"
        kill -9 $pid
    fi
done

echo "Starting AI Services..."
# AI Prediction (5001)
cd "$BASE_DIR/ai-complaint-model" && nohup python3 predict_api.py > predict.log 2>&1 &
echo "Started AI Prediction on 5001"

# AI Captioning (5002)
cd "$BASE_DIR/ai-image-detection" && nohup python3 caption_api.py > caption.log 2>&1 &
echo "Started AI Captioning on 5002"

# AI Video Analysis (5003)
cd "$BASE_DIR/ai-video-analysis" && nohup python3 video_analysis_api.py > video.log 2>&1 &
echo "Started AI Video Analysis on 5003"

# AI Fake Detection (5004)
cd "$BASE_DIR/ai-fake-detection" && nohup python3 fake_detection_api.py > fake.log 2>&1 &
echo "Started AI Fake Detection on 5004"

echo "Starting Backend..."
cd "$BASE_DIR/civic-sense-backend" && nohup npm start > backend.log 2>&1 &
echo "Started Backend on 5000"

echo "Starting Frontend..."
cd "$BASE_DIR/civic-sense" && nohup npm run dev > frontend.log 2>&1 &
echo "Started Frontend on 5173"

echo "All services started. Waiting 10 seconds for initialization..."
sleep 10
lsof -i :5000,5001,5002,5003,5004,5173
