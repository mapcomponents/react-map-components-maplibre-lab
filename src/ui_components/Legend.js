import React from "react";
import Drawer from "@mui/material/Drawer";
import { styled } from "@mui/material/styles";

const StyledDrawer = styled(Drawer)(() => ({
  boxShadow: "0px 2px 3px 2px rgb(0,0,0, .4)",
  flexGrow: 1,
  zIndex: 110,
  position: "absolute",
  top: "100px",
  left: 0,
  height: "275px",
  backgroundColor: "#aecaec",
  "& .MuiDrawer-paper": {
    position: "static",
    display: "flex",
    alignItems: "stretch",
    alignContent: "stretch",
    flexDirection: "column",
    padding: "10px 10px 10px 10px",
    boxSizing: "border-box",
    minWidth: "170px",
    width: "200px",
  },
}));

export default function Legend(props) {
  return (
    <StyledDrawer variant="persistent" anchor={"left"} open={true}>
      {props.children}
    </StyledDrawer>
  );
}
