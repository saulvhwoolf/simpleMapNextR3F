import {NextRequest, NextResponse} from "next/server";

import {generateFilename, timeout} from "../../util";

import {fromUrl} from "geotiff";
import * as jpeg from "jpeg-js";
import {Storage} from "@google-cloud/storage";


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
    // const filepath = "heightMap_e83.95_w83.55_s28.55_n28.65.tif\n"
    const filepath = "public"
    const filename = generateFilename(coords)
    const jpgFilename = filename + ".jpg"
    const tifFilename = filename + ".tif"
    const jsonFilename = filename + ".json"
    const jpgPath = filepath + "/" + jpgFilename
    const tifPath = filepath + "/" + tifFilename
    const jsonPath = filepath + "/" + jsonFilename

    const publicpath = "https://storage.googleapis.com/ele-map-collection/public"
    const jpgPublicPath = publicpath + "/" + jpgFilename
    const tifPublicPath = publicpath + "/" + tifFilename
    const jsonPublicPath = publicpath + "/" + jsonFilename


    if (await bucketHasFile(jpgPath) && await bucketHasFile(jsonPath)) {
    // if (fs.js.existsSync(jpgPath) && fs.js.existsSync((jsonPath))) {
        console.log("Already Downloaded [" + jpgFilename + "] -- sending response")
        return NextResponse.json({"img": jpgPublicPath, "json": jsonPublicPath, "url":wireframeUrl})
    }

    if (await bucketHasFile(jpgPath)) {
        console.log("Already Downloaded [" + tifFilename + "] ...")
    } else {
        console.log("Downloading and Converting [" + tifFilename + "] ...")
        console.log("... "+url)
        await downloadTifJpgJson(url, tifPath, tifPublicPath, jpgPath, jsonPath)
    }

    // console.log("Converting to Jpg [" + tifFilename + "] ...")
    // console.log("... " + tifPublicPath)
    // await convertTifToJpgAndJson(tifPublicPath, jpgPath, jsonPath)

    return NextResponse.json({"img": jpgPublicPath, "json": jsonPublicPath, "url":wireframeUrl})
    // return NextResponse.json({status:200, message: "starting conversion"})
}


function getAndValidateCoordinates(request) {
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
    // https://portal.opentopography.org/API/globaldem?demtype=SRTMGL3&south=28.55&north=28.65&west=83.85&east=83.95&outputFormat=GTiff&API_Key=2c66270018613ef769655d9c553de8ba
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
        console.log("[] downloading to bucket")
        await uploadFileToBucket(res.body, tifPath)

        console.log("[] load from bucket", tifPublicPath)
        // const tiff2 = await fromUrl("https://storage.googleapis.com/ele-map-collection/public/heightMap_e83.95_w83.55_s28.55_n28.65.tif");
        const tiff2 = await fromUrl(tifPublicPath);
        console.log("[] loaded, converting")

        const image = await tiff2.getImage(), raster = await image.readRasters();
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
        // console.log("... Min Height:" + min + " and Max Height " + max)

        // console.log("... Scaling Down ...")
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
        await uploadFileToBucket(jpegBuffer, jpgPath);
        // await fs.js.promises.writeFile(jpgPath, jpegBuffer, {});

        console.log("... Saving Json ...")
        await uploadFileToBucket(JSON.stringify({
            "MIN": min, "MAX": max,
            "WIDTH": width, "HEIGHT": height
        }), jsonPath);
        console.log("... DONE ...")
    })

}


async function uploadFileToBucket(fileIn, filename) {
    const file = GetBucket().file(filename);
    console.log("attempting to save")
    file.save(fileIn, (err) => {
        if (!err) {
            console.log(".. upload successful");
        } else {
            console.log("error " + err);
        }
    });
    // await timeout(5000)

    // const [response] = await file.generateSignedPostPolicyV4({
    //     expires: Date.now() + 60 * 1000, //  1 minute,
    //     fields: { 'x-goog-meta-test': 'data' },
    // });

    const ifExist = (await file.exists())[0]; // (await brackets) needed
    console.log("[] done uploading!")
    return ifExist
}


async function bucketHasFile(filename) {
    const res = await GetBucket().file(filename).exists()
    // console.log(filename, res[0], res)
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
