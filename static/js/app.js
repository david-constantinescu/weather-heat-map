// Weather Map Application
// API Configuration
const WEATHER_API_KEY = '17f35b441d994f24954faa231dcc1755'; // OpenWeatherMap API key

class WeatherMapApp {
    constructor() {
        this.map = null;
        this.currentLocation = null;
        this.activeLayers = new Map();
        this.measurementMode = null;
        this.measurementPoints = [];
        this.measurementLayer = null;
        this.stormData = null;
        this.animationInterval = null;
        this.isAnimating = false;
        this.currentTimeIndex = 0;
        this.timeData = [];
        this.currentZoom = 2; // Track current zoom level
        
        this.init();
    }

    init() {
        this.initializeMap();
        this.setupEventListeners();
        this.loadInitialData();
    }

    initializeMap() {
        // Initialize Leaflet map with global view for temperature mapping
        this.map = L.map('map', {
            center: [30.0, 0.0],
            zoom: 2,
            zoomControl: false,
            minZoom: 1,
            maxZoom: 11 // Limit to city level - OpenWeatherMap tile data stops at zoom ~10-11
        });

        // Add base layers
        this.baseLayers = {
            osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }),
            satellite: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '© Esri',
                maxZoom: 19
            }),
            terrain: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenTopoMap',
                maxZoom: 17
            })
        };

        // Add default base layer
        this.baseLayers.osm.addTo(this.map);

        // Add zoom controls
        L.control.zoom({
            position: 'bottomright'
        }).addTo(this.map);

        // Add zoom event listener for dynamic temperature detail
        this.map.on('zoomend', () => {
            this.currentZoom = this.map.getZoom();
            this.updateTemperatureDetail();
        });

        // Initialize measurement layer
        this.measurementLayer = L.layerGroup().addTo(this.map);
        
        // Initialize weather markers layer
        this.weatherMarkers = L.layerGroup().addTo(this.map);

        // Update coordinate display on mouse move
        this.map.on('mousemove', (e) => {
            this.updateCoordinateDisplay(e.latlng);
        });

        // Handle map clicks for measurement and weather
        this.map.on('click', (e) => {
            if (this.measurementMode) {
                this.handleMeasurementClick(e.latlng);
            } else {
                // Load weather data for clicked location
                this.loadWeatherData(e.latlng.lat, e.latlng.lng);
            }
        });
    }

    setupEventListeners() {
        // Hamburger menu toggle
        const hamburgerMenu = document.getElementById('hamburgerMenu');
        const slideMenu = document.getElementById('slideMenu');
        const menuOverlay = document.getElementById('menuOverlay');
        const closeMenu = document.getElementById('closeMenu');

        hamburgerMenu.addEventListener('click', () => {
            hamburgerMenu.classList.toggle('active');
            slideMenu.classList.toggle('active');
            menuOverlay.classList.toggle('active');
        });

        closeMenu.addEventListener('click', () => {
            hamburgerMenu.classList.remove('active');
            slideMenu.classList.remove('active');
            menuOverlay.classList.remove('active');
        });

        menuOverlay.addEventListener('click', () => {
            hamburgerMenu.classList.remove('active');
            slideMenu.classList.remove('active');
            menuOverlay.classList.remove('active');
        });

        // Search functionality
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.performSearch();
        });

        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performSearch();
            }
        });

        // Location button
        document.getElementById('locationBtn').addEventListener('click', () => {
            this.getCurrentLocation();
        });

        // Base layer controls
        document.querySelectorAll('input[name="baseLayer"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.switchBaseLayer(e.target.value);
            });
        });

        // Temperature overlay controls
        document.getElementById('temperatureOverlay').addEventListener('change', (e) => {
            this.toggleOverlay('temperature', e.target.checked);
        });

        // Opacity slider
        document.getElementById('tempOpacity').addEventListener('input', (e) => {
            this.updateOverlayOpacity('temperature', e.target.value);
            document.getElementById('opacityValue').textContent = e.target.value + '%';
        });
    }

    async loadInitialData() {
        this.showLoading();
        try {
            // Load storm data
            await this.loadStormData();
            // Automatically enable temperature overlay
            this.addTemperatureOverlay();
            this.hideLoading();
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.hideLoading();
        }
    }

    async loadInitialWeatherData() {
        // Load temperature data for comprehensive coverage of US, Europe, and global cities
        const temperatureCities = [
            // Major US Cities
            { name: 'New York', lat: 40.7128, lon: -74.0060, region: 'US' },
            { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, region: 'US' },
            { name: 'Chicago', lat: 41.8781, lon: -87.6298, region: 'US' },
            { name: 'Houston', lat: 29.7604, lon: -95.3698, region: 'US' },
            { name: 'Phoenix', lat: 33.4484, lon: -112.0740, region: 'US' },
            { name: 'Philadelphia', lat: 39.9526, lon: -75.1652, region: 'US' },
            { name: 'San Antonio', lat: 29.4241, lon: -98.4936, region: 'US' },
            { name: 'San Diego', lat: 32.7157, lon: -117.1611, region: 'US' },
            { name: 'Dallas', lat: 32.7767, lon: -96.7970, region: 'US' },
            { name: 'San Jose', lat: 37.3382, lon: -121.8863, region: 'US' },
            { name: 'Austin', lat: 30.2672, lon: -97.7431, region: 'US' },
            { name: 'Jacksonville', lat: 30.3322, lon: -81.6557, region: 'US' },
            { name: 'Fort Worth', lat: 32.7555, lon: -97.3308, region: 'US' },
            { name: 'Columbus', lat: 39.9612, lon: -82.9988, region: 'US' },
            { name: 'Charlotte', lat: 35.2271, lon: -80.8431, region: 'US' },
            { name: 'Seattle', lat: 47.6062, lon: -122.3321, region: 'US' },
            { name: 'Denver', lat: 39.7392, lon: -104.9903, region: 'US' },
            { name: 'Washington', lat: 38.9072, lon: -77.0369, region: 'US' },
            { name: 'Boston', lat: 42.3601, lon: -71.0589, region: 'US' },
            { name: 'El Paso', lat: 31.7619, lon: -106.4850, region: 'US' },
            
            // Comprehensive European Cities
            // Western Europe
            { name: 'London', lat: 51.5074, lon: -0.1278, region: 'Europe' },
            { name: 'Paris', lat: 48.8566, lon: 2.3522, region: 'Europe' },
            { name: 'Madrid', lat: 40.4168, lon: -3.7038, region: 'Europe' },
            { name: 'Barcelona', lat: 41.3851, lon: 2.1734, region: 'Europe' },
            { name: 'Valencia', lat: 39.4699, lon: -0.3763, region: 'Europe' },
            { name: 'Seville', lat: 37.3891, lon: -5.9845, region: 'Europe' },
            { name: 'Bilbao', lat: 43.2627, lon: -2.9253, region: 'Europe' },
            { name: 'Amsterdam', lat: 52.3676, lon: 4.9041, region: 'Europe' },
            { name: 'Rotterdam', lat: 51.9244, lon: 4.4777, region: 'Europe' },
            { name: 'Utrecht', lat: 52.0907, lon: 5.1214, region: 'Europe' },
            { name: 'Brussels', lat: 50.8503, lon: 4.3517, region: 'Europe' },
            { name: 'Antwerp', lat: 51.2194, lon: 4.4025, region: 'Europe' },
            { name: 'Ghent', lat: 51.0543, lon: 3.7174, region: 'Europe' },
            { name: 'Dublin', lat: 53.3498, lon: -6.2603, region: 'Europe' },
            { name: 'Cork', lat: 51.8985, lon: -8.4756, region: 'Europe' },
            { name: 'Luxembourg', lat: 49.6116, lon: 6.1319, region: 'Europe' },
            
            // Central Europe
            { name: 'Berlin', lat: 52.5200, lon: 13.4050, region: 'Europe' },
            { name: 'Munich', lat: 48.1351, lon: 11.5820, region: 'Europe' },
            { name: 'Hamburg', lat: 53.5511, lon: 9.9937, region: 'Europe' },
            { name: 'Cologne', lat: 50.9375, lon: 6.9603, region: 'Europe' },
            { name: 'Frankfurt', lat: 50.1109, lon: 8.6821, region: 'Europe' },
            { name: 'Stuttgart', lat: 48.7758, lon: 9.1829, region: 'Europe' },
            { name: 'Düsseldorf', lat: 51.2277, lon: 6.7735, region: 'Europe' },
            { name: 'Dortmund', lat: 51.5136, lon: 7.4653, region: 'Europe' },
            { name: 'Essen', lat: 51.4556, lon: 7.0116, region: 'Europe' },
            { name: 'Leipzig', lat: 51.3397, lon: 12.3731, region: 'Europe' },
            { name: 'Bremen', lat: 53.0793, lon: 8.8017, region: 'Europe' },
            { name: 'Dresden', lat: 51.0504, lon: 13.7373, region: 'Europe' },
            { name: 'Hannover', lat: 52.3759, lon: 9.7320, region: 'Europe' },
            { name: 'Nuremberg', lat: 49.4521, lon: 11.0767, region: 'Europe' },
            { name: 'Vienna', lat: 48.2082, lon: 16.3738, region: 'Europe' },
            { name: 'Graz', lat: 47.0707, lon: 15.4395, region: 'Europe' },
            { name: 'Salzburg', lat: 47.8095, lon: 13.0550, region: 'Europe' },
            { name: 'Innsbruck', lat: 47.2692, lon: 11.4041, region: 'Europe' },
            { name: 'Zurich', lat: 47.3769, lon: 8.5417, region: 'Europe' },
            { name: 'Geneva', lat: 46.2044, lon: 6.1432, region: 'Europe' },
            { name: 'Basel', lat: 47.5596, lon: 7.5886, region: 'Europe' },
            { name: 'Bern', lat: 46.9481, lon: 7.4474, region: 'Europe' },
            { name: 'Lausanne', lat: 46.5197, lon: 6.6323, region: 'Europe' },
            { name: 'Prague', lat: 50.0755, lon: 14.4378, region: 'Europe' },
            { name: 'Brno', lat: 49.1951, lon: 16.6068, region: 'Europe' },
            { name: 'Ostrava', lat: 49.8209, lon: 18.2625, region: 'Europe' },
            { name: 'Budapest', lat: 47.4979, lon: 19.0402, region: 'Europe' },
            { name: 'Debrecen', lat: 47.5316, lon: 21.6273, region: 'Europe' },
            { name: 'Szeged', lat: 46.2530, lon: 20.1414, region: 'Europe' },
            { name: 'Warsaw', lat: 52.2297, lon: 21.0122, region: 'Europe' },
            { name: 'Krakow', lat: 50.0647, lon: 19.9450, region: 'Europe' },
            { name: 'Gdansk', lat: 54.3520, lon: 18.6466, region: 'Europe' },
            { name: 'Wroclaw', lat: 51.1079, lon: 17.0385, region: 'Europe' },
            { name: 'Poznan', lat: 52.4064, lon: 16.9252, region: 'Europe' },
            { name: 'Lodz', lat: 51.7592, lon: 19.4560, region: 'Europe' },
            
            // Northern Europe
            { name: 'Stockholm', lat: 59.3293, lon: 18.0686, region: 'Europe' },
            { name: 'Gothenburg', lat: 57.7089, lon: 11.9746, region: 'Europe' },
            { name: 'Malmö', lat: 55.6050, lon: 13.0038, region: 'Europe' },
            { name: 'Uppsala', lat: 59.8586, lon: 17.6389, region: 'Europe' },
            { name: 'Copenhagen', lat: 55.6761, lon: 12.5683, region: 'Europe' },
            { name: 'Aarhus', lat: 56.1572, lon: 10.2107, region: 'Europe' },
            { name: 'Odense', lat: 55.4038, lon: 10.4024, region: 'Europe' },
            { name: 'Oslo', lat: 59.9139, lon: 10.7522, region: 'Europe' },
            { name: 'Bergen', lat: 60.3913, lon: 5.3221, region: 'Europe' },
            { name: 'Trondheim', lat: 63.4305, lon: 10.3951, region: 'Europe' },
            { name: 'Helsinki', lat: 60.1699, lon: 24.9384, region: 'Europe' },
            { name: 'Tampere', lat: 61.4991, lon: 23.7871, region: 'Europe' },
            { name: 'Turku', lat: 60.4518, lon: 22.2666, region: 'Europe' },
            { name: 'Reykjavik', lat: 64.1466, lon: -21.9426, region: 'Europe' },
            
            // Eastern Europe
            { name: 'Moscow', lat: 55.7558, lon: 37.6176, region: 'Europe' },
            { name: 'St. Petersburg', lat: 59.9311, lon: 30.3609, region: 'Europe' },
            { name: 'Novosibirsk', lat: 55.0084, lon: 82.9357, region: 'Europe' },
            { name: 'Yekaterinburg', lat: 56.8431, lon: 60.6454, region: 'Europe' },
            { name: 'Kiev', lat: 50.4501, lon: 30.5234, region: 'Europe' },
            { name: 'Kharkiv', lat: 49.9935, lon: 36.2304, region: 'Europe' },
            { name: 'Odessa', lat: 46.4825, lon: 30.7233, region: 'Europe' },
            { name: 'Minsk', lat: 53.9045, lon: 27.5615, region: 'Europe' },
            { name: 'Vilnius', lat: 54.6872, lon: 25.2797, region: 'Europe' },
            { name: 'Riga', lat: 56.9496, lon: 24.1052, region: 'Europe' },
            { name: 'Tallinn', lat: 59.4370, lon: 24.7536, region: 'Europe' },
            { name: 'Bucharest', lat: 44.4268, lon: 26.1025, region: 'Europe' },
            { name: 'Cluj-Napoca', lat: 46.7712, lon: 23.6236, region: 'Europe' },
            { name: 'Sofia', lat: 42.6977, lon: 23.3219, region: 'Europe' },
            { name: 'Plovdiv', lat: 42.1354, lon: 24.7453, region: 'Europe' },
            
            // Southern Europe
            { name: 'Rome', lat: 41.9028, lon: 12.4964, region: 'Europe' },
            { name: 'Milan', lat: 45.4642, lon: 9.1900, region: 'Europe' },
            { name: 'Naples', lat: 40.8518, lon: 14.2681, region: 'Europe' },
            { name: 'Turin', lat: 45.0703, lon: 7.6869, region: 'Europe' },
            { name: 'Palermo', lat: 38.1157, lon: 13.3613, region: 'Europe' },
            { name: 'Genoa', lat: 44.4056, lon: 8.9463, region: 'Europe' },
            { name: 'Bologna', lat: 44.4949, lon: 11.3426, region: 'Europe' },
            { name: 'Florence', lat: 43.7696, lon: 11.2558, region: 'Europe' },
            { name: 'Venice', lat: 45.4408, lon: 12.3155, region: 'Europe' },
            { name: 'Athens', lat: 37.9838, lon: 23.7275, region: 'Europe' },
            { name: 'Thessaloniki', lat: 40.6401, lon: 22.9444, region: 'Europe' },
            { name: 'Patras', lat: 38.2466, lon: 21.7346, region: 'Europe' },
            { name: 'Lisbon', lat: 38.7223, lon: -9.1393, region: 'Europe' },
            { name: 'Porto', lat: 41.1579, lon: -8.6291, region: 'Europe' },
            { name: 'Coimbra', lat: 40.2033, lon: -8.4103, region: 'Europe' },
            { name: 'Zagreb', lat: 45.8150, lon: 15.9819, region: 'Europe' },
            { name: 'Split', lat: 43.5081, lon: 16.4402, region: 'Europe' },
            { name: 'Rijeka', lat: 45.3271, lon: 14.4422, region: 'Europe' },
            { name: 'Ljubljana', lat: 46.0569, lon: 14.5058, region: 'Europe' },
            { name: 'Maribor', lat: 46.5547, lon: 15.6459, region: 'Europe' },
            { name: 'Bratislava', lat: 48.1486, lon: 17.1077, region: 'Europe' },
            { name: 'Kosice', lat: 48.7164, lon: 21.2611, region: 'Europe' },
            { name: 'Belgrade', lat: 44.7866, lon: 20.4489, region: 'Europe' },
            { name: 'Novi Sad', lat: 45.2671, lon: 19.8335, region: 'Europe' },
            { name: 'Nis', lat: 43.3209, lon: 21.8958, region: 'Europe' },
            { name: 'Sarajevo', lat: 43.8563, lon: 18.4131, region: 'Europe' },
            { name: 'Banja Luka', lat: 44.7722, lon: 17.1910, region: 'Europe' },
            { name: 'Podgorica', lat: 42.4304, lon: 19.2594, region: 'Europe' },
            { name: 'Skopje', lat: 41.9981, lon: 21.4254, region: 'Europe' },
            { name: 'Tirana', lat: 41.3275, lon: 19.8187, region: 'Europe' },
            { name: 'Valletta', lat: 35.8989, lon: 14.5146, region: 'Europe' },
            { name: 'Nicosia', lat: 35.1856, lon: 33.3823, region: 'Europe' },
            { name: 'Limassol', lat: 34.7071, lon: 33.0226, region: 'Europe' },
            
            // Global Cities
            { name: 'Tokyo', lat: 35.6762, lon: 139.6503, region: 'Asia' },
            { name: 'Sydney', lat: -33.8688, lon: 151.2093, region: 'Oceania' },
            { name: 'Mumbai', lat: 19.0760, lon: 72.8777, region: 'Asia' },
            { name: 'Shanghai', lat: 31.2304, lon: 121.4737, region: 'Asia' },
            { name: 'Beijing', lat: 39.9042, lon: 116.4074, region: 'Asia' },
            { name: 'Seoul', lat: 37.5665, lon: 126.9780, region: 'Asia' },
            { name: 'Singapore', lat: 1.3521, lon: 103.8198, region: 'Asia' },
            { name: 'Bangkok', lat: 13.7563, lon: 100.5018, region: 'Asia' },
            { name: 'Jakarta', lat: -6.2088, lon: 106.8456, region: 'Asia' },
            { name: 'Manila', lat: 14.5995, lon: 120.9842, region: 'Asia' },
            { name: 'Kuala Lumpur', lat: 3.1390, lon: 101.6869, region: 'Asia' },
            { name: 'Hong Kong', lat: 22.3193, lon: 114.1694, region: 'Asia' },
            { name: 'Taipei', lat: 25.0330, lon: 121.5654, region: 'Asia' },
            { name: 'Melbourne', lat: -37.8136, lon: 144.9631, region: 'Oceania' },
            { name: 'São Paulo', lat: -23.5505, lon: -46.6333, region: 'South America' },
            { name: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729, region: 'South America' },
            { name: 'Buenos Aires', lat: -34.6118, lon: -58.3960, region: 'South America' },
            { name: 'Mexico City', lat: 19.4326, lon: -99.1332, region: 'North America' },
            { name: 'Toronto', lat: 43.6532, lon: -79.3832, region: 'North America' },
            { name: 'Montreal', lat: 45.5017, lon: -73.5673, region: 'North America' },
            { name: 'Vancouver', lat: 49.2827, lon: -123.1207, region: 'North America' },
            { name: 'Cairo', lat: 30.0444, lon: 31.2357, region: 'Africa' },
            { name: 'Lagos', lat: 6.5244, lon: 3.3792, region: 'Africa' },
            { name: 'Johannesburg', lat: -26.2041, lon: 28.0473, region: 'Africa' },
            { name: 'Nairobi', lat: -1.2921, lon: 36.8219, region: 'Africa' },
            { name: 'Casablanca', lat: 33.5731, lon: -7.5898, region: 'Africa' }
        ];

        // Load temperature data for all cities
        for (const city of temperatureCities) {
            try {
                const response = await fetch(`/api/weather/${city.lat}/${city.lon}`);
                const weatherData = await response.json();
                this.addTemperatureMarker(city.lat, city.lon, weatherData, city.region);
            } catch (error) {
                console.error(`Error loading temperature for ${city.name}:`, error);
            }
        }
    }

    addTemperatureMarker(lat, lon, weatherData, region) {
        // Create temperature-focused marker
        const temp = Math.round(weatherData.main.temp);
        const tempColor = this.getTemperatureColor(temp);
        const tempIcon = this.getTemperatureIcon(temp);
        
        const marker = L.marker([lat, lon], {
            icon: tempIcon
        });
        
        const popupContent = `
            <div class="temperature-popup">
                <h3>${weatherData.name}</h3>
                <div class="temperature-info">
                    <div class="temp-display" style="color: ${tempColor}">
                        ${temp}°C
                    </div>
                    <div class="temp-details">
                        <div>Feels like: ${Math.round(weatherData.main.feels_like)}°C</div>
                        <div>Min: ${Math.round(weatherData.main.temp_min)}°C</div>
                        <div>Max: ${Math.round(weatherData.main.temp_max)}°C</div>
                        <div>Region: ${region}</div>
                    </div>
                </div>
            </div>
        `;
        
        marker.bindPopup(popupContent);
        marker.addTo(this.weatherMarkers);
    }

    getTemperatureColor(temp) {
        if (temp >= 35) return '#FF0000'; // Red - Very Hot
        if (temp >= 30) return '#FF4500'; // Orange Red - Hot
        if (temp >= 25) return '#FFA500'; // Orange - Warm
        if (temp >= 20) return '#FFD700'; // Gold - Pleasant
        if (temp >= 15) return '#ADFF2F'; // Green Yellow - Cool
        if (temp >= 10) return '#00FF00'; // Green - Cold
        if (temp >= 5) return '#00BFFF'; // Deep Sky Blue - Very Cold
        if (temp >= 0) return '#0000FF'; // Blue - Freezing
        return '#8A2BE2'; // Blue Violet - Very Freezing
    }

    getTemperatureIcon(temp) {
        const color = this.getTemperatureColor(temp);
        const size = Math.max(20, Math.min(40, Math.abs(temp) + 20)); // Size based on temperature
        
        return L.divIcon({
            className: 'temperature-marker',
            html: `
                <div style="
                    background: ${color};
                    color: white;
                    border: 2px solid white;
                    border-radius: 50%;
                    width: ${size}px;
                    height: ${size}px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: ${Math.max(10, size * 0.4)}px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                ">
                    ${temp}°
                </div>
            `,
            iconSize: [size, size],
            iconAnchor: [size/2, size/2]
        });
    }

    async performSearch() {
        const query = document.getElementById('searchInput').value.trim();
        if (!query) return;

        this.showLoading();
        try {
            const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data.lat && data.lon) {
                this.map.setView([data.lat, data.lon], 10);
                this.currentLocation = { lat: data.lat, lon: data.lon };
                this.loadWeatherData(data.lat, data.lon);
            } else {
                alert('Location not found');
            }
        } catch (error) {
            console.error('Search error:', error);
            alert('Error searching for location');
        } finally {
            this.hideLoading();
        }
    }

    getCurrentLocation() {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by this browser');
            return;
        }

        this.showLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                this.map.setView([lat, lon], 10);
                this.currentLocation = { lat, lon };
                this.loadWeatherData(lat, lon);
                this.hideLoading();
            },
            (error) => {
                console.error('Geolocation error:', error);
                alert('Error getting current location');
                this.hideLoading();
            }
        );
    }

    async loadWeatherData(lat, lon) {
        try {
            const [weatherResponse, forecastResponse] = await Promise.all([
                fetch(`/api/weather/${lat}/${lon}`),
                fetch(`/api/forecast/${lat}/${lon}`)
            ]);

            const weatherData = await weatherResponse.json();
            const forecastData = await forecastResponse.json();

            // Display weather information on the map
            this.displayWeatherMarker(lat, lon, weatherData);
            console.log('Weather data:', weatherData);
            console.log('Forecast data:', forecastData);
        } catch (error) {
            console.error('Error loading weather data:', error);
        }
    }

    displayWeatherMarker(lat, lon, weatherData) {
        // Clear existing weather markers
        this.weatherMarkers.clearLayers();
        
        // Add the new temperature marker
        this.addTemperatureMarker(lat, lon, weatherData, 'Selected');
    }

    getWeatherIcon(iconCode) {
        const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        return L.icon({
            iconUrl: iconUrl,
            iconSize: [50, 50],
            iconAnchor: [25, 25],
            popupAnchor: [0, -25]
        });
    }

    addPrecipitationOverlay() {
        // Create precipitation overlay using OpenWeatherMap precipitation tiles
        const overlay = L.tileLayer('https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=17f35b441d994f24954faa231dcc1755', {
            attribution: 'Precipitation data © OpenWeatherMap',
            opacity: 0.7
        });
        overlay.addTo(this.map);
        this.activeLayers.set('precipitation', overlay);
    }

    addTemperatureOverlay() {
        // Create temperature heat map overlay with natural gradient
        // OpenWeatherMap tile data is available up to zoom level ~10-11 (city level)
        const overlay = L.tileLayer('https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=' + WEATHER_API_KEY, {
            attribution: 'Temperature data © OpenWeatherMap',
            opacity: 0.65, // Moderate opacity so the overlay is visible but not overpowering (~65%)
            maxZoom: 11, // Limit to what API supports (city level, not building level)
            minZoom: 1,
            className: 'high-contrast-temp temperature-layer',
            errorTileUrl: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            keepBuffer: 4
        });
        overlay.addTo(this.map);
        this.activeLayers.set('temperature', overlay);
        
        // Apply initial temperature detail based on zoom
        this.updateTemperatureDetail();
        
        // Start monitoring for new tiles to apply filters dynamically
        this.startTemperatureTileMonitoring();
        
        // Update filters when tiles load
        overlay.on('tileload', () => {
            setTimeout(() => this.updateTemperatureDetail(), 100);
        });
    }

    updateTemperatureDetail() {
        // Dynamically adjust temperature visualization based on zoom level
        // At city level, make colors much more sensitive and less bright/neon
        const zoom = this.currentZoom;
        
        // Limit to maximum supported zoom level
        const effectiveZoom = Math.min(zoom, 11);
        
        // At higher zoom levels, DECREASE contrast and saturation dramatically
        // to show more subtle, natural temperature variations
        // City level needs much higher sensitivity with lower saturation
        const zoomFactor = (effectiveZoom - 2) / 9; // 0 at zoom 2, 1 at zoom 11
        
    // Make the default filters much more vivid so the red/blue overlay is highly visible.
    // Slight zoom-based tweak retained but biased toward stronger contrast and saturation.
    const contrast = 1.9 - (zoomFactor * 0.15); // ~1.9 to ~1.75

    const saturation = 1.9 - (zoomFactor * 0.15); // ~1.9 to ~1.75

    const brightness = 1.05 - (zoomFactor * 0.03); // ~1.05 to ~1.02
        
        // No hue rotation for most natural colors
        const hueRotate = 0;
        
        // Apply the dynamic filter to temperature tiles
        const tempTiles = document.querySelectorAll('img[src*="tile.openweathermap.org/map/temp"]');
        tempTiles.forEach(tile => {
            tile.style.filter = `contrast(${contrast}) saturate(${saturation}) brightness(${brightness}) hue-rotate(${hueRotate}deg)`;
            // let the layer opacity control tile transparency (we'll set it to 0.65 below)
            tile.style.opacity = '';
        });

        // Set overlay opacity to ~65% to match original subtlety preference
        const tempOverlay = this.activeLayers.get('temperature');
        if (tempOverlay) {
            tempOverlay.setOpacity(0.65);
        }
        
        // Log the values for debugging
        console.log(`Zoom ${zoom}: contrast=${contrast.toFixed(2)}, saturation=${saturation.toFixed(2)}, brightness=${brightness.toFixed(2)}, opacity=65% (applied)`);
    }

    startTemperatureTileMonitoring() {
        // Monitor for new temperature tiles being loaded and apply filters
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.tagName === 'IMG' && node.src && node.src.includes('tile.openweathermap.org/map/temp')) {
                        // Apply current filter settings to newly loaded tiles
                        this.updateTemperatureDetail();
                    }
                });
            });
        });

        // Observe the map container for new tiles
        const mapContainer = document.querySelector('.leaflet-tile-pane');
        if (mapContainer) {
            observer.observe(mapContainer, {
                childList: true,
                subtree: true
            });
        }
    }


    addWindOverlay() {
        // Create wind overlay using OpenWeatherMap wind tiles
        const overlay = L.tileLayer('https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=17f35b441d994f24954faa231dcc1755', {
            attribution: 'Wind data © OpenWeatherMap',
            opacity: 0.7
        });
        overlay.addTo(this.map);
        this.activeLayers.set('wind', overlay);
    }

    addPressureOverlay() {
        // Create pressure overlay using OpenWeatherMap pressure tiles
        const overlay = L.tileLayer('https://tile.openweathermap.org/map/pressure_new/{z}/{x}/{y}.png?appid=17f35b441d994f24954faa231dcc1755', {
            attribution: 'Pressure data © OpenWeatherMap',
            opacity: 0.7
        });
        overlay.addTo(this.map);
        this.activeLayers.set('pressure', overlay);
    }


    async loadStormData() {
        try {
            const response = await fetch('/api/storms');
            this.stormData = await response.json();
            this.renderStormTracks();
        } catch (error) {
            console.error('Error loading storm data:', error);
        }
    }

    switchBaseLayer(layerName) {
        // Remove all base layers
        Object.values(this.baseLayers).forEach(layer => {
            this.map.removeLayer(layer);
        });

        // Add selected layer
        this.baseLayers[layerName].addTo(this.map);
    }

    toggleOverlay(overlayType, enabled) {
        if (enabled) {
            this.addOverlay(overlayType);
        } else {
            this.removeOverlay(overlayType);
        }
    }

    addOverlay(overlayType) {
        // Create weather markers and overlays based on type
        if (overlayType === 'precipitation') {
            this.addPrecipitationOverlay();
        } else if (overlayType === 'temperature') {
            this.addTemperatureOverlay();
        } else if (overlayType === 'wind') {
            this.addWindOverlay();
        } else if (overlayType === 'pressure') {
            this.addPressureOverlay();
        }
    }

    removeOverlay(overlayType) {
        const overlay = this.activeLayers.get(overlayType);
        if (overlay) {
            this.map.removeLayer(overlay);
            this.activeLayers.delete(overlayType);
        }
    }

    updateOverlayOpacity(overlayType, opacity) {
        const overlay = this.activeLayers.get(overlayType);
        if (overlay) {
            overlay.setOpacity(opacity / 100);
        }
    }

    renderStormTracks() {
        if (!this.stormData || !this.stormData.storms) return;

        this.stormData.storms.forEach(storm => {
            // Create storm track polyline
            const trackCoords = storm.track.map(point => [point.lat, point.lon]);
            const track = L.polyline(trackCoords, {
                color: this.getStormColor(storm.category),
                weight: 3,
                opacity: 0.8
            });

            // Create forecast track if available
            if (storm.forecast && storm.forecast.length > 0) {
                const forecastCoords = storm.forecast.map(point => [point.lat, point.lon]);
                const forecast = L.polyline(forecastCoords, {
                    color: this.getStormColor(storm.category),
                    weight: 2,
                    opacity: 0.6,
                    dashArray: '5, 5'
                });
                forecast.addTo(this.map);
            }

            track.addTo(this.map);

            // Add current position marker
            const marker = L.circleMarker([storm.current_position.lat, storm.current_position.lon], {
                radius: 8,
                fillColor: this.getStormColor(storm.category),
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            });

            marker.bindPopup(`
                <strong>${storm.name}</strong><br>
                Category: ${storm.category}<br>
                Position: ${storm.current_position.lat.toFixed(2)}, ${storm.current_position.lon.toFixed(2)}
            `);

            marker.addTo(this.map);
        });
    }

    getStormColor(category) {
        const colors = {
            1: '#00ff00', // Green
            2: '#ffff00', // Yellow
            3: '#ff8000', // Orange
            4: '#ff0000', // Red
            5: '#800080'  // Purple
        };
        return colors[category] || '#666666';
    }

    toggleStormTracks(enabled) {
        // Implementation for toggling storm tracks
        console.log('Storm tracks:', enabled);
    }

    toggleStormForecast(enabled) {
        // Implementation for toggling storm forecast
        console.log('Storm forecast:', enabled);
    }

    updateTimeDisplay(value) {
        const timeDisplay = document.getElementById('timeDisplay');
        const percentage = parseInt(value);
        
        if (percentage === 0) {
            timeDisplay.textContent = 'Current';
        } else if (percentage <= 50) {
            const hours = Math.floor((percentage / 50) * 24);
            timeDisplay.textContent = `+${hours}h`;
        } else {
            const hours = Math.floor(((percentage - 50) / 50) * 24);
            timeDisplay.textContent = `-${hours}h`;
        }
    }

    startAnimation() {
        if (this.isAnimating) return;
        
        this.isAnimating = true;
        document.getElementById('playBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;

        this.animationInterval = setInterval(() => {
            const slider = document.getElementById('timeSlider');
            const currentValue = parseInt(slider.value);
            const maxValue = parseInt(slider.max);
            
            if (currentValue < maxValue) {
                slider.value = currentValue + 1;
                this.updateTimeDisplay(slider.value);
                this.updateAnimationFrame();
            } else {
                this.pauseAnimation();
            }
        }, 500);
    }

    pauseAnimation() {
        this.isAnimating = false;
        document.getElementById('playBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        
        if (this.animationInterval) {
            clearInterval(this.animationInterval);
            this.animationInterval = null;
        }
    }

    resetAnimation() {
        this.pauseAnimation();
        document.getElementById('timeSlider').value = 0;
        this.updateTimeDisplay(0);
        this.updateAnimationFrame();
    }

    updateAnimationFrame() {
        // Update overlays based on current time
        // This would typically involve fetching different time slices of data
        console.log('Updating animation frame');
    }

    setMeasurementMode(mode) {
        this.measurementMode = mode;
        this.measurementPoints = [];
        
        // Update button states
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (mode === 'distance') {
            document.getElementById('measureDistance').classList.add('active');
        } else if (mode === 'area') {
            document.getElementById('measureArea').classList.add('active');
        }

        // Change cursor
        this.map.getContainer().style.cursor = 'crosshair';
    }

    handleMeasurementClick(latlng) {
        this.measurementPoints.push(latlng);
        
        // Add marker
        const marker = L.circleMarker(latlng, {
            radius: 5,
            fillColor: '#ff0000',
            color: '#fff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
        });
        marker.addTo(this.measurementLayer);

        if (this.measurementMode === 'distance' && this.measurementPoints.length === 2) {
            this.calculateDistance();
            this.clearMeasurementMode();
        } else if (this.measurementMode === 'area' && this.measurementPoints.length >= 3) {
            this.calculateArea();
            this.clearMeasurementMode();
        }
    }

    async calculateDistance() {
        const points = this.measurementPoints.map(p => ({
            lat: p.lat,
            lon: p.lng
        }));

        try {
            const response = await fetch('/api/measurement', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    points: points,
                    type: 'distance'
                })
            });

            const result = await response.json();
            this.showMeasurementResults(`Distance: ${result.distance_km} km (${result.distance_miles} miles)`);
        } catch (error) {
            console.error('Error calculating distance:', error);
        }
    }

    async calculateArea() {
        const points = this.measurementPoints.map(p => ({
            lat: p.lat,
            lon: p.lng
        }));

        try {
            const response = await fetch('/api/measurement', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    points: points,
                    type: 'area'
                })
            });

            const result = await response.json();
            this.showMeasurementResults(`Area: ${result.area_km2} km² (${result.area_miles2} mi²)`);
        } catch (error) {
            console.error('Error calculating area:', error);
        }
    }

    clearMeasurementMode() {
        this.measurementMode = null;
        this.measurementPoints = [];
        this.map.getContainer().style.cursor = '';
        
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }

    clearMeasurements() {
        this.measurementLayer.clearLayers();
        this.clearMeasurementMode();
        this.hideMeasurementResults();
    }

    showMeasurementResults(text) {
        document.getElementById('measurementText').textContent = text;
        document.getElementById('measurementResults').classList.add('show');
    }

    hideMeasurementResults() {
        document.getElementById('measurementResults').classList.remove('show');
    }

    updateCoordinateDisplay(latlng) {
        const display = document.getElementById('coordinateDisplay');
        display.textContent = `Lat: ${latlng.lat.toFixed(3)}, Lon: ${latlng.lng.toFixed(3)}`;
    }

    showSettings() {
        document.getElementById('settingsModal').classList.add('show');
    }

    hideSettings() {
        document.getElementById('settingsModal').classList.remove('show');
    }

    saveSettings() {
        // Save settings to localStorage
        const settings = {
            tempUnit: document.getElementById('tempUnit').value,
            distanceUnit: document.getElementById('distanceUnit').value,
            speedUnit: document.getElementById('speedUnit').value,
            pressureUnit: document.getElementById('pressureUnit').value,
            theme: document.getElementById('theme').value,
            animationSpeed: document.getElementById('animationSpeed').value
        };

        localStorage.setItem('weatherMapSettings', JSON.stringify(settings));
        this.applySettings(settings);
        this.hideSettings();
    }

    loadSettings() {
        const saved = localStorage.getItem('weatherMapSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.applySettings(settings);
            
            // Update form values
            document.getElementById('tempUnit').value = settings.tempUnit || 'celsius';
            document.getElementById('distanceUnit').value = settings.distanceUnit || 'km';
            document.getElementById('speedUnit').value = settings.speedUnit || 'kmh';
            document.getElementById('pressureUnit').value = settings.pressureUnit || 'hpa';
            document.getElementById('theme').value = settings.theme || 'light';
            document.getElementById('animationSpeed').value = settings.animationSpeed || 5;
        }
    }

    applySettings(settings) {
        // Apply theme
        if (settings.theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }

        // Update animation speed display
        document.getElementById('speedValue').textContent = `${settings.animationSpeed}x`;
    }

    resetSettings() {
        localStorage.removeItem('weatherMapSettings');
        location.reload();
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const toggleBtn = document.getElementById('toggleSidebar');
        
        sidebar.classList.toggle('collapsed');
        
        if (sidebar.classList.contains('collapsed')) {
            toggleBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        } else {
            toggleBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        }
    }

    showLoading() {
        document.getElementById('loadingIndicator').classList.add('show');
    }

    hideLoading() {
        document.getElementById('loadingIndicator').classList.remove('show');
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.weatherMapApp = new WeatherMapApp();
});
