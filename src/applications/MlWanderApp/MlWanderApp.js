import React from "react";
import TopToolbar from "../../ui_components/TopToolbar";
import {
  MlLayerMagnify,
  MlGpxViewer,
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
          mapId={props.wmsLayerMapId}
          urlParameters={{ layers: "" }}
        />
      </TopToolbar>

      <GeoJsonProvider>
        <MlGpxViewer mapId="map_1" />
        <MlSpatialElevationProfile mapId={props.wmsLayerMapId} />
      </GeoJsonProvider>
      <MlLayerMagnify
        map1Id="map_1"
        map2Id={props.wmsLayerMapId}
        magnifierRadius={100}
      />
    </>
  );
};

export default MlWanderApp;
