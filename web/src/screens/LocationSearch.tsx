import { useState } from 'react';
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
} from '@chakra-ui/react';
import { FaSearch } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../api/client';

interface Location {
  name: string;
  lat: number;
  lon: number;
  street?: string;
  city?: string;
  region?: string;
  country?: string;
}

interface GeocodingResult {
  formatted: string;
  geometry: {
    lat: number;
    lng: number;
  };
  components: {
    road?: string;
    city?: string;
    town?: string;
    state?: string;
    country?: string;
  };
}

async function searchLocations(query: string): Promise<Location[]> {
  if (query.length < 3) return [];
  
  try {
    console.log('Searching locations with query:', query);
    const response = await apiClient.get('/geocode', {
      params: { query }
    });
    
    console.log('Geocoding Response:', response.data);
    return response.data.results.map((result: GeocodingResult) => ({
      name: result.formatted,
      lat: result.geometry.lat,
      lon: result.geometry.lng,
      street: result.components.road,
      city: result.components.city || result.components.town,
      region: result.components.state,
      country: result.components.country
    }));
  } catch (error) {
    console.error('Error searching locations:', error);
    throw error;
  }
}

function LocationSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: locations, isLoading, error } = useQuery({
    queryKey: ['locations', searchQuery],
    queryFn: () => searchLocations(searchQuery),
    enabled: searchQuery.length >= 3,
  });

  const handleLocationSelect = (location: Location) => {
    navigate('/', { state: { selectedLocation: location } });
  };

  return (
    <Container maxW="container.sm" py={8}>
      <Stack gap={4}>
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
                {location.street && (
                  <Text fontSize="sm" color="gray.600">
                    {location.street}
                  </Text>
                )}
              </Stack>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Container>
  );
}

export default LocationSearch; 