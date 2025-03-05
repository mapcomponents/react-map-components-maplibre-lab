import React from "react";

import {
  MapComponentsProvider,
  MlScaleReference,
  MapLibreMap,
} from "@mapcomponents/react-maplibre";
import "./style.css";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Paper } from "@mui/material";

const theme = createTheme({});

const decorators = [
  (Story) => (
    <div className="fullscreen_map">
      <ThemeProvider theme={theme}>
        <MapComponentsProvider>
          <Paper
            sx={{
              position: "fixed",
              bottom: "40px",
              right: "20px",
              zIndex: 1300,
            }}
          >
            <MlScaleReference />
          </Paper>
          <Story />
          <MapLibreMap
            options={{
              //style: "mapbox://styles/mapbox/light-v10",
              //center: [-87.62712, 41.89033],
              zoom: 14.5,
              //pitch: 45,
              style:
                "https://wms.wheregroup.com/tileserver/style/klokantech-basic.json",
              //style:"https://wms.wheregroup.com/tileserver/style/osm-liberty.json",
              //center: [8.607, 53.1409349],
              //          zoom: 13,
              center: [7.0851268, 50.73884],
              //          maxBounds: [
              //            [1.40625, 43.452919],
              //            [17.797852, 55.973798],
              //          ],
            }}
          />
        </MapComponentsProvider>
      </ThemeProvider>
    </div>
  ),
];

export default decorators;
