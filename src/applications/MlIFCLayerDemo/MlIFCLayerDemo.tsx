import { useState } from "react";
import type { LngLatLike } from "maplibre-gl";
import { ThreeProvider } from "./contexts/ThreeProvider";
import IfcViewer from "./components/IfcViewer";
import CssBaseline from "@mui/material/CssBaseline";

function MlIFCLayerDemo() {
  // Anchors the Three.js world matrix at the model's latitude for correct metric scale
  const [refCenter, setRefCenter] = useState<LngLatLike | undefined>(undefined);

  return (
    <>
      <CssBaseline />
      <div style={{ position: "absolute", inset: 0 }}>
        <ThreeProvider mapId="map_1" id="three-scene-layer" refCenter={refCenter}>
          <IfcViewer onModelLocated={setRefCenter} />
        </ThreeProvider>
      </div>
      </>
  );
}

export default MlIFCLayerDemo;
