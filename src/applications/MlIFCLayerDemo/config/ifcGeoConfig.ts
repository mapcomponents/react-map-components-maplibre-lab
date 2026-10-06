import proj4 from 'proj4';
import proj4List from 'proj4-list';

/**
 * Central configuration for IFC georeferencing / coordinate reprojection.
 *
 * IFC files encode geometry in a local/projected coordinate system. To place the
 * model accurately on a WGS84 map, the projected coordinates must be reprojected.
 * The source CRS is read from the file when declared (IfcProjectedCRS), otherwise
 * the user selects one from CRS_OPTIONS when the file does not declare it.
 */

export const WGS84 = 'EPSG:4326';

/** Edge length (meters) of the invisible ground plane that occludes below-ground geometry. */
export const GROUND_OCCLUDER_SIZE = 4000;

export interface CrsOption {
	/** EPSG code, e.g. "EPSG:3946" */
	code: string;
	/** Human readable label for the UI */
	label: string;
	/** proj4 definition string */
	def: string;
}

export const CRS_REGISTRY = proj4List;

const CRS_LABELS: Record<string, string> = {
	'EPSG:3942': 'EPSG:3942 — RGF93 / CC42 (France, lat 41–43)',
	'EPSG:3943': 'EPSG:3943 — RGF93 / CC43 (France, lat 42–44)',
	'EPSG:3944': 'EPSG:3944 — RGF93 / CC44 (France, lat 43–45)',
	'EPSG:3945': 'EPSG:3945 — RGF93 / CC45 (France, lat 44–46)',
	'EPSG:3946': 'EPSG:3946 — RGF93 / CC46 (France, lat 45–47, Lyon)',
	'EPSG:3947': 'EPSG:3947 — RGF93 / CC47 (France, lat 46–48)',
	'EPSG:3948': 'EPSG:3948 — RGF93 / CC48 (France, lat 47–49)',
	'EPSG:2154': 'EPSG:2154 — RGF93 / Lambert-93 (France)',
	'EPSG:25832': 'EPSG:25832 — ETRS89 / UTM zone 32N (Central Europe)',
	'EPSG:25833': 'EPSG:25833 — ETRS89 / UTM zone 33N (Central Europe)',
	'EPSG:28992': 'EPSG:28992 — Amersfoort / RD New (Netherlands)',
	'EPSG:3857': 'EPSG:3857 — WGS84 / Pseudo-Mercator (Web)',
};

const toCrsOption = (code: string): CrsOption => ({
	code,
	label: CRS_LABELS[code] ?? code,
	def: CRS_REGISTRY[code][1],
});

/** Common CRS choices shown before the user starts searching. */
const COMMON_CRS_CODES = [
	'EPSG:2154',
	'EPSG:3942',
	'EPSG:3943',
	'EPSG:3944',
	'EPSG:3945',
	'EPSG:3946',
	'EPSG:3947',
	'EPSG:3948',
	'EPSG:25832',
	'EPSG:25833',
	'EPSG:28992',
	'EPSG:3857',
];

export const CRS_OPTIONS: CrsOption[] = COMMON_CRS_CODES.map(toCrsOption);
export const ALL_CRS_OPTIONS: CrsOption[] = Object.keys(CRS_REGISTRY).map(toCrsOption);

// Register all definitions with proj4 once at module load.
Object.keys(CRS_REGISTRY).forEach((code) => proj4.defs(code, CRS_REGISTRY[code][1]));

/** Returns true if the given EPSG code has a registered proj4 definition. */
export const isSupportedCrs = (code: string): boolean =>
	Boolean(CRS_REGISTRY[code]);
