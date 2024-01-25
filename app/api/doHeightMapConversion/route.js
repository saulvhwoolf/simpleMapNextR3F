import {NextRequest, NextResponse} from "next/server";

import {calculateBoundingBox, generateFilename, getBoundsZoomLevel, timeout} from "../../util";

import {fromArrayBuffer, fromBlob, fromUrl} from "geotiff";
import * as jpeg from "jpeg-js";
import {Storage} from "@google-cloud/storage";
import * as util from "../../util";

export async function GET(request) {
    util.log("HANDLING... " + request.url)

    const res = getAndValidateCoordinates(request)
    const coords = res[0], err = res[1], zoom = res[2]
    if (coords == null)
        return NextResponse.json({status: 500, message: err});
    util.log("... z(" + zoom + ") Latitude:(" + coords["west"] + "," + coords["east"] + ")  Longitude:(" + coords["south"] + "," + coords["north"] + ")")

    const wireframeUrl = "/wireframe?" + request.url.split("?")[1]
    const apiQueryUrl = generateQueryUrl(coords)
    util.log("... API URL: " + apiQueryUrl)

    const centerCoords = [(Math.round(1000000 * (coords["west"] + (coords["east"] - coords["west"]) / 2)) / 1000000),
        (Math.round(1000000 * (coords["south"] + (coords["north"] - coords["south"]) / 2)) / 1000000)]
    // const dims = getDimensions(coords["east"] - coords["west"], coords["north"] - coords["south"])
    const raw_dims = [640, 640]


    console.log("ZOOM", zoom, util.getBoundsZoomLevel(coords["south"], coords["north"], coords["west"], coords["east"],
        {width: 640, height: 640}))
    const realBoundingBox = util.calculateBoundingBox(centerCoords, zoom, raw_dims[0], raw_dims[1])
    const myBoundingBox = [coords["west"], coords["east"], coords["south"], coords["north"]]

    const requestDim = getDimensions(myBoundingBox, realBoundingBox, raw_dims)
    console.log("REQUEST DIMENSIONS" + requestDim)
    const dimString = requestDim[0] + "x" + requestDim[1]

    const textureQueryUrl = "https://maps.googleapis.com/maps/api/staticmap?center=" + centerCoords[1] + "," + centerCoords[0] + "&zoom=" + zoom + "&size=" + dimString + "&maptype=satellite&key=" + process.env.GMAPS_API_KEY
    util.log("... API TEXTURE URL: " + textureQueryUrl)
    const filename = generateFilename(coords)
    const jpgFilename = filename + ".jpg",
        tifFilename = filename + ".tif",
        pngFilename = filename + ".png",
        jsonFilename = filename + ".json"

    const filepath = "public"
    const jpgPath = filepath + "/" + jpgFilename,
        tifPath = filepath + "/" + tifFilename,
        pngPath = filepath + "/" + pngFilename,
        jsonPath = filepath + "/" + jsonFilename

    const publicPath = "https://storage.googleapis.com/ele-map-collection/public"
    const jpgPublicPath = publicPath + "/" + jpgFilename,
        tifPublicPath = publicPath + "/" + tifFilename,
        jsonPublicPath = publicPath + "/" + jsonFilename


    if (await bucketHasFile(jpgPath) && await bucketHasFile(jsonPath)) {
        util.log("... ALREADY DOWNLOADED [" + jpgFilename + "] -- sending response")
        return NextResponse.json({"img": jpgPublicPath, "json": jsonPublicPath, "url": wireframeUrl})
    } else {
        util.log("... DOWNLOADING AND CONVERTING [" + tifFilename + "] ...")
        await downloadTifJpgJson(apiQueryUrl, tifPath, tifPublicPath, jpgPath, jsonPath)

        await downloadTexture(textureQueryUrl, pngPath, myBoundingBox, realBoundingBox, raw_dims)
    }

    return NextResponse.json({"img": jpgPublicPath, "json": jsonPublicPath, "url": wireframeUrl})
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

    return [coords, null, parseInt(request.nextUrl.searchParams.get("zoom"))]
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
    const queryString2 = ["south", "north", "west", "east"].map((v) => {
        return v + "=" + coords[v]
    }).join("&")
    const queryString3 = "outputFormat=GTiff&API_Key=" + process.env.TOPO_API_KEY

    return url + "?" + queryString1 + "&" + queryString2 + "&" + queryString3
}

// ********   FILES  **********

async function downloadTexture(textureUrl, texturePath) {
    await fetch(textureUrl, {}).then(async (res) => {
        util.log("...... downloading texture /" + res.status + "\\")

        const blob = await res.blob()
        util.log("...... converting png to blob /" + res.status + "\\")

        util.log("...... saving png blob arraybuffer ")
        await uploadFileToBucket(blob.stream(), texturePath);
    })
}


async function downloadTifJpgJson(url, tifPath, tifPublicPath, jpgPath, jsonPath) {
    await fetch(url, {}).then(async (res) => {
        util.log("...... downloading tif /" + res.status + "\\")

        const blob = await res.blob()
        util.log("...... converting tif to blob /" + res.status + "\\")

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

function GetBucket() {
    const storage = new Storage({
        projectId: process.env.PROJECT_ID,
        credentials: {
            client_email: process.env.CLIENT_EMAIL,
            private_key: process.env.PRIVATE_KEY.split(String.raw`\n`).join('\n'),
        },
    });

    return storage.bucket(process.env.BUCKET_NAME)
}

function getDimensions(targetBoundingBox, rawBoundingBox, rawDimensions) {
    const tb = targetBoundingBox, rb = rawBoundingBox

    console.log(tb, rb)
    const latRatio = (tb[1] - tb[0]) / (rb[1] - rb[0])
    const lngRatio = (tb[3] - tb[2]) / (rb[3] - rb[2])
    // console.log(tb)
    // console.log(rb)
    // console.log(latRatio)
    // console.log(lngRatio)
    const dim = Math.max(Math.floor(rawDimensions[0] * lngRatio), Math.floor(rawDimensions[1] * latRatio))
    return [dim, dim]
    // console.log(result)

    // return [Math.floor(200 * width / height), Math.floor(200)]
}
