import React from "react";

import { MapComponentsProvider } from "@mapcomponents/react-core";
import { MapLibreMap, MlNavigationTools } from "@mapcomponents/react-maplibre";
import "./style.css";
import { createTheme, ThemeProvider } from "@mui/material/styles";

const theme = createTheme({});

const decorators = [
  (Story) => (
    <div className="fullscreen_map">
      <ThemeProvider theme={theme}>
        <MapComponentsProvider>
          <Story />
          <MapLibreMap
            mapId="map_1"
            options={{
              zoom: 14.5,
              style: "https://wms.wheregroup.com/tileserver/style/osm-bright.json",
              center: [7.0851268, 50.73884],
            }}
          />
          <MlNavigationTools
            mapId="map_1"/>
        </MapComponentsProvider>
      </ThemeProvider>
    </div>
  ),
];

export default decorators;
