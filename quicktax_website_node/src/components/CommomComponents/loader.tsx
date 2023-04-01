/**
 * @format
 */
import {Box, Flex, Spinner} from '@chakra-ui/react'

export const Loader = () => (
  <Box w="100%" alignItems={'center'} display="flex" justifyContent={'center'}>
    <Flex
      bgColor={'cyan.700'}
      padding="5"
      opacity={0.95}
      zIndex={100}
      top="50%"
      width="200px"
      borderRadius={'lg'}
      boxShadow={'lg'}
      margin="auto"
      alignItems={'center'}
      justifyContent="center"
      position="absolute">
      <Spinner color="white" size="md" />
    </Flex>
  </Box>
)
