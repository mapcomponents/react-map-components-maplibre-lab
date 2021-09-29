import React from "react";

import MlMobilerImker from "./MlMobilerImker";
import Legend from "../../ui_components/Legend";
import mapContextDecorator from "../../decorators/MapContextDecorator";

const storyoptions = {
  title: "MapComponents/MlMobilerImker",
  component: MlMobilerImker,
  argTypes: {
    url: {},
    layer: {},
  },
  decorators: mapContextDecorator,
};
export default storyoptions;

const Template = (args) => {
  return (
    <>
      <Legend>
        <MlMobilerImker />
      </Legend>
    </>
  );
};

export const ExampleConfig = Template.bind({});
ExampleConfig.parameters = {};
ExampleConfig.args = {};
