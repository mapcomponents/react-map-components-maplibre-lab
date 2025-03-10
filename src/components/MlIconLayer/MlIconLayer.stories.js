import React, { useMemo, useEffect, useState, useContext, useRef } from "react";
import * as d3 from "d3";
import * as turf from "@turf/turf";
import MlIconLayer from "./MlIconLayer";
import getShipType from "./utils/getShipType.js";
import mapContextDecorator from "../../decorators/MapContextKlokantechBasicDecorator";
import {
  MapContext,
  MlWmsLayer,
  SimpleDataProvider,
} from "@mapcomponents/react-maplibre";
import TopToolbar from "../../ui_components/TopToolbar.tsx";
import Sidebar from "../../ui_components/Sidebar.tsx";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
} from "@mui/material";

const storyoptions = {
  title: "MapComponents/MlIconLayer",
  component: MlIconLayer,
  argTypes: {
    url: {},
    layer: {},
  },
  decorators: mapContextDecorator,
};
export default storyoptions;

const Template = (args) => {
  const mapContext = useContext(MapContext);
  const [timeParam, setTimeParam] = useState();
  const timeRef = useRef();

  const dataUrl = useMemo(
    () =>
      timeParam
        ? "https://meri.digitraffic.fi/api/ais/v1/locations?from=" + timeParam
        : "",
    [timeParam]
  );

  const increaseTimeParam = () => {
    setTimeParam(timeParam + 10);
  };

  const renewDataUrl = () => {
    setTimeout(increaseTimeParam, 10000);
  };

  useEffect(() => {
    if (mapContext.map) {
      mapContext.map.jumpTo({ center: [22.870581, 62.543826], zoom: 5.5 });
      setTimeParam(Math.floor(new Date().getTime()) - 5000);
    }
  }, [mapContext.map]);

  return (
    <>
      <SimpleDataProvider
        format="json"
        url={dataUrl}
        formatData={(d) => {
          timeRef.current = new Date().getTime();
          const props = d.properties;
          return {
            mmsi: props.mmsi,
            velocity: props.sog,
            navStat: d.properties.navStat,
            time_contact: props.timestampExternal,
            longitude: d.geometry?.coordinates[0],
            latitude: d.geometry?.coordinates[1],
            true_track: props.cog,
            accurancy: props.posAcc,
            interpolatePos: d3.geoInterpolate(
              [d.geometry?.coordinates[0], d.geometry?.coordinates[1]],
              d.geometry?.coordinates[0] === null
                ? [d.geometry?.coordinates[0], d.geometry?.coordinates[1]]
                : turf.transformTranslate(
                    turf.point([
                      d.geometry?.coordinates[0],
                      d.geometry?.coordinates[1],
                    ]),
                    props.sog * 5.14444444, //distance in meters over 10 sec
                    props.heading,
                    {
                      units: "meters",
                    }
                  ).geometry.coordinates
            ),
          };
        }}
        data_property="features"
        onData={renewDataUrl}
      >
        <MlIconLayer />
      </SimpleDataProvider>
      <MlWmsLayer
        url="https://openwms.statkart.no/skwms1/wms.dybdekurver_havomraader?"
        layerId="dybdekontur_oversiktsdata"
        urlParameters={{
          format: "image/png",
          layers: ["dybdekontur_oversiktsdata", "dybdekontur_label"],
          transparent: "true",
        }}
      />
    </>
  );
};

const CatalogueSidebar = ({ openSidebar, setOpenSidebar }) => {
  const mapContext = useContext(MapContext);
  const [timeParam, setTimeParam] = useState();
  const timeRef = useRef();

  const [sidebarInfo, setSidebarInfo] = useState({
    hoverInfo: {},
    vesselInfo: null,
  });

  const [showMovingVessels, setShowMovingvessels] = useState(true);
  const [showNotMovingVessels, setShowNotMovingVessels] = useState(true);
  const [selectedVessel, setSelectedVessel] = useState(null);

  const dataUrl = useMemo(
    () =>
      timeParam
        ? "https://meri.digitraffic.fi/api/ais/v1/locations?from=" + timeParam
        : "",
    [timeParam]
  );

  const increaseTimeParam = () => {
    setTimeParam(timeParam + 10);
  };

  const renewDataUrl = () => {
    setTimeout(increaseTimeParam, 10000);
  };

  useEffect(() => {
    if (mapContext.map) {
      mapContext.map.jumpTo({ center: [22.870581, 62.543826], zoom: 5.5 });
      setTimeParam(Math.floor(new Date().getTime()) - 5000);
    }
  }, [mapContext.map]);

  const resetSidebarInfo = () => {
    setSidebarInfo({
      hoverInfo: {},
      vesselInfo: null,
    });
  };

  useEffect(() => {
    if (!openSidebar) {
      resetSidebarInfo();
      setSelectedVessel(null);
    }
  }, [openSidebar]);

  const convertKnotsToKmh = (knots) => {
    return (knots * 1.852).toFixed(2);
  };

  return (
    <>
      <SimpleDataProvider
        format="json"
        url={dataUrl}
        formatData={(d) => {
          timeRef.current = new Date().getTime();
          const props = d.properties;
          return {
            mmsi: props.mmsi,
            velocity: props.sog,
            navStat: d.properties.navStat,
            time_contact: props.timestampExternal,
            longitude: d.geometry?.coordinates[0],
            latitude: d.geometry?.coordinates[1],
            true_track: props.cog,
            accurancy: props.posAcc,
            interpolatePos: d3.geoInterpolate(
              [d.geometry?.coordinates[0], d.geometry?.coordinates[1]],
              d.geometry?.coordinates[0] === null
                ? [d.geometry?.coordinates[0], d.geometry?.coordinates[1]]
                : turf.transformTranslate(
                    turf.point([
                      d.geometry?.coordinates[0],
                      d.geometry?.coordinates[1],
                    ]),
                    props.sog * 5.14444444, //distance in meters over 10 sec
                    props.heading,
                    {
                      units: "meters",
                    }
                  ).geometry.coordinates
            ),
          };
        }}
        data_property="features"
        onData={renewDataUrl}
      >
        <MlIconLayer
          setOpenSidebar={setOpenSidebar}
          setSidebarInfo={setSidebarInfo}
          showMovingVessels={showMovingVessels}
          showNotMovingVessels={showNotMovingVessels}
          selectedVessel={selectedVessel}
          setSelectedVessel={setSelectedVessel}
        />
      </SimpleDataProvider>

      <MlWmsLayer
        url="https://openwms.statkart.no/skwms1/wms.dybdekurver_havomraader?"
        layerId="dybdekontur_oversiktsdata"
        urlParameters={{
          format: "image/png",
          layers: ["dybdekontur_oversiktsdata", "dybdekontur_label"],
          transparent: "true",
        }}
      />

      <Sidebar open={openSidebar} setOpen={setOpenSidebar}>
        <Box sx={{ marginLeft: "15px", marginTop: "10px" }}>
          <Typography sx={{ fontSize: "1.2rem" }}>
            <b>Animated Layer</b>
          </Typography>
        </Box>
        <Box sx={{ marginLeft: "15px", marginTop: "40px", height: 120 }}>
          <Typography sx={{ fontSize: "1.1rem" }}>
            <b>Ship speed</b>
          </Typography>
          <Box
            sx={{ marginTop: "10px", display: "flex", flexDirection: "column" }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={showNotMovingVessels}
                  onChange={() =>
                    setShowNotMovingVessels(!showNotMovingVessels)
                  }
                  sx={{
                    color: "#009ee0",
                    "&.Mui-checked": {
                      color: "#009ee0",
                    },
                  }}
                />
              }
              label={
                <Typography sx={{ fontSize: "1.1rem" }}>
                  0 kn (0.00 km/h)
                </Typography>
              }
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={showMovingVessels}
                  onChange={() => setShowMovingvessels(!showMovingVessels)}
                  sx={{
                    color: "#009ee0",
                    "&.Mui-checked": {
                      color: "#009ee0",
                    },
                  }}
                />
              }
              label={
                <Typography sx={{ fontSize: "1.1rem" }}>
                  {" > 0.1 kn (0.185 km/h)"}
                </Typography>
              }
            />
          </Box>
        </Box>
        <Box sx={{ marginLeft: "15px", marginTop: "40px", height: 200 }}>
          <Typography sx={{ fontSize: "1.1rem" }}>
            <b>Selected ship information</b>
          </Typography>

          <Box sx={{ marginTop: "20px" }}>
            {sidebarInfo.hoverInfo && sidebarInfo.navStats ? (
              <>
                <Typography>
                  <b>MMSI: </b> {sidebarInfo.hoverInfo.object?.mmsi}
                </Typography>
                <Typography>
                  <b>Navigational Status: </b>
                  <br />
                  {sidebarInfo.hoverInfo.object?.navStat}:{" "}
                  {sidebarInfo.navStats[sidebarInfo.hoverInfo.object?.navStat]}
                </Typography>
                <Typography>
                  <b>Speed: </b> {sidebarInfo.hoverInfo.object?.velocity} kn (
                  {convertKnotsToKmh(sidebarInfo.hoverInfo.object?.velocity)}{" "}
                  km/h)
                </Typography>
                <Typography>
                  <b>Position accuracy: </b>
                  {sidebarInfo.hoverInfo.object?.accurancy ? "high" : "low"}
                </Typography>
              </>
            ) : (
              <Typography></Typography>
            )}

            {sidebarInfo.vesselInfo ? (
              <>
                <Typography>
                  <b>Name:</b> {sidebarInfo.vesselInfo.name || "--"}
                </Typography>
                <Typography>
                  <b>Callsign:</b> {sidebarInfo.vesselInfo.callSign || "--"}
                </Typography>
                <Typography>
                  <b>Destination:</b>{" "}
                  {sidebarInfo.vesselInfo.destination || "--"}
                </Typography>
                <Typography>
                  <b>Ship Type: </b>
                  {getShipType(sidebarInfo.vesselInfo.shipType) || "--"}
                </Typography>
              </>
            ) : (
              <Typography>No ship selected.</Typography>
            )}
          </Box>
        </Box>
      </Sidebar>
    </>
  );
};

const CatalogueTemplate = () => {
  const [openSidebar, setOpenSidebar] = useState(true);
  const handleToggleSidebar = () => {
    setOpenSidebar(!openSidebar);
  };

  return (
    <>
      <TopToolbar
        buttons={
          <Button
            variant={openSidebar ? "contained" : "outlined"}
            sx={{
              fontSize: "16px",
              marginRight: "30px",
              backgroundColor: openSidebar ? "#009ee0" : "transparent",
              color: openSidebar ? "#fff" : "#009ee0",
              borderColor: "#009ee0",
              "&:hover": {
                backgroundColor: openSidebar ? "#006e9c" : "#f5fbfe",
                borderColor: openSidebar ? "#006e9c" : "#009ee0",
              },
            }}
            onClick={handleToggleSidebar}
          >
            Sidebar
          </Button>
        }
        text={
          <Typography sx={{ fontSize: "1.1rem" }}>
            Ships on Baltic Sea
          </Typography>
        }
      >
        <Typography>Ships on Baltic Sea</Typography>
      </TopToolbar>
      <CatalogueSidebar
        openSidebar={openSidebar}
        setOpenSidebar={setOpenSidebar}
      />
    </>
  );
};

export const ExampleConfig = Template.bind({});
ExampleConfig.parameters = {};
ExampleConfig.args = {};

export const CatalogueDemo = CatalogueTemplate.bind({});
CatalogueDemo.parameters = {};
CatalogueDemo.args = {};
