import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import { useThree } from '../contexts/ThreeContext';

export interface MlThreeGizmoProps {
	target?: THREE.Object3D;
	mode?: 'translate' | 'rotate' | 'scale';
	enabled?: boolean;
	space?: 'world' | 'local';
	size?: number;
	onObjectChange?: (object: THREE.Object3D) => void;
}

const MlThreeGizmo = (props: MlThreeGizmoProps) => {
	const { target, mode = 'translate', enabled = true, space = 'world', size, onObjectChange } = props;
	const { scene, camera, renderer, map, sceneRoot } = useThree();
	const controlsRef = useRef<TransformControls | null>(null);

	// Keep the latest callback without recreating the controls on every render
	const onObjectChangeRef = useRef(onObjectChange);
	onObjectChangeRef.current = onObjectChange;

	useEffect(() => {
		if (!scene || !camera || !renderer || !map || !sceneRoot) return;

		const domElement = renderer.getRenderer().domElement;
		const controls = new TransformControls(camera, domElement);
		controlsRef.current = controls;

		controls.setMode(mode);
		controls.setSpace(space);
		if (size) {
			controls.setSize(size);
		}

		// Add TransformControls to the sceneRoot
		sceneRoot.add((controls as any)._root);

		// Disable map interaction when using transform controls
		const onDraggingChanged = (event: any) => {
			if (event.value) {
				map.dragPan.disable();
				map.scrollZoom.disable();
			} else {
				map.dragPan.enable();
				map.scrollZoom.enable();
			}
		};

		controls.addEventListener('dragging-changed', onDraggingChanged);

		const handleObjectChange = () => {
			if (controls.object) {
				onObjectChangeRef.current?.(controls.object);
			}
		};
		controls.addEventListener('objectChange', handleObjectChange);

		return () => {
			controls.removeEventListener('dragging-changed', onDraggingChanged);
			controls.removeEventListener('objectChange', handleObjectChange);
			controls.detach();
			sceneRoot.remove((controls as any)._root);
			controls.dispose();
			controlsRef.current = null;
		};
	}, [scene, camera, renderer, map, sceneRoot]);

	// Update target object
	useEffect(() => {
		if (!controlsRef.current) return;

		if (target) {
			controlsRef.current.attach(target);
		} else {
			controlsRef.current.detach();
		}
	}, [target]);

	// Update mode
	useEffect(() => {
		if (!controlsRef.current) return;
		controlsRef.current.setMode(mode);
	}, [mode]);

	// Update enabled state
	useEffect(() => {
		if (!controlsRef.current) return;
		controlsRef.current.enabled = enabled;
	}, [enabled]);

	// Update space
	useEffect(() => {
		if (!controlsRef.current) return;
		controlsRef.current.setSpace(space);
	}, [space]);

	// Update size
	useEffect(() => {
		if (!controlsRef.current || !size) return;
		controlsRef.current.setSize(size);
	}, [size]);

	return null;
};

export default MlThreeGizmo;
