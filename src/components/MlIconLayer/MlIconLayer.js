import React, { useRef, useMemo, useEffect, useState, useContext } from "react";
import * as d3 from "d3";

import { MapContext, SimpleDataContext } from "@mapcomponents/react-maplibre";

import { MapboxLayer } from "@deck.gl/mapbox";
import { IconLayer } from "@deck.gl/layers";

import DeckGlContext from "../../deckgl_components/DeckGlContext";
import getShipType from "./utils/getShipType";
import Ships from "./assets/Ships_v2.png";


const navStats = {
  0: "under way using engine",
  1: "at anchor",
  2: "not under command",
  3: "restricted maneuverability",
  4: "constrained by her draught",
  5: "moored",
  6: "aground",
  7: "engaged in fishing",
  8: "under way sailing",
  11: "power-driven vessel towing astern (regional use)",
  12: "power-driven vessel pushing ahead or towing alongside (regional use)",
  14: "AIS-SART (active), MOB-AIS, EPIRB-AIS",
  15: "default",
};

const MlIconLayer = ({
  setOpenSidebar,
  setSidebarInfo,
  showMovingVessels,
  showNotMovingVessels,
  ...props
}) => {
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

  const [selectedVessel, setSelectedVessel] = useState(null);
  const [hoverInfo, setHoverInfo] = useState({});
  const [vesselInfo, setVesselInfo] = useState();

  const getVesselInfo = (mmsi) => {
    fetch("https://meri.digitraffic.fi/api/ais/v1/vessels/" + mmsi)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setVesselInfo(data);
        setSidebarInfo({ hoverInfo, vesselInfo: data, navStats });
      })
      .catch((error) => {
        console.error(
          "There has been a problem with your fetch operation:",
          error
        );
      });
  };

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

  const onClickHandler = (ev) => {
    setOpenSidebar(true);
    getVesselInfo(ev.object.mmsi);
    setSelectedVessel(ev.object);
  };

  const deckLayerProps = useMemo(() => {
    return {
      id: layerName,
      type: IconLayer,
      data,
      pickable: true,
      iconAtlas: Ships,
      iconMapping: {
        moving: {
          x: 0,
          y: 0,
          width: 512,
          height: 512,
        },
        other: {
          x: 512,
          y: 0,
          width: 512,
          height: 512,
        },
        selected: {
          x: 1024,
          y: 0,
          width: 512,
          height: 512,
        },
      },
      sizeScale: 30,
      autoHighlight: true,
      onHover: (d) => {
        if (d.picked) {
          setVesselInfo(undefined);
          setHoverInfo(d);
        } else {
          setHoverInfo({});
        }
      },
      getPosition: (d) => [d.longitude, d.latitude],
      onClick: onClickHandler,
      getIcon: (d) => {
        if (
          (d.velocity === 0 && !showNotMovingVessels) ||
          (d.velocity > 1 && !showMovingVessels)
        ) {
          return null;
        }

        if (selectedVessel && d.mmsi === selectedVessel.mmsi) {
          return "selected";
        }
        return d.navStat === 0 ? "moving" : "other";
      },
      getAngle: (d) => -d.true_track,
      getTooltip: (d) => {
        if (
          (d.velocity === 0 && !showNotMovingVessels) ||
          (d.velocity > 1 && !showMovingVessels)
        ) {
          return null;
        }

        return renderTooltip(d);
      },
    };
  }, [
    data,
    selectedVessel,
    hoverInfo,
    vesselInfo,
    showMovingVessels,
    showNotMovingVessels,
  ]);

  const animationFrame = () => {
    if (!simpleDataContext.data) return;
    let airplanes_tmp = rawDataRef.current;
    let _timeNow = new Date().getTime();

    airplanes_tmp = airplanes_tmp.map((d) => {
      let trackPorcentage =
        (_timeNow - d.time_contact) / 1000 / fetchEverySeconds;

      const [longitude, latitude] = d.interpolatePos(trackPorcentage);
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

    // Adjusting the tooltip position at the edges of the screen
    const tooltipWidth = 300;
    const tooltipHeight = 200;

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    if (x + tooltipWidth > screenWidth) {
      x = screenWidth - tooltipWidth - 20;
    }

    if (y + tooltipHeight > screenHeight) {
      y = screenHeight - tooltipHeight - 20;
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
          <b>MMSI:</b>
          {object.mmsi}
          <br />
          <>
            <b>Navigational Status:</b>
            <br />
            {object.navStat}: {navStats[object.navStat]}
            <br />
          </>
          {object.origin_country && (
            <>
              Country:
              {object.origin_country}
              <br />
            </>
          )}
          <b>Speed: </b>
          {object.velocity} kn (
          {Math.round(object.velocity * 1.852 * 100) / 100} km/h)
          <br />
          <b>Position accuracy: </b>
          {object.accurancy ? "high" : "low"}
          <br />
          <br />
          {!vesselInfo ? (
            <b>click on ship to get more info...</b>
          ) : (
            <>
              <b>Name:</b>
              <br />
              {vesselInfo.name}
              <br />
              <b>Callsign:</b>
              <br />
              {vesselInfo.callSign}
              <br />
              <b>Destination:</b>
              <br />
              {vesselInfo.destination}
              <br />
              <b>Ship type:</b>
              <br />
              {getShipType(vesselInfo.shipType)}
            </>
          )}
        </div>
      </div>
    );
  }

  return <>{renderTooltip(hoverInfo)}</>;
};

export default MlIconLayer;
