import React from "react";
import DashboardPage from "./MlDemoDashboard.js";
import { MapLibreMap, MlFillExtrusionLayer } from "@mapcomponents/react-maplibre";
import mapContextDecorator from "../../decorators/MapContextDashboardDecorator";
import { SimpleDataProvider } from "@mapcomponents/react-core";
import "./style.css";

const storyoptions = {
  title: "Applications/MlDemoDashboard",
  component: DashboardPage,
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

const Template = (args) => (
  <>
    <DashboardPage>
      <MapLibreMap
        options={{
          //style: "mapbox://styles/mapbox/light-v10",
          //center: [-87.62712, 41.89033],
          zoom: 14.5,
          //pitch: 45,
          style: "https://wms.wheregroup.com/tileserver/style/osm-bright.json",
          //style:"https://wms.wheregroup.com/tileserver/style/osm-liberty.json",
          //center: [8.607, 53.1409349],
          //          zoom: 13,
          center: [7.0851268, 50.73884],
          //          maxBounds: [
          //            [1.40625, 43.452919],
          //            [17.797852, 55.973798],
          //          ],
        }}
      />
      <SimpleDataProvider format="json" url="/assets/laerm_points.json">
        <MlFillExtrusionLayer
          paint={{
            "fill-extrusion-color": "hsl(30, 30, 30)",
          }}
          minZoom={13}
        />
      </SimpleDataProvider>
    </DashboardPage>
  </>
);

export const ExampleConfig = Template.bind({});
ExampleConfig.parameters = {};
