# Weather & Satellite Map Application

A comprehensive Flask web application for interactive weather and satellite imagery mapping with storm tracking capabilities.

## Features

### Core Features
- **Interactive Map Base**: OpenStreetMap, Satellite, and Terrain base layers
- **Satellite Imagery Overlay**: Near-real-time satellite imagery integration
- **Weather Overlays**: Precipitation, temperature, wind, and pressure data
- **Storm Tracking**: Tropical cyclone and hurricane tracking with forecast paths
- **Time Controls**: Animation slider for historical and forecast data
- **Search & Geolocation**: Location search and current location detection
- **Measurement Tools**: Distance and area measurement capabilities
- **Settings Panel**: Units, themes, and customization options

### Technical Features
- **Responsive Design**: Mobile-friendly interface
- **Caching**: Redis-based caching for improved performance
- **API Integration**: OpenWeatherMap, NASA, and other weather data sources
- **Real-time Updates**: Live weather and storm data
- **Customizable**: Dark/light themes, unit preferences

## Installation

### Prerequisites
- Python 3.8 or higher
- Redis (optional, for caching)
- Git

### Setup Instructions

1. **Clone or download the project**
   ```bash
   cd /Users/thechallenger_/Downloads
   ```

2. **Create a virtual environment**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your API keys:
   ```
   OPENWEATHER_API_KEY=your_openweather_api_key_here
   NASA_API_KEY=your_nasa_api_key_here
   ```

5. **Install Redis (optional, for caching)**
   ```bash
   # On macOS with Homebrew
   brew install redis
   brew services start redis
   
   # On Ubuntu/Debian
   sudo apt-get install redis-server
   sudo systemctl start redis
   ```

6. **Run the application**
   ```bash
   python app.py
   ```

7. **Open your browser**
   Navigate to `http://localhost:5000`

## API Keys Setup

### OpenWeatherMap API
1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to your `.env` file

### NASA API (Optional)
1. Go to [NASA API Portal](https://api.nasa.gov/)
2. Sign up for a free account
3. Get your API key
4. Add it to your `.env` file

## Usage

### Basic Navigation
- **Pan**: Click and drag the map
- **Zoom**: Use mouse wheel or zoom controls
- **Search**: Enter location in the search bar
- **Current Location**: Click the location button

### Layer Controls
- **Base Layers**: Switch between OpenStreetMap, Satellite, and Terrain
- **Weather Overlays**: Toggle precipitation, temperature, wind, and pressure
- **Storm Tracking**: View current and forecast storm tracks
- **Opacity**: Adjust overlay transparency with sliders

### Time Controls
- **Time Slider**: Navigate through historical and forecast data
- **Animation**: Play/pause time-based animations
- **Reset**: Return to current time

### Measurement Tools
- **Distance**: Click two points to measure distance
- **Area**: Click multiple points to measure area
- **Clear**: Remove all measurements

### Settings
- **Units**: Temperature (°C/°F), Distance (km/miles), Speed, Pressure
- **Theme**: Light or dark mode
- **Animation Speed**: Control playback speed

## Project Structure

```
weather-map-app/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── .env.example          # Environment variables template
├── README.md             # This file
├── templates/
│   └── index.html        # Main HTML template
└── static/
    ├── css/
    │   └── style.css     # Application styles
    └── js/
        └── app.js        # JavaScript application logic
```

## API Endpoints

### Weather Data
- `GET /api/weather/<lat>/<lon>` - Current weather data
- `GET /api/forecast/<lat>/<lon>` - 5-day forecast data

### Satellite Imagery
- `GET /api/satellite/<lat>/<lon>/<zoom>` - Satellite imagery tiles

### Storm Tracking
- `GET /api/storms` - Current storm tracks and forecasts

### Utilities
- `GET /api/geocode?q=<query>` - Location geocoding
- `POST /api/measurement` - Distance/area calculations

## Configuration

### Environment Variables
- `OPENWEATHER_API_KEY`: OpenWeatherMap API key
- `NASA_API_KEY`: NASA API key (optional)
- `REDIS_URL`: Redis connection URL (optional)

### Customization
- Modify `app.py` to add new data sources
- Update `static/js/app.js` for frontend functionality
- Customize `static/css/style.css` for styling

## Performance Optimization

### Caching
- Redis caching for API responses
- Tile caching for map layers
- Browser caching for static assets

### Data Sources
- Efficient tile serving
- Preprocessed weather data
- Optimized image formats

## Troubleshooting

### Common Issues

1. **API Key Errors**
   - Ensure API keys are correctly set in `.env`
   - Check API key permissions and quotas

2. **Redis Connection Issues**
   - Install and start Redis server
   - Application will work without Redis (uses memory cache)

3. **Map Not Loading**
   - Check internet connection
   - Verify Leaflet.js is loading correctly

4. **Weather Data Not Showing**
   - Verify OpenWeatherMap API key
   - Check API quota limits

### Debug Mode
Run with debug enabled:
```bash
export FLASK_DEBUG=1
python app.py
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check browser console for errors
4. Verify all dependencies are installed

## Future Enhancements

- Multiple forecast models (GFS, ICON, ECMWF)
- High-resolution satellite imagery
- Advanced measurement tools
- User accounts and preferences
- Mobile app version
- Real-time alerts and notifications

## Recent visual change (temperature overlay)

- The temperature overlay (OpenWeatherMap 'temp' tiles) was made much more visible per user request.
   - Opacity set to 100% (fully opaque).
   - CSS filters increased: higher contrast and saturation to make red/blue colors far more vivid.
   - A `.high-contrast-temp` rule was added so the overlay tiles blend strongly with the base map (mix-blend-mode: overlay).
   - JS now ensures the tile layer opacity is forced to 1.0 and applies stronger dynamic filters.

If you'd like the overlay less intense, reduce the opacity in the slide-out settings or change the values in `static/js/app.js` and `static/css/style.css`.
