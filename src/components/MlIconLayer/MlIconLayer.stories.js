import React, { useMemo, useEffect, useState, useContext, useRef } from "react";
import * as d3 from "d3";
import * as turf from "@turf/turf";

import MlIconLayer from "./MlIconLayer";

import mapContextDecorator from "../../decorators/MapContextKlokantechBasicDecorator";
import { MapContext, SimpleDataProvider } from "@mapcomponents/react-maplibre";

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
    // currently vv is used to prevent cache as time requires an opensky account
    () =>
      timeParam
        ? "https://meri.digitraffic.fi/api/ais/v1/locations?from=" + (timeParam)
        : "",
    [timeParam]
  );

  const plainDataUrl = "https://meri.digitraffic.fi/api/ais/v1/locations?mmsi=312691000";

  const increaseTimeParam = () => {
    setTimeParam(timeParam + 10);
  };

  const renewDataUrl = () => {
    setTimeout(increaseTimeParam, 10000);
  };

  useEffect(() => {
    if (mapContext.map) {
      //mapContext.map.setZoom(8.5);
      mapContext.map.jumpTo({ center: [22.870581, 62.543826], zoom:5.5 });
      setTimeParam(Math.floor(new Date().getTime()) - 5000);
    }
  }, [mapContext.map]);

  return (
    <SimpleDataProvider
      format="json"
      url={dataUrl}
      formatData={(d) => {        
        timeRef.current = new Date().getTime();
        const props = d.properties;
        return {
          mmsi: props.mmsi,
          velocity:props.sog,
          navStat: d.properties.navStat,
          //   callsign: d[1],
          //   time_contact: (d[3]?d[3]:d[4]),
          // time_contact: timeRef.current,        
          time_contact: props.timestampExternal,
          longitude: d.geometry?.coordinates[0],
          latitude: d.geometry?.coordinates[1],
          //   lon: d[5],
          //   lat: d[6],
          //   altitude: d[13],
          //   origin_country: d[2],
          true_track: props.cog,
          accurancy: props.posAcc,
          interpolatePos: d3.geoInterpolate(
            [d.geometry?.coordinates[0], d.geometry?.coordinates[1]],            
            d.geometry?.coordinates[0] === null
              ? [d.geometry?.coordinates[0], d.geometry?.coordinates[1]]
              : 
               turf.transformTranslate(
                  turf.point([
                    d.geometry?.coordinates[0],
                    d.geometry?.coordinates[1],
                  ]),
                  props.sog * 5.14444444 ,  //distance in meters over 10 sec
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
  );
};

export const ExampleConfig = Template.bind({});
ExampleConfig.parameters = {};
ExampleConfig.args = {};
