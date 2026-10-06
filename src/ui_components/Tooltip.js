import React from "react";

const tooltipStyle = {
  position: "fixed",
  top: "100px",
  left: "100px",
  zIndex: 100000,
};

export default function Tooltip(props) {
  return <div style={tooltipStyle}>tooltip</div>;
}
