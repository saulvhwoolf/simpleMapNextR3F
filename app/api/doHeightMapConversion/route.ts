import {NextRequest, NextResponse} from "next/server";

import path from "path";
import * as fs from 'fs';

import axios from "axios";
import {fromArrayBuffer} from "geotiff";
import * as jpeg from "jpeg-js";


export async function GET(request: NextRequest) {
    console.log("Seeking...")

    const res = getAndValidateCoordinates(request)
    const coords = res[0], err = res[1]
    if (coords == null) {
        return NextResponse.json({status: 500, message: err});
    }

    const wireframeUrl = "/wireframe?"+request.url.split("?")[1]


    console.log("... Latitude:(" + coords["west"] + "," + coords["east"] + ")  Longitude:(" + coords["south"] + "," + coords["north"] + ")")

    const url = generateQueryUrl(coords)
    console.log("... URL: "+ url)
    const filepath = "public"
    const filename = generateFilename(coords)
    const jpgFilename = filename + ".jpg"
    const tifFilename = filename + ".tif"
    const jsonFilename = filename + ".json"
    const jpgPath = filepath + path.sep + jpgFilename
    const tifPath = filepath + path.sep + tifFilename
    const jsonPath = filepath + path.sep + jsonFilename

    if (fs.existsSync(jpgPath) && fs.existsSync((jsonPath))) {
        console.log("Already Downloaded [" + jpgFilename + "] -- sending response")
        return NextResponse.json({"img": jpgFilename, "json": jsonFilename, "url":wireframeUrl})
    }

    if (fs.existsSync(tifPath)) {
        console.log("Already Downloaded [" + tifFilename + "] ...")
    } else {
        console.log("Downloading [" + tifFilename + "] ...")
        console.log("... "+url)
        await downloadTif(url, tifPath)
    }

    console.log("Converting to Jpg [" + tifFilename + "] ...")
    await convertTifToJpgAndJson(tifPath, jpgPath, jsonPath)

    return NextResponse.json({"img": jpgFilename, "json": jsonFilename, "url":wireframeUrl})
    // return NextResponse.json({status:200, message: "starting conversion"})
}


export function getAndValidateCoordinates(request) {
    let east = request.nextUrl.searchParams.get("east")
    let west = request.nextUrl.searchParams.get("west")
    let south = request.nextUrl.searchParams.get("south")
    let north = request.nextUrl.searchParams.get("north")

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
export function isValidLongitude(lng) {
    return !isNaN(lng) && ((-180 < lng) && (lng < 180))
}

export function isValidLatitude(lat) {
    return !isNaN(lat) && ((-180 < lat) && (lat < 180))
}


export function scale(val, min, max, scale) {
    return ((val - min) / (max - min)) * scale
}


// ********   QUERY URL **********
export function generateQueryUrl(coords) {
    // https://portal.opentopography.org/API/globaldem?demtype=SRTMGL3&south=28.55&north=28.65&west=83.85&east=83.95&outputFormat=GTiff&API_Key=2c66270018613ef769655d9c553de8ba
    const url = "https://portal.opentopography.org/API/globaldem"
    const queryString1 = "demtype=SRTMGL3"
    const queryString2 = [ "south","north", "west", "east"].map((v) => {
        return v + "=" + coords[v]
    }).join("&")
    const queryString3 = "outputFormat=GTiff&API_Key=2c66270018613ef769655d9c553de8ba"

    return url + "?" + queryString1 + "&" + queryString2 + "&" + queryString3

}

// ********   FILES  **********
export function generateFilename(coords) {
    return "heightMap_e" + coords["east"] + "_w" + coords["west"] + "_s" + coords["south"] + "_n" + coords["north"]
}


export async function downloadTif(url, filename) {
    const axRes = await axios.get(url, {responseType: 'arraybuffer'})
    await fs.promises.writeFile(filename, axRes.data)
}

export async function convertTifToJpgAndJson(tifPath, jpgPath, jsonPath) {
    console.log("... Load and Raster...")
    const tiffData = fs.readFileSync(tifPath);
    const arrayBuffer = tiffData.buffer.slice(tiffData.byteOffset, tiffData.byteOffset + tiffData.byteLength);
    const tiff = await fromArrayBuffer(arrayBuffer);

    const image = await tiff.getImage(), raster = await image.readRasters();
    const width = image.getWidth(), height = image.getHeight();

    // Assuming a greyscale image for simplicity; adjust for other types
    const rgbaBuffer = new Uint8Array(width * height * 4);
    let min = null, max = null
    for (let i = 0; i < width * height; i++) {
        let val = raster[0][i]
        if (min == null || min > val)
            min = val
        if (max == null || max < val)
            max = val
    }
    console.log("... Min Height:" + min + " and Max Height " + max)


    console.log("... Scaling Down ...")
    for (let i = 0; i < width * height; i++) {
        let val = scale(raster[0][i], min, max, 255)
        rgbaBuffer[i * 4] = val;     // Red
        rgbaBuffer[i * 4 + 1] = val; // Green
        rgbaBuffer[i * 4 + 2] = val; // Blue
        rgbaBuffer[i * 4 + 3] = 255; // Alpha
    }

    // Encode as JPEG
    const jpegImageData = {
        data: rgbaBuffer,
        width: width,
        height: height
    };
    const jpegBuffer = jpeg.encode(jpegImageData, 90).data; // 90 is the quality

    console.log("... Saving Jpg ...")
    await fs.promises.writeFile(jpgPath, jpegBuffer, {});

    console.log("... Saving Json ...")
    await fs.promises.writeFile(jsonPath, JSON.stringify({
        "MIN": min, "MAX": max,
        "WIDTH": width, "HEIGHT": height
    }), {});
}
