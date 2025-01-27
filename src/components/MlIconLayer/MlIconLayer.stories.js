import React, { useMemo, useEffect, useState, useContext, useRef } from "react";
import * as d3 from "d3";
import * as turf from "@turf/turf";
import MlIconLayer from "./MlIconLayer";
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

      <Sidebar open={openSidebar} setOpen={setOpenSidebar}>
        <Box sx={{ marginLeft: "15px", marginTop: "10px" }}>
          <Typography sx={{ fontSize: "1.5rem" }}>Animated Layer</Typography>
        </Box>
        <Box sx={{ marginLeft: "15px", marginTop: "40px", height: 120 }}>
          <Typography sx={{ fontSize: "1.1rem" }}>
            <b>Ship speed</b>
          </Typography>
          <Box
            sx={{ marginTop: "10px", display: "flex", flexDirection: "column" }}
          >
            <FormControlLabel
              control={<Checkbox />}
              label={
                <Typography sx={{ fontSize: "1.1rem" }}>
                  0 kn (0.00 km/h)
                </Typography>
              }
            />
            <FormControlLabel
              control={<Checkbox />}
              label={
                <Typography sx={{ fontSize: "1.1rem" }}>
                  {" > 1 kn (1.85 km/h)"}
                </Typography>
              }
            />
          </Box>
        </Box>
        <Box sx={{ marginLeft: "15px", marginTop: "40px", height: 200 }}>
          <Typography sx={{ fontSize: "1.1rem" }}>
            <b>Selected ship information</b>
          </Typography>
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
            variant={openSidebar ? "contained" : "outlined"} // Der Button-Variant ändert sich je nach Sidebar-Status
            sx={{
              backgroundColor: openSidebar ? "#009EE0" : undefined,
              fontSize: "1.2rem",
              fontFamily: "sans-serif",
              mr: "10px",
            }}
            onClick={handleToggleSidebar} // Klick-Handler zum Öffnen/Schließen der Sidebar
          >
            Tools
          </Button>
        }
        text={
          <Typography fontFamily="sans-serif" sx={{ fontSize: "1.2rem" }}>
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
