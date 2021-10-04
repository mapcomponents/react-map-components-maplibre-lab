import React, { useContext, useEffect, useState } from "react";
import { MapContext } from "react-map-components-core";
import { MlWmsLayer } from "react-map-components-maplibre";
import * as turf from "@turf/turf";

const MlAerialPhotograph = () => {
  const mapContext = useContext(MapContext);
  const [legendData, setLegendData] = useState({
    name: "",
    class: "",
    x: "",
    y: "",
    z: "",
  });

  useEffect(() => {
    if (!mapContext.map) return;

    mapContext.map.transform._maxZoom = 19.99;

    mapContext.map.addSource("featuredGeometrySource", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [],
      },
    })

    mapContext.map.addLayer({
      id: "mapData",
      source: "openmaptiles",
      "source-layer": "water",
      type: "fill",
      paint: {
        "fill-opacity": 0,
      },
    });

    mapContext.map.addLayer({
      id: "greenData",
      source: "openmaptiles",
      "source-layer": "landcover",
      type: "fill",
      paint: {
        "fill-opacity": 0,
      },
    });

    mapContext.map.addLayer({
      id: "placeData",
      source: "openmaptiles",
      "source-layer": "poi",
      type: "circle",
      filter: ["has", "name"],
      paint: {
        "circle-opacity": 0,
        "circle-radius": {
          stops: [
            [0, 0],
            [20, 500],
          ],
          base: 2,
        },
      },
    });

    mapContext.map.addLayer({
      id: "riverData",
      source: "openmaptiles",
      type: "line",
      "source-layer": "waterway",
      filter: ["==", "class", "river"],
      paint: {
        "line-opacity": 0,
        "line-width": {
          stops: [
            [0, 0],
            [20, 500],
          ],
          base: 2,
        },

      },
    });

    mapContext.map.on("click", function (e) {
      let features = mapContext.map.queryRenderedFeatures(e.point, {
        layers: ["mapData", "greenData", "placeData", "riverData"],
      });
      let closestFeature = getClosestFeature(features, Object.values(e.point));

      if (features[0] && closestFeature.id !== mapContext.map.getSource("featuredGeometrySource")._data.id) {
        setLegendData({
          name: closestFeature.properties.name,
          class: closestFeature.properties.class,
          x: closestFeature._vectorTileFeature._x,
          y: closestFeature._vectorTileFeature._y,
          z: closestFeature._vectorTileFeature._z,
        });

        if(mapContext.map.getLayer("featuredGeometry")){
          mapContext.map.removeLayer("featuredGeometry")
        }
        let layerType = closestFeature.layer.type
        let layerTypeStyle = closestFeature.layer.paint
        layerTypeStyle[layerType +"-opacity"] = 0.35
        layerTypeStyle[layerType +"-color"] = "#dfbb33"

        mapContext.map.addLayer({
          id: "featuredGeometry",
          source: "featuredGeometrySource",
          type: layerType,
          paint: layerTypeStyle,
        });
        mapContext.map.getSource("featuredGeometrySource").setData(closestFeature)
      } else {
        mapContext.map.removeLayer("featuredGeometry")
        mapContext.map.getSource("featuredGeometrySource").setData({id: 333333})
      }
    });
  }, [mapContext.map]);

  function getClosestFeature(featureCollection, mousePoint, identifier) {
    identifier = identifier || true;
    let closestFeature = featureCollection[0];
    for (let i in featureCollection) {
      if (featureCollection[i].layer["source-layer"] === identifier) {
        if (
          turf.distance(turf.center(featureCollection[i]), mousePoint) >
          turf.distance(turf.center(closestFeature), mousePoint)
        ) {
          closestFeature = featureCollection[i];
        }
      }
    }
    return closestFeature;
  }

  return (
    <>
      <MlWmsLayer
        url="https://www.wms.nrw.de/geobasis/wms_nw_dop"
        layer="nw_dop_rgb"
        sourceOptions={{ maxzoom: 20 }}
        belowLayerId="waterway-name"
      />
      <div style={{ paddingLeft: 0, fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', paddingTop: "10px"}}>
        {legendData.name} {legendData.class && "(" + legendData.class + ")"}
      </div>
    </>
  );
}; //"Roboto", "Helvetica", "Arial", sans-serif;

export default MlAerialPhotograph;
