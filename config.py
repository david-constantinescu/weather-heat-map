"""
Configuration settings for the Weather Map Application
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Base configuration"""
    
    # Flask settings
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    # API Keys
    OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', '')
    NASA_API_KEY = os.getenv('NASA_API_KEY', '')
    
    # Redis settings
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    
    # Cache settings
    CACHE_DEFAULT_TIMEOUT = 3600  # 1 hour
    CACHE_WEATHER_TIMEOUT = 600   # 10 minutes
    CACHE_STORM_TIMEOUT = 1800    # 30 minutes
    
    # Map settings
    DEFAULT_LAT = 20.0
    DEFAULT_LON = 0.0
    DEFAULT_ZOOM = 3
    MAX_ZOOM = 19
    
    # API endpoints
    OPENWEATHER_BASE_URL = 'http://api.openweathermap.org/data/2.5'
    NASA_BASE_URL = 'https://api.nasa.gov'
    
    # Weather overlay settings
    WEATHER_OVERLAYS = {
        'precipitation': {
            'url': 'https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png',
            'attribution': 'Weather data © OpenWeatherMap',
            'opacity': 0.7
        },
        'temperature': {
            'url': 'https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png',
            'attribution': 'Weather data © OpenWeatherMap',
            'opacity': 0.7
        },
        'wind': {
            'url': 'https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png',
            'attribution': 'Weather data © OpenWeatherMap',
            'opacity': 0.7
        },
        'pressure': {
            'url': 'https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png',
            'attribution': 'Weather data © OpenWeatherMap',
            'opacity': 0.7
        }
    }
    
    # Storm tracking settings
    STORM_SOURCES = {
        'nhc': 'https://www.nhc.noaa.gov/',
        'ibtracs': 'https://www.ncdc.noaa.gov/ibtracs/',
        'jtwc': 'https://www.metoc.navy.mil/jtwc/'
    }
    
    # Animation settings
    ANIMATION_SPEEDS = [1, 2, 3, 5, 10]  # Multipliers
    DEFAULT_ANIMATION_SPEED = 5
    
    # Measurement settings
    MEASUREMENT_UNITS = {
        'distance': ['km', 'miles', 'nautical_miles'],
        'area': ['km2', 'miles2', 'acres'],
        'temperature': ['celsius', 'fahrenheit', 'kelvin'],
        'speed': ['kmh', 'mph', 'knots', 'ms'],
        'pressure': ['hpa', 'mb', 'inhg', 'mmhg']
    }
    
    # Default units
    DEFAULT_UNITS = {
        'distance': 'km',
        'area': 'km2',
        'temperature': 'celsius',
        'speed': 'kmh',
        'pressure': 'hpa'
    }

class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False

class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
