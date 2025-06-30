import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Stack,
  Button,
  Text,
  Flex,
  Icon,
  Grid,
  Badge,
  Spinner,
  Link,
  Divider,
  useToast,
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaExternalLinkAlt, FaSync } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';
import axios from 'axios';

interface Location {
  name: string;
  lat: number;
  lon: number;
}

interface AirQuality {
  source: string;
  aqi: number;
  pm2_5?: number;
  pm10?: number;
  o3?: number;
  co?: number;
  timestamp: number;
  error?: string;
}

interface UVIndex {
  source: string;
  uv_index: number;
  timestamp: string;
  max_uv?: number;
  max_uv_time?: string;
  error?: string;
}

interface TapWater {
  source: string;
  is_safe: boolean;
  country: string;
  error?: string;
}

interface Humidity {
  source: string;
  humidity: number;
  timestamp: number;
  error?: string;
}

interface Weather {
  source: string;
  temperature: {
    current: number;
    feels_like: number;
    min: number;
    max: number;
  };
  humidity: number;
  pressure: number;
  wind: {
    speed: number;
    direction: number;
  };
  weather: {
    description: string;
    icon: string;
    main: string;
  };
  clouds: number;
  visibility: number;
  sunrise: number;
  sunset: number;
  timestamp: number;
  error?: string;
}

interface Pollen {
  source: string;
  alder: number;
  birch: number;
  grass: number;
  mugwort: number;
  olive: number;
  ragweed: number;
  error?: string;
}

interface EnvironmentalData {
  h3_cell: string;
  location: string;
  last_updated: number;
  data: {
    air_quality: AirQuality;
    tap_water: TapWater;
    uv: UVIndex;
    weather: Weather;
    humidity: Humidity;
    pollen: Pollen;
  };
  news: {
    articles: Array<{
      title: string;
      description: string;
      url: string;
    }>;
  };
}

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  // State for current location (auto-detected or manually selected)
  const [currentLocation, setCurrentLocation] = useState<Location | null>(
    location.state?.selectedLocation || null
  );
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  // Test environment variables
  console.log('API URL:', import.meta.env.VITE_API_URL);
  console.log('API Key exists:', !!import.meta.env.VITE_API_KEY);

  // Function to reverse geocode coordinates to get place name
  const reverseGeocode = async (lat: number, lon: number): Promise<string> => {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: lat,
          lon: lon,
          format: 'json',
          'accept-language': 'en',
          addressdetails: 1
        },
        headers: {
          'User-Agent': 'HealthExposure/1.0'
        }
      });
      
      // Create a concise location name from address components
      if (response.data && response.data.address) {
        const address = response.data.address;
        const parts = [];
        
        // Primary: City/Town/Village/Suburb
        if (address.city) parts.push(address.city);
        else if (address.town) parts.push(address.town);
        else if (address.village) parts.push(address.village);
        else if (address.suburb) parts.push(address.suburb);
        
        // Secondary: State/Province (only if different from city)
        if (address.state && address.state !== parts[0]) {
          parts.push(address.state);
        }
        
        // Tertiary: Country (only if not obvious from state)
        if (address.country && address.country !== 'United States') {
          parts.push(address.country);
        }
        
        const result = parts.join(', ');
        
        // Limit length for UI - if too long, use just city and state
        if (result.length > 60) {
          return parts.slice(0, 2).join(', ');
        }
        
        return result;
      }
      
      // Fallback to coordinates if no address components available
      return `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      // Fallback to coordinates if reverse geocoding fails
      return `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
    }
  };

  // Function to get current location
  const getCurrentLocation = (): Promise<Location> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          
          // Get place name from coordinates
          const placeName = await reverseGeocode(lat, lon);
          
          resolve({
            name: placeName,
            lat: lat,
            lon: lon
          });
        },
        (error) => {
          let errorMessage = 'Unable to get your location';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access was denied. Please enable location services.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information is unavailable.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              break;
          }
          reject(new Error(errorMessage));
        }
      );
    });
  };

  // Function to refresh current location
  const refreshCurrentLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const detectedLocation = await getCurrentLocation();
      setCurrentLocation(detectedLocation);
      toast({
        title: 'Location updated',
        description: 'Refreshed to your current location',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
      toast({
        title: 'Location Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Auto-detect location on component mount
  useEffect(() => {
    const detectLocation = async () => {
      // If we already have a location from navigation state, use it
      if (location.state?.selectedLocation) {
        setCurrentLocation(location.state.selectedLocation);
        return;
      }

      // Otherwise, try to get current location
      setIsDetectingLocation(true);
      try {
        const detectedLocation = await getCurrentLocation();
        setCurrentLocation(detectedLocation);
        toast({
          title: 'Location detected',
          description: 'Using your current location',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
        toast({
          title: 'Location Error',
          description: errorMessage,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        console.error('Location detection failed:', error);
      } finally {
        setIsDetectingLocation(false);
      }
    };

    detectLocation();
  }, [location.state?.selectedLocation, toast]);

  // Handle browser refresh to update current location
  useEffect(() => {
    // Check if this is a page reload and we don't have a selected location
    const isPageReload = performance.navigation.type === 1;
    
    if (isPageReload && !location.state?.selectedLocation) {
      console.log('Page reload detected, refreshing location');
      refreshCurrentLocation();
    }
  }, [location.state?.selectedLocation]);

  const { data: environmentalData, isLoading, error } = useQuery({
    queryKey: ['environmentalData', currentLocation?.lat, currentLocation?.lon],
    queryFn: async () => {
      if (!currentLocation) return null;
      try {
        console.log('Making API request with key:', !!import.meta.env.VITE_API_KEY);
        console.log('Request params:', { lat: currentLocation.lat, lon: currentLocation.lon });
        const response = await apiClient.get('/cells', {
          params: {
            lat: currentLocation.lat,
            lon: currentLocation.lon
          }
        });
        console.log('API Response:', response.data);
        console.log('UV Data from API:', response.data?.data?.uv);
        return response.data as EnvironmentalData;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('API Error:', {
            status: error.response?.status,
            data: error.response?.data,
            headers: error.response?.headers
          });
        }
        throw error;
      }
    },
    enabled: !!currentLocation
  });

  const getAQIColor = (aqi: number) => {
    if (aqi <= 1) return 'green.50';
    if (aqi <= 2) return 'yellow.50';
    if (aqi <= 3) return 'orange.50';
    if (aqi <= 4) return 'red.50';
    return 'purple.50';
  };

  const getUVColor = (uv: number) => {
    if (uv <= 2) return 'green.50';
    if (uv <= 5) return 'yellow.50';
    if (uv <= 7) return 'orange.50';
    if (uv <= 10) return 'red.50';
    return 'purple.50';
  };

  const getTapWaterColor = (isSafe: boolean) => {
    return isSafe ? 'green.50' : 'red.50';
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch (error) {
      return timeString;
    }
  };

  return (
    <Container maxW="container.sm" py={8}>
      <Stack gap={6}>
        <Heading size="lg" textAlign="center">Health Exposure</Heading>
        
        <Box
          p={6}
          bg="white"
          borderRadius="lg"
          boxShadow="sm"
          borderWidth="1px"
          borderColor="gray.200"
        >
          <Stack gap={4} align="center">
            {currentLocation ? (
              <Box p={4} bg="gray.50" borderRadius="md" textAlign="center" w="full">
                <Text fontWeight="medium" fontSize="lg">{currentLocation.name}</Text>
                <Text fontSize="sm" color="gray.600" mt={1}>
                  Lat: {currentLocation.lat.toFixed(4)}, Lon: {currentLocation.lon.toFixed(4)}
                </Text>
                {!location.state?.selectedLocation && (
                  <Button
                    size="sm"
                    variant="ghost"
                    leftIcon={<Icon as={FaSync} />}
                    onClick={refreshCurrentLocation}
                    isLoading={isDetectingLocation}
                    loadingText="Refreshing..."
                    title="Refresh current location"
                    mt={2}
                  >
                    Refresh
                  </Button>
                )}
              </Box>
            ) : isDetectingLocation ? (
              <Box
                p={4}
                bg="gray.50"
                borderRadius="md"
                textAlign="center"
                color="gray.500"
                w="full"
              >
                <Spinner size="sm" mr={2} />
                Detecting your location...
              </Box>
            ) : (
              <Box
                p={4}
                bg="gray.50"
                borderRadius="md"
                textAlign="center"
                color="gray.500"
                w="full"
              >
                <Text mb={2}>No location available</Text>
                <Button
                  size="sm"
                  colorScheme="blue"
                  onClick={async () => {
                    setIsDetectingLocation(true);
                    try {
                      const detectedLocation = await getCurrentLocation();
                      setCurrentLocation(detectedLocation);
                      toast({
                        title: 'Location detected',
                        description: 'Using your current location',
                        status: 'success',
                        duration: 3000,
                        isClosable: true,
                      });
                    } catch (error) {
                      const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
                      toast({
                        title: 'Location Error',
                        description: errorMessage,
                        status: 'error',
                        duration: 5000,
                        isClosable: true,
                      });
                    } finally {
                      setIsDetectingLocation(false);
                    }
                  }}
                >
                  Try Again
                </Button>
              </Box>
            )}

            <Button
              leftIcon={<Icon as={FaMapMarkerAlt} />}
              colorScheme="blue"
              variant="outline"
              onClick={() => navigate('/location-search')}
            >
              Change Location
            </Button>
          </Stack>
        </Box>

        {currentLocation && (
          <>
            {/* Weather Card - Separate */}
            <Box
              p={6}
              bg="white"
              borderRadius="lg"
              boxShadow="sm"
              borderWidth="1px"
              borderColor="gray.200"
            >
              <Stack gap={4}>
                <Heading size="md" textAlign="center">Weather</Heading>
                
                {isLoading && (
                  <Box textAlign="center" py={4}>
                    <Spinner />
                  </Box>
                )}

                {error && (
                  <Box p={4} bg="red.50" color="red.500" borderRadius="md">
                    Error loading weather data. Please try again.
                  </Box>
                )}

                {environmentalData && (
                  <Box p={4} bg="gray.50" borderRadius="md">
                    {environmentalData.data.weather?.error ? (
                      <Badge colorScheme="red">{environmentalData.data.weather.error}</Badge>
                    ) : (
                      <Stack spacing={1}>
                        <Badge colorScheme="blue">
                          {Math.round(environmentalData.data.weather?.temperature?.current || 0)}°C (feels like {Math.round(environmentalData.data.weather?.temperature?.feels_like || 0)}°C)
                        </Badge>
                        <Text fontSize="sm" color="gray.600">
                          min {Math.round(environmentalData.data.weather?.temperature?.min || 0)}°C, max {Math.round(environmentalData.data.weather?.temperature?.max || 0)}°C
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          {environmentalData.data.weather?.weather?.description}
                        </Text>
                        <Text fontSize="sm" color="gray.600">
                          Wind: {(environmentalData.data.weather?.wind?.speed || 0).toFixed(1)} m/s
                        </Text>
                        {environmentalData.data.weather?.visibility && (
                          <Text fontSize="sm" color="gray.600">
                            Visibility: {Math.round((environmentalData.data.weather.visibility / 1000))} km
                          </Text>
                        )}
                      </Stack>
                    )}
                  </Box>
                )}
              </Stack>
            </Box>

            {/* Environmental Data Card */}
            <Box
              p={6}
              bg="white"
              borderRadius="lg"
              boxShadow="sm"
              borderWidth="1px"
              borderColor="gray.200"
            >
              <Stack gap={4}>
                <Heading size="md" textAlign="center">Environmental Data</Heading>
                
                {isLoading && (
                  <Box textAlign="center" py={4}>
                    <Spinner />
                  </Box>
                )}

                {error && (
                  <Box p={4} bg="red.50" color="red.500" borderRadius="md">
                    Error loading environmental data. Please try again.
                  </Box>
                )}

                {environmentalData && (
                  <Stack spacing={4}>
                    <Box p={4} bg={getAQIColor(environmentalData.data.air_quality?.aqi || 0)} borderRadius="md">
                      <Text fontWeight="medium">Air Quality</Text>
                      {environmentalData.data.air_quality?.error ? (
                        <Badge colorScheme="red">{environmentalData.data.air_quality.error}</Badge>
                      ) : (
                        <Stack spacing={1}>
                          <Badge colorScheme={getAQIColor(environmentalData.data.air_quality?.aqi || 0).replace('.50', '')}>
                            AQI: {environmentalData.data.air_quality?.aqi}
                          </Badge>
                          {environmentalData.data.air_quality?.pm2_5 && (
                            <Text fontSize="sm" color="gray.600">
                              PM2.5: {environmentalData.data.air_quality.pm2_5} µg/m³
                            </Text>
                          )}
                          {environmentalData.data.air_quality?.pm10 && (
                            <Text fontSize="sm" color="gray.600">
                              PM10: {environmentalData.data.air_quality.pm10} µg/m³
                            </Text>
                          )}
                        </Stack>
                      )}
                    </Box>

                    <Box p={4} bg={getUVColor(environmentalData.data.uv?.uv_index || 0)} borderRadius="md">
                      <Text fontWeight="medium">UV Index</Text>
                      {environmentalData.data.uv?.error ? (
                        <Badge colorScheme="red">{environmentalData.data.uv.error}</Badge>
                      ) : (
                        <Stack spacing={1}>
                          <Badge colorScheme={getUVColor(environmentalData.data.uv?.uv_index || 0).replace('.50', '')}>
                            {environmentalData.data.uv?.uv_index}
                          </Badge>
                          {environmentalData.data.uv?.max_uv && (
                            <Text fontSize="sm" color="gray.600">
                              Max: {environmentalData.data.uv?.max_uv} at {formatTime(environmentalData.data.uv?.max_uv_time || '')}
                            </Text>
                          )}
                          {environmentalData.data.weather?.sunrise && (
                            <Text fontSize="sm" color="gray.600">
                              Sunrise: {formatTime(new Date(environmentalData.data.weather.sunrise * 1000).toISOString())}
                            </Text>
                          )}
                          {environmentalData.data.weather?.sunset && (
                            <Text fontSize="sm" color="gray.600">
                              Sunset: {formatTime(new Date(environmentalData.data.weather.sunset * 1000).toISOString())}
                            </Text>
                          )}
                        </Stack>
                      )}
                    </Box>

                    <Box p={4} bg="blue.50" borderRadius="md">
                      <Text fontWeight="medium">Conditions</Text>
                      {environmentalData.data.humidity?.error ? (
                        <Badge colorScheme="red">{environmentalData.data.humidity.error}</Badge>
                      ) : (
                        <Stack spacing={1}>
                          <Badge colorScheme="blue">Humidity: {environmentalData.data.humidity?.humidity}%</Badge>
                          {environmentalData.data.weather?.pressure && (
                            <Text fontSize="sm" color="gray.600">
                              Pressure: {environmentalData.data.weather.pressure} hPa
                            </Text>
                          )}
                        </Stack>
                      )}
                    </Box>

                    <Box p={4} bg="gray.50" borderRadius="md">
                      <Text fontWeight="medium" mb={2}>Pollen</Text>
                      {environmentalData.data.pollen?.error ? (
                        <Badge colorScheme="red">{environmentalData.data.pollen.error}</Badge>
                      ) : (
                        <Stack spacing={2}>
                          <Grid templateColumns="repeat(2, 1fr)" gap={2}>
                            <Box>
                              <Text fontSize="sm">Alder: {environmentalData.data.pollen?.alder}</Text>
                              <Text fontSize="sm">Birch: {environmentalData.data.pollen?.birch}</Text>
                              <Text fontSize="sm">Grass: {environmentalData.data.pollen?.grass}</Text>
                            </Box>
                            <Box>
                              <Text fontSize="sm">Mugwort: {environmentalData.data.pollen?.mugwort}</Text>
                              <Text fontSize="sm">Olive: {environmentalData.data.pollen?.olive}</Text>
                              <Text fontSize="sm">Ragweed: {environmentalData.data.pollen?.ragweed}</Text>
                            </Box>
                          </Grid>
                        </Stack>
                      )}
                    </Box>

                    <Box fontSize="xs" color="gray.500" textAlign="center">
                      Last updated: {formatTimestamp(environmentalData.last_updated)}
                    </Box>
                  </Stack>
                )}
              </Stack>
            </Box>
          </>
        )}
      </Stack>
    </Container>
  );
}

export default Dashboard; 