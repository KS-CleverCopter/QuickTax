import { Box, Button, Flex } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

export const Header = ({ selectedMenu }: { selectedMenu: string }) => {
  
  const buttonStyles = {
    variant: "ghost",
    px: 1,
    mx: 4,
    borderWidth: "3px",
    borderRadius: 0,
    borderTop: 0,
    borderLeft: 0,
    borderRight: 0,
    borderColor: "grey.900",
    color: "grey.900",
  };
  const navigate = useNavigate();
  const navigateTo = (location: string) => {
    navigate(location);
  };
  const handleClick = (clickedMenu: string) => {
    navigateTo(clickedMenu);
  };

  return (
    <Flex
      bgColor={"grey.300"}
      justifyContent={"space-between"}
      p="2"
      py="4"
    >
      <Box>
        <Button
          {...buttonStyles}
          variant={selectedMenu === "/" ? "selectedButton" : "ghost"}
          borderColor={selectedMenu === "/" ? "blue.400" : "grey.300"}
          onClick={() => {
            handleClick("/");
          }}
        >
          Home
        </Button>
        <Button
          onClick={() => {
            handleClick("/processedData");
          }}
          {...buttonStyles}
          variant={
            selectedMenu === "/processedData" ? "selectedButton" : "ghost"
          }
          borderColor={
            selectedMenu === "/processedData" ? "blue.400" : "grey.300"
          }
        >
          Processed
        </Button>
      </Box>
      <Box>
        <Button {...buttonStyles}>Perfil</Button>
        
      </Box>
    </Flex>
  );
};
