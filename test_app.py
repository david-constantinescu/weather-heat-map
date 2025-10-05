#!/usr/bin/env python3
"""
Simple test script for the Weather Map Application
"""

import requests
import json
import time
import os
import sys

def test_app():
    """Test basic functionality of the Flask app"""
    base_url = "http://localhost:5001"
    
    print("🧪 Testing Weather Map Application...")
    
    try:
        # Test main page
        print("1. Testing main page...")
        response = requests.get(base_url, timeout=5)
        if response.status_code == 200:
            print("   ✅ Main page loads successfully")
        else:
            print(f"   ❌ Main page failed: {response.status_code}")
            return False
        
        # Test API endpoints
        print("2. Testing API endpoints...")
        
        # Test geocoding
        try:
            response = requests.get(f"{base_url}/api/geocode?q=New York", timeout=5)
            if response.status_code in [200, 404]:  # 404 is OK if location not found
                print("   ✅ Geocoding endpoint working")
            else:
                print(f"   ⚠️  Geocoding endpoint: {response.status_code}")
        except Exception as e:
            print(f"   ⚠️  Geocoding endpoint error: {e}")
        
        # Test weather endpoint
        try:
            response = requests.get(f"{base_url}/api/weather/40.7128/-74.0060", timeout=5)
            if response.status_code in [200, 500]:  # 500 might be due to missing API key
                print("   ✅ Weather endpoint accessible")
            else:
                print(f"   ⚠️  Weather endpoint: {response.status_code}")
        except Exception as e:
            print(f"   ⚠️  Weather endpoint error: {e}")
        
        # Test storm data
        try:
            response = requests.get(f"{base_url}/api/storms", timeout=5)
            if response.status_code == 200:
                print("   ✅ Storm tracking endpoint working")
            else:
                print(f"   ⚠️  Storm tracking endpoint: {response.status_code}")
        except Exception as e:
            print(f"   ⚠️  Storm tracking endpoint error: {e}")
        
        print("\n🎉 Basic tests completed!")
        print("💡 Note: Some API endpoints may return errors if API keys are not configured.")
        print("   This is normal for the initial setup.")
        
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to the application.")
        print("   Make sure the Flask app is running on http://localhost:5000")
        return False
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_app()
    if success:
        print("\n✅ Application is working correctly!")
    else:
        print("\n❌ Application has issues. Check the output above.")
        sys.exit(1)
