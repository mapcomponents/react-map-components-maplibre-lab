import * as THREE from 'three';
import { LngLatLike } from 'maplibre-gl';
import {
	useIfcModel,
	IfcModelTransform,
	IfcSiteLocation,
	IfcElementInfo,
	IfcElementProperty,
} from './useIfcModel';

/**
 * MlIfcLayer - Renders IFC (Industry Foundation Classes) 3D models on the MapLibreMap
 *
 * @component
 *
 * @example
 * ```tsx
 * <MlIfcLayer
 *   url="assets/IFC/building.ifc"
 *   position={[7.1, 50.7]}
 *   transform={{ scale: 1, rotation: { x: Math.PI / 2, y: 0, z: 0 } }}
 * />
 * ```
 */

export interface MlIfcLayerProps {
	/** URL to the IFC file */
	url: string;
	/** Geographic position [lng, lat] where the model should be placed */
	position?: LngLatLike;
	/** Transform options for the model (scale, rotation, position offset) */
	transform?: IfcModelTransform;
	/** If true, use the IFCSITE location from the IFC file instead of the position prop */
	useIfcPosition?: boolean;
	/** Source CRS used to reproject projected coordinates when the file declares none */
	sourceCrs?: string;
	/** Callback called before the model starts loading */
	init?: () => void;
	/** Callback called when the model is loaded, includes extracted site location if available */
	onDone?: (siteLocation?: IfcSiteLocation) => void;
	/** Callback called when Web-IFC cannot load or parse the model */
	onError?: (error: Error) => void;
	/** Optional map ID */
	mapId?: string;
	/** Enable element picking by clicking on elements */
	enablePicking?: boolean;
	/** Callback when an element is picked */
	onElementPicked?: (element: IfcElementInfo | null) => void;
	/** Callback when an element is hovered */
	onElementHovered?: (element: IfcElementInfo | null) => void;
	/** IFC properties to load and return when an element is selected */
	elementProperties?: IfcElementProperty[];
	/** Show geometry below the ground plane */
	showUnderground?: boolean;
	/** Clipping planes for section cuts */
	clippingPlanes?: THREE.Plane[];
	/** Express ID of the selected element */
	highlightedExpressId?: number;
	/** Express ID of the hovered element */
	hoveredExpressId?: number;
}

const MlIfcLayer = (props: MlIfcLayerProps) => {
	const {
		url,
		position,
		transform,
		useIfcPosition,
		sourceCrs,
		init,
		onDone,
		onError,
		enablePicking,
		onElementPicked,
		onElementHovered,
		elementProperties,
		showUnderground,
		clippingPlanes,
		highlightedExpressId,
		hoveredExpressId,
	} = props;

	useIfcModel({
		url,
		position,
		transform,
		useIfcPosition,
		sourceCrs,
		init,
		onDone,
		onError,
		enablePicking,
		onElementPicked,
		onElementHovered,
		elementProperties,
		showUnderground,
		clippingPlanes,
		highlightedExpressId,
		hoveredExpressId,
	});

	return null;
};

export default MlIfcLayer;
export type { IfcModelTransform, IfcSiteLocation, IfcElementInfo, IfcElementProperty };
