"use client";
import React, {Suspense, useEffect, useState} from "react";
import {Canvas} from "@react-three/fiber";
import {Terrain} from "./Terrain";
import {OrbitControls, Sky, Sphere} from "@react-three/drei";
import {useSearchParams} from "next/navigation";
import {getHeightMap} from "../../util";
import * as styles from "./Map3dComponent.module.css"


export function Map3dComponent() {
    const [heightMapUrl, setHeightMapUrl] = React.useState(null)
    const [textureUrl, setTextureUrl] = React.useState(null)
    const [heightRange, setHeightRange] = React.useState(null)
    const [dimensions, setDimensions] = React.useState(null)
    const [showWireframe, setShowWireframe] = React.useState(false)


    const searchParams = useSearchParams()
    const east = searchParams.get('east'), west = searchParams.get('west'),
        south = searchParams.get('south'), north = searchParams.get('north')

    const toggleWireframeVisibility = () => {
        setShowWireframe(!showWireframe)
    }

    useEffect(() => {
        if (heightMapUrl == null) {
            getHeightMap(west, east, south, north).then(async (hm) => {
                const res = await fetch(hm["json"])
                const vals = await res.json()
                setHeightMapUrl(hm["img"])
                setTextureUrl(hm["png"])
                setDimensions([parseFloat(vals["WIDTH"]), parseFloat(vals["HEIGHT"])])
                setHeightRange([parseFloat(vals["MIN"]), parseFloat(vals["MAX"])])
            })
        }
    }, [])

    return (
        <>
            {heightMapUrl && heightRange && dimensions?
                <>
                    <button onClick={toggleWireframeVisibility}>Toggle Wireframe {showWireframe?"Off":"On"}</button>
                    <div className={styles.cellContainer}>
                        <Canvas camera={{position: [10, 30, 40] }}>
                            <fog attach="fog" args={["white", 40, 100]} />
                            <OrbitControls autoRotate={true} autoRotateSpeed={1}/>
                            {/*<ambientLight/>*/}
                            {/*<Sphere position={[0, 10, 0]}>*/}
                            {/*    <meshStandardMaterial color="hotpink" />*/}
                            {/*</Sphere>*/}
                            <directionalLight position={[5, 5, 5]} intensity={2} />
                            <directionalLight position={[-5, -5, -5]} intensity={1} />
                            <pointLight intensity={10} position={[0, 10, 0]} color="#fff"/>
                            <Sky sunPosition={[7, 5, 1]}/>
                            <Suspense fallback={null}>
                                <Terrain showWireFrame={showWireframe} heightMapUrl={heightMapUrl}
                                         textureUrl={textureUrl} heightRange={heightRange} dimensions={dimensions} />
                            </Suspense>

                        </Canvas>
                    </div>
                    {dimensions?
                        <img src={heightMapUrl} width={dimensions[0]} height={dimensions[1]}
                             alt={"black and white height map"}></img>
                        :<></>}
                </>
                :
                <><p>LOADING</p></>
            }
        </>
    );

}


