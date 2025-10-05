from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
import requests
import json
import os
from datetime import datetime, timedelta
import math
from geopy.geocoders import Nominatim
import redis
from dotenv import load_dotenv
from config import config

load_dotenv()

app = Flask(__name__)
app.config.from_object(config[os.getenv('FLASK_ENV', 'default')])
CORS(app)

# Initialize Redis for caching (optional, falls back to memory cache)
try:
    cache = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
    cache.ping()
except:
    cache = {}

# Configuration
WEATHER_API_KEY = app.config.get('OPENWEATHER_API_KEY', 'your_api_key_here')
NASA_API_KEY = app.config.get('NASA_API_KEY', 'your_nasa_api_key_here')

class WeatherMapApp:
    def __init__(self):
        self.geocoder = Nominatim(user_agent="weather_map_app")
        
    def get_cached_data(self, key, fetch_func, ttl=3600):
        """Get data from cache or fetch if not available"""
        if isinstance(cache, dict):
            if key in cache:
                return cache[key]
            data = fetch_func()
            cache[key] = data
            return data
        else:
            cached = cache.get(key)
            if cached:
                return json.loads(cached)
            data = fetch_func()
            cache.setex(key, ttl, json.dumps(data))
            return data
    
    def fetch_weather_data(self, lat, lon):
        """Fetch weather data from OpenWeatherMap API"""
        def _fetch():
            url = f"http://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={WEATHER_API_KEY}&units=metric"
            response = requests.get(url)
            return response.json() if response.status_code == 200 else {}
        
        return self.get_cached_data(f"weather_{lat}_{lon}", _fetch, ttl=600)
    
    def fetch_forecast_data(self, lat, lon):
        """Fetch 5-day forecast data"""
        def _fetch():
            url = f"http://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={WEATHER_API_KEY}&units=metric"
            response = requests.get(url)
            return response.json() if response.status_code == 200 else {}
        
        return self.get_cached_data(f"forecast_{lat}_{lon}", _fetch, ttl=1800)
    
    def fetch_satellite_imagery(self, lat, lon, zoom):
        """Fetch satellite imagery data (mock implementation)"""
        def _fetch():
            # This is a mock implementation - in reality you'd integrate with NASA GIBS or similar
            return {
                "tile_url": f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{zoom}/{math.floor((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * (2 ** zoom))}/{math.floor((lon + 180) / 360 * (2 ** zoom))}",
                "timestamp": datetime.now().isoformat()
            }
        
        return self.get_cached_data(f"satellite_{lat}_{lon}_{zoom}", _fetch, ttl=3600)
    
    def fetch_storm_tracks(self):
        """Fetch tropical cyclone data (mock implementation)"""
        def _fetch():
            # Mock storm track data - in reality you'd fetch from NHC or IBTrACS
            return {
                "storms": [
                    
                ]
            }
        
        return self.get_cached_data("storm_tracks", _fetch, ttl=1800)
    
    def geocode_location(self, query):
        """Geocode a location query to lat/lon coordinates"""
        try:
            location = self.geocoder.geocode(query)
            if location:
                return {
                    "lat": location.latitude,
                    "lon": location.longitude,
                    "address": location.address
                }
        except Exception as e:
            print(f"Geocoding error: {e}")
        return None

weather_app = WeatherMapApp()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/weather/<lat>/<lon>')
def get_weather(lat, lon):
    try:
        lat = float(lat)
        lon = float(lon)
        weather_data = weather_app.fetch_weather_data(lat, lon)
        return jsonify(weather_data)
    except ValueError:
        return jsonify({"error": "Invalid coordinates"}), 400

@app.route('/api/forecast/<lat>/<lon>')
def get_forecast(lat, lon):
    try:
        lat = float(lat)
        lon = float(lon)
        forecast_data = weather_app.fetch_forecast_data(lat, lon)
        return jsonify(forecast_data)
    except ValueError:
        return jsonify({"error": "Invalid coordinates"}), 400

@app.route('/api/satellite/<float:lat>/<float:lon>/<int:zoom>')
def get_satellite(lat, lon, zoom):
    satellite_data = weather_app.fetch_satellite_imagery(lat, lon, zoom)
    return jsonify(satellite_data)

@app.route('/api/storms')
def get_storms():
    storm_data = weather_app.fetch_storm_tracks()
    return jsonify(storm_data)

@app.route('/api/geocode')
def geocode():
    query = request.args.get('q', '')
    if not query:
        return jsonify({"error": "Query parameter 'q' is required"}), 400
    
    result = weather_app.geocode_location(query)
    if result:
        return jsonify(result)
    else:
        return jsonify({"error": "Location not found"}), 404

@app.route('/api/measurement')
def calculate_measurement():
    points = request.json.get('points', [])
    measurement_type = request.json.get('type', 'distance')
    
    if len(points) < 2:
        return jsonify({"error": "At least 2 points required"}), 400
    
    if measurement_type == 'distance':
        # Calculate distance between two points using Haversine formula
        lat1, lon1 = points[0]['lat'], points[0]['lon']
        lat2, lon2 = points[1]['lat'], points[1]['lon']
        
        R = 6371  # Earth's radius in kilometers
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        distance = R * c
        
        return jsonify({
            "distance_km": round(distance, 2),
            "distance_miles": round(distance * 0.621371, 2)
        })
    
    elif measurement_type == 'area':
        # Calculate area of polygon using Shoelace formula
        if len(points) < 3:
            return jsonify({"error": "At least 3 points required for area calculation"}), 400
        
        # Convert to radians and apply Shoelace formula
        area = 0
        n = len(points)
        for i in range(n):
            j = (i + 1) % n
            area += math.radians(points[i]['lon']) * math.radians(points[j]['lat'])
            area -= math.radians(points[j]['lon']) * math.radians(points[i]['lat'])
        area = abs(area) / 2
        
        # Convert to square kilometers (approximate)
        area_km2 = area * 6371**2
        
        return jsonify({
            "area_km2": round(area_km2, 2),
            "area_miles2": round(area_km2 * 0.386102, 2)
        })
    
    return jsonify({"error": "Invalid measurement type"}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5006)
