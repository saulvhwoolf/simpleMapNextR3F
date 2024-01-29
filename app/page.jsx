"use client";
import styles from "./page.module.css";
import ControllerWidget from "./components/ControllerWidget/ControllerWidget";
import {GoogleMapWidget} from "./components/GoogleMapWidget/GoogleMapWidget";
import * as React from 'react'
import $ from "jquery";
import {doHeightMapConversion, getBoundsZoomLevel} from "./util";
import Link from "next/link";
import Image from "next/image";


async function getReadinessStatus(west, east, south, north) {
    let queryString = "east=" + east + "&" + "west=" + west + "&" + "south=" + south + "&" + "north=" + north
    const res = await fetch("/api/fileIsReady?" + queryString, {cache: "no-cache"})
    return [res.status, await res.json()]

}

export default function HomePage() {
    const [neCoord, setNECoord] = React.useState({lng: -70, lat: 30})
    const [swCoord, setSWCoord] = React.useState({lng: -60, lat: 40})
    const [stepsize, setStepsize] = React.useState(0.088)
    // const [updateMapCallback, setUpdateMapCallback] = React.useState(null)

    const mapWidgetRef = React.useRef()

    const [isValid, setIsValid] = React.useState(false)
    const [error, setError] = React.useState(null)
    const [loading, setLoading] = React.useState(false)
    const [result, setResult] = React.useState(null)

    const updateCoords = (long1, long2, lat1, lat2, moveCamera=false) => {
        long1 = Math.round(long1*1000000)/1000000
        long2 = Math.round(long2*1000000)/1000000
        lat1 = Math.round(lat1*1000000)/1000000
        lat2 = Math.round(lat2*1000000)/1000000

        // console.log("update coords", long1, long2, lat1, lat2)
        const ne = {lng: Math.max(long1, long2), lat: Math.max(lat1, lat2)},
            sw = {lng: Math.min(long1, long2), lat: Math.min(lat1, lat2)}
        const [valid, err] = validateCoordinates(ne, sw)
        mapWidgetRef.current.updateMap(ne, sw)
        setIsValid(valid)
        setError(err)
        setNECoord(ne)
        setSWCoord(sw)
        if (moveCamera) {
            centerMapOnCoordinates(ne, sw)
        }
    }

    const consumeControllerEvent = (event) => {
        console.log(event)
        if ("udlr".indexOf(event[0]) !== -1) {
            if (event.length === 2) {
                if (event[0] === "d" && event[1] === "d") {
                    updateCoords(neCoord.lng, swCoord.lng, neCoord.lat, swCoord.lat - stepsize)
                } else if (event[0] === "d" && event[1] === "u") {
                    updateCoords(neCoord.lng, swCoord.lng, neCoord.lat, swCoord.lat + stepsize)
                } else if (event[0] === "u" && event[1] === "u") {
                    updateCoords(neCoord.lng, swCoord.lng, neCoord.lat + stepsize, swCoord.lat)
                } else if (event[0] === "u" && event[1] === "d") {
                    updateCoords(neCoord.lng, swCoord.lng, neCoord.lat - stepsize, swCoord.lat)
                } else if (event[0] === "l" && event[1] === "l") {
                    updateCoords(neCoord.lng, swCoord.lng - stepsize, neCoord.lat, swCoord.lat)
                } else if (event[0] === "l" && event[1] === "r") {
                    updateCoords(neCoord.lng, swCoord.lng + stepsize, neCoord.lat, swCoord.lat)
                } else if (event[0] === "r" && event[1] === "r") {
                    updateCoords(neCoord.lng + stepsize, swCoord.lng, neCoord.lat, swCoord.lat)
                } else if (event[0] === "r" && event[1] === "l") {
                    updateCoords(neCoord.lng - stepsize, swCoord.lng, neCoord.lat, swCoord.lat)
                }
            } else {
                if (event[0] === "d") {
                    updateCoords(neCoord.lng, swCoord.lng, neCoord.lat - stepsize, swCoord.lat - stepsize)
                } else if (event[0] === "u") {
                    updateCoords(neCoord.lng, swCoord.lng, neCoord.lat + stepsize, swCoord.lat + stepsize)
                } else if (event[0] === "l") {
                    updateCoords(neCoord.lng - stepsize, swCoord.lng - stepsize, neCoord.lat, swCoord.lat)
                } else if (event[0] === "r") {
                    updateCoords(neCoord.lng + stepsize, swCoord.lng + stepsize, neCoord.lat, swCoord.lat)
                }
            }
        } else if (event[0] === "slider") {
            const steps = [.00001, .00005, .0001, .0005, .001, .005, .01, .05, .1, .5, 1, 5]

            const index = Math.floor((event[1]/100) * steps.length)
            // const sliderValue = Math.max(parseInt(event[1]) / 10, .01)
            // const decimals = (Math.floor(sliderValue) - 5 ) / 4
            // const value = (sliderValue % 1)
            // const result = Math.round(1000000 * value * Math.pow(10, decimals)) / 1000000
            const result = steps[index]
            console.log(event[1] , index, result)
            setStepsize(result)
        } else if (event[0] === "center") {
            let width = neCoord.lng - swCoord.lng,
                height = neCoord.lat - swCoord.lat
            const coords = mapWidgetRef.current.getCenterCoordinates()
            updateCoords(coords.lng - width/2, coords.lng + width/2, coords.lat - height/2, coords.lat + height/2)
        } else if (event[0] === "find") {
            centerMapOnCoordinates(neCoord, swCoord)
        } else if (event[0] === "expand") {
            updateCoords(neCoord.lng + stepsize, swCoord.lng - stepsize, neCoord.lat + stepsize, swCoord.lat - stepsize)
        } else if (event[0] === "contract") {
            updateCoords(neCoord.lng - stepsize, swCoord.lng + stepsize, neCoord.lat - stepsize, swCoord.lat + stepsize)

        }
    }

    const centerMapOnCoordinates = (ne, sw) => {
        let coords = {
            lng: (ne.lng + sw.lng)/2,
            lat: (ne.lat + sw.lat)/2
        }
        const zoom = getBoundsZoomLevel(sw.lng, ne.lng, sw.lat, ne.lat, {width: 640, height: 640})
        mapWidgetRef.current.lookAtCoordinates(coords, zoom)
    }

    const onCoordInputUpdate = () => {
        let lat1 = parseFloat(document.getElementById("min_lat").value)
        let lat2 = parseFloat(document.getElementById("max_lat").value)
        let long1 = parseFloat(document.getElementById("min_long").value)
        let long2 = parseFloat(document.getElementById("max_long").value)

        if ((!isNaN(lat1) && !isNaN(lat2) && !isNaN(long1) && !isNaN(long2)) && (lat1 < lat2 && long1 < long2)) {
            updateCoords(long1, long2, lat1, lat2)
        } else {
            console.log("invalid coords", lat1, lat2, long1, long2)
        }
    }

    const checkStatus = (i = 0) => {
        setTimeout(async () => {
            const [status, jsonResult] = await getReadinessStatus(swCoord.lng, neCoord.lng, swCoord.lat, neCoord.lat)
            // console.log(status, jsonResult)
            if (jsonResult["status"] === 204) {
                console.log("retrying...(" + i + ")")
                if (i < 15) {
                    checkStatus(i + 1)
                }
            } else if (jsonResult["status"] === 200) {
                setResult({
                    url:jsonResult["url"],
                    png:jsonResult["png"],
                    image:jsonResult["png"]
                })
                setLoading(false)
                console.log("done")
            }
        }, 5000)
    }

    const submitCoordinates = async () => {
        setLoading(true)
        setResult(null)
        // setUrl(null)
        // setImageUrl(null)
        const $map = $('#map')
        const zoom = getBoundsZoomLevel(swCoord.lng, neCoord.lng, swCoord.lat, neCoord.lat, {height: $map.height(), width: $map.width()})

        doHeightMapConversion(swCoord.lng, neCoord.lng, swCoord.lat, neCoord.lat, zoom).then(r => {})

        setTimeout(() => {
            checkStatus()
        }, 1000)
    }



    const locations = [
        {location: "Everest", lnglat: [84, 85, 29.5, 30.5]},
        {location: "Yosemite", lnglat: [-119.65, -119.45, 37.65, 38.05]},
        {location: "Rio", lnglat: [ -43.35, -43.05, -23.00, -22.75]},
        {location: "Pleasant Lake", lnglat: [-70.55, -70.5, 44, 44.07]},
        {location: "Grand Canyon", lnglat: [-111.55, -112.85, 36.05, 36.85]},
    ]

    return (
        <main className={styles.main}>
            <div className={styles.mapContainer}>

                <GoogleMapWidget ref={mapWidgetRef}/>
            </div>
            <div className={styles.controlContainer} style={{width: "400px"}}>
                <p>Make a selection on the map to the right in order to generate a 3d topographical map! Use the controls below:</p>
                <ControllerWidget callback={consumeControllerEvent}/>

                <p>You can also adjust the longitude and latitude manually:</p>
                <div style={{position:"relative", display:"block", textAlign: "center"}}>
                    <input id={"step_size"} key={"step_size"} type="number" step={.01} value={stepsize}  className={styles.in}/>

                    <form action="" onChange={onCoordInputUpdate} style={{display:"inline-block"}}>
                        {/*<span className={styles.latitudeHeader}>{"[---Latitude---]"}</span>*/}
                        {/*<span className={styles.longitudeHeader}>{"[---Longitude---]"}</span>*/}

                        <span className={styles.spacer}></span>
                        <input id={"max_lat"} key={"max_lat"} type="number" step={stepsize} value={neCoord.lat}  className={styles.in}/>
                        <span className={styles.spacer}></span>
                        <br/>

                        <input id={"min_long"} key={"min_long"} type="number" step={stepsize} value={swCoord.lng} className={styles.in}/>
                        <span className={styles.spacer}></span>
                        <input id={"max_long"} key={"max_long"} type="number" step={stepsize} value={neCoord.lng} className={styles.in}/>
                        <br/>
                        <span className={styles.spacer}></span>
                        <input id={"min_lat"} key={"min_lat"} type="number" step={stepsize} value={swCoord.lat}  className={styles.in}/>
                        <span className={styles.spacer}></span>

                    </form>
                </div>

                <p>You can choose any of the regions below to get started.</p>
                <ul className={styles.locationList}>
                    {locations.map((data, i) => {
                        return <li className={styles.locationListItem} key={"location_" + i} onClick={() => {
                            updateCoords(...data.lnglat, true)
                        }}>
                            {data.location}
                        </li>
                    })}
                </ul>


                <p>Use the button below to submit your region and see a 3d preview:</p>

                {loading?
                    <button className={`${styles.submitButton} ${styles.disabled}`}><div className={styles.loading}>Loading</div></button>
                    :
                    isValid?
                        <button className={styles.submitButton} onClick={submitCoordinates}>Generate 3d</button>
                        :
                        <>
                            <button className={`${styles.submitButton} ${styles.disabled} ${styles.struck}`}>Generate 3d</button>
                            {error!=null?<p>ERROR: {error}</p>:<></>}
                        </>
                }


                {result ? <Link className={styles.mapLink} href={result.url}>SEE YOUR MAP</Link> : <></>}
                {result?
                    <>
                        <p>{result.url}, {result.png}, {result.image}</p>
                        {/*<Image src={result.png} alt="" width={100} height={100}  style={{display: "inline-block"}}/>*/}
                        {/*<Image src={result.image} alt="" width={100} height={100}  style={{display: "inline-block"}}/>*/}
                    </>
                    :<></>}
                {/*<Image src={"/fromBucket?file=/public/hm_e-42.962_w-43.35_s-23_n-22.662.jpg"} alt="" width={100} height={100} style={{display: "inline-block"}}/>*/}

                {/*<Link className={styles.mapLink} href={"/"}>MAP IS DONE <br/> CLICK HERE TO SEE</Link>*/}
            </div>


        </main>
    )
}


function validateCoordinates(ne, sw) {
    const area = Math.round(1000 * ((ne.lat - sw.lat) * (ne.lng - sw.lng))) / 1000
    if (area > 20) {
        return [false, "Region invalid, area too large"]
    } else if (area === 0) {
        return [false, "Region invalid, nothing selected"]
    }
    return [true, "Region valid"]
}
