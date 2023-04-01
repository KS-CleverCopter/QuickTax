import { Box,useStyleConfig, useToast } from "@chakra-ui/react";

import { ReactNode } from "react";

export const GrayBox = ({
  children,
  props,
}: {
  children: ReactNode;
  props: any;
}) => {
  const { variant, ...rest } = props;
  
  const styles = useStyleConfig("GrayBox", { variant: "rounded" });
  return (
    <Box
    {...styles}
      {...rest}
      bgColor={ "grey.300"}
    >
      {children}
    </Box>
  );
};

export const ShowToast = (success: boolean, title: string, msg: string) => {
  const toast = useToast();
  toast({
    title,
    description: msg,
    status: success ? "success" : "error",
    duration: 5000,
    isClosable: true,
    position: "top",
  });
};
