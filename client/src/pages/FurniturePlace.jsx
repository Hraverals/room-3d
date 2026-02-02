import React, { useEffect, useState, Suspense } from "react";
import { useParams, Link } from "react-router";
import axios from 'axios';
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html } from "@react-three/drei";
import * as THREE from "three";
import { TransformControls } from "three-stdlib";

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

function NativeFurnitureSystem() {
    const { scene, camera, gl, controls } = useThree();

    useEffect(() => {
        const transformControls = new TransformControls(camera, gl.domElement);
        scene.add(transformControls);

        transformControls.addEventListener("dragging-changed", (event) => {
            if (controls) controls.enabled = !event.value;
        });

        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        const createFurniture = (point) => {
            const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
            const material = new THREE.MeshStandardMaterial({ color: 0xff4444 });
            const furniture = new THREE.Mesh(geometry, material);

            furniture.userData = { isFurniture: true, id: Date.now() };

            furniture.position.copy(point);
            furniture.position.y += 0.25;

            scene.add(furniture);
            transformControls.attach(furniture);
        };

        const handleDoubleClick = (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, camera);

            const intersects = raycaster.intersectObjects(scene.children, true);

            if (intersects.length > 0) {
                let target = intersects[0].object;

                let isControl = false;
                let t = target;
                while (t) {
                    if (t.isTransformControls || t.type === 'Line') {
                        isControl = true;
                        break;
                    }
                    t = t.parent;
                }

                if (!isControl) {
                    if (target.userData.isFurniture) {
                        transformControls.attach(target);
                    }
                    else {
                        createFurniture(intersects[0].point);
                    }
                }
            }
        };

        const handleKeyDown = (event) => {
            switch (event.key.toLowerCase()) {
                case "w": transformControls.setMode("translate"); break;
                case "e": transformControls.setMode("rotate"); break;
                case "r": transformControls.setMode("scale"); break;
                case "escape": transformControls.detach(); break;
                case "delete":
                case "backspace":
                    if (transformControls.object) {
                        const target = transformControls.object;
                        transformControls.detach();
                        scene.remove(target);

                        if (target.geometry) target.geometry.dispose();
                        if (target.material) target.material.dispose();
                    }
                    break;
            }
        };

        window.addEventListener("dblclick", handleDoubleClick);
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("dblclick", handleDoubleClick);
            window.removeEventListener("keydown", handleKeyDown);
            if (transformControls) {
                transformControls.detach();
                scene.remove(transformControls);
                transformControls.dispose();
            }
        };
    }, [scene, camera, gl, controls]);

    return null;
}

function HouseModel({ url }) {
    const { scene } = useGLTF(url);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const code = e.code;
            if (code === 'KeyX') scene.rotation.x += Math.PI / 2;
            if (code === 'KeyY') scene.rotation.y += Math.PI / 2;
            if (code === 'KeyZ') scene.rotation.z += Math.PI / 2;
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [scene]);

    return <primitive object={scene} />;
}


function FurnitureArranger() {
    const { urlid } = useParams();
    const [glbUrl, setGlbUrl] = useState(null);

    useEffect(() => {
        axios.get(`${SERVER_URL}/api/room/${urlid}`)
            .then(res => setGlbUrl(`${SERVER_URL}/api/glbs/${res.data.room.glb.name}`))
            .catch(err => console.log(err));
    }, [urlid]);

    return (
        <div className="w-full h-screen bg-gray-200">
            {glbUrl && (
                <Canvas
                    dpr={[1, 2]}
                    camera={{ fov: 60, position: [0, 5, 10] }}
                >
                    <Suspense fallback={<Html center>Loading...</Html>}>
                        <ambientLight intensity={0.6} />
                        <pointLight position={[10, 20, 10]} />

                        <OrbitControls makeDefault />

                        <HouseModel url={glbUrl} />

                        <NativeFurnitureSystem />

                    </Suspense>
                </Canvas>
            )}

            {/* 오른쪽 위에 나가기 버튼임 */}
            <Link to={`/${urlid}`} className="fixed top-10 right-10 btn btn-circle btn-ghost btn-xl hover:scale-110 transition-transform z-50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" id="times" className="size-10 fill-current"><path d="M13.41,12l4.3-4.29a1,1,0,1,0-1.42-1.42L12,10.59,7.71,6.29A1,1,0,0,0,6.29,7.71L10.59,12l-4.3,4.29a1,1,0,0,0,0,1.42,1,1,0,0,0,1.42,0L12,13.41l4.29,4.3a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42Z"></path></svg>
            </Link>

            {/* 왼쪽 위에 설명창임. 사실 daisyui에 kbd라는 키보드 키 예쁘게 보여주는거 있길래 써보고 싶었음 히히 */}
            <div className="fixed top-10 left-10 card w-60 bg-base-100 shadow-md z-50 text-xs pointer-events-none">
                <div className="card-body p-4 gap-2">
                    <h2 className="card-title text-sm text-primary">조작 가이드</h2>
                    <div className="divider my-0"></div>
                    <div className="flex justify-between items-center">
                        <span>생성/선택</span>
                        <div>
                            <kbd className="kbd kbd-xs">더블 클릭</kbd>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span>이동/회전/크기</span>
                        <div>
                            <kbd className="kbd kbd-xs">W</kbd> <kbd className="kbd kbd-xs">E</kbd> <kbd className="kbd kbd-xs">R</kbd>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span>삭제</span>
                        <div>
                            <kbd className="kbd kbd-xs">Del</kbd>
                        </div>
                    </div>
                    <div className="divider my-0"></div>
                    <div className="flex justify-between items-center text-secondary">
                        <span>집 회전</span>
                        <div>
                            <kbd className="kbd kbd-xs">X</kbd> <kbd className="kbd kbd-xs">Y</kbd> <kbd className="kbd kbd-xs">Z</kbd>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FurnitureArranger;