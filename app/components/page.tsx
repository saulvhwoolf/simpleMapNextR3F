"use client";
import styles from "../wireframe/page.module.css";
import ControllerWidget from "./ControllerWidget/ControllerWidget";
import {GoogleMapWidget} from "./GoogleMapWidget/GoogleMapWidget";

export default function ComponentsPage() {

    return (
        <main className={styles.main}>
            {/*full page container*/}
            <div style={{width: "80vw", minHeight:"400px", maxWidth:"800px", maxHeight: "100vh",  border: "thin solid black"}}>
                {/*controls container*/}
                <ControllerWidget callback={(v)=>{
                    console.log(v)
                }}/>
                <div style={{width:"400px", height:"400px"}}>
                    <GoogleMapWidget/>
                </div>

            </div>
        </main>
    )
}


