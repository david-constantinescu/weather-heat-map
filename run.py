#!/usr/bin/env python3
"""
Weather Map Application Startup Script
"""

import os
import sys
from app import app

if __name__ == '__main__':
    # Set default environment variables if not set
    if not os.getenv('FLASK_ENV'):
        os.environ['FLASK_ENV'] = 'development'
    
    if not os.getenv('FLASK_DEBUG'):
        os.environ['FLASK_DEBUG'] = 'True'
    
    # Check if .env file exists
    if not os.path.exists('.env') and os.path.exists('env.example'):
        print("⚠️  No .env file found. Please copy env.example to .env and add your API keys.")
        print("   cp env.example .env")
        print("   Then edit .env with your API keys.")
        print()
    
    print("🌍 Starting Weather Map Application...")
    print("📍 Open your browser to: http://localhost:500")
    print("🛑 Press Ctrl+C to stop the server")
    print()
    
    try:
        app.run(debug=True, host='0.0.0.0', port=5001)
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Error starting application: {e}")
        sys.exit(1)
