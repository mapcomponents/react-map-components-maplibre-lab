import React from "react";

import MlIFCLayerDemo from "./MlIFCLayerDemo";
import mapContextDecorator from "../../decorators/MapContextDecorator";

const storyoptions = {
  title: "Applications/MlIFCLayerDemo",
  component: MlIFCLayerDemo,
  decorators: mapContextDecorator,
};

export default storyoptions;

const Template = (args) => <MlIFCLayerDemo {...args} />;

export const ExampleConfig = Template.bind({});
ExampleConfig.parameters = {};
ExampleConfig.args = {};
