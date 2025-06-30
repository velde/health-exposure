import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Input,
  InputGroup,
  InputLeftElement,
  Stack,
  Text,
  Icon,
  Spinner,
  Button,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Flex,
  Heading,
} from '@chakra-ui/react';
import { FaSearch, FaLocationArrow } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface Location {
  name: string;
  lat: number;
  lon: number;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

async function searchLocations(query: string): Promise<Location[]> {
  if (query.length < 3) return [];
  
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'json',
        limit: 5,
        addressdetails: 1,
        'accept-language': 'en'
      },
      headers: {
        'User-Agent': 'HealthExposure/1.0'
      }
    });
    
    if (!response.data || !Array.isArray(response.data)) {
      return [];
    }

    return response.data.map((result: NominatimResult) => ({
      name: result.display_name,
      lat: parseFloat(result.lat),
      lon: parseFloat(result.lon)
    }));
  } catch (error) {
    console.error('Error searching locations:', error);
    return [];
  }
}

async function getCurrentLocation(): Promise<Location | null> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        
        // Get place name from coordinates using reverse geocoding
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
          
          let placeName = 'Current Location';
          
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
              placeName = parts.slice(0, 2).join(', ');
            } else {
              placeName = result;
            }
          }
          
          resolve({
            name: placeName,
            lat: lat,
            lon: lon
          });
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          // Fallback to coordinates if reverse geocoding fails
          resolve({
            name: `Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`,
            lat: lat,
            lon: lon
          });
        }
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access was denied. Please enable location services or search manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please try searching manually.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again or search manually.';
            break;
        }
        reject(new Error(errorMessage));
      }
    );
  });
}

function LocationSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const toast = useToast();

  const { data: locations, isLoading, error } = useQuery({
    queryKey: ['locations', searchQuery],
    queryFn: () => searchLocations(searchQuery),
    enabled: searchQuery.length >= 3,
  });

  const handleLocationSelect = (location: Location) => {
    navigate('/', { state: { selectedLocation: location } });
  };

  const handleUseCurrentLocation = async () => {
    setIsGettingLocation(true);
    setLocationError(null);
    try {
      const location = await getCurrentLocation();
      if (location) {
        handleLocationSelect(location);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
      setLocationError(errorMessage);
      toast({
        title: 'Location Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsGettingLocation(false);
    }
  };

  return (
    <Container maxW="container.sm" py={8}>
      <Stack gap={4}>
        <Flex align="center" justify="space-between">
          <Heading size="lg">Select Location</Heading>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
          >
            Back to Dashboard
          </Button>
        </Flex>

        <Text color="gray.600">
          Choose a different location to view environmental data for that area.
        </Text>

        <Button
          leftIcon={<Icon as={FaLocationArrow} />}
          colorScheme="blue"
          onClick={handleUseCurrentLocation}
          isLoading={isGettingLocation}
          loadingText="Getting location..."
        >
          Use Current Location
        </Button>

        {locationError && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Location Access Required</AlertTitle>
              <AlertDescription>{locationError}</AlertDescription>
            </Box>
          </Alert>
        )}

        <Box>
          <Text mb={2} fontWeight="medium">Or search for a location:</Text>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <Icon as={FaSearch} color="gray.400" />
            </InputLeftElement>
            <Input
              placeholder="Search location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </InputGroup>
        </Box>

        {isLoading && (
          <Box textAlign="center" py={4}>
            <Spinner />
          </Box>
        )}

        {error && (
          <Box p={4} bg="red.50" color="red.500" borderRadius="md">
            Error searching locations. Please try again.
          </Box>
        )}

        <Stack gap={2}>
          {locations?.map((location) => (
            <Box
              key={`${location.lat}-${location.lon}`}
              p={4}
              bg="white"
              borderRadius="md"
              boxShadow="sm"
              borderWidth="1px"
              borderColor="gray.200"
              cursor="pointer"
              _hover={{ bg: 'gray.50' }}
              onClick={() => handleLocationSelect(location)}
            >
              <Stack gap={1}>
                <Text fontWeight="medium">{location.name}</Text>
              </Stack>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Container>
  );
}

export default LocationSearch; 