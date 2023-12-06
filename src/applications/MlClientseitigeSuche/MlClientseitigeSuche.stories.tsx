import React, { useState } from "react";

import MlClientseitigeSuche from "./MlClientseitigeSuche";

import mapContextWorldDecorator from "../../decorators/MapContextWorldDecorator";
import { TopToolbar, Sidebar } from "@mapcomponents/react-maplibre";
import { Button } from "@mui/material";

const storyoptions = {
  title: "Applications/MlClientseitigeSuche",
  component: MlClientseitigeSuche,
  argTypes: {},
  decorators: mapContextWorldDecorator,
};
export default storyoptions;

const Template = () => {
  const [openSidebar, setOpenSidebar] = useState(true);
  return (
    <>
      <TopToolbar
        buttons={
          <>
            <Button
              variant={openSidebar ? "contained" : "outlined"}
              onClick={() => setOpenSidebar(!openSidebar)}
              sx={{ marginRight: { xs: "0px", sm: "10px" } }}
            >
              Search
            </Button>
          </>
        }
      />
      <Sidebar
        open={openSidebar}
        setOpen={setOpenSidebar}
        name={"Client-side search across countries in the world"}
      >
        <MlClientseitigeSuche />
      </Sidebar>
    </>
  );
};

export const ExampleConfig = Template.bind({});
ExampleConfig.parameters = {};
ExampleConfig.args = {};
