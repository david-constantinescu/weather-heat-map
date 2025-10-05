#!/bin/bash

# Weather Map Application Installation Script

echo "🌍 Weather Map Application Setup"
echo "================================="
echo

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if pip is installed
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip."
    exit 1
fi

echo "✅ pip3 found"

# Create virtual environment
echo "📦 Creating virtual environment..."
python3 -m venv venv

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📚 Installing Python dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    if [ -f env.example ]; then
        echo "📝 Creating .env file from template..."
        cp env.example .env
        echo "⚠️  Please edit .env file and add your API keys:"
        echo "   - OPENWEATHER_API_KEY (required)"
        echo "   - NASA_API_KEY (optional)"
    else
        echo "📝 Creating basic .env file..."
        cat > .env << EOF
# Weather Map Application Environment Variables
OPENWEATHER_API_KEY=your_openweather_api_key_here
NASA_API_KEY=your_nasa_api_key_here
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_hex(16))')
EOF
    fi
fi

echo
echo "🎉 Installation completed!"
echo
echo "📋 Next steps:"
echo "1. Edit .env file and add your API keys:"
echo "   - Get OpenWeatherMap API key: https://openweathermap.org/api"
echo "   - Get NASA API key: https://api.nasa.gov/ (optional)"
echo
echo "2. Start the application:"
echo "   python run.py"
echo "   or"
echo "   python app.py"
echo
echo "3. Open your browser to: http://localhost:5000"
echo
echo "🔧 Optional: Install Redis for better caching:"
echo "   brew install redis  # macOS"
echo "   sudo apt-get install redis-server  # Ubuntu/Debian"
echo
echo "📖 For more information, see README.md"
