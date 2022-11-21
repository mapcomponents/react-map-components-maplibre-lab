import React, { useEffect, useContext, useState } from "react";

import MlLaermkarte from "./MlLaermkarte";
import { MlFillExtrusionLayer } from "@mapcomponents/react-maplibre";
import { useMap, SimpleDataProvider, useCameraFollowPath } from "@mapcomponents/react-maplibre";
import DeckGlProvider from "../../deckgl_components/DeckGlProvider";

//import mapContext3DDecorator from "../../decorators/MapContext3DDecorator";
import mapContextDecorator from "../../decorators/MapContextKlokantechBasicDecorator";

const storyoptions = {
  title: "Applications/MlLaermkarte",
  component: MlLaermkarte,
  argTypes: {
    url: {},
    layer: {},
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
      [7.10942788610961, 50.708209240168],
      [7.10966149846967, 50.7088867160122],
      [7.10910082880551, 50.7108256986007],
      [7.10856352037736, 50.7126945974813],
      [7.1083532692533, 50.7142598002937],
      [7.10814301812924, 50.7160118929942],
      [7.10793276700518, 50.7169463424345],
      [7.10776923835314, 50.7176004570426],
      [7.10713848498096, 50.718838602551],
      [7.10699831756492, 50.7199599418793],
      [7.106900786313568, 50.72118132611057],
    ],
  },
};

const Template = (args) => {
  const mapHook = useMap({mapId: "map_1"});

  const CameraFollowPath = useCameraFollowPath({
    route: routeJson,
    pause: false,
    pitch: 60,
    zoom: 15,
    speed: 1,
  });

  useEffect(() => {
    if (!mapHook) return;
   CameraFollowPath.play();
  }, [mapHook]);

  return (
    <>
      <DeckGlProvider>
        <SimpleDataProvider format="json" url="assets/laerm_points.json">
          <MlLaermkarte />
        </SimpleDataProvider>
      </DeckGlProvider>
    </>
  );
};

export const ExampleConfig = Template.bind({});
ExampleConfig.parameters = {};
ExampleConfig.args = {};
