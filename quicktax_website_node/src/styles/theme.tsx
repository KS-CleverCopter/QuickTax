import { extendTheme} from "@chakra-ui/react";

export const customTheme = extendTheme({
  styles: {
    global: {
      "html, body": {
        fontFamily: "Roboto, Helvetica, Arial",
        fontSize: "14px",
        padding: 0,
        margin: 0,
        bg: "white",
        color: "grey.900",
      },
    },
  },
  colors: {
    grey: {
      100: "#fff",
      200: "#FAFAFF",
      300: "#EFEFF8",
      400: "#D4D4D9",
      500: "#3E3E40",
      600: "#252526",
      700: "#1B1B1C",
      900: "#000000",
    },
    blue: {
      300: "#6695FF",
      400: "#3372FF",
      500: "#004FFF",
    },
  },
  components: {
    Button: {
      baseStyle: {
        fontFamily: "Roboto-Medium",
        fontWeight: "normal",
        fontSize: "12px",
      },
      variants: {
        selectedButton: {
          borderRadius: "0",
          borderColor: "blue.400",
          borderWidth: "3px",
          borderTop: 0,
          borderLeft: 0,
          borderRight: 0,
        },
      },
    },
    Input: {
      variants: {
        standardVariant: {
          field: {
            bgColor: "white",
            color: "grey.900",
            borderColor: "grey.400",
            borderWidth: "1px",
          },
        },
      },
      defaultProps: {
        variant: "standardVariant",
      },
    },
    GrayBox: {
      baseStyle: {
        p: 4,
        m: 4,
        bgColor: "grey.300",
      },
      variants: {
        rounded: {
          borderRadius: "12px",
        },
      },
      defaultProps: {
        variant: "rounded",
      },
    },
    Modal:{
      baseStyle: () => ({
        dialog: {
          bg: "#fff"
        }
      })
    }
  },
});
