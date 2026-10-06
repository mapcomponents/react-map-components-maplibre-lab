import { useEffect, useRef } from "react";
import { useThree } from "../contexts/ThreeContext";
import * as THREE from "three";

const Lights = () => {
    const { scene } = useThree();
    const lightsRef = useRef<THREE.Light[]>([]);

    useEffect(() => {
        if (!scene) return;

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(100, 100, 100).normalize();
        scene.add(directionalLight);

        const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight2.position.set(-100, -100, 100).normalize();
        scene.add(directionalLight2);

        lightsRef.current = [ambientLight, directionalLight, directionalLight2];

        return () => {
            lightsRef.current.forEach((light) => scene.remove(light));
        };
    }, [scene]);

    return null;
};

export default Lights; 