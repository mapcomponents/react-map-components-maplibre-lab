import proj4 from 'proj4';

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

export const CRS_OPTIONS: CrsOption[] = [
	{
		code: 'EPSG:3942',
		label: 'EPSG:3942 — RGF93 / CC42 (France, lat 41–43)',
		def: '+proj=lcc +lat_0=42 +lon_0=3 +lat_1=41.25 +lat_2=42.75 +x_0=1700000 +y_0=1200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
	},
	{
		code: 'EPSG:3943',
		label: 'EPSG:3943 — RGF93 / CC43 (France, lat 42–44)',
		def: '+proj=lcc +lat_0=43 +lon_0=3 +lat_1=42.25 +lat_2=43.75 +x_0=1700000 +y_0=2200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
	},
	{
		code: 'EPSG:3944',
		label: 'EPSG:3944 — RGF93 / CC44 (France, lat 43–45)',
		def: '+proj=lcc +lat_0=44 +lon_0=3 +lat_1=43.25 +lat_2=44.75 +x_0=1700000 +y_0=3200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
	},
	{
		code: 'EPSG:3945',
		label: 'EPSG:3945 — RGF93 / CC45 (France, lat 44–46)',
		def: '+proj=lcc +lat_0=45 +lon_0=3 +lat_1=44.25 +lat_2=45.75 +x_0=1700000 +y_0=4200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
	},
	{
		code: 'EPSG:3946',
		label: 'EPSG:3946 — RGF93 / CC46 (France, lat 45–47, Lyon)',
		def: '+proj=lcc +lat_0=46 +lon_0=3 +lat_1=45.25 +lat_2=46.75 +x_0=1700000 +y_0=5200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
	},
	{
		code: 'EPSG:3947',
		label: 'EPSG:3947 — RGF93 / CC47 (France, lat 46–48)',
		def: '+proj=lcc +lat_0=47 +lon_0=3 +lat_1=46.25 +lat_2=47.75 +x_0=1700000 +y_0=6200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
	},
	{
		code: 'EPSG:3948',
		label: 'EPSG:3948 — RGF93 / CC48 (France, lat 47–49)',
		def: '+proj=lcc +lat_0=48 +lon_0=3 +lat_1=47.25 +lat_2=48.75 +x_0=1700000 +y_0=7200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
	},
	{
		code: 'EPSG:2154',
		label: 'EPSG:2154 — RGF93 / Lambert-93 (France)',
		def: '+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
	},
	{
		code: 'EPSG:25832',
		label: 'EPSG:25832 — ETRS89 / UTM zone 32N (Central Europe)',
		def: '+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
	},
	{
		code: 'EPSG:25833',
		label: 'EPSG:25833 — ETRS89 / UTM zone 33N (Central Europe)',
		def: '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs',
	},
	{
		code: 'EPSG:28992',
		label: 'EPSG:28992 — Amersfoort / RD New (Netherlands)',
		def: '+proj=stere +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.4171,50.3319,465.5524,-0.398957,0.343988,-1.8774,4.0725 +units=m +no_defs',
	},
	{
		code: 'EPSG:3857',
		label: 'EPSG:3857 — WGS84 / Pseudo-Mercator (Web)',
		def: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +no_defs',
	},
];

// Register all definitions with proj4 once at module load.
CRS_OPTIONS.forEach((option) => proj4.defs(option.code, option.def));

/** Returns true if the given EPSG code has a registered proj4 definition. */
export const isSupportedCrs = (code: string): boolean =>
	CRS_OPTIONS.some((option) => option.code === code);
