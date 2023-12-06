import React from "react";
import { SearchContextProvider } from "./lib/SearchContext";
import SearchForm from "./lib/SearchForm";

interface MlClientseitigeSucheProps {
  /**
   * Id of the target MapLibre instance in mapContext
   */
  mapId?: string;
}

export type { MlClientseitigeSucheProps };

/**
 * Component template
 *
 */

const MlClientseitigeSuche = () => {
  return (
    <>
      <SearchContextProvider>
        <SearchForm />
      </SearchContextProvider>
    </>
  );
};

MlClientseitigeSuche.defaultProps = {
  mapId: undefined,
};
export default MlClientseitigeSuche;
