import React, { useRef, useEffect, useState, useContext } from "react";
import * as d3 from "d3";
import * as turf from "@turf/turf";

import MlIconLayer from "./MlIconLayer";

import mapContextDecorator from "../../decorators/MapContextKlokantechBasicDecorator";
import { MapContext, SimpleDataProvider } from "@mapcomponents/react-core";

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
  const [dataUrl, setDataUrl] = useState("");

  const renewDataUrl = () => {
    setTimeout(() => {
      setDataUrl("https://opensky-network.org/api/states/all?vv=" + Math.random());
    }, 10000);
  };

  useEffect(() => {
    if (mapContext.map) {
      mapContext.map.setZoom(8.5);
      setDataUrl("https://opensky-network.org/api/states/all?vv=" + Math.random());
    }
  }, [mapContext.map]);

  return (
    <SimpleDataProvider
      format="json"
      url={dataUrl}
      formatData={(d) => {
        return ({
        callsign: d[1],
        lon: d[5],
        lat: d[6],
        longitude: d[5],
        latitude: d[6],
        velocity: d[9],
        altitude: d[13],
        origin_country: d[2],
        true_track: d[10],
        interpolatePos: d3.geoInterpolate(
          [d[5], d[6]],
          (d[5] === null ? [d[5], d[6]]:turf.transformTranslate(turf.point([d[5], d[6]]), d[9]*5, d[10],{'units':'meters'}).geometry.coordinates)
        ),
      });
      }}
      data_property="states"
      onData={renewDataUrl}
    >
      <MlIconLayer />
    </SimpleDataProvider>
  );
};

export const ExampleConfig = Template.bind({});
ExampleConfig.parameters = {};
ExampleConfig.args = {};
