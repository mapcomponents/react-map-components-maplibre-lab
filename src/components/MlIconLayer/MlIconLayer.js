import React, { useRef, useMemo, useEffect, useState, useContext } from "react";
import * as d3 from "d3";

import { MapContext, SimpleDataContext } from "@mapcomponents/react-maplibre";
import DeckGlContext from "../../deckgl_components/DeckGlContext";

import { MapboxLayer } from "@deck.gl/mapbox";
import { IconLayer } from "@deck.gl/layers";

import Airplane from "./assets/airplane-icon.png";
import Cargo from "./assets/spaceship.png";
import DirectionsBoatIcon from "@mui/icons-material/DirectionsBoat";

const MlIconLayer = (props) => {
  // Use a useRef hook to reference the layer object to be able to access it later inside useEffect hooks
  // without the requirement of adding it to the dependency list (ignore the false eslint exhaustive deps warning)
  const mapContext = useContext(MapContext);
  const mapRef = useRef(null);
  const deckGlContext = useContext(DeckGlContext);
  const simpleDataContext = useContext(SimpleDataContext);
  const initializedRef = useRef(false);
  const layerName = "icondeckgl-layer";
  const currentFrame = useRef(null);
  const timer = useRef(null);
  const fetchEverySeconds = 10;
  const DeckMlLayerRef = useRef();

  const rawDataRef = useRef([]);
  const [data, setData] = useState([]);

  const [hoverInfo, setHoverInfo] = useState({});

  const startAnimation = () => {
    if (timer.current) {
      timer.current.stop();
    }
    currentFrame.current = 0;
    timer.current = d3.timer(animationFrame);
  };

  useEffect(() => {
    if (!simpleDataContext.data) {
      return;
    }
    //console.log(new Error().stack);
    rawDataRef.current = [...simpleDataContext.data];
       startAnimation();
  }, [simpleDataContext.data]);

  const deckLayerProps = useMemo(() => {
    return {
      id: layerName,
      type: IconLayer,
      data,
      pickable: true,
      iconAtlas: Cargo,
      iconMapping: {
        airplane: {
          x: 0,
          y: 0,
          width: 512,
          height: 512,
        },
        blue_airplane: {
          x: 512,
          y: 0,
          width: 512,
          height: 512,
        },
      },
      sizeScale: 20,
      autoHighlight: true,
      onHover: (d) => {       
        if (d.picked) {
          setHoverInfo(d);
        } else {
          setHoverInfo({});
        }
      },
      getPosition: (d) => [d.longitude, d.latitude],
      getIcon: (d) => {
        return d.origin_country === "Germany" ? "blue_airplane" : "airplane";
      },
      getAngle: (d) => -d.true_track,
    };
  }, [data]);

  const animationFrame = () => {
    if (!simpleDataContext.data) return;
    let airplanes_tmp = rawDataRef.current;
    let _timeNow = new Date().getTime();
    airplanes_tmp = airplanes_tmp.map((d) => {
      const [longitude, latitude] = d.interpolatePos(
        (_timeNow - d.time_contact * 1000) / 1000 / fetchEverySeconds
      );
      return {
        ...d,
        longitude,
        latitude,
      };
    });

    currentFrame.current += 1;
    setData(airplanes_tmp);
  };
  const cleanup = () => {
    // This is the cleanup function, it is called when this react component is removed from react-dom
    // try to remove anything this component has added to the MapLibre-gl instance
    // e.g.: remove the layer
    // mapContext.getMap(props.mapId).removeLayer(layerRef.current);
    if (timer.current) {
      timer.current.stop();
    }
    if (mapRef.current) {
      if (mapRef.current.style) {
        if (mapRef.current.getLayer(layerName)) {
          mapRef.current.removeLayer(layerName);
        }

        if (mapRef.current.getSource(layerName)) {
          mapRef.current.removeSource(layerName);
        }
      }

      mapRef.current = null;
    }
  };

  useEffect(() => {
    return cleanup;
  }, []);

  useEffect(() => {
    if (!DeckMlLayerRef.current) return;

    DeckMlLayerRef.current.deck.setProps({
      layers: [
        new IconLayer({
          ...deckLayerProps,
        }),
      ],
    });
  }, [deckLayerProps]);

  useEffect(() => {
    if (
      !simpleDataContext.data ||
      !mapContext.mapExists(props.mapId) ||
      initializedRef.current
    )
      return;

    initializedRef.current = true;
    mapRef.current = mapContext.getMap(props.mapId);

    // for debugging
    //window.DeckGlMapLibreLayer = deckGlContext.maplibreLayer;

    //deckGlContext.deckGl.setProps({
    //  layers: [
    //    new IconLayer({
    //      ...deckLayerProps,
    //    }),
    //  ],
    //});
    DeckMlLayerRef.current = new MapboxLayer({
      id: layerName,
      type: IconLayer,
      ...deckLayerProps,
      data: simpleDataContext.data,
    });

    window.mapBoxLayer = DeckMlLayerRef.current;

    mapRef.current.addLayer(DeckMlLayerRef.current, "poi_label");

    startAnimation();

    if (typeof props.onDone === "function") {
      props.onDone();
    }
  }, [mapContext.mapIds, mapContext, simpleDataContext.data]);

  function renderTooltip(info) {
    let { object, x, y } = info;
    if (!object) {
      return null;
    }

    return (
      <div
        className="tooltip"
        style={{
          zIndex: 1000,
          position: "fixed",
          padding: "8px",
          borderRadius: "4px",
          border: "1px solid rgba(12, 12, 120, .9)",
          backgroundColor: "rgba(12, 12, 120, .5)",
          color: "rgb(255, 255, 255)",
          opacity: 1,
          left: x,
          top: y,
          marginTop: "20px",
          marginLeft: "20px",
          display: "flex",
        }}
      >
        <div style={{ paddingRight: "10px" }}>
          MMSI:     
          {object.mmsi}
          <br />
          {object.navStat && (
            <>
              Navigational Status:
              <br />
              {object.navStat}
              <br />
            </>
          )}
          {object.origin_country && (
            <>
              Country:
              {object.origin_country}
              <br />
            </>
          )}
          Speed:
          {object.velocity} kn
        </div>
      </div>
    );
  }

  return <>{renderTooltip(hoverInfo)}</>;
};

export default MlIconLayer;
