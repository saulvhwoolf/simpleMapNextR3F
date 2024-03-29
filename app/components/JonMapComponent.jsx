"use client";

import React from 'react'
import {GoogleMap, useJsApiLoader} from '@react-google-maps/api';
import * as util from "../util";
import {getProportionalDimensions, getTextureUrlFromLatLngBounds} from "../util";


const containerStyle = {
    maxWidth: '80vw',
    margin: '0 auto',
    width: '800px',
    height: '500px',
};


export function JonMapComponent() {
    const {isLoaded} = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "AIzaSyB9uKKAGJxnNgquq3f3UOvxDkHWRYgjqrk"
    })

    const [map, setMap] = React.useState(null)
    const [lat, setLat] = React.useState([28.55, 28.65])
    const [long, setLong] = React.useState([83.85, 83.95])

    const [targetUrl, setTargetUrl] = React.useState(null)

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
        setMap(map)
    }, [])

    const onUnmount = React.useCallback(function callback(map) {
        setMap(null)
    }, [])


    const lnglat = [37.8, 38.2, -119.3, -118.85,]
    // const lnglat = [44, 44.07, -70.55, -70.5,]
    // const lnglat = [37.560546874999986,
    //     38.439453124999986,
    //     -61.13783937849957,
    //     -60.71072909141721
    // ]

    // const textureUrl = getTextureUrlFromLatLngBounds(lnglat)
    // const center = [(lnglat[1] + lnglat[0]) / 2,(lnglat[3] + lnglat[2]) / 2]
    const zoom = util.getBoundsZoomLevel(...lnglat, {width: 640, height: 640})
    // const realBoundingBox = util.calculateBoundingBox(center, zoom, 640, 640)

    React.useEffect(() => {
        if (map != null) {

            const p1 = makePoly(lnglat[2], lnglat[3], lnglat[0], lnglat[1], false)
            p1.setMap(map)

            // const p2 = makePoly(realBoundingBox[2], realBoundingBox[3], realBoundingBox[0], realBoundingBox[1], true)
            // p2.setMap(map)

            const bounds = new google.maps.LatLngBounds();
            p1.getPaths().forEach(function(path) {
                path.forEach(function(coord) {
                    bounds.extend(coord);
                });
            });

            map.fitBounds(bounds)
            map.setZoom(zoom)

            // setTargetUrl(textureUrl)
        }
    }, [map])

    return (
        <>
            <div>
                {isLoaded ? (
                    <GoogleMap id={"map"} mapContainerStyle={containerStyle} zoom={8} onLoad={onLoad}
                               onUnmount={onUnmount}
                               bootstrapURLKeys={{key: process.env.REACT_APP_MAP_KEY, v: '3.30',}}>
                        <></>
                    </GoogleMap>
                ) : <></>}
                {targetUrl? <a href={targetUrl}>{targetUrl}</a>:<></>}
            </div>
        </>

    )
}


function makePoly(long1, long2, lat1, lat2, other) {
    // Define the LatLng coordinates for the polygon's path.
    const pathCoords = [{lat: lat1, lng: long1}, {lat: lat2, lng: long1},
        {lat: lat2, lng: long2}, {lat: lat1, lng: long2}, {lat: lat1, lng: long1}];
    let p  = new google.maps.Polygon({
        paths: pathCoords,
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: other ? "#FF0000" : "#00FF00",
        fillOpacity: 0.35,
    });

    return p
}
