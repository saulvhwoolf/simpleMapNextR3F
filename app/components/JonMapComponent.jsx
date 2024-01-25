"use client";

import React from 'react'
import {GoogleMap, useJsApiLoader} from '@react-google-maps/api';


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
        setMap(map)
    }, [])

    const onUnmount = React.useCallback(function callback(map) {
        setMap(null)
    }, [])


    React.useEffect(()=> {
        if (map != null) {

            const p1 = makePoly( -119.3, -118.85, 37.8, 38.2 , false)
            p1.setMap(map)

            // const p2 = makePoly(  -61.13783937849957,
            //     -60.71072909141721,
            //     37.560546874999986,
            //     38.439453124999986
            //
            //     , true)
            // p2.setMap(map)

        }
    }, [map])

    return (
        <>
            <div>
                {isLoaded ? (
                    <GoogleMap id={"map"} mapContainerStyle={containerStyle} zoom={8} onLoad={onLoad}
                               onUnmount={onUnmount} bootstrapURLKeys={{key: process.env.REACT_APP_MAP_KEY, v: '3.30',}}>
                        <></>
                    </GoogleMap>
                ) : <></>}
            </div>
        </>

    )
}


function makePoly( long1, long2, lat1, lat2, other) {
    // Define the LatLng coordinates for the polygon's path.
    const pathCoords = [{lat: lat1, lng: long1}, {lat: lat2, lng: long1},
        {lat: lat2, lng: long2}, {lat: lat1, lng: long2}, {lat: lat1, lng: long1}];
    return new google.maps.Polygon({
        paths: pathCoords,
        strokeColor: "#FF0000",
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: other?"#FF0000":"#00FF00",
        fillOpacity: 0.35,
    });
}
