import React from "react";
import TopToolbar from "../../ui_components/TopToolbar";
import {
  MlLayerMagnify,
  MlGPXViewer,
  MlSpatialElevationProfile,
  MlWmsLayer,
  GeoJsonProvider,
} from "@mapcomponents/react-maplibre";

const MlWanderApp = (props) => {
  return (
    <>
      <TopToolbar>
        <MlWmsLayer
          url="https://www.wms.nrw.de/geobasis/wms_nw_dop?language=ger&bbox={bbox-epsg-3857}"
          layer="nw_dop_rgb"
          sourceOptions={{
            maxzoom: 24,
          }}
          mapId="map_2"
        />
      </TopToolbar>

      <GeoJsonProvider>
        <MlGPXViewer mapId="map_1" />
        <MlSpatialElevationProfile mapId="map_2" />
      </GeoJsonProvider>
      <MlLayerMagnify map1Id="map_1" map2Id="map_2" magnifierRadius={30} />
    </>
  );
};

export default MlWanderApp;
