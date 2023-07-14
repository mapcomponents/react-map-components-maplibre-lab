import React, { useState } from "react";
import mapContextDecorator from "../../decorators/MapContextDecorator";
import {
  Button,
  MenuItem,
  Slider,
  Typography,
  createTheme,
  ThemeProvider,
} from "@mui/material";
import {
  TopToolbar,
  Sidebar,
  useCameraFollowPath,
  MlGeoJsonLayer,
} from "@mapcomponents/react-maplibre";

import MlDeckGlTerrainLayer from "./MlDeckGlTerrainLayer";

const theme = createTheme({
  palette: {
    primary: {
      main: "#009EE0",
    },
    secondary: { main: "#747577" },
    text: {
      primary: "#000",
      contrast: "#fff",
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "#fff",
        },
      },
    },
  },
});

const storyoptions = {
  title: "MapComponents/MlDeckGlTerrainLayer",
  component: MlDeckGlTerrainLayer,
  argTypes: {
    options: {
      control: {
        type: "object",
      },
    },
  },
  decorators: mapContextDecorator,
};
export default storyoptions;

const routeJson = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "LineString",
    coordinates: [
      [11.200688, 47.427417],
      [9.874942, 47.215719],
    ],
  },
};

const marks = [
  {
    value: 8,
    label: "8",
  },
  {
    value: 9,
    label: "9",
  },
  {
    value: 10,
    label: "10",
  },
  {
    value: 11,
    label: "11",
  },
  {
    value: 12,
    label: "12",
  },
  {
    value: 13,
    label: "13",
  },
];

const Template = (args) => {
  const [state, setState] = useState({
    pause: true,
    zoom: 11,
    speed: 20,
    pitch: 60,
  });

  const CameraFollowPath = useCameraFollowPath({
    route: routeJson,
    pause: state.pause,
    pitch: state.pitch,
    zoom: state.zoom,
    speed: state.speed,
  });

  const [showRoute, setShowRoute] = useState(true);
  const [showLayer, setShowLayer] = useState(true);
  const [openSidebar, setOpenSidebar] = useState(true);

  return (
    <>
      <ThemeProvider theme={theme}>
        {showLayer ? <MlDeckGlTerrainLayer /> : null}
        {showRoute ? (
          <MlGeoJsonLayer
            geojson={routeJson}
            type="line"
            paint={{
              "line-width": 2,
              "line-color": "blue",
            }}
          />
        ) : null}
        <TopToolbar
          buttons={
            <>
              <Button
                variant={showLayer ? "contained" : "outlined"}
                onClick={() => setShowLayer(!showLayer)}
                sx={{
                  marginRight: { xs: "0px", sm: "10px" },
                  marginBottom: { xs: "5px", sm: "00px" },
                }}
              >
                Terrain Layer
              </Button>
              <Button
                variant={openSidebar ? "contained" : "outlined"}
                onClick={() => setOpenSidebar(!openSidebar)}
                sx={{ marginRight: { xs: "0px", sm: "10px" } }}
              >
                Camera Settings
              </Button>
            </>
          }
        />
        <Sidebar
          open={openSidebar}
          setOpen={setOpenSidebar}
          name={"Camera Settings"}
        >
          <MenuItem onClick={() => setShowRoute(!showRoute)}>
            <Typography>
              {showRoute ? "Route ausblenden" : "Route einblenden"}
            </Typography>
          </MenuItem>

          <MenuItem
            disabled={!state.pause}
            onClick={() =>
              setState((current) => {
                return { ...current, pause: false };
              })
            }
          >
            <Typography>Start</Typography>
          </MenuItem>
          <MenuItem
            disabled={state.pause}
            onClick={() =>
              setState((current) => {
                return { ...current, pause: true };
              })
            }
          >
            <Typography>Pause</Typography>
          </MenuItem>
          <MenuItem
            onClick={() => {
              setState((current) => {
                return { ...current, pause: true, pitch: 60, zoom: 11, speed: 20 };
              });
              setTimeout(() => {
                CameraFollowPath.reset();
              }, 50);
            }}
          >
            <Typography>Reset</Typography>
          </MenuItem>
          <MenuItem>
            <Typography
              id="discrete-slider"
              style={{ color: "#121212", marginLeft: "10px", marginRight: "10px" }}
            >
              Zoom:
            </Typography>
            <Slider
              value={state.zoom}
              onChange={(ev, value) => {
                setState((current) => {
                  return { ...current, zoom: value };
                });
              }}
              getAriaValueText={(value) => value}
              aria-labelledby="discrete-slider"
              //valueLabelDisplay="auto"
              step={1}
              marks={marks}
              min={8}
              max={13}
              sx={{
                marginTop: "20px",
                paddingBottom: "20px",
                marginRight: "10px",
                maxWidth: "200px",
              }}
            />
          </MenuItem>
          <MenuItem>
            <Typography
              id="discrete-slider2"
              style={{ color: "#121212", marginLeft: "10px", marginRight: "10px" }}
            >
              Speed:
            </Typography>
            <Slider
              value={state.speed}
              onChange={(ev, value) => {
                setState((current) => {
                  return { ...current, speed: value };
                });
              }}
              getAriaValueText={(value) => value}
              aria-labelledby="discrete-slider2"
              //valueLabelDisplay="auto"
              step={5}
              marks
              min={1}
              max={60}
              sx={{
                marginRight: "10px",
                maxWidth: "200px",
              }}
            />
          </MenuItem>
          <MenuItem
            onClick={() => {
              if (state.pitch === 0) {
                setState((current) => {
                  return { ...current, pitch: 60 };
                });
              } else {
                setState((current) => {
                  return { ...current, pitch: 0 };
                });
              }
            }}
          >
            {state.pitch === 0 ? "3D" : "2D"}
          </MenuItem>
        </Sidebar>
      </ThemeProvider>
    </>
  );
};

export const ExampleConfig = Template.bind({});
ExampleConfig.parameters = {};
