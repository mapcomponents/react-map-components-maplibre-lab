import React, { useState, useEffect, useCallback } from "react";
import elasticlunr from "elasticlunr";
import index from "./searchIndex.json";
import { SearchContextInterface } from "./searchContext.js";
import * as turf from "@turf/turf";
import { MlGeoJsonLayer, useMap } from "@mapcomponents/react-maplibre";

const SearchContext = React.createContext<SearchContextInterface>(
  {} as SearchContextInterface
);

const SearchContextProvider = ({ children }: { children: React.ReactNode }) => {
  var url = window.location.origin;

  const [searchIndex, setSearchIndex] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState<string | undefined>(undefined);
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [selectedResult, setSelectedResult] = useState<string>();
  const [featureCollection, setFeatureCollection] = useState<any | undefined>(
    undefined
  );
  const [feature, setFeature] = useState<any | undefined>(undefined);

  const mapHook = useMap({
    mapId: undefined,
  });

  const getBoundingBox = (geometry: any): turf.BBox => {
    if ("coordinates" in geometry && geometry.coordinates.length === 2) {
      geometry = turf.buffer(geometry, 0.03, {
        units: "kilometers",
      });
    }
    return turf.bbox(geometry);
  };

  const loadFeatureCollection = useCallback(() => {
    fetch(url + "/assets/world-administrative-boundaries-countries.geojson")
      .then((res) => {
        if (!res.ok) {
          throw new Error();
        }
        return res.json();
      })
      .then((data) => {
        setFeatureCollection(data);
      });
  }, []);

  useEffect(() => {
    loadFeatureCollection();
  }, [loadFeatureCollection]);

  useEffect(() => {
    // @ts-ignore
    const loadedIndex = elasticlunr.Index.load(index);
    setSearchIndex(loadedIndex);
  }, []);

  useEffect(() => {
    if (searchTerm && searchIndex && featureCollection) {
      let results = searchIndex.search(searchTerm.toString(), {
        fields: {
          COUNTRY: { expand: true },
        },
        expand: true,
      });

      let maxResults = 10;

      let resultsLimited = results
        .filter((result: any) => result !== undefined)
        .slice(0, maxResults)
        .map((result: any) => {
          const countryName = searchIndex.documentStore.getDoc(
            result.ref
          ).COUNTRY;
          searchIndex.documentStore;
          const name = countryName.toString();
          return name;
        });
      setSearchResults(resultsLimited);
    }
  }, [searchTerm, searchIndex]);

  useEffect(() => {
    if (featureCollection && mapHook.map) {
      featureCollection.features.forEach(
        (feature: {
          geometry(geometry: any): unknown;
          properties: { preferred_term: string | undefined };
        }) => {
          if (feature.properties.preferred_term === selectedResult) {
            setFeature(feature);
            let bbox = getBoundingBox(feature.geometry);
            // @ts-ignore
            mapHook.map.fitBounds(bbox);
          }
        }
      );
    }
  }, [selectedResult, featureCollection, mapHook.map]);

  const value = {
    searchTerm,
    setSearchTerm,
    searchResults,
    setSearchResults,
    selectedResult,
    setSelectedResult,
  };

  return (
    <>
      <SearchContext.Provider value={value}> {children}</SearchContext.Provider>
      {feature && <MlGeoJsonLayer geojson={feature} />}
    </>
  );
};

export { SearchContextProvider };
export default SearchContext;
