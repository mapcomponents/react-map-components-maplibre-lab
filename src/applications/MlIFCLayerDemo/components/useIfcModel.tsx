import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { LngLatLike, MercatorCoordinate } from 'maplibre-gl';
import { useThree } from '../contexts/ThreeContext';
import {
	extractGeoreferencing,
	computeGeometryBounds,
	resolveCrs,
	reprojectToWgs84,
	isProjectedCoordinate,
	getStoreyGroundShift,
	readMapConversion,
	mapConversionLocalToProjected,
	GeoreferencingMethod,
} from '../lib/IfcGeoreferencing';
import { GROUND_OCCLUDER_SIZE } from '../config/ifcGeoConfig';

// ThreejsUtils helper - position conversion
const toScenePosition = (
	worldMatrixInv: THREE.Matrix4,
	lngLat: LngLatLike,
	altitude: number
): THREE.Vector3 => {
	let lng: number, lat: number;
	if (Array.isArray(lngLat)) {
		[lng, lat] = lngLat;
	} else if ('lng' in lngLat) {
		lng = lngLat.lng;
		lat = lngLat.lat;
	} else {
		lng = (lngLat as any).lon;
		lat = (lngLat as any).lat;
	}

	const mercator = MercatorCoordinate.fromLngLat([lng, lat], altitude);
	const worldPos = new THREE.Vector3(mercator.x, mercator.y, mercator.z);
	return worldPos.applyMatrix4(worldMatrixInv);
};

export interface IfcModelTransform {
	rotation?: { x: number; y: number; z: number };
	scale?: { x: number; y: number; z: number } | number;
	position?: { x: number; y: number; z: number };
}

export interface IfcSiteLocation {
	latitude: number;
	longitude: number;
	elevation: number;
	/** Horizontal rotation from IfcMapConversion, in radians. */
	rotation?: number;
	/** CRS used to reproject the location; undefined when read from RefLat/Long */
	crs?: string;
	/** Whether the CRS was declared inside the IFC file */
	crsFromFile?: boolean;
	/** Which IFC source provided the location */
	method?: GeoreferencingMethod;
}

export interface IfcElementInfo {
	expressId: number;
	type: string;
	attributes: Record<string, unknown>;
}

export interface UseIfcModelProps {
	url: string;
	position?: LngLatLike;
	transform?: IfcModelTransform;
	init?: () => void;
	onDone?: (siteLocation?: IfcSiteLocation) => void;
	useIfcPosition?: boolean;
	/** Source CRS used to reproject projected coordinates when the file declares none */
	sourceCrs?: string;
	enablePicking?: boolean;
	onElementPicked?: (element: IfcElementInfo | null) => void;
	onElementHovered?: (element: IfcElementInfo | null) => void;
	clippingPlanes?: THREE.Plane[];
	highlightedExpressId?: number;
	hoveredExpressId?: number;
}

/**
 * Recursively dispose of Three.js object resources
 */
const disposeObject = (obj: THREE.Object3D): void => {
	if ((obj as any).geometry) {
		(obj as any).geometry.dispose();
	}
	if ((obj as any).material) {
		const material = (obj as any).material;
		if (Array.isArray(material)) {
			material.forEach((m) => m.dispose());
		} else {
			material.dispose();
		}
	}
	if ('dispose' in obj && typeof (obj as any).dispose === 'function') {
		(obj as any).dispose();
	}
};

/**
 * Hook to manage loading, transforming, and rendering an IFC model
 */
export const useIfcModel = (props: UseIfcModelProps) => {
	const { 
		url, 
		position, 
		transform, 
		init, 
		onDone, 
		useIfcPosition = false,
		sourceCrs,
		enablePicking = false,
		onElementPicked,
		onElementHovered,
		clippingPlanes = [],
		highlightedExpressId,
		hoveredExpressId,
	} = props;
	const { scene, worldMatrixInv, camera, renderer } = useThree();
	const [model, setModel] = useState<THREE.Group | undefined>(undefined);
	const [siteLocation, setSiteLocation] = useState<IfcSiteLocation | undefined>(undefined);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | undefined>(undefined);
	const modelRef = useRef<THREE.Group | undefined>(undefined);
	const ifcApiRef = useRef<any>(null);
	const modelIdRef = useRef<number | null>(null);

	const initRef = useRef(init);
	const onDoneRef = useRef(onDone);
	initRef.current = init;
	onDoneRef.current = onDone;

	const sourceCrsRef = useRef(sourceCrs);
	sourceCrsRef.current = sourceCrs;

	const webIfcRef = useRef<any>(null);
	const geometryBoundsRef = useRef<
		{ easting: number; northing: number; baseHeight: number } | undefined
	>(undefined);
	const occluderRef = useRef<THREE.Mesh | undefined>(undefined);

	const transformRef = useRef({ position, transform, useIfcPosition });
	transformRef.current = { position, transform, useIfcPosition };

	const worldMatrixInvRef = useRef(worldMatrixInv);
	worldMatrixInvRef.current = worldMatrixInv;

	// Readiness flag so re-anchoring (new worldMatrixInv) repositions without reloading geometry
	const worldMatrixReady = Boolean(worldMatrixInv);

	const updateModelTransform = useCallback(
		(
			object: THREE.Group,
			currentWorldMatrixInv: THREE.Matrix4 | undefined,
			ifcLocation?: IfcSiteLocation
		) => {
			const {
				position: currentPosition,
				transform: currentTransform,
				useIfcPosition: useIfc,
			} = transformRef.current;

			// Determine the map position to use
			let mapPosition: LngLatLike | undefined = currentPosition;
			if (useIfc && ifcLocation) {
				mapPosition = [ifcLocation.longitude, ifcLocation.latitude];
			}

			console.log('[IFC Transform] useIfc:', useIfc);
			console.log('[IFC Transform] mapPosition:', mapPosition);
			console.log('[IFC Transform] currentWorldMatrixInv:', !!currentWorldMatrixInv);

			if (mapPosition && currentWorldMatrixInv) {
				const scenePos = toScenePosition(currentWorldMatrixInv, mapPosition, 0);
				console.log('[IFC Transform] scenePos:', scenePos);
				object.position.set(scenePos.x, scenePos.y, scenePos.z);

				if (currentTransform?.position) {
					object.position.x += currentTransform.position.x;
					object.position.y += currentTransform.position.y;
					object.position.z += currentTransform.position.z;
				}

				// Keep the ground occluder centered on the model at ground level (z=0)
				if (occluderRef.current) {
					occluderRef.current.position.set(object.position.x, object.position.y, 0);
					occluderRef.current.updateMatrixWorld(true);
				}
			}

			if (currentTransform?.rotation) {
				object.rotation.set(
					currentTransform.rotation.x,
					currentTransform.rotation.y + (ifcLocation?.rotation ?? 0),
					currentTransform.rotation.z
				);
			}

			if (currentTransform?.scale) {
				if (typeof currentTransform.scale === 'number') {
					object.scale.set(currentTransform.scale, currentTransform.scale, currentTransform.scale);
				} else {
					object.scale.set(
						currentTransform.scale.x,
						currentTransform.scale.y,
						currentTransform.scale.z
					);
				}
			}

			object.updateMatrixWorld(true);
		},
		[]
	);

	const cleanup = useCallback(() => {
		if (modelRef.current && scene) {
			scene.remove(modelRef.current);
			modelRef.current.traverse(disposeObject);
			disposeObject(modelRef.current);
			modelRef.current = undefined;
			setModel(undefined);
		}
		if (occluderRef.current && scene) {
			scene.remove(occluderRef.current);
			occluderRef.current.geometry.dispose();
			(occluderRef.current.material as THREE.Material).dispose();
			occluderRef.current = undefined;
		}
	}, [scene]);

	useEffect(() => {
		if (!scene || !worldMatrixInvRef.current) {
			console.log('[IFC] Waiting for scene and worldMatrixInv:', !!scene, worldMatrixReady);
			return;
		}

		console.log('[IFC] Starting load - scene and worldMatrixInv ready');

		if (typeof initRef.current === 'function') {
			initRef.current();
		}

		let isCanceled = false;
		setIsLoading(true);
		setError(undefined);

		const loadIfcModel = async () => {
			try {
				// Dynamically import web-ifc to avoid loading WASM at module evaluation time
				const WebIFC = await import('web-ifc');
				webIfcRef.current = WebIFC;

				const ifcApi = new WebIFC.IfcAPI();

				// Set WASM path - files are in public/wasm folder
				ifcApi.SetWasmPath('/wasm/', false);

				await ifcApi.Init();

				// Fetch the IFC file
				const response = await fetch(url);
				if (!response.ok) {
					throw new Error(`Failed to fetch IFC file: ${response.statusText}`);
				}
				const data = await response.arrayBuffer();
				const uint8Array = new Uint8Array(data);

				// Keep original projected coordinates so we can derive the geometry center
				const modelID = ifcApi.OpenModel(uint8Array, {
					COORDINATE_TO_ORIGIN: false,
				});

				console.log('[IFC] Model opened, ID:', modelID);

				// Derive placement from the geometry bounding-box center (projected CRS),
				// reprojected to WGS84. Falls back to site georeferencing when the model
				// has no projected coordinates.
				const bounds = computeGeometryBounds(ifcApi, modelID);
				const { crs, crsFromFile } = resolveCrs(ifcApi, WebIFC, modelID, sourceCrsRef.current);
				const mapConversion = readMapConversion(ifcApi, WebIFC, modelID);

				let location: IfcSiteLocation | undefined;
				// Offset subtracted from geometry (web-ifc XYZ) so its center sits at the group origin
				const geometryOffset = { x: 0, y: 0, z: 0 };

				// web-ifc output is Y-up: X = easting, Y = up/height, Z = -northing
				const easting = bounds ? bounds.center.x : NaN;
				const northing = bounds ? -bounds.center.z : NaN;

				if (bounds && isProjectedCoordinate(easting, northing) && !crs) {
					throw new Error('The IFC uses projected coordinates but no CRS was selected.');
				}

				const groundShift = getStoreyGroundShift(ifcApi, WebIFC, modelID);
				const projectedCenter = mapConversion && bounds
					? mapConversionLocalToProjected(mapConversion, bounds.center.x, bounds.center.z)
					: undefined;
				const anchorEasting = projectedCenter?.easting ?? easting;
				const anchorNorthing = projectedCenter?.northing ?? northing;

				if (bounds && crs && (isProjectedCoordinate(anchorEasting, anchorNorthing) || mapConversion)) {
					const { longitude, latitude } = reprojectToWgs84(anchorEasting, anchorNorthing, crs);
					location = {
						longitude,
						latitude,
						elevation: bounds.min.y,
						rotation: mapConversion?.rotation,
						crs,
						crsFromFile,
						method: 'geometrycenter',
					};
					// Center horizontally on the bbox center; align the ground-floor storey
					// to z=0 so below-grade storeys fall below ground.
					geometryOffset.x = bounds.center.x;
					geometryOffset.y = bounds.min.y + groundShift;
					geometryOffset.z = bounds.center.z;
					geometryBoundsRef.current = {
						easting: anchorEasting,
						northing: anchorNorthing,
						baseHeight: bounds.min.y,
					};
				} else {
					try {
						location = extractGeoreferencing(ifcApi, WebIFC, modelID, sourceCrsRef.current);
					} catch (err) {
						console.warn('Could not extract georeferencing from IFC:', err);
					}
				}

				if (isCanceled) {
					ifcApi.CloseModel(modelID);
					return;
				}

				// Create a group to hold all meshes
				const group = new THREE.Group();
				group.name = 'IFC Model';
				let meshCount = 0;

				// Get all mesh geometries
				ifcApi.StreamAllMeshes(modelID, (mesh: any) => {
					const placedGeometries = mesh.geometries;

					for (let i = 0; i < placedGeometries.size(); i++) {
						const placedGeometry = placedGeometries.get(i);
						const geometry = ifcApi.GetGeometry(modelID, placedGeometry.geometryExpressID);
						const vertices = ifcApi.GetVertexArray(
							geometry.GetVertexData(),
							geometry.GetVertexDataSize()
						);
						const indices = ifcApi.GetIndexArray(
							geometry.GetIndexData(),
							geometry.GetIndexDataSize()
						);

						if (vertices.length === 0 || indices.length === 0) {
							geometry.delete();
							continue;
						}

						// Create BufferGeometry
						const bufferGeometry = new THREE.BufferGeometry();

						// Vertices from web-ifc include position (3), normal (3), and UV (2) = 6 floats per vertex
						const positionArray = new Float32Array((vertices.length / 6) * 3);
						const normalArray = new Float32Array((vertices.length / 6) * 3);

						for (let j = 0; j < vertices.length / 6; j++) {
							const baseIdx = j * 6;
							positionArray[j * 3] = vertices[baseIdx];
							positionArray[j * 3 + 1] = vertices[baseIdx + 1];
							positionArray[j * 3 + 2] = vertices[baseIdx + 2];
							normalArray[j * 3] = vertices[baseIdx + 3];
							normalArray[j * 3 + 1] = vertices[baseIdx + 4];
							normalArray[j * 3 + 2] = vertices[baseIdx + 5];
						}

						bufferGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
						bufferGeometry.setAttribute('normal', new THREE.BufferAttribute(normalArray, 3));
						bufferGeometry.setIndex(new THREE.BufferAttribute(indices, 1));

						// Get color from the placed geometry
						const color = new THREE.Color(
							placedGeometry.color.x,
							placedGeometry.color.y,
							placedGeometry.color.z
						);

						// Create material
						const material = new THREE.MeshLambertMaterial({
							color: color,
							transparent: placedGeometry.color.w < 1,
							opacity: placedGeometry.color.w,
							side: THREE.DoubleSide,
						});

						// Create mesh
						const ifcMesh = new THREE.Mesh(bufferGeometry, material);

						// Store expressID for element picking
						ifcMesh.userData.expressId = mesh.expressID;
						ifcMesh.userData.geometryExpressId = placedGeometry.geometryExpressID;

						// Apply transformation matrix from IFC, recentered on the geometry
						// center so baked positions stay small (float32-safe).
						const matrix = new THREE.Matrix4();
						matrix.fromArray(placedGeometry.flatTransformation);
						matrix.elements[12] -= geometryOffset.x;
						matrix.elements[13] -= geometryOffset.y;
						matrix.elements[14] -= geometryOffset.z;
						ifcMesh.applyMatrix4(matrix);

						group.add(ifcMesh);
						meshCount++;

						geometry.delete();
					}
				});

				console.log(`[IFC] Created ${meshCount} meshes`);
				console.log(`[IFC] Group children: ${group.children.length}`);

				// Store ifcApi and modelID for element picking (don't close model yet)
				ifcApiRef.current = ifcApi;
				modelIdRef.current = modelID;

				if (isCanceled) {
					group.traverse(disposeObject);
					return;
				}

				if (modelRef.current) {
					cleanup();
				}

				modelRef.current = group;
				setSiteLocation(location);

				console.log('[IFC] Site location:', location);
				console.log('[IFC] Scene before add:', scene.children.length);

				// Invisible ground plane that writes depth only, so geometry below z=0
				// (basements) is occluded and the map shows through.
				const occluder = new THREE.Mesh(
					new THREE.PlaneGeometry(GROUND_OCCLUDER_SIZE, GROUND_OCCLUDER_SIZE),
					new THREE.MeshBasicMaterial({ colorWrite: false })
				);
				occluder.name = 'IFC Ground Occluder';
				occluder.renderOrder = -1;
				occluderRef.current = occluder;
				scene.add(occluder);

				updateModelTransform(group, worldMatrixInvRef.current, location);

				// Compute bounding box to check geometry
				const box = new THREE.Box3().setFromObject(group);
				console.log('[IFC] Bounding box:', box.min, box.max);

				scene.add(group);
				console.log('[IFC] Scene after add:', scene.children.length);

				setModel(group);
				setIsLoading(false);

				if (typeof onDoneRef.current === 'function') {
					onDoneRef.current(location);
				}
			} catch (err) {
				console.error('Error loading IFC model:', err);
				setError(err instanceof Error ? err : new Error(String(err)));
				setIsLoading(false);
			}
		};

		loadIfcModel();

		return () => {
			isCanceled = true;
			cleanup();
			// Close IFC model on cleanup
			if (ifcApiRef.current && modelIdRef.current !== null) {
				try {
					ifcApiRef.current.CloseModel(modelIdRef.current);
				} catch (e) {
					console.warn('Error closing IFC model:', e);
				}
				ifcApiRef.current = null;
				modelIdRef.current = null;
			}
		};
	}, [url, scene, worldMatrixReady, cleanup, updateModelTransform]);

	// Update transform when props change
	useEffect(() => {
		if (model) {
			updateModelTransform(model, worldMatrixInv, siteLocation);
		}
	}, [model, position, transform, useIfcPosition, worldMatrixInv, updateModelTransform, siteLocation]);

	// Re-extract georeferencing when the selected source CRS changes
	useEffect(() => {
		if (!model || !ifcApiRef.current || !webIfcRef.current || modelIdRef.current === null) return;
		if (siteLocation?.crsFromFile) return;

		try {
			const bounds = geometryBoundsRef.current;
			let location: IfcSiteLocation | undefined;

			if (bounds && sourceCrs) {
				const { longitude, latitude } = reprojectToWgs84(bounds.easting, bounds.northing, sourceCrs);
				location = {
					longitude,
					latitude,
					elevation: bounds.baseHeight,
					crs: sourceCrs,
					crsFromFile: false,
					method: 'geometrycenter',
				};
			} else {
				location = extractGeoreferencing(
					ifcApiRef.current,
					webIfcRef.current,
					modelIdRef.current,
					sourceCrs
				);
			}

			setSiteLocation(location);
			if (typeof onDoneRef.current === 'function') {
				onDoneRef.current(location);
			}
		} catch (err) {
			console.warn('Could not re-extract georeferencing for CRS change:', err);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sourceCrs]);

	// Handle clipping planes
	useEffect(() => {
		if (!model) return;

		model.traverse((child) => {
			if (child instanceof THREE.Mesh && child.material) {
				const material = child.material as THREE.Material;
				if (clippingPlanes.length > 0) {
					material.clippingPlanes = clippingPlanes;
					material.clipShadows = true;
				} else {
					material.clippingPlanes = [];
				}
				material.needsUpdate = true;
			}
		});

		// Enable clipping in renderer
		if (renderer) {
			const threeRenderer = renderer.getRenderer();
			threeRenderer.localClippingEnabled = clippingPlanes.length > 0;
		}
	}, [model, clippingPlanes, renderer]);

	useEffect(() => {
		if (!model) return;

		const updateMaterial = (material: THREE.Material, expressId?: number) => {
			if (!(material instanceof THREE.MeshLambertMaterial)) return;

			material.emissive.setHex(0x000000);

			if (highlightedExpressId !== undefined && expressId === highlightedExpressId) {
				material.emissive.setHex(0x00ff00);
			} else if (hoveredExpressId !== undefined && expressId === hoveredExpressId) {
				material.emissive.setHex(0x00bcd4);
			}

			material.needsUpdate = true;
		};

		model.traverse((child) => {
			if (!(child instanceof THREE.Mesh) || !child.material) return;

			const expressId = child.userData.expressId;

			if (Array.isArray(child.material)) {
				child.material.forEach((material) => updateMaterial(material, expressId));
			} else {
				updateMaterial(child.material, expressId);
			}
		});
	}, [model, highlightedExpressId, hoveredExpressId]);

	// Element picking
	const pickElement = useCallback(
		(event: MouseEvent): IfcElementInfo | null => {
			if (!model || !camera || !renderer || !ifcApiRef.current || modelIdRef.current === null) {
				return null;
			}

			const canvas = renderer.getRenderer().domElement;
			const rect = canvas.getBoundingClientRect();
			const mouse = new THREE.Vector2(
				((event.clientX - rect.left) / rect.width) * 2 - 1,
				-((event.clientY - rect.top) / rect.height) * 2 + 1
			);

			const raycaster = new THREE.Raycaster();
			raycaster.setFromCamera(mouse, camera);

			const intersects = raycaster.intersectObject(model, true);
			const visibleHit = intersects.find((intersection) =>
				clippingPlanes.every((plane) => plane.distanceToPoint(intersection.point) >= 0)
			);

			if (visibleHit) {
				const hit = visibleHit;
				const mesh = hit.object as THREE.Mesh;
				const expressId = mesh.userData.expressId;

				if (expressId !== undefined) {
					try {
						const ifcApi = ifcApiRef.current;
						const modelID = modelIdRef.current;

						// Get the element line
						const element = ifcApi.GetLine(modelID, expressId);
						const typeName = ifcApi.GetNameFromTypeCode(element.type) || 'Unknown';

						// Extract relevant attributes
						const attributes: Record<string, unknown> = {};
						if (element.Name?.value) attributes.Name = element.Name.value;
						if (element.Description?.value) attributes.Description = element.Description.value;
						if (element.ObjectType?.value) attributes.ObjectType = element.ObjectType.value;
						if (element.Tag?.value) attributes.Tag = element.Tag.value;
						if (element.GlobalId?.value) attributes.GlobalId = element.GlobalId.value;

						return {
							expressId,
							type: typeName,
							attributes,
						};
					} catch (e) {
						console.warn('Error getting element info:', e);
						return { expressId, type: 'Unknown', attributes: {} };
					}
				}
			}

			return null;
		},
		[model, camera, renderer, clippingPlanes]
	);

	// Set up click handler for element picking
	useEffect(() => {
		if (!enablePicking || !renderer || !onElementPicked) return;

		const canvas = renderer.getRenderer().domElement;

		const handleClick = (event: MouseEvent) => {
			const element = pickElement(event);
			onElementPicked(element);
		};

		canvas.addEventListener('click', handleClick);

		return () => {
			canvas.removeEventListener('click', handleClick);
		};
	}, [enablePicking, renderer, pickElement, onElementPicked]);

	useEffect(() => {
		if (!enablePicking || !renderer || !onElementHovered) return;

		const canvas = renderer.getRenderer().domElement;

		const handleMouseMove = (event: MouseEvent) => {
			onElementHovered(pickElement(event));
		};

		const handleMouseLeave = () => {
			onElementHovered(null);
		};

		canvas.addEventListener('mousemove', handleMouseMove);
		canvas.addEventListener('mouseleave', handleMouseLeave);

		return () => {
			canvas.removeEventListener('mousemove', handleMouseMove);
			canvas.removeEventListener('mouseleave', handleMouseLeave);
		};
	}, [enablePicking, renderer, pickElement, onElementHovered]);

	return { model, siteLocation, isLoading, error, pickElement };
};
