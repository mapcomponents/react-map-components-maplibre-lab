import { useRef, useLayoutEffect, useState } from 'react';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import * as THREE from 'three';
import { LngLatLike } from 'maplibre-gl';
import MlThreeGizmo from './MlThreeGizmo';
import { useThree } from '../contexts/ThreeContext';
import ThreejsUtils from '../lib/ThreejsUtils';
import { IfcSiteLocation } from './MlIfcLayer';
import { CRS_OPTIONS } from '../config/ifcGeoConfig';

export type ClippingState = {
	enabled: boolean;
	value: number;
};

export type SideClippingState = {
	enabled: boolean;
	angle: number;
	offset: number;
};

export interface MlIfcControlsProps {
	modelLoaded: boolean;
	onUpload: () => void;
	onUseDemo: () => void;
	onCenterToModel: () => void;
	onReset: () => void;
	isPickingPosition: boolean;
	onPickPosition: () => void;
	uploadDisabled?: boolean;
	showLayer: boolean;
	setShowLayer: (show: boolean) => void;
	showUnderground: boolean;
	setShowUnderground: (show: boolean) => void;
	scale: number;
	setScale: (scale: number) => void;
	rotation: { x: number; y: number; z: number };
	setRotation: (rotation: { x: number; y: number; z: number }) => void;
	mapPosition: { lng: number; lat: number };
	setMapPosition: (position: { lng: number; lat: number }) => void;
	position: { x: number; y: number; z: number };
	setPosition: (position: { x: number; y: number; z: number }) => void;
	enableTransformControls: boolean;
	setEnableTransformControls: (enable: boolean) => void;
	transformMode: 'translate' | 'rotate' | 'scale';
	setTransformMode: (mode: 'translate' | 'rotate' | 'scale') => void;
	ifcSiteLocation?: IfcSiteLocation;
	sourceCrs?: string;
	setSourceCrs: (crs: string) => void;
	topClipping: ClippingState;
	setTopClipping: (state: ClippingState) => void;
	bottomClipping: ClippingState;
	setBottomClipping: (state: ClippingState) => void;
	sideClipping: SideClippingState;
	setSideClipping: (state: SideClippingState) => void;
	isLoading?: boolean;
}

export const MlIfcControls = ({
	modelLoaded,
	onUpload,
	onUseDemo,
	onCenterToModel,
	onReset,
	isPickingPosition,
	onPickPosition,
	uploadDisabled = false,
	showLayer,
	setShowLayer,
	showUnderground,
	setShowUnderground,
	scale,
	setScale,
	rotation,
	setRotation,
	mapPosition,
	setMapPosition,
	position,
	setPosition,
	enableTransformControls,
	setEnableTransformControls,
	transformMode,
	setTransformMode,
	ifcSiteLocation,
	sourceCrs,
	setSourceCrs,
	topClipping,
	setTopClipping,
	bottomClipping,
	setBottomClipping,
	sideClipping,
	setSideClipping,
	isLoading,
}: MlIfcControlsProps) => {
	const { scene, worldMatrixInv } = useThree();
	const dummyMeshRef = useRef<THREE.Mesh | undefined>(undefined);
	const [dummyMeshReady, setDummyMeshReady] = useState(false);

	type NumberFieldConfig = {
		key: string;
		label: string;
		value: number;
		step: number;
		min?: number;
		max?: number;
		disabled?: boolean;
		onChange: (value: number) => void;
	};

	// Create and manage dummy mesh for transform controls
	useLayoutEffect(() => {
		if (!scene || !worldMatrixInv || !enableTransformControls) {
			if (dummyMeshRef.current) {
				scene?.remove(dummyMeshRef.current);
				dummyMeshRef.current.geometry.dispose();
				(dummyMeshRef.current.material as THREE.Material).dispose();
				dummyMeshRef.current = undefined;
				setDummyMeshReady(false);
			}
			return;
		}

		const geometry = new THREE.BoxGeometry(1, 1, 1);
		const material = new THREE.MeshBasicMaterial({ visible: false });
		const dummyMesh = new THREE.Mesh(geometry, material);

		const scenePos = ThreejsUtils.toScenePosition(
			worldMatrixInv,
			[mapPosition.lng, mapPosition.lat] as LngLatLike,
			0
		);
		dummyMesh.position.set(
			scenePos.x + position.x,
			scenePos.y + position.y,
			scenePos.z + position.z
		);
		dummyMesh.rotation.set(
			(rotation.x * Math.PI) / 180,
			(rotation.y * Math.PI) / 180,
			(rotation.z * Math.PI) / 180
		);
		dummyMesh.scale.set(scale, scale, scale);

		scene.add(dummyMesh);
		dummyMeshRef.current = dummyMesh;
		setDummyMeshReady(true);

		return () => {
			if (dummyMeshRef.current) {
				scene.remove(dummyMeshRef.current);
				dummyMeshRef.current.geometry.dispose();
				(dummyMeshRef.current.material as THREE.Material).dispose();
				dummyMeshRef.current = undefined;
				setDummyMeshReady(false);
			}
		};
	}, [scene, worldMatrixInv, enableTransformControls]);

	// Update dummy mesh position
	useLayoutEffect(() => {
		if (!dummyMeshRef.current || !worldMatrixInv) return;

		const scenePos = ThreejsUtils.toScenePosition(
			worldMatrixInv,
			[mapPosition.lng, mapPosition.lat] as LngLatLike,
			0
		);
		dummyMeshRef.current.position.set(
			scenePos.x + position.x,
			scenePos.y + position.y,
			scenePos.z + position.z
		);
		dummyMeshRef.current.rotation.set(
			(rotation.x * Math.PI) / 180,
			(rotation.y * Math.PI) / 180,
			(rotation.z * Math.PI) / 180
		);
		dummyMeshRef.current.scale.set(scale, scale, scale);
		dummyMeshRef.current.updateMatrixWorld(true);
	}, [position, rotation, scale, mapPosition, worldMatrixInv]);

	const handleObjectChange = (object: THREE.Object3D) => {
		if (!worldMatrixInv) return;

		const scenePos = ThreejsUtils.toScenePosition(
			worldMatrixInv,
			[mapPosition.lng, mapPosition.lat] as LngLatLike,
			0
		);

		setPosition({
			x: object.position.x - scenePos.x,
			y: object.position.y - scenePos.y,
			z: object.position.z - scenePos.z,
		});

		setRotation({
			x: (object.rotation.x * 180) / Math.PI,
			y: (object.rotation.y * 180) / Math.PI,
			z: (object.rotation.z * 180) / Math.PI,
		});

		setScale(object.scale.x);
	};

	const renderNumberFields = (fields: NumberFieldConfig[]) => (
		<Box sx={{ display: 'grid', gap: 1.5 }}>
			{fields.map((field) => (
				<TextField
					key={field.key}
					label={field.label}
					type="number"
					size="small"
					value={field.value}
					onChange={(e) => {
						const nextValue = Number(e.target.value);
						if (Number.isNaN(nextValue)) {
							return;
						}
						field.onChange(nextValue);
					}}
					slotProps={{
						htmlInput: {
							step: field.step,
							min: field.min,
							max: field.max,
						},
					}}
					disabled={field.disabled}
					fullWidth
				/>
			))}
		</Box>
	);

	const topClippingFields: NumberFieldConfig[] = [
		{
			key: 'top-height',
			label: 'Top Height (m)',
			value: topClipping.value,
			step: 0.1,
			min: -50,
			max: 100,
			onChange: (value) => setTopClipping({ ...topClipping, value }),
		},
	];

	const bottomClippingFields: NumberFieldConfig[] = [
		{
			key: 'bottom-height',
			label: 'Bottom Height (m)',
			value: bottomClipping.value,
			step: 0.1,
			min: -50,
			max: 100,
			onChange: (value) => setBottomClipping({ ...bottomClipping, value }),
		},
	];

	const sideClippingFields: NumberFieldConfig[] = [
		{
			key: 'side-angle',
			label: 'Side Angle (°)',
			value: sideClipping.angle,
			step: 1,
			min: -180,
			max: 180,
			onChange: (value) => setSideClipping({ ...sideClipping, angle: value }),
		},
		{
			key: 'side-offset',
			label: 'Side Offset (m)',
			value: sideClipping.offset,
			step: 0.1,
			min: -100,
			max: 100,
			onChange: (value) => setSideClipping({ ...sideClipping, offset: value }),
		},
	];

	const transformFields: NumberFieldConfig[] = [
		{
			key: 'scale',
			label: 'Scale',
			value: scale,
			step: 0.01,
			min: 0.01,
			max: 50,
			onChange: setScale,
		},
		{
			key: 'rotation-x',
			label: 'Rotation X (°)',
			value: rotation.x,
			step: 1,
			min: 0,
			max: 360,
			onChange: (value) => setRotation({ ...rotation, x: value }),
		},
		{
			key: 'rotation-y',
			label: 'Rotation Y (°)',
			value: rotation.y,
			step: 1,
			min: 0,
			max: 360,
			onChange: (value) => setRotation({ ...rotation, y: value }),
		},
		{
			key: 'rotation-z',
			label: 'Rotation Z (°)',
			value: rotation.z,
			step: 1,
			min: 0,
			max: 360,
			onChange: (value) => setRotation({ ...rotation, z: value }),
		},
	];

	const mapPositionFields: NumberFieldConfig[] = [
		{
			key: 'longitude',
			label: 'Longitude',
			value: mapPosition.lng,
			step: 0.0001,
			min: -180,
			max: 180,
			disabled: false,
			onChange: (value) => setMapPosition({ ...mapPosition, lng: value }),
		},
		{
			key: 'latitude',
			label: 'Latitude',
			value: mapPosition.lat,
			step: 0.0001,
			min: -90,
			max: 90,
			disabled: false,
			onChange: (value) => setMapPosition({ ...mapPosition, lat: value }),
		},
	];

	const offsetFields: NumberFieldConfig[] = [
		{
			key: 'offset-x',
			label: 'Offset X (m)',
			value: position.x,
			step: 0.1,
			min: -100,
			max: 100,
			onChange: (value) => setPosition({ ...position, x: value }),
		},
		{
			key: 'offset-y',
			label: 'Offset Y (m)',
			value: position.y,
			step: 0.1,
			min: -100,
			max: 100,
			onChange: (value) => setPosition({ ...position, y: value }),
		},
		{
			key: 'offset-z',
			label: 'Offset Z (m)',
			value: position.z,
			step: 0.1,
			min: -100,
			max: 100,
			onChange: (value) => setPosition({ ...position, z: value }),
		},
	];

	return (
		<>
			{dummyMeshReady && dummyMeshRef.current && enableTransformControls && (
				<MlThreeGizmo
					target={dummyMeshRef.current}
					mode={transformMode}
					enabled={enableTransformControls}
					onObjectChange={handleObjectChange}
				/>
			)}
			<Box sx={{ padding: '15px', maxHeight: '80vh', overflowY: 'auto' }}>
				<Box sx={{ mb: 2 }}>
					<Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
						Load IFC model
					</Typography>
					<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
					<Button variant="contained" onClick={onUpload} disabled={uploadDisabled || isLoading} size="small">
						Upload IFC
					</Button>
					<Button variant="outlined" onClick={onUseDemo} disabled={isLoading} size="small">
						Use Demo
					</Button>
					</Box>
				</Box>
				<Divider sx={{ mb: 2 }} />

				{isLoading && (
					<Typography color="primary" sx={{ mb: 2 }}>
						Loading IFC model...
					</Typography>
				)}

				{/* IFC Site Location */}
				{modelLoaded && (
					<Box sx={{ mb: 2, p: 1, bgcolor: '#e3f2fd', borderRadius: 1 }}>
						<Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
							IFC Site Location
						</Typography>
						{ifcSiteLocation ? (
							<>
								<Typography variant="body2">
									Lat: {ifcSiteLocation.latitude.toFixed(6)}
								</Typography>
								<Typography variant="body2">
									Lng: {ifcSiteLocation.longitude.toFixed(6)}
								</Typography>
								<Typography variant="body2">
									Elevation: {ifcSiteLocation.elevation.toFixed(6)}m
								</Typography>
								<Typography variant="body2">
									Position source: {ifcSiteLocation.method ?? 'unknown'}
								</Typography>
								<Typography variant="body2">
									CRS: {ifcSiteLocation.crs ?? 'WGS84 / RefLatitude and RefLongitude'}
								</Typography>
								<TextField
									select
									label="Source CRS"
									size="small"
									fullWidth
									value={ifcSiteLocation.crsFromFile ? ifcSiteLocation.crs ?? sourceCrs : sourceCrs}
									onChange={(e) => setSourceCrs(e.target.value)}
									disabled={ifcSiteLocation.crsFromFile}
									helperText={
										ifcSiteLocation.crsFromFile
											? `Detected from file (${ifcSiteLocation.method})`
											: ifcSiteLocation.method === 'reflatlong'
											? 'File has no projected coordinates — using RefLat/Long'
											: `Reprojected from ${ifcSiteLocation.method}`
									}
									sx={{ mt: 1 }}
								>
									{CRS_OPTIONS.map((option) => (
										<MenuItem key={option.code} value={option.code}>
											{option.label}
										</MenuItem>
									))}
								</TextField>
							</>
						) : (
							<Typography variant="body2" color="error">
								No site location or georeferencing information was found in this IFC file.
							</Typography>
						)}
					</Box>
				)}

				{modelLoaded && <>
				<Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
					Model controls
				</Typography>
				{/* Show/Hide & Gizmo Buttons */}
				<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
					<Button variant="outlined" onClick={onCenterToModel} disabled={isLoading} size="small">
						Center to model
					</Button>
					<Button variant="outlined" onClick={onReset} disabled={isLoading} size="small">
						Reset
					</Button>
					<Button
						color="primary"
						variant={showLayer ? 'contained' : 'outlined'}
						onClick={() => setShowLayer(!showLayer)}
						size="small"
					>
						{showLayer ? 'Hide' : 'Show'} Model
					</Button>
					<Button
						color="info"
						variant={enableTransformControls ? 'contained' : 'outlined'}
						onClick={() => setEnableTransformControls(!enableTransformControls)}
						size="small"
					>
						3D Gizmo
					</Button>
					<FormControlLabel
						control={
							<Switch
								checked={showUnderground}
								onChange={(event) => setShowUnderground(event.target.checked)}
								size="small"
							/>
						}
						label="Underground"
					/>
				</Box>

				{/* Transform Mode Buttons */}
				{enableTransformControls && (
					<Box sx={{ mb: 2 }}>
						<ButtonGroup variant="outlined" size="small" fullWidth>
							<Button
								variant={transformMode === 'translate' ? 'contained' : 'outlined'}
								onClick={() => setTransformMode('translate')}
							>
								Move
							</Button>
							<Button
								variant={transformMode === 'rotate' ? 'contained' : 'outlined'}
								onClick={() => setTransformMode('rotate')}
							>
								Rotate
							</Button>
							<Button
								variant={transformMode === 'scale' ? 'contained' : 'outlined'}
								onClick={() => setTransformMode('scale')}
							>
								Scale
							</Button>
						</ButtonGroup>
					</Box>
				)}

				<Accordion disableGutters sx={{ mb: 2 }}>
					<AccordionSummary expandIcon={<ExpandMoreIcon />}>
						<Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
							Clipping Plane
						</Typography>
					</AccordionSummary>
					<AccordionDetails>
						<FormControlLabel
							control={
								<Switch
									checked={topClipping.enabled}
									onChange={(e) => setTopClipping({ ...topClipping, enabled: e.target.checked })}
									size="small"
								/>
							}
							label="Top"
						/>
						{topClipping.enabled && (
							<Box sx={{ mb: 2 }}>
								{renderNumberFields(topClippingFields)}
							</Box>
						)}

						<FormControlLabel
							control={
								<Switch
									checked={bottomClipping.enabled}
									onChange={(e) =>
										setBottomClipping({ ...bottomClipping, enabled: e.target.checked })
									}
									size="small"
								/>
							}
							label="Bottom"
						/>
						{bottomClipping.enabled && (
							<Box sx={{ mb: 2 }}>
								{renderNumberFields(bottomClippingFields)}
							</Box>
						)}

						<FormControlLabel
							control={
								<Switch
									checked={sideClipping.enabled}
									onChange={(e) => setSideClipping({ ...sideClipping, enabled: e.target.checked })}
									size="small"
								/>
							}
							label="Side"
						/>
						{sideClipping.enabled && (
							<Box>
								{renderNumberFields(sideClippingFields)}
							</Box>
						)}
					</AccordionDetails>
				</Accordion>

				<Accordion disableGutters sx={{ mb: 2 }}>
					<AccordionSummary expandIcon={<ExpandMoreIcon />}>
						<Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
							Transform
						</Typography>
					</AccordionSummary>
					<AccordionDetails>
						{renderNumberFields(transformFields)}
					</AccordionDetails>
				</Accordion>

				<Accordion disableGutters>
					<AccordionSummary expandIcon={<ExpandMoreIcon />}>
						<Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
							Position
						</Typography>
					</AccordionSummary>
					<AccordionDetails>
						<Typography variant="subtitle2" sx={{ fontWeight: 'bold' }} gutterBottom>
							Map Position
						</Typography>
						{renderNumberFields(mapPositionFields)}
						<Button
							variant={isPickingPosition ? 'contained' : 'outlined'}
							color={isPickingPosition ? 'secondary' : 'primary'}
							onClick={onPickPosition}
							fullWidth
							size="small"
							sx={{ mt: 1.5 }}
						>
							{isPickingPosition ? 'Click map to place model' : 'Click position'}
						</Button>

						<Divider sx={{ my: 2 }} />

						<Typography variant="subtitle2" sx={{ fontWeight: 'bold' }} gutterBottom>
							Offset Position
						</Typography>
						{renderNumberFields(offsetFields)}
					</AccordionDetails>
				</Accordion>
				</>}
			</Box>
		</>
	);
};

export default MlIfcControls;
