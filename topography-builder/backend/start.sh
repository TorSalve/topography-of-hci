#!/bin/bash

# Load configuration from environment or use defaults
HOST=${HOST:-127.0.0.1}
PORT=${PORT:-8000}
RELOAD=${RELOAD:-true}

echo "=== Topography Builder Backend Setup ==="
echo "Server will run on: http://$HOST:$PORT"
echo ""

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip first
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

echo ""
echo "=== Starting FastAPI Server ==="
echo "Configuration:"
echo "  Host: $HOST"
echo "  Port: $PORT" 
echo "  Reload: $RELOAD"
echo "  Virtual Environment: $(which python)"
echo ""

# Start the FastAPI server with configuration
python -m uvicorn app.main:app --host $HOST --port $PORT --reload
