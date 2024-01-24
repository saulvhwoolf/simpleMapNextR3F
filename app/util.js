
export async function getHeightMap(west=0, east=0, south=0, north=0) {
    const API_URL = "/api/getHeightMap"
    let queryString = "east=" + east + "&" + "west=" + west + "&" + "south=" + south + "&" + "north=" + north
    let url = API_URL + "?" + queryString
    log("REQUESTING EXISTING HEIGHTMAP")
    const res = await fetch(url,
        {method: 'GET'}
    )

    return await res.json()
}

export async function doHeightMapConversion(west=0, east=0, south=0, north=0) {
    const API_URL = "/api/doHeightMapConversion"
    let queryString = "east=" + east + "&" + "west=" + west + "&" + "south=" + south + "&" + "north=" + north
    log("REQUESTING CONVERSION")
    const res = await fetch(API_URL + "?" + queryString,
        {cache: 'no-cache', method: 'GET'}
    )

    return await res.text()
}


export function generateFilename(coords) {
    return "heightMap_e" + coords["east"] + "_w" + coords["west"] + "_s" + coords["south"] + "_n" + coords["north"]
}



export function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


export function getTimestamp() {
    const date = new Date().toTimeString().split(' ')[0];
    const millis = (new Date().getMilliseconds())/1000
    return date + "." + millis
}


export function log(message) {
    console.log("["+getTimestamp()+ "] (" + message+")")
}
