import React, { useState } from "react";
import MlCameraFollowPath from "../MlCameraFollowPath/MlCameraFollowPath";
import TopToolbar from "../../ui_components/TopToolbar";
import mapContextDecorator from "../../decorators/MapContextDecorator";
import { Button, Slider, Typography } from "@mui/material";
import { MlGeoJsonLayer, MlNavigationTools } from "@mapcomponents/react-maplibre";

import MlDeckGlTerrainLayer from "./MlDeckGlTerrainLayer";

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
    speed: 10,
    pitch: 60,
  });

  const CameraFollowPath = MlCameraFollowPath({
    route: routeJson,
    pause: state.pause,
    pitch: state.pitch,
    zoom: state.zoom,
    speed: state.speed,
  });

  const [showComponent, setShowComponent] = useState(true);

  return (
    <>
      <TopToolbar>
        <MlDeckGlTerrainLayer />
        <Button onClick={() => setShowComponent(!showComponent)}>
          {showComponent ? "Route ausblenden" : "Route einblenden"}
        </Button>
        {showComponent ? (
          <MlGeoJsonLayer
            geojson={routeJson}
            type="line"
            paint={{
              "line-width": 2,
              "line-color": "blue",
            }}
          />
        ) : null}
        <Button
          disabled={!state.pause}
          onClick={() =>
            setState((current) => {
              return { ...current, pause: false };
            })
          }
        >
          Start
        </Button>
        <Button
          disabled={state.pause}
          onClick={() =>
            setState((current) => {
              return { ...current, pause: true };
            })
          }
        >
          Pause
        </Button>
        <Button
          onClick={() => {
            CameraFollowPath.reset();
            setState((current) => {
              return { ...current, pause: true, pitch: 60, zoom: 13, speed: 10 };
            });
          }}
        >
          Reset
        </Button>
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
          step={1}
          marks
          min={1}
          max={20}
          sx={{
            marginRight: "10px",
            maxWidth: "200px",
          }}
        />
        <Button
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
        </Button>
      </TopToolbar>
      <MlNavigationTools />
    </>
  );
};

export const ExampleConfig = Template.bind({});
ExampleConfig.parameters = {};
