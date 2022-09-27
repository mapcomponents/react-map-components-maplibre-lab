import React, { useEffect, useCallback, useRef, useState } from "react";

import * as turf from "@turf/turf";
import { useMap } from "@mapcomponents/react-maplibre/";

const MlCameraFollowPath = (props) => {
  // Use a useRef hook to reference the layer object to be able to access it later inside useEffect hooks
  // without the requirement of adding it to the dependency list (ignore the false eslint exhaustive deps warning)
  const initializedRef = useRef(false);
  const clearIntervalRef = useRef(false);

  const pause = useRef(false);
  const reset = useRef(false);
  const step = useRef(1);
  const zoomInTo = useRef(18);
  const targetPitch = useRef(false);

  var timer;
  var zoom = 14;
  var zoomSteps = 0.04;

  const mapHook = useMap({
    mapId: props.mapId,
    waitForLayer: props.insertBeforeLayer,
  });

  useEffect(() => {
    pause.current = !props.play;
  }, [props.play]);
  useEffect(() => {
    zoomInTo.current = props.zoomInTo;
  }, [props.zoomInTo]);
  useEffect(() => {
    reset.current = props.reset;
  }, [props.reset]);
  useEffect(() => {
    targetPitch.current = props.targetPitch;
  }, [props.targetPitch]);


  const disableInteractivity = useCallback(() => {
    if (!mapHook.map) return;
    mapHook.map.map["scrollZoom"].disable();
    mapHook.map.map["boxZoom"].disable();
    mapHook.map.map["dragRotate"].disable();
    mapHook.map.map["dragPan"].disable();
    mapHook.map.map["keyboard"].disable();
    mapHook.map.map["doubleClickZoom"].disable();
    mapHook.map.map["touchZoomRotate"].disable();
  }, [mapHook.map]);
  const enableInteractivity = useCallback(() => {
    if (!mapHook.map) return;
    mapHook.map.map["scrollZoom"].enable();
    mapHook.map.map["boxZoom"].enable();
    mapHook.map.map["dragRotate"].enable();
    mapHook.map.map["dragPan"].enable();
    mapHook.map.map["keyboard"].enable();
    mapHook.map.map["doubleClickZoom"].enable();
    mapHook.map.map["touchZoomRotate"].enable();
  }, [mapHook.map]);

  const centerRoute = () => {
    if (!mapHook.map || !props.route) return;
    var bbox = turf.bbox(props.route);
    var bounds;
    if (bbox && bbox.length > 3) {
      bounds = [
        [bbox[0], bbox[1]],
        [bbox[2], bbox[3]],
      ];
      mapHook.map.map.fitBounds(bounds, { padding: 100 });
    }
  };

  const zoomInPlay = () => {
    if (!mapHook.map) return;
    if (mapHook.map.map.getZoom() !== zoom) {
      mapHook.map.map.setZoom(zoom);
    }
    while (zoom < zoomInTo.current) {
      zoom = zoom + zoomSteps;
      mapHook.map.map.setZoom(zoom);
    }
    while (zoom > zoomInTo.current) {
      zoom = zoom - zoomSteps;
      mapHook.map.map.setZoom(zoom);
    }
    //mapHook.map.map.easeTo({pitch:60 });
    disableInteractivity();
  };

  const pitch = () => {
    if (!mapHook.map) return;
    if (targetPitch.current) {
        mapHook.map.map.setPitch(60 );
      }else{
          mapHook.map.map.setPitch( 0 );
      }
  };

 /* useEffect(() => {
    if (!mapHook.map) return;
    if (targetPitch.current) {
        mapHook.map.map.setPitch(60 );
      }else{
          mapHook.map.map.setPitch( 0 );
      }
  }, [props.targetPitch]);
 */
  useEffect(() => {
    if (!mapHook.map) return;
    if (reset.current) {
      window.clearInterval(timer);
      step.current = 1;
      initializedRef.current = false;
      reset.current = false;
      }
  }, [props.reset]);
 

  useEffect(() => {
    return () => {
      clearIntervalRef.current = true;
      // This is the cleanup function, it is called when this react component is removed from react-dom
      // try to remove anything this component has added to the MapLibre-gl instance
      // e.g.: remove the layer
      // mapHook.map.getMap(props.mapId).removeLayer(layerRef.current);
    };
  }, []);
  
  
  useEffect(() => {
    if (!mapHook.map || !props.route) return;
    if (initializedRef.current) return;
    // the MapLibre-gl instance (mapHook.map.map) is accessible here
    // initialize the layer and add it to the MapLibre-gl instance or do something else with it
    initializedRef.current = true;

    var kmPerStep = props.kmPerStep || 0.01;
    var routeDistance = turf.lineDistance(props.route);
    var stepDuration = props.stepDuration || 70;
   
    centerRoute();

    timer = window.setInterval(function () {
      if (clearIntervalRef.current) {
        window.clearInterval(timer);
      }
      if (!pause.current) {
        zoomInPlay();
        pitch();

        var alongRoute = turf.along(props.route, step.current * kmPerStep).geometry
          .coordinates;

        if (step.current * kmPerStep < routeDistance) {
          mapHook.map.map.panTo(alongRoute, {
            bearing: turf.bearing(
              turf.point([
                mapHook.map.map.getCenter().lng,
                mapHook.map.map.getCenter().lat,
              ]),
              turf.point(alongRoute)
            ),
            duration: stepDuration,
            essential: true,
          }); 
          step.current++;
          console.log("PAN MOVE");
        } else { 
          enableInteractivity();
          console.log("ENABLE CONTROLS");
          window.clearInterval(timer);
          //initializedRef.current = false;
          mapHook.map.map.setPitch(0);
          centerRoute();
        }
      } else {
        enableInteractivity(); 
      }
    }, stepDuration);
  }, [
    mapHook.mapId,
    mapHook.map,
    props,
    disableInteractivity,
    enableInteractivity,
    props.route,
  ]);

  return <></>;
};

export default MlCameraFollowPath;
