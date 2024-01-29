import React from "react";
import {useLoader} from "@react-three/fiber";
import * as THREE from "three";
import {Plane} from "@react-three/drei";


export const Terrain = ({showWireFrame, heightMapUrl, textureUrl, heightRange, dimensions}) => {
    const height = useLoader(THREE.TextureLoader, heightMapUrl);
    let color = useLoader(THREE.TextureLoader, textureUrl);


    const MAX_WIDTH_OR_HEIGHT = 64
    // m * largerdimension = 64
    const largerDimension = Math.max(dimensions[0], dimensions[1])
    const smallerDimension = Math.min(dimensions[0], dimensions[1])
    const multiplier = 64 / largerDimension

    const dimRatio = [multiplier * dimensions[0], multiplier * dimensions[1]]

    // const n = (smallerDimension / largerDimension) * MAX_WIDTH_OR_HEIGHT
    // const dimRatio = (dimensions[0] > dimensions[1]? [MAX_WIDTH_OR_HEIGHT, n] : [n, MAX_WIDTH_OR_HEIGHT])


    const verticalScale = multiplier * (heightRange[1] - heightRange[0]) / 20
    console.log(verticalScale, dimRatio, heightRange[0], heightRange[1], dimensions[0], dimensions[1])

    return (
        <group>
            <Plane
                // visible={showWireFrame}
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -3, 0]}
                args={[dimRatio[0], dimRatio[1], 50, 50]}
            >
                <meshStandardMaterial
                    attach="material"
                    color="white"
                    wireframe={true}
                    displacementMap={height}
                    displacementScale={verticalScale}
                />
            </Plane>
            {/*{showWireFrame ? <></>*/}
            {/*    :*/}
            <Plane
                visible={!showWireFrame}
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, -3, 0]}
                args={[dimRatio[0], dimRatio[1], 1000, 1000]}
            >
                <meshStandardMaterial
                    attach="material"
                    color="white"
                    map={color}
                    metalness={.2}
                    displacementMap={height}
                    displacementScale={verticalScale}
                />
            </Plane>
            {/*}*/}
        </group>
    );
};


const MAX_WIDTH_OR_HEIGHT = 64

function getDimensionRatio(dimension) {

    const largerDimension = Math.max(dimension[0], dimension[1])
    const smallerDimension = Math.min(dimension[0], dimension[1])
    const n = (smallerDimension / largerDimension) * MAX_WIDTH_OR_HEIGHT

    return (dimension[0] > dimension[1] ? [MAX_WIDTH_OR_HEIGHT, n] : [n, MAX_WIDTH_OR_HEIGHT])
    // height / width  = n / 64
    // width  / height = n / 64
    // const ratio = heightRange[0]/heightRange[1]
}
