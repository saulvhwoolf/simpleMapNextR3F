"use client";

import React from 'react'
import {GoogleMap, useJsApiLoader} from '@react-google-maps/api';
import Link from "next/link";
import {doHeightMapConversion} from "../util";
import MapMovepad from "./MapMovepadComponent";
import * as styles from "./MapComponent.module.css"


const containerStyle = {
    maxWidth: '80vw',
    margin: '0 auto',
    width: '800px',
    height: '500px',
};

async function getData(west, east, south, north) {
    let queryString = "east=" + east + "&" + "west=" + west + "&" + "south=" + south + "&" + "north=" + north
    const res = await fetch("/api/fileIsReady?" + queryString, {
        cache: "no-cache"

    })
    return [res.status, await res.json()]

}

export function MapComponent() {
    const {isLoaded} = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "AIzaSyB9uKKAGJxnNgquq3f3UOvxDkHWRYgjqrk"
    })

    const [valid, setValid] = React.useState(false)
    const [loading, setLoading] = React.useState(false)
    const [map, setMap] = React.useState(null)
    const [url, setUrl] = React.useState(null)
    const [imageUrl, setImageUrl] = React.useState(null)
    const [lat, setLat] = React.useState([28.55, 28.65])
    const [long, setLong] = React.useState([83.85, 83.95])

    const [selectionPolygon, setSelectionPolygon] = React.useState(null)

    function initMap() {
        return new google.maps.Map(document.getElementById("map"), {
            zoom: 8,
            center: {lat: (lat[0] + lat[1]) / 2, lng: (long[0] + long[1]) / 2},
            mapTypeId: "terrain",
        });
    }

    const onLoad = React.useCallback(function callback(map) {
        map = initMap()
        if (selectionPolygon != null) {
            selectionPolygon.setMap(map)
        }
        setMap(map)
    }, [])

    const onUnmount = React.useCallback(function callback(map) {
        setMap(null)
    }, [])

    const updateCoords = (lat1, lat2, long1, long2) => {
        setLat([Math.min(lat1, lat2), Math.max(lat1, lat2)])
        setLong([Math.min(long1, long2), Math.max(long1, long2)])
        setValid(true)

        // Define the LatLng coordinates for the polygon's path.
        const pathCoords = [{lat: lat1, lng: long1}, {lat: lat2, lng: long1},
            {lat: lat2, lng: long2}, {lat: lat1, lng: long2}, {lat: lat1, lng: long1}];


        if (selectionPolygon == null) {
            const poly = new google.maps.Polygon({
                paths: pathCoords,
                strokeColor: "#FF0000",
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: "#FF0000",
                fillOpacity: 0.35,
            });
            poly.setMap(map)
            setSelectionPolygon(poly)
            map.setCenter({lat: (lat1 + lat2) / 2, lng: (long1 + long2) / 2})
        } else {
            selectionPolygon.setPath(pathCoords)
            map.setCenter({lat: (lat1 + lat2) / 2, lng: (long1 + long2) / 2})
        }
    }

    const onCoordInputUpdate = () => {
        let lat1 = parseFloat(document.getElementById("min_lat").value)
        let lat2 = parseFloat(document.getElementById("max_lat").value)
        let long1 = parseFloat(document.getElementById("min_long").value)
        let long2 = parseFloat(document.getElementById("max_long").value)
        if ((!isNaN(lat1) && !isNaN(lat2) && !isNaN(long1) && !isNaN(long2)) && (lat1 < lat2 && long1 < long2)) {
            updateCoords(lat1, lat2, long1, long2)
        } else {
            console.log("invalid coords")
        }
    }

    const checkStatus = (i=0) => {
        setTimeout(async () => {
            const [status, jsonResult] = await getData(long[0], long[1], lat[0], lat[1])
            // console.log(status, jsonResult)
            if (jsonResult["status"] === 204) {
                console.log("retrying...("+i+")")
                if (i < 15) {
                    checkStatus(i+1)
                }
            } else if (jsonResult["status"] === 200) {
                setUrl(jsonResult["url"])
                setImageUrl(jsonResult["jpg"])
                setLoading(false)
                console.log("done")
            }
        }, 5000)
    }

    const submitCoordinates = async () => {
        setLoading(true)
        doHeightMapConversion(long[0], long[1], lat[0], lat[1]).then(r => {})
        setTimeout(()=>{checkStatus()}, 1000)
    }

    const onMapControl = (controlString) => {
        let lat1 = lat[0], lat2 = lat[1],
            long1 = long[0], long2 = long[1]
        let DIST = .05

        if(controlString === "right") {
            updateCoords(lat1, lat2, round(long1+DIST), round(long2+DIST))
        } else if(controlString === "left") {
            updateCoords(lat1, lat2, round(long1-DIST), round(long2-DIST))
        } else if(controlString === "down") {
            updateCoords(round(lat1-DIST), round(lat2-DIST), long1, long2)
        } else if(controlString === "up") {
            updateCoords(round(lat1+DIST), round(lat2+DIST), long1, long2)
        } else if(controlString === "expand") {
            updateCoords(round(lat1-DIST), round(lat2+DIST), round(long1-DIST), round(long2+DIST))
        } else if(controlString === "contract") {
            updateCoords(round(lat1+DIST), round(lat2-DIST), round(long1+DIST), round(long2-DIST))
        }
    }
    const round = (i) => {
        return Math.round(i*100)/100
    }


    return (
        <>
            <ul className={styles.locationList}>
                <li onClick={()=>{updateCoords(29.5, 30.5, 84, 85)}} className={styles.locationListItem}>Everest</li>
                <li onClick={()=>{updateCoords(37.65, 38.05, -119.65, -119.45)}} className={styles.locationListItem}>Yosemite</li>
                {/*<li onClick={()=>{updateCoords(-23.00, -22.75, -43.35, -43.05)}} className={styles.locationListItem}>Rio</li>*/}
                {/*<li onClick={()=>{updateCoords(44, 44.07, -70.55, -70.5)}} className={styles.locationListItem}>Pleasant Lake</li>*/}
                <li onClick={()=>{updateCoords(36.05, 36.85, -111.55, -112.85)}} className={styles.locationListItem}>Grand Canyon</li>
            </ul>
            <div>
                {isLoaded ? (
                    <GoogleMap id={"map"} mapContainerStyle={containerStyle} zoom={8} onLoad={onLoad}
                               onUnmount={onUnmount} bootstrapURLKeys={{key: process.env.REACT_APP_MAP_KEY, v: '3.30',}}>
                        <></>
                    </GoogleMap>
                ) : <></>}
            </div>
            <div>

                <div style={{"float": "left", "width": "48%", "padding": "10px", "textAlign": "center", maxWidth: '90vw', margin: '0 auto',}}>
                    <MapMovepad callback={onMapControl}/>
                    {url ?
                        <Link style={{"display": "block", "color": "blue", "textDecoration": "underline"}} href={url}>
                            YOUR MAP
                        </Link>
                        : <></>
                    }
                </div>
                <div style={{"float": "right", "width": "48%", maxWidth: '80vw', margin: '10px auto',
                    "padding": "10px", "backgroundColor": "rgb(200,200,200)"}}>
                    <p>Change the minimum and maximum latitude values until you see the range you seek on the map above.
                        You may need to change zoom level to get a good view.</p>
                    {url ?
                        <Link style={{"display": "block", "color": "blue", "textDecoration": "underline"}} href={url}>
                            YOUR MAP
                        </Link>
                        : <></>
                    }
                    <p>NOTE: RUNNING ON MINIMAL SERVER -- LARGE AREAS TAKE A WHILE TO DOWNLOAD</p>

                    <form action="@/app/components/MapComponent" onChange={onCoordInputUpdate}>
                        <br/>
                        <label htmlFor="max_lat">Max Latitude</label>
                        <input id={"max_lat"} type="number" step={.05} defaultValue={lat[1]}/><br/>
                        <label htmlFor="min_lat">Min Latitude</label>
                        <input id={"min_lat"} type="number" step={.05} defaultValue={lat[0]}/><br/>
                        <br/>
                        <label htmlFor="max_long">Max Longitude</label>
                        <input id={"max_long"} type="number" step={.05} defaultValue={long[1]}/><br/>
                        <label htmlFor="min_long">Min Longitude</label>
                        <input id={"min_long"} type="number" step={.05} defaultValue={long[0]}/><br/>
                        <br/>
                    </form>
                    <button disabled={!valid} className={(valid || loading) ? styles.enabledButtonStyle : styles.disabledButtonStyle}
                            onClick={submitCoordinates}> {loading ? "generating... please be patient (click again 30s if nothing happens)" : "Generate 3d"}</button>

                    <p>Current Area: {Math.round(1000*((long[1]-long[0])*(lat[1]-lat[0])))/1000}</p>
                </div>
            </div>
        </>

    )
}


