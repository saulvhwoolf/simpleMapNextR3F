import {NextRequest, NextResponse} from "next/server";


export async function GET(request: NextRequest) {
    let file = request.nextUrl.searchParams.get("file")
    console.log("... getting file from bucket: ", file)

    // const wireframeUrl = "/wireframe?" + request.url.split("?")[1]
    const url = "https://storage.googleapis.com/ele-map-collection/"+file
    console.log("...  ", url)

    const res = await fetch(url)
    return new NextResponse(await res.body)
    // return NextResponse.json({status: 200, ready: false, message: "done", "img": jpgPublicPath, "json": jsonPublicPath, "url":wireframeUrl})
}
