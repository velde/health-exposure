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
} from '@chakra-ui/react';
import { FaMapMarkerAlt } from 'react-icons/fa';
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
  level: string;
  timestamp: number;
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

  return (
    <Container maxW="container.sm" py={8}>
      <Stack gap={6}>
        <Heading size="lg">Health Exposure</Heading>
        
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
              <Heading size="md">Environmental Data</Heading>
              
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
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box p={4} bg="gray.50" borderRadius="md">
                    <Text fontWeight="medium">Air Quality</Text>
                    {environmentalData.data.air_quality?.error ? (
                      <Badge colorScheme="red">{environmentalData.data.air_quality.error}</Badge>
                    ) : (
                      <Stack spacing={1}>
                        <Badge colorScheme="green">AQI: {environmentalData.data.air_quality?.aqi}</Badge>
                        {environmentalData.data.air_quality?.pm2_5 && (
                          <Text fontSize="sm">PM2.5: {environmentalData.data.air_quality.pm2_5} µg/m³</Text>
                        )}
                      </Stack>
                    )}
                  </Box>

                  <Box p={4} bg="gray.50" borderRadius="md">
                    <Text fontWeight="medium">UV Index</Text>
                    {environmentalData.data.uv?.error ? (
                      <Badge colorScheme="red">{environmentalData.data.uv.error}</Badge>
                    ) : (
                      <Badge colorScheme={environmentalData.data.uv?.uv_index > 6 ? 'red' : 'green'}>
                        {environmentalData.data.uv?.uv_index}
                      </Badge>
                    )}
                  </Box>

                  <Box p={4} bg="gray.50" borderRadius="md">
                    <Text fontWeight="medium">Tap Water</Text>
                    {environmentalData.data.tap_water?.error ? (
                      <Badge colorScheme="red">{environmentalData.data.tap_water.error}</Badge>
                    ) : (
                      <Badge colorScheme={environmentalData.data.tap_water?.is_safe ? 'green' : 'red'}>
                        {environmentalData.data.tap_water?.is_safe ? 'Safe' : 'Not Safe'}
                      </Badge>
                    )}
                  </Box>

                  <Box p={4} bg="gray.50" borderRadius="md">
                    <Text fontWeight="medium">Pollen</Text>
                    {environmentalData.data.pollen?.error ? (
                      <Badge colorScheme="red">{environmentalData.data.pollen.error}</Badge>
                    ) : (
                      <Badge colorScheme={
                        environmentalData.data.pollen?.level === 'high' ? 'red' :
                        environmentalData.data.pollen?.level === 'moderate' ? 'yellow' : 'green'
                      }>
                        {environmentalData.data.pollen?.level}
                      </Badge>
                    )}
                  </Box>
                </Grid>
              )}
            </Stack>
          </Box>
        )}
      </Stack>
    </Container>
  );
}

export default Dashboard; 