


const API_URL = "/api/getHeightMap"
export async function getHeightMap(west=0, east=0, south=0, north=0) {
    // let queryString = API_DATA.map((arr)=>{return arr[0] + "=" + arr[1]}).join("&")
    let queryString = "east=" + east + "&" + "west=" + west + "&" + "south=" + south + "&" + "north=" + north
    let url = API_URL + "?" + queryString
    console.log("GETTING THE THING")
    const res = await fetch(url,
        // const res = await fetch(API_URL+"?"+queryString,
        {cache: 'force-cache', method: 'GET'}
    )

    return await res.json()
}
