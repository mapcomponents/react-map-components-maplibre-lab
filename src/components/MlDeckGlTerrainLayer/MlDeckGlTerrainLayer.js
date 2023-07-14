import React from "react";
import { MapboxLayer } from "@deck.gl/mapbox";
import { TerrainLayer } from "@deck.gl/geo-layers";
import { MlBasicComponent } from "@mapcomponents/react-maplibre";

/**
 * MlDeckGlTerrainLayer adds kepler.gl layer to the maplibre-gl instance.
 */
const MlDeckGlTerrainLayer = () => {
  const layerName = "deckgl-terrain-layer";

  const ELEVATION_DECODER = {
    rScaler: 6553.6,
    gScaler: 25.6,
    bScaler: 0.1,
    offset: -10000,
  };

  const TERRAIN_IMAGE = `https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWF4dG9iaSIsImEiOiJjaW1rcWQ5bWMwMDJvd2hrbWZ2ZTBhcnM5In0.NcGt5NmLP5Q1WC7P5u6qUA`;
  const SURFACE_IMAGE = `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.png?access_token=pk.eyJ1IjoibWF4dG9iaSIsImEiOiJjaW1rcWQ5bWMwMDJvd2hrbWZ2ZTBhcnM5In0.NcGt5NmLP5Q1WC7P5u6qUA`;

  const cleanup = (map) => {
    if (map && map.style && map.getLayer(layerName)) {
      map.removeLayer(layerName);
    }
  };

  const mapIsReady = (map) => {
    console.log("Hallo ");
    map.addLayer(
      new MapboxLayer({
        id: layerName,
        type: TerrainLayer,
        minZoom: 0,
        maxZoom: 23,
        strategy: "no-overlap",
        elevationDecoder: ELEVATION_DECODER,
        elevationData: TERRAIN_IMAGE,
        texture: SURFACE_IMAGE,
        wireframe: false,
        color: [255, 255, 255],
      }),
      "water-name-lakeline"
    );
  };

  return (
    <>
      <MlBasicComponent cleanup={cleanup} mapIsReady={mapIsReady}></MlBasicComponent>
    </>
  );
};

export default MlDeckGlTerrainLayer;
