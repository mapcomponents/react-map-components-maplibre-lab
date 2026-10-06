import proj4 from 'proj4';
import { WGS84, isSupportedCrs } from '../config/ifcGeoConfig';

/**
 * Extracts accurate georeferencing from an IFC model.
 *
 * Priority of sources:
 *  1. IfcMapConversion (Eastings/Northings) — the IFC4 standard georeferencing.
 *  2. IfcSite placement point — projected coordinates stored directly on the site.
 *  3. IfcSite RefLatitude/RefLongitude — coarse WGS84 values (no reprojection).
 *
 * Projected coordinates (sources 1 and 2) are reprojected to WGS84 using the CRS
 * declared in the file (IfcProjectedCRS) when available, otherwise the CRS the
 * caller provides (selectedCrs).
 */

export type GeoreferencingMethod =
	| 'geometrycenter'
	| 'mapconversion'
	| 'siteplacement'
	| 'reflatlong';

export interface GeoreferencingResult {
	latitude: number;
	longitude: number;
	elevation: number;
	/** Horizontal rotation, in radians, from IfcMapConversion X-axis metadata. */
	rotation?: number;
	/** CRS used for reprojection; undefined when the result came from RefLat/Long */
	crs?: string;
	/** Whether the CRS was declared inside the IFC file */
	crsFromFile: boolean;
	method: GeoreferencingMethod;
}

/** Minimal threshold (meters) above which a coordinate is treated as projected. */
const PROJECTED_COORD_THRESHOLD = 1000;

/** True when a coordinate pair is large enough to be projected (not model-local). */
export const isProjectedCoordinate = (easting: number, northing: number): boolean =>
	Math.abs(easting) >= PROJECTED_COORD_THRESHOLD &&
	Math.abs(northing) >= PROJECTED_COORD_THRESHOLD;

export interface GeometryBounds {
	center: { x: number; y: number; z: number };
	min: { x: number; y: number; z: number };
	max: { x: number; y: number; z: number };
	vertexCount: number;
}

/**
 * Streams all meshes and computes the world-space geometry bounding box in the
 * web-ifc output coordinate system (Y-up: X = easting, Y = up, Z = -northing).
 * Must be called on a model opened with COORDINATE_TO_ORIGIN disabled so the
 * coordinates remain in the original projected CRS.
 */
export const computeGeometryBounds = (ifcApi: any, modelID: number): GeometryBounds | undefined => {
	let xmin = Infinity;
	let ymin = Infinity;
	let zmin = Infinity;
	let xmax = -Infinity;
	let ymax = -Infinity;
	let zmax = -Infinity;
	let vertexCount = 0;

	ifcApi.StreamAllMeshes(modelID, (mesh: any) => {
		const geometries = mesh.geometries;
		for (let i = 0; i < geometries.size(); i++) {
			const placed = geometries.get(i);
			const geometry = ifcApi.GetGeometry(modelID, placed.geometryExpressID);
			const verts = ifcApi.GetVertexArray(geometry.GetVertexData(), geometry.GetVertexDataSize());
			const m = placed.flatTransformation;

			for (let v = 0; v < verts.length; v += 6) {
				const x = verts[v];
				const y = verts[v + 1];
				const z = verts[v + 2];
				const wx = m[0] * x + m[4] * y + m[8] * z + m[12];
				const wy = m[1] * x + m[5] * y + m[9] * z + m[13];
				const wz = m[2] * x + m[6] * y + m[10] * z + m[14];

				if (wx < xmin) xmin = wx;
				if (wy < ymin) ymin = wy;
				if (wz < zmin) zmin = wz;
				if (wx > xmax) xmax = wx;
				if (wy > ymax) ymax = wy;
				if (wz > zmax) zmax = wz;
				vertexCount++;
			}
			geometry.delete();
		}
	});

	if (vertexCount === 0) return undefined;

	return {
		center: { x: (xmin + xmax) / 2, y: (ymin + ymax) / 2, z: (zmin + zmax) / 2 },
		min: { x: xmin, y: ymin, z: zmin },
		max: { x: xmax, y: ymax, z: zmax },
		vertexCount,
	};
};

const toNumber = (value: unknown): number => {
	if (typeof value === 'number') return value;
	if (value && typeof value === 'object' && 'value' in value) {
		return Number((value as { value: unknown }).value);
	}
	return NaN;
};

/** Parses an "EPSG:xxxx" code from an IfcProjectedCRS name string. */
const parseEpsgCode = (name: unknown): string | undefined => {
	const raw = typeof name === 'string' ? name : (name as { value?: string })?.value ?? '';
	const match = String(raw).match(/EPSG[:_\s]*(\d{4,6})/i);
	return match ? `EPSG:${match[1]}` : undefined;
};

/** Reprojects projected coordinates (easting, northing) to WGS84 lng/lat. */
export const reprojectToWgs84 = (
	easting: number,
	northing: number,
	crs: string
): { longitude: number; latitude: number } => {
	const [longitude, latitude] = proj4(crs, WGS84, [easting, northing]);
	return { longitude, latitude };
};

/** Reads the first IfcProjectedCRS EPSG code declared in the file, if any. */
export const readFileCrs = (ifcApi: any, WebIFC: any, modelID: number): string | undefined => {
	const ids = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCPROJECTEDCRS);
	if (ids.size() === 0) return undefined;
	const crsLine = ifcApi.GetLine(modelID, ids.get(0));
	return parseEpsgCode(crsLine?.Name);
};

/** Resolves the CRS to reproject with: the file-declared one if supported, else the selected one. */
export const resolveCrs = (
	ifcApi: any,
	WebIFC: any,
	modelID: number,
	selectedCrs?: string
): { crs?: string; crsFromFile: boolean } => {
	const fileCrs = readFileCrs(ifcApi, WebIFC, modelID);
	const crsFromFile = Boolean(fileCrs && isSupportedCrs(fileCrs));
	return { crs: crsFromFile ? fileCrs : selectedCrs, crsFromFile };
};

/**
 * Vertical shift (meters) from the lowest storey to the ground-floor storey.
 * Used to place the ground floor at z=0 so below-grade storeys fall below ground.
 * Returns 0 when no storeys are found.
 */
export const getStoreyGroundShift = (ifcApi: any, WebIFC: any, modelID: number): number => {
	const ids = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCBUILDINGSTOREY);
	const elevations: number[] = [];
	for (let i = 0; i < ids.size(); i++) {
		const storey = ifcApi.GetLine(modelID, ids.get(i));
		const elevation = toNumber(storey?.Elevation);
		if (!Number.isNaN(elevation)) elevations.push(elevation);
	}
	if (elevations.length === 0) return 0;

	const minElevation = Math.min(...elevations);
	const nonNegative = elevations.filter((e) => e >= 0);
	const groundElevation = nonNegative.length > 0 ? Math.min(...nonNegative) : minElevation;
	return groundElevation - minElevation;
};

/** Reads IfcMapConversion eastings/northings/height, if present. */
export const readMapConversion = (
	ifcApi: any,
	WebIFC: any,
	modelID: number
): { easting: number; northing: number; height: number; rotation: number; scale: number } | undefined => {
	const ids = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCMAPCONVERSION);
	if (ids.size() === 0) return undefined;
	const line = ifcApi.GetLine(modelID, ids.get(0));
	const easting = toNumber(line?.Eastings);
	const northing = toNumber(line?.Northings);
	if (Number.isNaN(easting) || Number.isNaN(northing)) return undefined;
	const xAxisAbscissa = toNumber(line?.XAxisAbscissa);
	const xAxisOrdinate = toNumber(line?.XAxisOrdinate);
	const rotation = Number.isNaN(xAxisAbscissa) || Number.isNaN(xAxisOrdinate)
		? 0
		: Math.atan2(xAxisOrdinate, xAxisAbscissa);
	const scale = toNumber(line?.Scale);
	return {
		easting,
		northing,
		height: toNumber(line?.OrthogonalHeight) || 0,
		rotation,
		scale: Number.isNaN(scale) ? 1 : scale,
	};
};

/** Converts WebIFC local coordinates to projected easting/northing coordinates. */
export const mapConversionLocalToProjected = (
	mapConversion: { easting: number; northing: number; rotation: number; scale: number },
	localX: number,
	localZ: number
): { easting: number; northing: number } => {
	const localNorthing = -localZ;
	const xAxisAbscissa = Math.cos(mapConversion.rotation);
	const xAxisOrdinate = Math.sin(mapConversion.rotation);
	return {
		easting:
			mapConversion.easting +
			mapConversion.scale * (localX * xAxisAbscissa - localNorthing * xAxisOrdinate),
		northing:
			mapConversion.northing +
			mapConversion.scale * (localX * xAxisOrdinate + localNorthing * xAxisAbscissa),
	};
};

/** Reads the IfcSite placement point coordinates (projected), if they look projected. */
const readSitePlacement = (
	site: any
): { easting: number; northing: number; height: number } | undefined => {
	const coordinates = site?.ObjectPlacement?.RelativePlacement?.Location?.Coordinates;
	if (!Array.isArray(coordinates) || coordinates.length < 2) return undefined;
	const easting = toNumber(coordinates[0]);
	const northing = toNumber(coordinates[1]);
	const height = coordinates.length > 2 ? toNumber(coordinates[2]) : 0;
	if (Number.isNaN(easting) || Number.isNaN(northing)) return undefined;
	if (
		Math.abs(easting) < PROJECTED_COORD_THRESHOLD &&
		Math.abs(northing) < PROJECTED_COORD_THRESHOLD
	) {
		return undefined;
	}
	return { easting, northing, height };
};

/** Converts IFC degree notation (degrees, minutes, seconds, microseconds) to decimal degrees. */
const ifcDegreesToDecimal = (values: unknown): number | undefined => {
	if (!Array.isArray(values) || values.length < 3) return undefined;
	const [degrees = 0, minutes = 0, seconds = 0, microseconds = 0] = values.map((v) => Number(v));
	return degrees + minutes / 60 + (seconds + microseconds / 1000000) / 3600;
};

export const extractGeoreferencing = (
	ifcApi: any,
	WebIFC: any,
	modelID: number,
	selectedCrs?: string
): GeoreferencingResult | undefined => {
	const sites = ifcApi.GetLineIDsWithType(modelID, WebIFC.IFCSITE);
	if (sites.size() === 0) return undefined;
	const site = ifcApi.GetLine(modelID, sites.get(0), true);

	const fileCrs = readFileCrs(ifcApi, WebIFC, modelID);
	const crs = fileCrs && isSupportedCrs(fileCrs) ? fileCrs : selectedCrs;
	const crsFromFile = Boolean(fileCrs && isSupportedCrs(fileCrs));

	const projected = readMapConversion(ifcApi, WebIFC, modelID);
	const method: GeoreferencingMethod = projected ? 'mapconversion' : 'siteplacement';
	const source = projected ?? readSitePlacement(site);

	if (source) {
		if (!crs) return undefined;
		const { longitude, latitude } = reprojectToWgs84(source.easting, source.northing, crs);
		return {
			longitude,
			latitude,
			elevation: source.height,
			rotation: projected?.rotation,
			crs,
			crsFromFile,
			method,
		};
	}

	const latitude = ifcDegreesToDecimal(site?.RefLatitude);
	const longitude = ifcDegreesToDecimal(site?.RefLongitude);
	if (latitude === undefined || longitude === undefined) return undefined;

	return {
		latitude,
		longitude,
		elevation: toNumber(site?.RefElevation) || 0,
		crsFromFile: false,
		method: 'reflatlong',
	};
};
