import React, { useMemo, useEffect, useState, useContext } from "react";
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

const navStats = {
    "0": "under way using engine",
    "1": "at anchor",
    "2": "not under command",
    "3": "restricted maneuverability",
    "4": "constrained by her draught",
    "5": "moored",
    "6": "aground",
    "7": "engaged in fishing",
    "8": "under way sailing",
    "9": "reserved for future amendment of navigational status for ships carrying DG, HS, or MP, or IMO hazard or pollutant category C, high speed craft (HSC)",
    "10": "reserved for future amendment of navigational status for ships carrying dangerous goods (DG), harmful substances (HS) or marine pollutants (MP), or IMO hazard or pollutant category A, wing in ground (WIG)",
    "11": "power-driven vessel towing astern (regional use)",
    "12": "power-driven vessel pushing ahead or towing alongside (regional use)",
    "13": "reserved for future use",
    "14": "AIS-SART (active), MOB-AIS, EPIRB-AIS",
    "15": "default"
  }
  
const Template = (args) => {
  const mapContext = useContext(MapContext);
  const [timeParam, setTimeParam] = useState();

  const dataUrl = useMemo(
    // currently vv is used to prevent cache as time requires an opensky account
    () =>
      timeParam
        ? "https://meri.digitraffic.fi/api/ais/v1/locations?from=" + timeParam
        : "",
    [timeParam]
  );

  const plainDataUrl= "https://meri.digitraffic.fi/api/ais/v1/locations"
 
  const increaseTimeParam = () => {
    setTimeParam(timeParam + 10);
  };

  const renewDataUrl = () => {
    setTimeout(increaseTimeParam, 10000);
  };

  useEffect(() => {
    if (mapContext.map) {
      //mapContext.map.setZoom(8.5);
      mapContext.map.jumpTo({center: [20.247363, 58.873056] , zoom: 5})
      setTimeParam(Math.floor(new Date().getTime() / 1000) - 5);
    }
  }, [mapContext.map]);

  return (
    <SimpleDataProvider
      format="json"
      url={plainDataUrl}
      formatData={(d) => {   
       
        const props =  d.properties; 
        return {
          mmsi: props.mmsi,
          velocity: d.properties.sog,
          navStat: navStats[d.properties.navStat],
        //   callsign: d[1],
        //   time_contact: (d[3]?d[3]:d[4]),
           time_contact: props.timestamp,
           longitude: d.geometry?.coordinates[0],
           latitude: d.geometry?.coordinates[1],
        //   lon: d[5],
        //   lat: d[6],             
        //   altitude: d[13],
        //   origin_country: d[2],
          true_track: props.cog,
          interpolatePos: d3.geoInterpolate(
            [d.geometry?.coordinates[0], d.geometry?.coordinates[1]],
            d.geometry?.coordinates[0] === null
              ? [d.geometry?.coordinates[0], d.geometry?.coordinates[1]]
              : turf.transformTranslate(turf.point([d.geometry?.coordinates[0], d.geometry?.coordinates[1]]), props.sog /360, props.cog, {
                  units: "nauticalmiles",
                }).geometry.coordinates
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
