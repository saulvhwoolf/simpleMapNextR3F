"use client";

import React from 'react'
import {GoogleMap, useJsApiLoader} from '@react-google-maps/api';
import Link from "next/link";
import {doHeightMapConversion} from "../util";


const containerStyle = {
    width: '800px',
    height: '500px'
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

    const onChangeCoords = () => {
        let lat1 = parseFloat(document.getElementById("min_lat").value)
        let lat2 = parseFloat(document.getElementById("max_lat").value)
        let long1 = parseFloat(document.getElementById("min_long").value)
        let long2 = parseFloat(document.getElementById("max_long").value)
        if ((!isNaN(lat1) && !isNaN(lat2) && !isNaN(long1) && !isNaN(long2)) && (lat1 < lat2 && long1 < long2)) {
            setLat([lat1, lat2])
            setLong([long1, long2])
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
                if (i < 10) {
                    checkStatus(i+1)
                }
            } else if (jsonResult["status"] === 200) {
                setUrl(jsonResult["url"])
                setImageUrl(jsonResult["jpg"])
                setLoading(false)
                console.log("done")
            }
        }, 3000)
    }

    const submitCoordinates = async () => {
        setLoading(true)
        doHeightMapConversion(long[0], long[1], lat[0], lat[1])
        // console.log(val)
        // setUrl(val["url"])
        // setImageUrl(val["jpg"])
        // setLoading(false)
        setTimeout(()=>{checkStatus()}, 1000)
    }


    const disabledButtonStyle = {
        "borderRadius": "10px", "border": "thin solid black", "padding": "5px",
        "margin": "0 auto", "textDecoration": "line-through", "pointerEvents": "None"
    }
    const enabledButtonStyle = {
        "borderRadius": "10px",
        "border": "thin solid black",
        "padding": "5px",
        "margin": "0 auto",
        // "background": "white"
    }


    return (
        <>
            <div>
                {isLoaded ? (
                    <GoogleMap
                        id={"map"}
                        mapContainerStyle={containerStyle}
                        zoom={8}
                        onLoad={onLoad}
                        onUnmount={onUnmount}
                    >
                        { /* Child components, such as markers, info windows, etc. */}
                        <></>
                    </GoogleMap>
                ) : <></>}
            </div>
            <div>
                <div style={{"float": "left", "width": "48%", "padding": "10px", "textAlign": "center"}}>
                    <form action="@/app/components/MapComponent" onChange={onChangeCoords}>
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
                    <button disabled={!valid} style={(valid || loading) ? enabledButtonStyle : disabledButtonStyle}
                            onClick={submitCoordinates}> {loading ? "generating..." : "Generate 3d"}</button>
                    {url ?
                        <Link style={{"display": "block", "color": "blue", "textDecoration": "underline"}} href={url}>YOUR
                            MAP</Link> : <></>}
                    {imageUrl ? <img src={imageUrl}></img> : <></>}
                </div>
                <div style={{
                    "float": "right",
                    "width": "48%",
                    "padding": "10px",
                    margin: "10px",
                    "backgroundColor": "rgb(200,200,200)"
                }}>
                    <p>Change the minimum and maximum latitude values until you see the range you seek on the map above.
                        You may need to change zoom level to get a good view.</p>
                    {url ?<Link style={{"display": "block", "color": "blue", "textDecoration": "underline"}} href={url}>YOUR
                        MAP</Link> : <></>}


                </div>
            </div>
        </>

    )
}


