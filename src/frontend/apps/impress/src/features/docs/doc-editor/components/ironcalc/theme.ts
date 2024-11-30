import { createTheme } from "@mui/material/styles";
//import "./fonts.css";

export const theme = createTheme({
  typography: {
    fontFamily: "Inter",
  },
  palette: {
    common: {
      black: "#272525",
      white: "#FFF",
    },
    primary: {
      main: "#F2994A",
      light: "#EFAA6D",
      dark: "#D68742",
      contrastText: "#FFF",
    },
    secondary: {
      main: "#2F80ED",
      light: "#4E92EC",
      dark: "#2B6EC8",
      contrastText: "#FFF",
    },
    error: {
      main: "#EB5757",
      light: "#E77A7A",
      dark: "#CB4C4C",
      contrastText: "#FFF",
    },
    warning: {
      main: "#F2C94C",
      light: "#EED384",
      dark: "#D6B244",
      contrastText: "#FFF",
    },
    info: {
      main: "#9E9E9E",
      light: "#E0E0E0",
      dark: "#757575",
      contrastText: "#FFF",
    },
    success: {
      main: "#27AE60",
      light: "#57BD82",
      dark: "#239152",
      contrastText: "#FFF",
    },
    grey: {
      "50": "#F2F2F2",
      "100": "#F5F5F5",
      "200": "#EEEEEE",
      "300": "#E0E0E0",
      "400": "#BDBDBD",
      "500": "#9E9E9E",
      "600": "#757575",
      "700": "#616161",
      "800": "#424242",
      "900": "#333333",
      A100: "#F2F2F2",
      A200: "#EEEEEE",
      A400: "#bdbdbd",
      A700: "#616161",
    },
  },
});
