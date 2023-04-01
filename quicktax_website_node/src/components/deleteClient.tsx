import {
  Box,
  Button,
  FormControl,
  Heading,
  HStack,
  Text,
  useToast,
} from "@chakra-ui/react";
import { GrayBox } from "./UiComponents";
import "react-datepicker/dist/react-datepicker.css";

export const DeleteClient = ({ cpf, cname, successCallback }: { cpf: string, cname: string, successCallback:()=>void }) => {

  const toast = useToast();

  const formSubmit = (e: any) => {
    const data = new FormData();
    data.append("cid", cpf);

    // Do server upload API here.
    fetch(`${process.env.REACT_APP_API_HOST}/rmcli.php`, {
      method: "POST",
      body: data,
    }).then((res) => res.json())
      .then((r) => {
        if (r.status === 'Success') {
          toast({
            title: "Client has been removed!",
            description: r.message,
            status: "success",
            duration: 3000,
            isClosable: true,
            position: "top",
          });
          successCallback()
          // setForm([]);
        } else {
          toast({
            title: "Failed to delete!",
            description: 'Failed to delete!',
            status: "error",
            duration: 3000,
            isClosable: true,
            position: "top",
          });
        }
      });
    e.preventDefault();
  };
  return (
    <Box>
      <Heading>Você quer deletar o cliente</Heading>
      <FormControl>
        <form onSubmit={formSubmit}>
          <GrayBox
            props={{
              m: 4,
              mt: "7",
              p: 4,
              minWidth: "200px",
              width: "280px",
            }}
          >
            <HStack spacing={4} justifyContent="space-between" align={"middle"}>
              <Box w="50%">
                <Heading size="xs" mb="2">
                  Nome
                </Heading>
                <Text>{cname}</Text>
              </Box>
              <Box w="50%">
                <Heading size="xs" mb="2px">
                  CPF
                </Heading>
                <Text
                  display="flex"
                  alignItems="center"
                  justifyContent="flexStart"
                  h="33px"
                >
                  {cpf}
                </Text>
              </Box>
            </HStack>
          </GrayBox>
          <Box p="5">
            <Box mt="8">
              <HStack spacing="4" alignItems="flex-end">
                <Box>
                  <Button type="submit" colorScheme={"orange"}>
                    CONFIRMAR
                  </Button>
                </Box>
              </HStack>
            </Box>
          </Box>
        </form>
      </FormControl>
    </Box >
  );
};