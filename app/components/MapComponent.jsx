"use client";

import React from 'react'
import {GoogleMap, useJsApiLoader} from '@react-google-maps/api';
import Link from "next/link";
import {doHeightMapConversion, getBoundsZoomLevel} from "../util";
import MapMovepad from "./MapMovepadComponent";
import * as styles from "./MapComponent.module.css"
import $ from 'jquery';


async function getReadinessStatus(west, east, south, north) {
    let queryString = "east=" + east + "&" + "west=" + west + "&" + "south=" + south + "&" + "north=" + north
    const res = await fetch("/api/fileIsReady?" + queryString, {cache: "no-cache"})
    return [res.status, await res.json()]

}

export function MapComponent() {
    const [valid, setValid] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [map, setMap] = React.useState(null)
    const [url, setUrl] = React.useState(null)
    const [imageUrl, setImageUrl] = React.useState(null)
    const [lat, setLat] = React.useState([28.55, 28.65])
    const [long, setLong] = React.useState([83.85, 83.95])
    const [selectionPolygon, setSelectionPolygon] = React.useState(null)

    const {isLoaded} = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "AIzaSyB9uKKAGJxnNgquq3f3UOvxDkHWRYgjqrk"
    })


    const onLoad = React.useCallback(function callback(map) {
        map = new google.maps.Map(document.getElementById("map"), {
            zoom: 8,
            center: {lat: (lat[0] + lat[1]) / 2, lng: (long[0] + long[1]) / 2},
            mapTypeId: "terrain",
            disableDefaultUI: true
        });

        selectionPolygon?.setMap(map)

        setMap(map)
    }, [])

    const onUnmount = React.useCallback(function callback(map) {
        setMap(null)
    }, [])

    const updateCoords = (long1, long2, lat1, lat2) => {
        setLat([Math.min(lat1, lat2), Math.max(lat1, lat2)])
        setLong([Math.min(long1, long2), Math.max(long1, long2)])
        setValid(true)

        // Define the LatLng coordinates for the polygon's path.
        const pathCoords = [{lat: lat1, lng: long1}, {lat: lat2, lng: long1},
            {lat: lat2, lng: long2}, {lat: lat1, lng: long2}, {lat: lat1, lng: long1}];


        const $map = $('#map')
        if (selectionPolygon == null) {
            const poly = new google.maps.Polygon({
                paths: pathCoords,
                strokeColor: "#FF0000",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#FF0000",
                fillOpacity: 0.35,
            });
            setSelectionPolygon(poly)
            poly.setMap(map)

        } else {
            selectionPolygon.setPath(pathCoords)
        }
        map.setCenter({lat: (lat1 + lat2) / 2, lng: (long1 + long2) / 2})
        const zoom = getBoundsZoomLevel(long1, long2, lat1, lat2, {height: $map.height(), width: $map.width()})
        map.setZoom(zoom)
    }

    const onCoordInputUpdate = () => {
        let lat1 = parseFloat(document.getElementById("min_lat").value)
        let lat2 = parseFloat(document.getElementById("max_lat").value)
        let long1 = parseFloat(document.getElementById("min_long").value)
        let long2 = parseFloat(document.getElementById("max_long").value)

        if ((!isNaN(lat1) && !isNaN(lat2) && !isNaN(long1) && !isNaN(long2)) && (lat1 < lat2 && long1 < long2)) {
            updateCoords(long1, long2, lat1, lat2, )
        } else {
            console.log("invalid coords", lat1, lat2, long1, long2)
        }
    }

    const checkStatus = (i = 0) => {
        setTimeout(async () => {
            const [status, jsonResult] = await getReadinessStatus(long[0], long[1], lat[0], lat[1])
            // console.log(status, jsonResult)
            if (jsonResult["status"] === 204) {
                console.log("retrying...(" + i + ")")
                if (i < 15) {
                    checkStatus(i + 1)
                }
            } else if (jsonResult["status"] === 200) {
                setUrl(jsonResult["url"])
                setImageUrl(jsonResult["png"])
                setLoading(false)
                console.log("done")
            }
        }, 5000)
    }

    const submitCoordinates = async () => {
        setLoading(true)
        setUrl(null)
        setImageUrl(null)
        const $map = $('#map')
        const zoom = getBoundsZoomLevel(... long, ... lat, {height: $map.height(), width: $map.width()})

        doHeightMapConversion(... long, ... lat, zoom).then(r => {})

        setTimeout(() => {
            checkStatus()
        }, 1000)
    }

    const onMapControl = (controlString) => {
        let lat1 = lat[0], lat2 = lat[1],
            long1 = long[0], long2 = long[1]
        let DIST = .05

        if (controlString === "right") {
            updateCoords(round(long1 + DIST), round(long2 + DIST), lat1, lat2)
        } else if (controlString === "left") {
            updateCoords( round(long1 - DIST), round(long2 - DIST), lat1, lat2)
        } else if (controlString === "down") {
            updateCoords(long1, long2, round(lat1 - DIST), round(lat2 - DIST))
        } else if (controlString === "up") {
            updateCoords(long1, long2, round(lat1 + DIST), round(lat2 + DIST))
        } else if (controlString === "expand") {
            updateCoords(round(long1 - DIST), round(long2 + DIST), round(lat1 - DIST), round(lat2 + DIST))
        } else if (controlString === "contract") {
            updateCoords(round(long1 + DIST), round(long2 - DIST), round(lat1 + DIST), round(lat2 - DIST))
        }
    }
    const round = (i) => {
        return Math.round(i * 10000) / 10000
    }


    const locations = [
        {location: "Everest", lnglat: [84, 85, 29.5, 30.5]},
        {location: "Yosemite", lnglat: [-119.65, -119.45, 37.65, 38.05]},
        {location: "Rio", lnglat: [ -43.35, -43.05, -23.00, -22.75]},
        {location: "Pleasant Lake", lnglat: [-70.55, -70.5, 44, 44.07]},
        {location: "Grand Canyon", lnglat: [-111.55, -112.85, 36.05, 36.85]},
    ]

    const area = Math.round(1000 * ((long[1] - long[0]) * (lat[1] - lat[0]))) / 1000

    return (
        <>
            {/* PRESETS */}
            <div className={styles.infoContainer}>
                <p>Change the minimum and maximum latitude values until you see the range you seek on the map above.
                    You may need to change zoom level to get a good view. You can also start with the following presets:</p>
                <ul className={styles.locationList}>
                    {locations.map((data, i) => {
                        return <li className={styles.locationListItem} key={"location_" + i} onClick={() => {
                            updateCoords(...data.lnglat)
                        }}>
                            {data.location}
                        </li>
                    })}
                </ul>
            </div>

            <div>
                {isLoaded ? (
                    <GoogleMap id={"map"} zoom={8} onLoad={onLoad} onUnmount={onUnmount}
                               mapContainerStyle={{maxWidth: "80vw", margin: "0 auto", width: "80vw", height: "500px"}}
                               bootstrapURLKeys={{key: process.env.REACT_APP_MAP_KEY, v: '3.30',}}>
                        <></>
                    </GoogleMap>
                ) : <></>}
            </div>

            <div className={styles.infoContainer}>
                <div className={styles.mapControlsContainer}>
                    <MapMovepad callback={onMapControl}/>
                    {url ? <Link className={styles.link} href={url}>SEE YOUR MAP</Link> : <></>}
                </div>
                {/*<div>*/}

                    {/*{url ? <Link className={styles.link} href={url}>SEE YOUR MAP</Link> : <></>}*/}


                <div className={styles.inputContainer}>
                    <form action="@/app/components/MapComponent" onChange={onCoordInputUpdate}>
                        <span className={styles.latitudeHeader}>{"[---Latitude---]"}</span>
                        <span className={styles.longitudeHeader}>{"[---Longitude---]"}</span>

                        <span className={styles.spacer}></span>
                        <input id={"max_lat"} key={"max_lat"} type="number" step={.05} defaultValue={lat[1]}  className={styles.in}/>
                        <span className={styles.spacer}></span>
                        <br/>

                        <input id={"min_long"} key={"min_long"} type="number" step={.05} defaultValue={long[0]} className={styles.in}/>
                        <span className={styles.spacer}></span>
                        <input id={"max_long"} key={"max_long"} type="number" step={.05} defaultValue={long[1]} className={styles.in}/>
                        <br/>
                        <span className={styles.spacer}></span>
                        <input id={"min_lat"} key={"min_lat"} type="number" step={.05} defaultValue={lat[0]}  className={styles.in}/>
                        <span className={styles.spacer}></span>

                    </form>
                </div>
                <br/>
                <button disabled={!valid}
                        className={(valid || loading) ? styles.enabledButtonStyle : styles.disabledButtonStyle}
                        onClick={submitCoordinates}> {loading ? "generating... please be patient (click again 30s if nothing happens)" : "Generate 3d"}</button>


                <p>Current Area: {area} degrees^2</p>
                {area>4? <p>NOTE: RUNNING ON MINIMAL SERVER -- LARGE AREAS TAKE A WHILE TO DOWNLOAD</p> :<></>}
            </div>
            {/*</div>*/}

        </>

    )
}


