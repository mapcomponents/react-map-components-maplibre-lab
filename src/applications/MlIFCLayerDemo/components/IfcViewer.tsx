
import { useState, useEffect, useMemo, useRef, type ChangeEvent } from "react";
import { LngLatLike, type MapMouseEvent } from "maplibre-gl";
import {  useMap,  Sidebar, TopToolbar } from "@mapcomponents/react-maplibre";
import MlIfcLayer, { IfcSiteLocation, IfcElementInfo, IfcElementProperty } from "./MlIfcLayer";
import MlIfcControls, { ClippingState, SideClippingState } from "./MlIfcControls";
import ElementInfoPanel from "./ElementInfoPanel";
import Lights from "./Lights";
import * as THREE from "three";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { ALL_CRS_OPTIONS, CRS_OPTIONS, isSupportedCrs } from "../config/ifcGeoConfig";
import { readFileCrs } from "../lib/IfcGeoreferencing";

interface IfcViewerProps {
  /** Called with the model's [lng, lat] once resolved, to anchor the world matrix */
  onModelLocated?: (center: LngLatLike) => void;
}

const DEMO_URL = "assets/IFC/model_Villa_A_1.ifc";
const INITIAL_MAP_POSITION = { lng: 0, lat: 0 };
const MODEL_ZOOM = 18;
const MODEL_PITCH = 60;
const DEMO_ELEMENT_PROPERTIES: IfcElementProperty[] = [
  { key: "Name", label: "Name", source: "attributes" },
  { key: "Description", label: "Description", source: "attributes" },
  { key: "Tag", label: "Tag", source: "attributes" },
  { key: "GlobalId", label: "Global ID", source: "attributes" },
  { key: "Name", label: "Material", source: "materials" },
];

const IfcViewer = ({ onModelLocated }: IfcViewerProps) => {
  // Layer visibility
  const [showLayer, setShowLayer] = useState(true);
  const [showUnderground, setShowUnderground] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modelUrl, setModelUrl] = useState<string>();
  const [modelReady, setModelReady] = useState(false);
  const [positionSelected, setPositionSelected] = useState(false);
  const [error, setError] = useState<string>();
  const [isInspecting, setIsInspecting] = useState(false);
  const [crsDialogOpen, setCrsDialogOpen] = useState(false);
  const [crsSearch, setCrsSearch] = useState("");
  const [pendingSource, setPendingSource] = useState<string>();
  const [detectedCrs, setDetectedCrs] = useState<string>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const skipNextMapCenterRef = useRef(false);

  // Guards the one-time world-matrix re-anchor (avoids a reload loop)
  const locatedRef = useRef(false);
  
  // Transform controls
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState({ x: 90, y: 0, z: 0 });
  const [position, setPosition] = useState({ x: 0, y: 0, z: 0 });
  const [mapPosition, setMapPosition] = useState(INITIAL_MAP_POSITION);
  const [isPickingPosition, setIsPickingPosition] = useState(false);
  
  // Gizmo controls
  const [enableTransformControls, setEnableTransformControls] = useState(false);
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate');
  
  const [ifcSiteLocation, setIfcSiteLocation] = useState<IfcSiteLocation | undefined>();

  // Source CRS for reprojecting projected IFC coordinates
  const [sourceCrs, setSourceCrs] = useState<string>();
  
  // Clipping planes
  const [topClipping, setTopClipping] = useState<ClippingState>({ enabled: false, value: 2 });
  const [bottomClipping, setBottomClipping] = useState<ClippingState>({ enabled: false, value: 0 });
  const [sideClipping, setSideClipping] = useState<SideClippingState>({ enabled: false, angle: 0, offset: 0 });
  
  // Element picking
  const [enablePicking] = useState(true);
  const [selectedElement, setSelectedElement] = useState<IfcElementInfo | undefined>();
  const [selectedExpressId, setSelectedExpressId] = useState<number | undefined>();
  const [hoveredExpressId, setHoveredExpressId] = useState<number | undefined>();
  
  // Sidebar
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const mapHook = useMap({ mapId: "map_1" });

  // Set initial map view
  useEffect(() => {
    if (!mapHook.map) return;
    mapHook.map.setZoom(4);
    mapHook.map.setCenter([INITIAL_MAP_POSITION.lng, INITIAL_MAP_POSITION.lat]);
  }, [mapHook.map]);

  // Update map center when position changes
  useEffect(() => {
    if (!mapHook.map) return;
    if (skipNextMapCenterRef.current) {
      skipNextMapCenterRef.current = false;
      return;
    }
    mapHook.map.setCenter([mapPosition.lng, mapPosition.lat]);
  }, [mapHook.map, mapPosition.lng, mapPosition.lat]);

  useEffect(() => {
    return () => {
      if (modelUrl?.startsWith('blob:')) URL.revokeObjectURL(modelUrl);
    };
  }, [modelUrl]);

  useEffect(() => {
    const map = mapHook.map;
    if (!map || !isPickingPosition) return;

    const handleMapClick = (event: unknown) => {
      const { lng, lat } = (event as MapMouseEvent).lngLat;
      setMapPosition({ lng, lat });
      setPositionSelected(true);
      setShowLayer(true);
      setIsPickingPosition(false);
    };

    map.getCanvas().style.cursor = 'crosshair';
    map.on('click', handleMapClick);

    return () => {
      map.off('click', handleMapClick);
      map.getCanvas().style.cursor = '';
    };
  }, [mapHook.map, isPickingPosition]);

  const resetTransformsForNewModel = () => {
    setScale(1);
    setRotation({ x: 90, y: 0, z: 0 });
    setPosition({ x: 0, y: 0, z: 0 });
    setEnableTransformControls(false);
    setSelectedElement(undefined);
    setTransformMode('translate');
  };

  const resetModelState = () => {
    resetTransformsForNewModel();
    setShowLayer(true);
    setTopClipping({ enabled: false, value: 20 });
    setBottomClipping({ enabled: false, value: 0 });
    setSideClipping({ enabled: false, angle: 0, offset: 0 });
    setSelectedElement(undefined);
    setSelectedExpressId(undefined);
    setHoveredExpressId(undefined);
    setIsPickingPosition(false);
    if (ifcSiteLocation) {
      const nextPosition = { lng: ifcSiteLocation.longitude, lat: ifcSiteLocation.latitude };
      skipNextMapCenterRef.current = true;
      setMapPosition(nextPosition);
      mapHook.map?.flyTo({ center: [nextPosition.lng, nextPosition.lat], zoom: MODEL_ZOOM, pitch: MODEL_PITCH });
    }
  };

  const inspectSource = async (source: string) => {
    setError(undefined);
    setIsInspecting(true);
    try {
      const WebIFC = await import('web-ifc');
      const ifcApi = new WebIFC.IfcAPI();
      ifcApi.SetWasmPath('/wasm/', false);
      await ifcApi.Init();
      const response = await fetch(source);
      if (!response.ok) throw new Error(`Failed to read IFC file: ${response.statusText}`);
      const modelId = ifcApi.OpenModel(new Uint8Array(await response.arrayBuffer()), {
        COORDINATE_TO_ORIGIN: false,
      });
      const fileCrs = readFileCrs(ifcApi, WebIFC, modelId);
      ifcApi.CloseModel(modelId);

      setPendingSource(source);
      setDetectedCrs(fileCrs);
      if (fileCrs && isSupportedCrs(fileCrs)) {
        setSourceCrs(fileCrs);
        setModelUrl(source);
      } else {
        setCrsSearch(fileCrs ?? "");
        setCrsDialogOpen(true);
      }
    } catch (inspectionError) {
      setError(inspectionError instanceof Error ? inspectionError.message : String(inspectionError));
      if (source.startsWith('blob:')) URL.revokeObjectURL(source);
    } finally {
      setIsInspecting(false);
    }
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (modelUrl?.startsWith('blob:')) URL.revokeObjectURL(modelUrl);
    resetTransformsForNewModel();
    setShowLayer(true);
    setModelUrl(undefined);
    setModelReady(false);
    setPositionSelected(false);
    setSourceCrs(undefined);
    setIfcSiteLocation(undefined);
    locatedRef.current = false;
    const source = URL.createObjectURL(file);
    void inspectSource(source);
  };

  const handleUseDemo = () => {
    if (modelUrl?.startsWith('blob:')) URL.revokeObjectURL(modelUrl);
    resetTransformsForNewModel();
    setShowLayer(true);
    setModelUrl(undefined);
    setModelReady(false);
    setPositionSelected(false);
    setSourceCrs(undefined);
    setIfcSiteLocation(undefined);
    locatedRef.current = false;
    void inspectSource(DEMO_URL);
  };

  const centerToModel = () => {
    mapHook.map?.flyTo({
      center: [mapPosition.lng, mapPosition.lat],
      zoom: MODEL_ZOOM,
      pitch: MODEL_PITCH,
    });
  };

  const handleCrsContinue = () => {
    const selected = isSupportedCrs(crsSearch) ? crsSearch : undefined;
    if (!selected || !pendingSource) return;
    setSourceCrs(selected);
    setModelUrl(pendingSource);
    setCrsDialogOpen(false);
  };

  const handleCrsCancel = () => {
    if (pendingSource?.startsWith('blob:')) URL.revokeObjectURL(pendingSource);
    setPendingSource(undefined);
    setCrsDialogOpen(false);
  };

  const matchingCrsOptions = useMemo(() => {
    const search = crsSearch.trim().toLowerCase();
    const options = search ? ALL_CRS_OPTIONS : CRS_OPTIONS;
    return options
      .filter((option) =>
        `${option.code} ${option.label}`.toLowerCase().includes(search)
      )
      .slice(0, CRS_OPTIONS.length);
  }, [crsSearch]);

  // Handle model loaded
  const handleDone = (location?: IfcSiteLocation) => {
    setIsLoading(false);
    setModelReady(true);
    if (location) {
      setIfcSiteLocation(location);
      // Automatically place the model at its own coordinate once available
      setMapPosition({ lng: location.longitude, lat: location.latitude });
      skipNextMapCenterRef.current = true;
      mapHook.map?.flyTo({
        center: [location.longitude, location.latitude],
        zoom: MODEL_ZOOM,
        pitch: MODEL_PITCH,
      });
      // Anchor the world matrix at the model's latitude for correct metric scale
      if (!locatedRef.current) {
        locatedRef.current = true;
        onModelLocated?.([location.longitude, location.latitude]);
      }
      console.log("IFC Site Location:", location);
    } else if (!positionSelected) {
      setShowLayer(false);
    }
  };

  const handleMapPositionChange = (nextPosition: { lng: number; lat: number }) => {
    setMapPosition(nextPosition);
    setPositionSelected(true);
    setShowLayer(true);
  };

  const handleModelError = (modelError: Error) => {
    setIsLoading(false);
    setError(modelError.message);
  };

  // Handle element picked
  const handleElementPicked = (element: IfcElementInfo | null) => {
    setSelectedElement(element || undefined);
    setSelectedExpressId(element?.expressId);    
  };

  // Handle element hovered
  const handleElementHovered = (element: IfcElementInfo | null) => {
    setHoveredExpressId(element?.expressId);
  };

  // Build clipping planes array from state
  const clippingPlanesArray = useMemo(() => {
    const planes: THREE.Plane[] = [];
    
    // Top: clips from above (normal pointing down, -Z)
    if (topClipping.enabled) {
      planes.push(new THREE.Plane(new THREE.Vector3(0, 0, -1), topClipping.value));
    }
    
    // Bottom: clips from below (normal pointing up, +Z)
    if (bottomClipping.enabled) {
      planes.push(new THREE.Plane(new THREE.Vector3(0, 0, 1), -bottomClipping.value));
    }
    
    // Side plane: rotatable vertical cut
    if (sideClipping.enabled) {
      const angleRad = (sideClipping.angle * Math.PI) / 180;
      const normal = new THREE.Vector3(Math.cos(angleRad), Math.sin(angleRad), 0);
      planes.push(new THREE.Plane(normal, -sideClipping.offset));
    }
    
    return planes;
  }, [topClipping, bottomClipping, sideClipping]);

  return (
    <>
      <Lights />
      
      {showLayer && modelUrl && (
        <MlIfcLayer
          key={modelUrl}
          url={modelUrl}
          position={[mapPosition.lng, mapPosition.lat]}
          useIfcPosition={false}
          sourceCrs={sourceCrs}
          transform={{
            rotation: {
              x: (rotation.x * Math.PI) / 180,
              y: (rotation.y * Math.PI) / 180,
              z: (rotation.z * Math.PI) / 180,
            },
            scale: scale,
            position: position,
          }}
          onDone={handleDone}
          onError={handleModelError}
          init={() => {
            setIsLoading(true);
            setError(undefined);
          }}
          enablePicking={enablePicking}
          elementProperties={DEMO_ELEMENT_PROPERTIES}
          showUnderground={showUnderground}
          onElementPicked={handleElementPicked}
          onElementHovered={handleElementHovered}
          clippingPlanes={clippingPlanesArray}
          highlightedExpressId={selectedExpressId}
          hoveredExpressId={hoveredExpressId}
        />
      )}

      <TopToolbar
        unmovableButtons={
          <Button
            variant={sidebarOpen ? "contained" : "outlined"}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            IFC Controls
          </Button>
        }
      />

      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} name="IFC Model Controls">
        <MlIfcControls
          modelLoaded={Boolean(modelUrl && modelReady && !isLoading)}
          onUpload={() => fileInputRef.current?.click()}
          onUseDemo={handleUseDemo}
            onCenterToModel={centerToModel}
          onReset={resetModelState}
          isPickingPosition={isPickingPosition}
          onPickPosition={() => setIsPickingPosition((picking) => !picking)}
          uploadDisabled={isInspecting}
          showLayer={showLayer}
          setShowLayer={setShowLayer}
          showUnderground={showUnderground}
          setShowUnderground={setShowUnderground}
          scale={scale}
          setScale={setScale}
          rotation={rotation}
          setRotation={setRotation}
          mapPosition={mapPosition}
          setMapPosition={handleMapPositionChange}
          position={position}
          setPosition={setPosition}
          enableTransformControls={enableTransformControls}
          setEnableTransformControls={setEnableTransformControls}
          transformMode={transformMode}
          setTransformMode={setTransformMode}
          ifcSiteLocation={ifcSiteLocation}
          sourceCrs={sourceCrs}
          setSourceCrs={setSourceCrs}
          topClipping={topClipping}
          setTopClipping={setTopClipping}
          bottomClipping={bottomClipping}
          setBottomClipping={setBottomClipping}
          sideClipping={sideClipping}
          setSideClipping={setSideClipping}
          isLoading={isLoading}
        />
      </Sidebar>

      <input
        ref={fileInputRef}
        type="file"
        accept=".ifc,application/ifc"
        onChange={handleUpload}
        style={{ display: 'none' }}
      />

      <Dialog open={crsDialogOpen} onClose={handleCrsCancel} fullWidth maxWidth="sm">
        <DialogTitle>Select the IFC source CRS</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {detectedCrs
              ? `The file declares ${detectedCrs}, which is not supported by this demo.`
              : 'The file does not declare a projected CRS. Select the CRS used by its coordinates.'}
          </Typography>
          <TextField
            label="Search or enter EPSG code"
            value={crsSearch}
            onChange={(event) => setCrsSearch(event.target.value)}
            fullWidth
            autoFocus
            helperText="Matching supported CRS options appear below."
          />
          <List
            dense
            sx={{
              mt: 1,
              maxHeight: 240,
              overflowY: 'auto',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            {matchingCrsOptions.length > 0 ? matchingCrsOptions.map((option) => (
              <ListItemButton key={option.code} onClick={() => setCrsSearch(option.code)}>
                <ListItemText primary={option.code} secondary={option.label.replace(`${option.code} — `, '')} />
              </ListItemButton>
            )) : (
              <ListItemText sx={{ px: 2, py: 1 }} primary="No matching CRS options" />
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCrsCancel}>Cancel</Button>
          <Button onClick={handleCrsContinue} variant="contained" disabled={!isSupportedCrs(crsSearch)}>
            Continue
          </Button>
        </DialogActions>
      </Dialog>

      {(isInspecting || error) && (
        <Box sx={{ position: 'absolute', top: 80, left: 16, zIndex: 2, bgcolor: 'white', p: 1.5 }}>
          {isInspecting && <Typography>Inspecting IFC CRS...</Typography>}
          {error && <Typography color="error">{error}</Typography>}
        </Box>
      )}

      {/* Floating element info panel */}
      <ElementInfoPanel
        element={selectedElement}
        onClose={() => {
          setSelectedElement(undefined);
          setSelectedExpressId(undefined);
        }}
      />
    </>
  );
};

export default IfcViewer; 