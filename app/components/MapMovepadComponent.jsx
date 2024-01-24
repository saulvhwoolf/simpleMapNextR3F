"use client"

import * as styles from "./MapComponent.module.css"


export default function MapMovepad({callback}) {


    return (
        <div className={styles.movepadContainer}>
            <div className={styles.buttonContainer} style={{"gridColumn": "2", "gridRow": "1"}}>
                <button onClick={()=>{callback("up")}} className={styles.button}>
                    {UP}
                </button>
            </div>

            <div className={styles.buttonContainer} style={{"gridColumn": "1", "gridRow": "2"}}>
                <button onClick={()=>{callback("left")}} className={styles.button}>
                    {LEFT}
                </button>
            </div>

            <div className={styles.buttonContainer} style={{"gridColumn": "3", "gridRow": "2"}}>
                <button onClick={()=>{callback("right")}} className={styles.button}>
                    {RIGHT}
                </button>
            </div>

            <div className={styles.buttonContainer} style={{"gridColumn": "2", "gridRow": "3"}}>
                <button onClick={()=>{callback("down")}} className={styles.button}>
                    {DOWN}
                </button>
            </div>

            <div className={styles.buttonContainer} style={{"gridColumn": "1", "gridRow": "3"}}>
                <button onClick={()=>{callback("contract")}} className={`${styles.button} ${styles.altButton}`}>
                    {RIGHT + LEFT}
                </button>
            </div>
            <div className={styles.buttonContainer} style={{"gridColumn": "3", "gridRow": "1"}}>
                <button onClick={()=>{callback("expand")}} className={`${styles.button} ${styles.altButton}`}>
                    {LEFT + RIGHT}
                </button>
            </div>
        </div>
    )
}


const DOWN = "\u2193";
const UP = "\u2191";
const RIGHT = "\u2192";
const LEFT = "\u2190";
