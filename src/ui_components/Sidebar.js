import React from "react";
import Drawer from "@mui/material/Drawer";
import { styled } from "@mui/material/styles";

const StyledDrawer = styled(Drawer)(() => ({
  flexGrow: 1,
  zIndex: 90,
  position: "absolute",
  top: 0,
  left: 0,
  bottom: 0,
  backgroundColor: "#fafafa",
  "& .MuiDrawer-paper": {
    position: "static",
    display: "flex",
    alignItems: "stretch",
    alignContent: "stretch",
    flexDirection: "column",
    padding: "90px 10px 10px 23px",
    boxSizing: "border-box",
    minWidth: "150px",
  },
}));

export default function Sidebar(props) {
  return (
    <StyledDrawer variant="persistent" anchor="left" open={true}>
      {props.children}
    </StyledDrawer>
  );
}
