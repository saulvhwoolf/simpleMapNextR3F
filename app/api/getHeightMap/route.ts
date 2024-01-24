import {NextRequest, NextResponse} from "next/server";

import path from "path";
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

    const filename = generateFilename(coords)

    const jpgFilename = filename + ".jpg"
    const jsonFilename = filename + ".json"

    const filepath = "public"
    const jpgPath = filepath + path.sep + jpgFilename
    const jsonPath = filepath + path.sep + jsonFilename

    const bucketPath = "https://storage.googleapis.com/ele-map-collection/public"
    const jpgBucketPath = bucketPath + "/" + jpgFilename
    const jsonBucketPath = bucketPath + "/" + jsonFilename

    const publicPath = "api/fromBucket"
    const jpgPublicPath = publicPath + "?file=public/" + jpgFilename
    const jsonPublicPath = publicPath + "?file=public/" + jsonFilename

    return NextResponse.json({status: 200, ready: false, message: "done", "img": jpgPublicPath, "json": jsonPublicPath, "url":wireframeUrl})
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

//
// async function bucketHasFile(filename) {
//     const res = await GetBucket().file(filename).exists()
//     // console.log(filename, res[0], res)
//     return res[0]
// }
//
// function GetBucket(){
//     const storage = new Storage({
//         projectId: process.env.PROJECT_ID,
//         credentials: {
//             client_email: process.env.CLIENT_EMAIL,
//             private_key: process.env.PRIVATE_KEY.split(String.raw`\n`).join('\n'),
//         },
//     });
//
//     return storage.bucket(process.env.BUCKET_NAME)
// }
