
export async function getHeightMap(west=0, east=0, south=0, north=0) {
    const API_URL = "/api/getHeightMap"
    // let queryString = API_DATA.map((arr)=>{return arr[0] + "=" + arr[1]}).join("&")
    let queryString = "east=" + east + "&" + "west=" + west + "&" + "south=" + south + "&" + "north=" + north
    let url = API_URL + "?" + queryString
    console.log("GETTING THE THING")
    const res = await fetch(url,
        // const res = await fetch(API_URL+"?"+queryString,
        {method: 'GET'}
    )

    return await res.json()
}


export async function doHeightMapConversion(west=0, east=0, south=0, north=0) {
    const API_URL = "/api/doHeightMapConversion"
    let queryString = "east=" + east + "&" + "west=" + west + "&" + "south=" + south + "&" + "north=" + north
    console.log("GETTING THE THING")
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
