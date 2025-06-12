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
} from '@chakra-ui/react';
import { FaMapMarkerAlt } from 'react-icons/fa';

interface Location {
  name: string;
  lat: number;
  lon: number;
}

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedLocation: Location | null = location.state?.selectedLocation || null;

  return (
    <Container maxW="container.sm" py={8}>
      <Stack gap={6}>
        <Heading size="lg">Health Exposure v1.0</Heading>
        
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
      </Stack>
    </Container>
  );
}

export default Dashboard; 