export async function getHeightMap(west = 0, east = 0, south = 0, north = 0) {
    const API_URL = "/api/getHeightMap"
    let queryString = "east=" + east + "&" + "west=" + west + "&" + "south=" + south + "&" + "north=" + north
    let url = API_URL + "?" + queryString
    log("REQUESTING EXISTING HEIGHTMAP")
    const res = await fetch(url,
        {method: 'GET'}
    )

    return await res.json()
}


export async function doHeightMapConversion(west = 0, east = 0, south = 0, north = 0, zoom = 21) {
    const API_URL = "/api/doHeightMapConversion"
    let queryString = "east=" + east + "&" + "west=" + west + "&" + "south=" + south + "&" + "n" +
        "orth=" + north + "&" + "zoom=" + (zoom)
    log("REQUESTING CONVERSION")
    const res = await fetch(API_URL + "?" + queryString,
        {cache: 'no-cache', method: 'GET'}
    )

    return await res.text()
}


export function generateFilename(coords) {
    return "hm_e" + coords["east"] + "_w" + coords["west"] + "_s" + coords["south"] + "_n" + coords["north"]
}


export function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


export function getTimestamp() {
    const date = new Date().toTimeString().split(' ')[0];
    const millis = (new Date().getMilliseconds()) / 1000
    return date + "." + millis
}


export function log(message) {
    console.log("[" + getTimestamp() + "] (" + message + ")")
}


export function getBoundsZoomLevel(minLat, maxLat, minLong, maxLong, mapDim) {
    var WORLD_DIM = {height: 256, width: 256};
    var ZOOM_MAX = 15;

    function latRad(lat) {
        var sin = Math.sin(lat * Math.PI / 180);
        var radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
        return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
    }

    function zoom(mapPx, worldPx, fraction) {
        return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    }

    const latFraction = (latRad(maxLat) - latRad(minLat)) / Math.PI;

    const lngDiff = maxLong - minLong;
    const lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

    const latZoom = zoom(mapDim.height, WORLD_DIM.height, latFraction);
    const lngZoom = zoom(mapDim.width, WORLD_DIM.width, lngFraction);

    const values = [latZoom, lngZoom, ].filter((v) => {return !Number.isNaN(v);})
    return Math.min(Math.min.apply(Math, values), ZOOM_MAX);
}


const _C = { x: 128, y: 128 };
const _J = 256 / 360;
const _L = 256 / (2 * Math.PI);

function tb(a) {
    return 180 * a / Math.PI
}

function sb(a) {
    return a * Math.PI / 180
}

function bounds(a, b, c) {
    null != b && (a = Math.max(a, b));
    null != c && (a = Math.min(a, c));
    return a
}

function latlonToPt(ll) {
    let a = bounds(Math.sin(sb(ll[0])), -(1 - 1E-15), 1 - 1E-15);
    return {
        x: _C.x + ll[1] * _J,
        y: _C.y + 0.5 * Math.log((1 + a) / (1 - a)) * - _L
    }
}

function ptToLatlon(pt) {
    return [tb(2 * Math.atan(Math.exp((pt.y - _C.y) / -_L)) - Math.PI / 2),(pt.x - _C.x) / _J]
}


export function calculateBoundingBox(ll, zoom, sizeX, sizeY) {
    const cp = latlonToPt(ll);
    // console.log("..........", ll, zoom, sizeX, sizeY)
    const pixelSize = Math.pow(2, -(zoom));
    const pwX = sizeX*pixelSize;
    const pwY = sizeY*pixelSize;

    const ne = ptToLatlon({x: cp.x + pwX, y: cp.y - pwY}), sw = ptToLatlon({x: cp.x - pwX, y: cp.y + pwY})
    return [sw[0], ne[0], sw[1], ne[1]]
}
