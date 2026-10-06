/**
 * Derived from mapbox-3d-tiles by Jianshun Yang (MIT License)
 * https://github.com/yangjs6/mapbox-3d-tiles
 */

import { type Map as MaplibreMap } from 'maplibre-gl';
import { WebGLRenderer, Scene, Camera } from 'three';
import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export default class ThreejsSceneRenderer {
	private renderer: WebGLRenderer;
	private labelRenderer: CSS2DRenderer;
	private hasLoggedRender = false;

	/**
	 * Creates a ThreejsSceneRenderer instance.
	 *
	 * @param map - The MapLibre map instance
	 * @param gl - The WebGL2 rendering context from MapLibre
	 */
	constructor(map: MaplibreMap, gl: WebGL2RenderingContext) {
		if (!gl || gl.isContextLost()) {
			throw new Error('WebGL context is lost or invalid');
		}

		this.renderer = new WebGLRenderer({
			alpha: true,
			antialias: true,
			canvas: map.getCanvas(),
			context: gl,
		});
		this.renderer.autoClear = false;

		this.renderer.shadowMap.enabled = true;
		this.labelRenderer = this.createLabelRenderer(map);
	}

	private createLabelRenderer(map: MaplibreMap): CSS2DRenderer {
		const container = map.getContainer();
		const labelRenderer = new CSS2DRenderer();

		labelRenderer.setSize(container.clientWidth, container.clientHeight);
		labelRenderer.domElement.style.position = 'absolute';
		labelRenderer.domElement.style.top = '0px';
		labelRenderer.domElement.style.pointerEvents = 'none';

		(map as any)._container.appendChild(labelRenderer.domElement);
		map.on('resize', () => {
			const { clientWidth, clientHeight } = map.getContainer();
			labelRenderer.setSize(clientWidth, clientHeight);
		});

		return labelRenderer;
	}

	getRenderer(): WebGLRenderer {
		return this.renderer;
	}

	render(scene: Scene, camera: Camera): void {
		// Reset WebGL state to avoid conflicts with MapLibre. MapLibre's map pass
		// can leave the shared depth buffer filled across the viewport, which would
		// otherwise hide the IFC model and transform gizmo completely.
		this.renderer.resetState();
		this.renderer.clearDepth();
		const canvas = this.renderer.domElement;
		this.renderer.setViewport(0, 0, canvas.width, canvas.height);
		if (!this.hasLoggedRender) {
			console.log('[Three] custom layer render', scene.children.length);
			this.hasLoggedRender = true;
		}
		this.renderer.render(scene, camera);
		this.labelRenderer.render(scene, camera);
	}

	dispose(): void {
		this.labelRenderer.domElement?.parentNode?.removeChild(this.labelRenderer.domElement);
		this.renderer?.dispose();
	}
}
