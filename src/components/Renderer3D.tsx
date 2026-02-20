import * as React from "react";
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import gsap from "gsap";

interface Renderer3DProps {
  elements?: any[];
  cameraTarget?: { position: [number, number, number], target?: [number, number, number] };
  autoRotate?: boolean;
  theme?: 'dark' | 'light';
}

/**
 * 3D Renderer component using Three.js.
 * Manages the scene, camera, lighting, and element rendering logic.
 */
export function Renderer3D({ elements, cameraTarget, autoRotate = true, theme = 'dark' }: Renderer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const objectsRef = useRef<Map<string, THREE.Object3D>>(new Map());
  const placeholderRef = useRef<THREE.Sprite | null>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
  } | null>(null);
  const hasInteractedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize Scene
    const scene = new THREE.Scene();
    const isDark = theme === 'dark';
    scene.background = new THREE.Color(isDark ? 0x1a1a1a : 0xf4f4f5); // zinc-100 fallback
    scene.fog = new THREE.FogExp2(isDark ? 0x1a1a1a : 0xf4f4f5, 0.02);

    // Camera
    const camera = new THREE.PerspectiveCamera(
      60,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(15, 10, 15);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false; // Will be enabled after first render
    controls.autoRotateSpeed = 1.0;

    const onStart = () => {
      hasInteractedRef.current = true;
      controls.autoRotate = false;
    };
    controls.addEventListener("start", onStart);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);

    // Grid Helper - More subtle
    const gridHelper = new THREE.GridHelper(100, 100, isDark ? 0x333333 : 0xcccccc, isDark ? 0x222222 : 0xeeeeee);
    gridHelper.position.y = -0.01; // Slightly below floor
    scene.add(gridHelper);

    sceneRef.current = { scene, camera, renderer, controls };

    // Resize handler
    const handleResize = () => {
      if (!containerRef.current || !sceneRef.current) return;
      const { camera, renderer } = sceneRef.current;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (sceneRef.current) {
        sceneRef.current.controls.update();
        sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
      }
    };
    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      gsap.killTweensOf(camera.position);
      if (sceneRef.current) {
        gsap.killTweensOf(sceneRef.current.controls.target);
        sceneRef.current.controls.removeEventListener("start", onStart);
      }
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;

    const { scene, controls } = sceneRef.current;
    const isDark = theme === 'dark';

    // Handle Placeholder
    if (!elements || elements.length === 0) {
      if (!placeholderRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.font = 'bold 24px Inter, system-ui, sans-serif';
          ctx.fillStyle = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText("Processing environment...", 256, 64);

          const texture = new THREE.CanvasTexture(canvas);
          const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
          const sprite = new THREE.Sprite(material);
          sprite.scale.set(8, 2, 1);
          sprite.position.set(0, 2, 0);
          scene.add(sprite);
          placeholderRef.current = sprite;

          // Pulse animation
          gsap.to(sprite.scale, {
            x: 8.5, y: 2.15,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut"
          });
        }
      }
      return;
    } else if (placeholderRef.current) {
      gsap.to(placeholderRef.current.scale, {
        x: 0, y: 0,
        duration: 0.5,
        ease: "back.in(2.5)",
        onComplete: () => {
          if (placeholderRef.current) {
            scene.remove(placeholderRef.current);
            placeholderRef.current = null;
          }
        }
      });
    }

    // Auto-rotate logic - stop while rendering new things
    if (controls) controls.autoRotate = false;

    // Clear old objects that aren't in the new list
    const currentIds = new Set(elements.map((el, index) => el.id || `el-${index}`));
    for (const [id, obj] of objectsRef.current.entries()) {
      if (!currentIds.has(id)) {
        scene.remove(obj);
        // Explicit Disposal to prevent "residual rendering" / leaks
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
        objectsRef.current.delete(id);
      }
    }

    // Render elements
    elements.forEach((el, index) => {
      const id = el.id || `el-${index}`;
      let obj = objectsRef.current.get(id);

      if (!obj) {
        let geometry: THREE.BufferGeometry;
        switch (el.type) {
          case "sphere":
            geometry = new THREE.SphereGeometry(el.radius || 1, 32, 32);
            break;
          case "cylinder":
            geometry = new THREE.CylinderGeometry(el.radius || 1, el.radius || 1, el.height || 2, 32);
            break;
          case "cube":
          case "cuboid":
          default:
            const s = el.size || [1, 1, 1];
            geometry = new THREE.BoxGeometry(s[0], s[1], s[2]);
            break;
        }

        const material = new THREE.MeshPhongMaterial({
          color: el.color || 0x808080,
          transparent: Boolean(el.opacity),
          opacity: el.opacity ?? 1,
          shininess: 100
        });
        obj = new THREE.Mesh(geometry, material);
        obj.castShadow = true;
        obj.receiveShadow = true;
        obj.name = id;

        // Initial state for "popping" animation - now sequenced after camera
        obj.scale.set(0.01, 0.01, 0.01);
        gsap.to(obj.scale, {
          x: 1, y: 1, z: 1,
          duration: 0.6,
          ease: "back.out(1.5)",
          delay: index * 0.1
        });

        scene.add(obj);
        objectsRef.current.set(id, obj);
      }

      // Update position/rotation (even for existing objects)
      if (el.position) obj.position.set(el.position[0], el.position[1], el.position[2]);
      if (el.rotation) obj.rotation.set(el.rotation[0], el.rotation[1], el.rotation[2]);
    });

    // Re-enable turntable after a short delay once elements are "popped", 
    // ONLY if user hasn't interacted yet AND autoRotate is enabled.
    const timer = setTimeout(() => {
      if (sceneRef.current && autoRotate && !hasInteractedRef.current) {
        sceneRef.current.controls.autoRotate = true;
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [elements, autoRotate, theme]);

  // Handle explicit autoRotate toggle
  useEffect(() => {
    if (sceneRef.current && autoRotate) {
      sceneRef.current.controls.autoRotate = true;
      hasInteractedRef.current = false; // Reset interaction if user explicitly enables rotate
    } else if (sceneRef.current) {
      sceneRef.current.controls.autoRotate = false;
    }
  }, [autoRotate]);

  // Manual Camera Movement Effect
  useEffect(() => {
    if (!cameraTarget || !sceneRef.current) return;
    const { camera, controls } = sceneRef.current;


    gsap.to(camera.position, {
      x: cameraTarget.position[0],
      y: cameraTarget.position[1],
      z: cameraTarget.position[2],
      duration: 2,
      ease: "power3.inOut"
    });

    if (cameraTarget.target) {
      gsap.to(controls.target, {
        x: cameraTarget.target[0],
        y: cameraTarget.target[1],
        z: cameraTarget.target[2],
        duration: 2,
        ease: "power3.inOut"
      });
    }
  }, [cameraTarget]);
  // Theme Update Effect
  useEffect(() => {
    if (!sceneRef.current) return;
    const { scene } = sceneRef.current;
    const isDark = theme === 'dark';
    const color = new THREE.Color(isDark ? 0x1a1a1a : 0xf4f4f5);

    gsap.to(scene.background, {
      r: color.r,
      g: color.g,
      b: color.b,
      duration: 1
    });

    if (scene.fog instanceof THREE.FogExp2) {
      gsap.to(scene.fog.color, {
        r: color.r,
        g: color.g,
        b: color.b,
        duration: 1
      });
    }

    // Update GridHelper color (find it in scene)
    scene.traverse((child) => {
      if (child instanceof THREE.GridHelper) {
        (child.material as any).color.set(isDark ? 0x333333 : 0xcccccc);
      }
    });
  }, [theme]);

  return <div ref={containerRef} className="w-full h-full relative" />;
}
