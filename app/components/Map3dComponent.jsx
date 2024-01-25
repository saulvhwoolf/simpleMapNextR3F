"use client";
import React, {Suspense, useEffect, useState} from "react";
import {Canvas} from "@react-three/fiber";
import {Terrain} from "../Terrain";
import {FlyControls, MapControls, OrbitControls, Sky} from "@react-three/drei";
import {useRouter, useSearchParams} from "next/navigation";
import {getHeightMap} from "../util";

export function Map3dComponent() {
    const [heightMapUrl, setHeightMapUrl] = React.useState(null)
    const [textureUrl, setTextureUrl] = React.useState(null)
    const [heightRange, setHeightRange] = React.useState(null)
    const [dimensions, setDimensions] = React.useState(null)
    const [showWireframe, setShowWireframe] = React.useState(true)


    const searchParams = useSearchParams()
    const east = searchParams.get('east')
    const west = searchParams.get('west')
    const south = searchParams.get('south')
    const north = searchParams.get('north')

    const toggleWireframeVisibility = () => {
        setShowWireframe(!showWireframe)
    }

    useEffect(() => {
        if (heightMapUrl == null) {
            getHeightMap(west, east, south, north).then(async (hm) => {
                const res = await fetch(hm["json"])
                console.log(hm["img"], hm["json"])
                const vals = await res.json()
                setHeightMapUrl(hm["img"])
                setTextureUrl(hm["png"])
                setDimensions([parseFloat(vals["WIDTH"]), parseFloat(vals["HEIGHT"])])
                setHeightRange([parseFloat(vals["MIN"]), parseFloat(vals["MAX"])])
            })
        }
    }, [])
    let i = 0;

    return (
        <>

            {heightMapUrl && heightRange && dimensions?
                <>
                    <button onClick={toggleWireframeVisibility}>Toggle Wireframe {showWireframe?"Off":"On"}</button>
                    <div className={"cellContainer"}>
                        <Canvas camera={{position: [10, 30, 40] }}>
                            <fog attach="fog" args={["white", 10, 130]} />
                            <OrbitControls autoRotate={true} autoRotateSpeed={1}/>


                            <ambientLight/>
                            <pointLight intensity={4} position={[7, 500, 100]}/>
                            <Sky sunPosition={[7, 5, 1]}/>
                            <Suspense fallback={null}>
                                <Terrain showWireFrame={showWireframe} heightMapUrl={heightMapUrl} textureUrl={textureUrl} heightRange={heightRange} dimensions={dimensions} />
                            </Suspense>

                        </Canvas>
                    </div>
                    {dimensions?<img src={heightMapUrl} width={dimensions[0]} height={dimensions[1]} alt={"black and white height map"}></img>:<></>}

                </>
                :
                <>
                    <p>LOADING</p>
                </>
            }
        </>
    );

}


