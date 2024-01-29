"use client";
import {GoogleMap, useJsApiLoader} from "@react-google-maps/api";
import * as React from 'react'
import $ from "jquery";
import {forwardRef, useImperativeHandle} from "react";
import {getBoundsZoomLevel} from "../../util";

export const GoogleMapWidget = forwardRef((props, ref) => {


// export default function GoogleMapWidget({ref}) {
    const [map, setMap] = React.useState(null)
    const [selectionPolygon, setSelectionPolygon] = React.useState(null)
    const {isLoaded} = useJsApiLoader({
        id: 'google-map-script', googleMapsApiKey: "AIzaSyB9uKKAGJxnNgquq3f3UOvxDkHWRYgjqrk"
    })

    useImperativeHandle(ref, () => ({
        updateMap(ne, sw) {
            console.log("UPDATE MAP", ne, sw)
            // Define the LatLng coordinates for the polygon's path.
            const pathCoords = [{lat: sw.lat, lng: sw.lng}, {lat: ne.lat, lng: sw.lng},
                {lat: ne.lat, lng: ne.lng}, {lat: sw.lat, lng: ne.lng}, {lat: sw.lat, lng: sw.lng}];


            const $map = $('#map')
            if (selectionPolygon == null) {
                const poly = new google.maps.Polygon({paths: pathCoords, strokeColor: "#FF0000",
                    strokeOpacity: 0.8, strokeWeight: 2, fillColor: "#FF0000", fillOpacity: 0.35,
                });
                setSelectionPolygon(poly)
                poly.setMap(map)

            } else {
                selectionPolygon.setPath(pathCoords)
            }
            // map.setCenter({lat: (sw.lat + ne.lat) / 2, lng: (sw.lng + ne.lng) / 2})
            // const zoom = getBoundsZoomLevel(sw.lng, ne.lng, sw.lat, ne.lat,
            //     {height: $map.height(), width: $map.width()})
            // map.setZoom(zoom)
        },

        getCenterCoordinates() {
            console.log(map.getCenter())
            return {lat:map.getCenter().lat(), lng:map.getCenter().lng()}
        },

        lookAtCoordinates(lnglat, zoom=null) {
            map.setCenter(lnglat)
            if (zoom!= null) {
                map.setZoom(zoom)
            }
        }
    }))



    const onLoad = React.useCallback(function callback(map) {
        const center = {lng: -70, lat: 40}
            // {lng: (neCoord.lng + swCoord.lng) / 2, lat: (neCoord.lat + swCoord.lat) / 2}
        setMap(new google.maps.Map(document.getElementById("map"), {
            zoom: 5, center: center, mapTypeId: "terrain", disableDefaultUI: true
        }));
    }, [])

    const onUnmount = React.useCallback(function callback(map) {
        setMap(null)
    }, [])

    return (
        <div style={{border: "thin solid black", height: "100%", width: "100%"}}>
            {isLoaded ? <>
                <GoogleMap id={"map"} zoom={8} onLoad={onLoad} onUnmount={onUnmount}
                           mapContainerStyle={{width: "100%", height: "100%", margin: "0"}}
                           bootstrapURLKeys={{key: process.env.REACT_APP_MAP_KEY, v: '3.30',}}>
                    <></>
                </GoogleMap>
            </> : <></>}
        </div>
    )
})
