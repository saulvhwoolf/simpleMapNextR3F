import {NextRequest, NextResponse} from "next/server";

import path from "path";
import * as fs from 'fs';
import {generateFilename} from "../../util";


export async function GET(request: NextRequest) {
    console.log("... checking")

    const val = getAndValidateCoordinates(request)
    const coords = val[0], err = val[1]
    console.log(coords, err)
    if (err != null) {
        return NextResponse.json({status: 500, message: err});
    }

    const wireframeUrl = "/wireframe?" + request.url.split("?")[1]

    const filepath = "public"
    const filename = generateFilename(coords)
    const jpgFilename = filename + ".jpg"
    const jsonFilename = filename + ".json"
    const jpgPath = filepath + path.sep + jpgFilename
    const jsonPath = filepath + path.sep + jsonFilename

    if (fs.existsSync(jpgPath) && fs.existsSync((jsonPath))) {
        console.log("...found download! [" + jpgFilename + ", " + jsonPath + "]")
        return NextResponse.json({status: 200, "img": jpgFilename, "json": jsonFilename, "url":wireframeUrl})
    } else {
        return NextResponse.json({status: 500, message: "no files"})
    }
}

function getAndValidateCoordinates(request) {
    let east = request.nextUrl.searchParams.get("east")
    let west = request.nextUrl.searchParams.get("west")
    let south = request.nextUrl.searchParams.get("south")
    let north = request.nextUrl.searchParams.get("north")

    // const east = 0, west = -.1, north = 0, south = -.1
    if (!(typeof east === "string" && typeof west === "string" && typeof south === "string" && typeof north === "string")) {
        return [null, "Invalid coordinates"]
    }
    const coords = {
        "east": parseFloat(east),
        "west": parseFloat(west),
        "north": parseFloat(north),
        "south": parseFloat(south)
    }

    if (!(isValidLatitude(coords["east"]) && isValidLatitude(coords["west"])
        && isValidLongitude(coords["north"]) && isValidLongitude(coords["south"]))) {
        return [null, "Invalid Coordinates " +
        "Latitude:(" + coords["west"] + "," + coords["east"] + ")  " +
        "Longitude:(" + coords["south"] + "," + coords["north"] + ")"]
    }

    return [coords, null]
}


// ********   COORDINATE VALIDATION **********
function isValidLongitude(lng) {
    return !isNaN(lng) && ((-180 < lng) && (lng < 180))
}

function isValidLatitude(lat) {
    return !isNaN(lat) && ((-180 < lat) && (lat < 180))
}



// ********   FILES  **********

