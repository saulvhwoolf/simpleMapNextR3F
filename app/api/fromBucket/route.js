import {NextRequest, NextResponse} from "next/server";
import * as util from "../../util";


export async function GET(request) {
    let file = request.nextUrl.searchParams.get("file")
    util.log("... FORWARDING FILE FROM BUCKET: "+ file)

    const url = "https://storage.googleapis.com/ele-map-collection/"+file

    const res = await fetch(url)
    return new NextResponse(await res.body)
}
