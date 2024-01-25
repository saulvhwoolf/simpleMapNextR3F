import React from "react";
import {useLoader} from "@react-three/fiber";
import * as THREE from "three";
import {Plane} from "@react-three/drei";


export const Terrain = ({showWireFrame, heightMapUrl, textureUrl, heightRange, dimensions}) => {
    const height = useLoader(THREE.TextureLoader, heightMapUrl);
    let color = useLoader(THREE.TextureLoader, textureUrl);
    const dimRatio = getDimensionRatio(dimensions)
    const veriticalScale = (heightRange[1]-heightRange[0])/512

    return (
        <group>

            {showWireFrame?
                <Plane
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, -3, 0]}
                    args={[dimRatio[0], dimRatio[1], 240, 240]}
                >
                    <meshStandardMaterial
                        attach="material"
                        color="white"
                        wireframe={true}
                        displacementMap={height}
                        displacementScale={veriticalScale}
                    />
                </Plane>
                :
                <Plane
                    rotation={[-Math.PI / 2, 0, 0]}
                    position={[0, -3, 0]}
                    args={[dimRatio[0], dimRatio[1], 240, 240]}
                >
                    <meshStandardMaterial
                        attach="material"
                        color="white"
                        // wireframe={false}
                        map={color}
                        displacementMap={height}
                        displacementScale={veriticalScale}
                    />
                </Plane>
            }
        </group>
    );
};


const MAX_WIDTH_OR_HEIGHT = 64

function getDimensionRatio(dimension) {

    const largerDimension = Math.max(dimension[0], dimension[1])
    const smallerDimension = Math.min(dimension[0], dimension[1])
    const n = (smallerDimension / largerDimension) * MAX_WIDTH_OR_HEIGHT

    return (dimension[0] > dimension[1]? [MAX_WIDTH_OR_HEIGHT, n] : [n, MAX_WIDTH_OR_HEIGHT])
    // height / width  = n / 64
    // width  / height = n / 64
    // const ratio = heightRange[0]/heightRange[1]
}
