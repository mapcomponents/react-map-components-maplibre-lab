import * as CommonSelectors from "@mapbox/mapbox-gl-draw";
import doubleClickZoom from "@mapbox/mapbox-gl-draw";
import * as Constants from "@mapbox/mapbox-gl-draw";
import isEventAtCoordinates from "@mapbox/mapbox-gl-draw";
import createVertex from "@mapbox/mapbox-gl-draw";

const CustomPolygonMode = {};

CustomPolygonMode.onSetup = function () {
    console.log("Change mode: custom polygon");

    const polygon = this.newFeature({
        type: Constants.geojsonTypes.FEATURE,
        properties: {},
        geometry: {
            type: Constants.geojsonTypes.POLYGON,
            coordinates: [[]],
        },
    });

    this.addFeature(polygon);

    this.clearSelectedFeatures();
    doubleClickZoom.disable(this);
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    this.activateUIButton(Constants.types.POLYGON);
    this.setActionableState({
        trash: true,
    });

    return {
        polygon,
        currentVertexPosition: 0,
    };
};

CustomPolygonMode.clickAnywhere = function (state, e) {
    if (
        state.currentVertexPosition > 0 &&
        isEventAtCoordinates(
            e,
            state.polygon.coordinates[0][state.currentVertexPosition - 1]
        )
    ) {
        return this.changeMode("custom_select", {
            featureIds: [state.polygon.id],
        });
    }
    this.updateUIClasses({ mouse: Constants.cursors.ADD });
    state.polygon.updateCoordinate(
        `0.${state.currentVertexPosition}`,
        e.lngLat.lng,
        e.lngLat.lat
    );
    state.currentVertexPosition++;
    state.polygon.updateCoordinate(
        `0.${state.currentVertexPosition}`,
        e.lngLat.lng,
        e.lngLat.lat
    );

    this.map.fire(Constants.events.CREATE, {
        features: [state.polygon.toGeoJSON()],
    });
};

CustomPolygonMode.clickOnVertex = function (state) {
    return this.changeMode("custom_select", {
        featureIds: [state.polygon.id],
    });
};

CustomPolygonMode.onMouseMove = function (state, e) {
    state.polygon.updateCoordinate(
        `0.${state.currentVertexPosition}`,
        e.lngLat.lng,
        e.lngLat.lat
    );

    if (CommonSelectors.isVertex(e)) {
        this.updateUIClasses({ mouse: Constants.cursors.POINTER });
    }
};

CustomPolygonMode.onTap = CustomPolygonMode.onClick = function (state, e) {
    if (CommonSelectors.isVertex(e)) return this.clickOnVertex(state, e);
    return this.clickAnywhere(state, e);
};

CustomPolygonMode.onKeyUp = function (state, e) {
    if (CommonSelectors.isEscapeKey(e)) {
        this.deleteFeature([state.polygon.id], { silent: true });
        this.changeMode("custom_select");
    } else if (CommonSelectors.isEnterKey(e)) {
        this.changeMode("custom_select", {
            featureIds: [state.polygon.id],
        });
    }
};

CustomPolygonMode.onStop = function (state) {
    this.updateUIClasses({ mouse: Constants.cursors.NONE });
    doubleClickZoom.enable(this);
    this.activateUIButton();

    // check to see if we've deleted this feature
    if (this.getFeature(state.polygon.id) === undefined) return;

    //remove last added coordinate
    state.polygon.removeCoordinate(`0.${state.currentVertexPosition}`);
    if (state.polygon.isValid()) {
        this.map.fire(Constants.events.CREATE, {
            features: [state.polygon.toGeoJSON()],
        });
    } else {
        this.deleteFeature([state.polygon.id], { silent: true });
        this.changeMode("custom_select", {}, { silent: true });
    }
};

CustomPolygonMode.toDisplayFeatures = function (state, geojson, display) {
    const isActivePolygon = geojson.properties.id === state.polygon.id;
    geojson.properties.active = isActivePolygon
        ? Constants.activeStates.ACTIVE
        : Constants.activeStates.INACTIVE;
    if (!isActivePolygon) return display(geojson);

    // Don't render a polygon until it has two positions
    // (and a 3rd which is just the first repeated)
    if (geojson.geometry.coordinates.length === 0) return;

    const coordinateCount = geojson.geometry.coordinates[0].length;
    // 2 coordinates after selecting a draw type
    // 3 after creating the first point
    if (coordinateCount < 3) {
        return;
    }
    geojson.properties.meta = Constants.meta.FEATURE;
    display(
        createVertex(
            state.polygon.id,
            geojson.geometry.coordinates[0][0],
            "0.0",
            false
        )
    );
    if (coordinateCount > 3) {
        // Add a start position marker to the map, clicking on this will finish the feature
        // This should only be shown when we're in a valid spot
        const endPos = geojson.geometry.coordinates[0].length - 3;
        display(
            createVertex(
                state.polygon.id,
                geojson.geometry.coordinates[0][endPos],
                `0.${endPos}`,
                false
            )
        );
    }
    if (coordinateCount <= 4) {
        // If we've only drawn two positions (plus the closer),
        // make a LineString instead of a Polygon
        const lineCoordinates = [
            [
                geojson.geometry.coordinates[0][0][0],
                geojson.geometry.coordinates[0][0][1],
            ],
            [
                geojson.geometry.coordinates[0][1][0],
                geojson.geometry.coordinates[0][1][1],
            ],
        ];
        // create an initial vertex so that we can track the first point on mobile devices
        display({
            type: Constants.geojsonTypes.FEATURE,
            properties: geojson.properties,
            geometry: {
                coordinates: lineCoordinates,
                type: Constants.geojsonTypes.LINE_STRING,
            },
        });
        if (coordinateCount === 3) {
            return;
        }
    }
    // render the Polygon
    return display(geojson);
};

CustomPolygonMode.onTrash = function (state) {
    this.deleteFeature([state.polygon.id], { silent: true });
    this.changeMode("custom_select");
};

export default CustomPolygonMode;
