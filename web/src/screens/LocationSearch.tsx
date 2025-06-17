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
      (position) => {
        resolve({
          name: 'Current Location',
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
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
  const [isGettingLocation, setIsGettingLocation] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const toast = useToast();

  const { data: locations, isLoading, error } = useQuery({
    queryKey: ['locations', searchQuery],
    queryFn: () => searchLocations(searchQuery),
    enabled: searchQuery.length >= 3,
  });

  useEffect(() => {
    handleUseCurrentLocation();
  }, []);

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