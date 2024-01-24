import {NextRequest, NextResponse} from "next/server";

import {generateFilename, timeout} from "../../util";

import {fromArrayBuffer, fromBlob, fromUrl} from "geotiff";
import * as jpeg from "jpeg-js";
import {Storage} from "@google-cloud/storage";
import * as util from "../../util";
import * as Util from "util";


export async function GET(request: NextRequest) {
    util.log("HANDLING... " + request.url)

    const res = getAndValidateCoordinates(request)
    const coords = res[0], err = res[1]
    if (coords == null)
        return NextResponse.json({status: 500, message: err});
    util.log("... Latitude:(" + coords["west"] + "," + coords["east"] + ")  Longitude:(" + coords["south"] + "," + coords["north"] + ")")

    const wireframeUrl = "/wireframe?"+request.url.split("?")[1]
    const apiQueryUrl = generateQueryUrl(coords)
    util.log("... API URL: "+ apiQueryUrl)

    const filename = generateFilename(coords)
    const jpgFilename = filename + ".jpg",
        tifFilename = filename + ".tif",
        jsonFilename = filename + ".json"

    const filepath = "public"
    const jpgPath = filepath + "/" + jpgFilename,
        tifPath = filepath + "/" + tifFilename,
        jsonPath = filepath + "/" + jsonFilename

    const publicPath = "https://storage.googleapis.com/ele-map-collection/public"
    const jpgPublicPath = publicPath + "/" + jpgFilename,
        tifPublicPath = publicPath + "/" + tifFilename,
        jsonPublicPath = publicPath + "/" + jsonFilename


    if (await bucketHasFile(jpgPath) && await bucketHasFile(jsonPath)) {
        util.log("... ALREADY DOWNLOADED [" + jpgFilename + "] -- sending response")
        return NextResponse.json({"img": jpgPublicPath, "json": jsonPublicPath, "url":wireframeUrl})
    } else {
        util.log("... DOWNLOADING AND CONVERTING [" + tifFilename + "] ...")
        await downloadTifJpgJson(apiQueryUrl, tifPath, tifPublicPath, jpgPath, jsonPath)
    }

    return NextResponse.json({"img": jpgPublicPath, "json": jsonPublicPath, "url":wireframeUrl})
}

function getAndValidateCoordinates(request) {
    let east = request.nextUrl.searchParams.get("east"),
        west = request.nextUrl.searchParams.get("west"),
        south = request.nextUrl.searchParams.get("south"),
        north = request.nextUrl.searchParams.get("north")

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


function scale(val, min, max, scale) {
    return ((val - min) / (max - min)) * scale
}


// ********   QUERY URL **********
function generateQueryUrl(coords) {
    const url = "https://portal.opentopography.org/API/globaldem"
    const queryString1 = "demtype=SRTMGL3"
    const queryString2 = [ "south","north", "west", "east"].map((v) => {
        return v + "=" + coords[v]
    }).join("&")
    const queryString3 = "outputFormat=GTiff&API_Key="+process.env.TOPO_API_KEY

    return url + "?" + queryString1 + "&" + queryString2 + "&" + queryString3
}

// ********   FILES  **********
async function downloadTifJpgJson(url, tifPath, tifPublicPath, jpgPath, jsonPath) {
    await fetch(url, {}).then(async (res) => {
        util.log("...... downloading tif /" + res.status +"\\")

        const blob = await res.blob()
        util.log("...... converting tif to blob /" + res.status +"\\")

        const tiff = await fromArrayBuffer(await blob.arrayBuffer());
        util.log("...... blob to arraybuffer")

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

        util.log("...... Saving Jpg")
        await uploadFileToBucket(jpegBuffer, jpgPath);
        // await fs.js.promises.writeFile(jpgPath, jpegBuffer, {});

        util.log("...... Saving Json")
        await uploadFileToBucket(JSON.stringify({
            "MIN": min, "MAX": max,
            "WIDTH": width, "HEIGHT": height
        }), jsonPath);


        util.log("...... Conversion done!")
    })

}


async function uploadFileToBucket(fileIn, filename) {
    const file = GetBucket().file(filename);
    // const [response] = await file.generateSignedPostPolicyV4({
    //     expires: Date.now() + 60 * 60000, //  60 minute,
    //     fields: { 'x-goog-meta-test': 'data' },
    // });

    file.save(fileIn, (err) => {
        if (!err) {
            util.log("... upload successful: " + filename);
        } else {
            util.log("... !upload failed!: " + filename + " ||||| " + err);
        }
    });

    const ifExist = (await file.exists())[0]; // (await brackets) needed
    util.log("... " + ifExist + " <-- found file?")
    return ifExist
}


async function bucketHasFile(filename) {
    const res = await GetBucket().file(filename).exists()
    return res[0]
}

function GetBucket(){
    const storage = new Storage({
        projectId: process.env.PROJECT_ID,
        credentials: {
            client_email: process.env.CLIENT_EMAIL,
            private_key: process.env.PRIVATE_KEY.split(String.raw`\n`).join('\n'),
        },
    });

    return storage.bucket(process.env.BUCKET_NAME)
}
