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
import axios from 'axios';

interface Location {
  name: string;
  lat: number;
  lon: number;
  street?: string;
  city?: string;
  region?: string;
  country?: string;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
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
    const url = 'https://nominatim.openstreetmap.org/search';
    const params = {
      q: query,
      format: 'json',
      limit: 5,
      addressdetails: 1
    };
    console.log('Request URL:', url);
    console.log('Request params:', params);
    
    const response = await axios.get(url, {
      params,
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'HealthExposure/1.0' // Required by Nominatim's usage policy
      }
    });
    
    console.log('Geocoding Response:', response.data);
    if (!response.data || !Array.isArray(response.data)) {
      console.error('Invalid response format:', response.data);
      return [];
    }

    return response.data.map((result: NominatimResult) => {
      const location = {
        name: result.display_name,
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        street: result.address.road,
        city: result.address.city || result.address.town,
        region: result.address.state,
        country: result.address.country
      };
      console.log('Processed location:', location);
      return location;
    });
  } catch (error) {
    console.error('Error searching locations:', error);
    if (axios.isAxiosError(error)) {
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      console.error('Response headers:', error.response?.headers);
    }
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