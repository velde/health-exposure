import { useNavigate, useLocation } from 'react-router-dom';
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
} from '@chakra-ui/react';
import { FaMapMarkerAlt, FaExternalLinkAlt } from 'react-icons/fa';
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
  const selectedLocation: Location | null = location.state?.selectedLocation || null;

  // Test environment variables
  console.log('API URL:', import.meta.env.VITE_API_URL);
  console.log('API Key exists:', !!import.meta.env.VITE_API_KEY);

  const { data: environmentalData, isLoading, error } = useQuery({
    queryKey: ['environmentalData', selectedLocation?.lat, selectedLocation?.lon],
    queryFn: async () => {
      if (!selectedLocation) return null;
      try {
        console.log('Making API request with key:', !!import.meta.env.VITE_API_KEY);
        console.log('Request params:', { lat: selectedLocation.lat, lon: selectedLocation.lon });
        const response = await apiClient.get('/cells', {
          params: {
            lat: selectedLocation.lat,
            lon: selectedLocation.lon
          }
        });
        console.log('API Response:', response.data);
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
    enabled: !!selectedLocation
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
          <Stack gap={4}>
            <Flex align="center" justify="space-between">
              <Text fontSize="lg" fontWeight="medium">
                Selected Location
              </Text>
              <Button
                leftIcon={<Icon as={FaMapMarkerAlt} />}
                colorScheme="blue"
                variant="outline"
                onClick={() => navigate('/location-search')}
              >
                Change Location
              </Button>
            </Flex>

            {selectedLocation ? (
              <Box p={4} bg="gray.50" borderRadius="md">
                <Text fontWeight="medium">{selectedLocation.name}</Text>
                <Text fontSize="sm" color="gray.600">
                  Lat: {selectedLocation.lat.toFixed(4)}, Lon: {selectedLocation.lon.toFixed(4)}
                </Text>
              </Box>
            ) : (
              <Box
                p={4}
                bg="gray.50"
                borderRadius="md"
                textAlign="center"
                color="gray.500"
              >
                No location selected
              </Box>
            )}
          </Stack>
        </Box>

        {selectedLocation && (
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
                <Stack spacing={6}>
                  <Grid templateColumns="repeat(2, 1fr)" gap={4}>
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
                            <Text fontSize="sm">PM2.5: {environmentalData.data.air_quality.pm2_5} µg/m³</Text>
                          )}
                          {environmentalData.data.air_quality?.pm10 && (
                            <Text fontSize="sm">PM10: {environmentalData.data.air_quality.pm10} µg/m³</Text>
                          )}
                          {environmentalData.data.air_quality?.o3 && (
                            <Text fontSize="sm">O3: {environmentalData.data.air_quality.o3} µg/m³</Text>
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
                        </Stack>
                      )}
                    </Box>

                    <Box p={4} bg={getTapWaterColor(environmentalData.data.tap_water?.is_safe || false)} borderRadius="md">
                      <Text fontWeight="medium">Tap Water</Text>
                      {environmentalData.data.tap_water?.error ? (
                        <Badge colorScheme="red">{environmentalData.data.tap_water.error}</Badge>
                      ) : (
                        <Stack spacing={1}>
                          <Badge colorScheme={environmentalData.data.tap_water?.is_safe ? 'green' : 'red'}>
                            {environmentalData.data.tap_water?.is_safe ? 'Safe' : 'Not Safe'}
                          </Badge>
                          <Text fontSize="sm">Country: {environmentalData.data.tap_water?.country}</Text>
                        </Stack>
                      )}
                    </Box>

                    <Box p={4} bg="gray.50" borderRadius="md">
                      <Text fontWeight="medium">Humidity</Text>
                      {environmentalData.data.humidity?.error ? (
                        <Badge colorScheme="red">{environmentalData.data.humidity.error}</Badge>
                      ) : (
                        <Stack spacing={1}>
                          <Text fontSize="lg">{environmentalData.data.humidity?.humidity}%</Text>
                          <Text fontSize="xs" color="gray.500">
                            Updated: {formatTimestamp(environmentalData.data.humidity?.timestamp || 0)}
                          </Text>
                        </Stack>
                      )}
                    </Box>
                  </Grid>

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

                  {environmentalData.news?.articles && environmentalData.news.articles.length > 0 && (
                    <Box>
                      <Heading size="sm" mb={4}>Local Health News</Heading>
                      <Stack spacing={4}>
                        {environmentalData.news.articles.map((article, index) => (
                          <Box key={index} p={4} bg="gray.50" borderRadius="md">
                            <Text fontWeight="medium">{article.title}</Text>
                            <Text fontSize="sm" mt={2}>{article.description}</Text>
                            <Link
                              href={article.url}
                              isExternal
                              color="blue.500"
                              fontSize="sm"
                              mt={2}
                              display="inline-flex"
                              alignItems="center"
                            >
                              Read more <Icon as={FaExternalLinkAlt} ml={1} />
                            </Link>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  )}

                  <Box fontSize="xs" color="gray.500" textAlign="center">
                    Last updated: {formatTimestamp(environmentalData.last_updated)}
                  </Box>
                </Stack>
              )}
            </Stack>
          </Box>
        )}
      </Stack>
    </Container>
  );
}

export default Dashboard; 