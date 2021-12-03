import React, { useContext, useEffect, useState } from "react";
import { MapContext } from "@mapcomponents/react-core";
import { MlWmsLayer } from "@mapcomponents/react-malibre";
import * as turf from "@turf/turf";
import Button from "@mui/material/Button";

const MlAerialPhotograph = () => {
  const mapContext = useContext(MapContext);
  const [legendData, setLegendData] = useState({
    name: "",
    class: "",
  });

  const layerIds = [
      "mapData",
      "greenData",
      "placeData",
      "riverData"
  ]

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

    layerIds.forEach((el, id) => {
      mapContext.map.on("mouseenter", el, function(){
        mapContext.map.getCanvas().style.cursor = "pointer"
      })

      mapContext.map.on("mouseleave", el, function(){
        mapContext.map.getCanvas().style.cursor = ""
      })
    })

    mapContext.map.on("click", function (e) {
      let features = mapContext.map.queryRenderedFeatures(e.point, {
        layers: ["mapData", "greenData", "placeData", "riverData"],
      });

      let closestFeature = getClosestFeature(features, Object.values(e.point));

      if (features[0]) {
        setLegendData({
          name: closestFeature.properties.name,
          class: closestFeature.properties.class,
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
      {legendData.class &&
      <Button onClick={() => {
        if (!mapContext.map) return;

        mapContext.map.removeLayer("featuredGeometry")
        mapContext.map.getSource("featuredGeometrySource").setData({id: ""})
        setLegendData({
          name: "",
          class: ""
        })
      }} variant={"outlined"} style={{marginTop: "20px"}}>Clear Selection</Button>
      }
    </>
  );
}; //"Roboto", "Helvetica", "Arial", sans-serif;

export default MlAerialPhotograph;
