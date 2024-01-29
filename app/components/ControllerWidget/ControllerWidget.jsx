"use client";
import * as s from './ControllerWidget.module.css'

const CONTROL_SIZE = 150//160
const SLIDER_SIZE = 30
const HEADER_SIZE = 30
const ARROWS_WIDTH = 60

export default function ControllerWidget({callback}) {


    return (
        <>
            <ButtonPanel callback={callback}/>
            <JoystickPanel callback={callback}/>
        </>
    )


}

export function ButtonPanel({callback}) {
    return (
        <div>
            <button className={`${s.functionalButton} ${s.find}`}
                    onClick={()=>{callback(["find"])}}>
                find
            </button>
            <button className={`${s.functionalButton} ${s.center}`}
                    onClick={()=>{callback(["center"])}}>
            center
            </button>
            <button className={`${s.functionalButton} ${s.expand}`}
                    onClick={()=>{callback(["expand"])}}>
            expand
            </button>
            <button className={`${s.functionalButton} ${s.contract}`}
                    onClick={()=>{callback(["contract"])}}>
            contract
            </button>

        </div>
    )
}

export function JoystickPanel({callback}) {
    return (
        <>
            <div style={{ display: "inline-block",
                height: CONTROL_SIZE + HEADER_SIZE, width: CONTROL_SIZE*2+SLIDER_SIZE+HEADER_SIZE}}>
                <div style={{position: "relative", float: "left", width:SLIDER_SIZE+HEADER_SIZE -2, height: "100%"}}>
                    <div style={{ position: "absolute", left: HEADER_SIZE-1, bottom:0, right: 0, height: CONTROL_SIZE}}>
                        <div className={s.relativeContainer}>
                            <span className={s.sliderLabel}>STEP SIZE</span>
                            <input type="range" id="temp3" name="temp3" list="values" defaultValue={23} className={s.slider}
                                   style={{width: CONTROL_SIZE, height: SLIDER_SIZE}}
                                   onChange={(event)=>{callback(["slider", event.target.value])}
                                   }/>
                        </div>
                    </div>
                </div>
                <div style={{position: "relative", float: "left", width: CONTROL_SIZE, height: "100%"}}>
                    <div style={{position: "absolute", left: 0, bottom:0, right: 0, aspectRatio:1}}>
                        <div className={s.relativeContainer}>
                            <span className={s.joystickLabel}>RESIZE</span>
                            <Joystick special={true} callback={(v)=>{callback(v)}}/>
                        </div>
                    </div>
                </div>
                <div style={{position: "relative", float: "left", width:CONTROL_SIZE, height: "100%"}}>
                    <div style={{position: "absolute", left: 0, bottom:0, right: 0, aspectRatio:1}}>
                        <div className={s.relativeContainer}>
                            <span className={s.joystickLabel}>MOVE</span>
                            <Joystick special={false} callback={(v)=>{callback(v)}}/>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}


export function Joystick({special: dual = false, callback}) {

    return (
        <>
            <div style={{position: "absolute", left: 0, bottom:"25%", width: ARROWS_WIDTH, height: "50%"}}>
                <div style={{position: "relative", width:"100%", height: "100%"}}>
                    {dual?
                        <>
                            <button onClick={()=>{callback(["l", "l"])}} className={`${s.arrow} ${s.half} ${s.left}`}>
                                <LEFT_ARROW/>
                            </button>
                            <button onClick={()=>{callback(["l", "r"])}} className={`${s.arrow} ${s.half} ${s.right}`}>
                                <RIGHT_ARROW/>
                            </button>
                        </>
                        :
                        <button onClick={()=>{callback(["l"])}} className={`${s.arrow} ${s.full} ${s.right}`}>
                            <LEFT_ARROW/>
                        </button>
                    }
                </div>
            </div>
            <div style={{position: "absolute", right: 0, bottom:"25%", width: ARROWS_WIDTH, height: "50%"}}>
                <div style={{position: "relative", width:"100%", height: "100%"}}>
                    {dual?
                        <>
                            <button onClick={()=>{callback(["r", "l"])}} className={`${s.arrow} ${s.half} ${s.left}`}>
                                <LEFT_ARROW/>
                            </button>
                            <button onClick={()=>{callback(["r", "r"])}} className={`${s.arrow} ${s.half} ${s.right}`}>
                                <RIGHT_ARROW/>
                            </button>
                        </>
                        :
                        <button onClick={()=>{callback(["r"])}} className={`${s.arrow} ${s.full} ${s.left}`}>
                            <RIGHT_ARROW/>
                        </button>
                    }
                </div>
            </div>
            <div style={{position:"absolute", top: 0, left:"25%", height: ARROWS_WIDTH, width: "50%"}}>
                <div style={{position: "relative", width:"100%", height: "100%"}}>
                    {dual?
                        <>
                            <button onClick={()=>{callback(["u", "u"])}} className={`${s.arrow} ${s.half} ${s.up}`}>
                                <UP_ARROW/>
                            </button>
                            <button onClick={()=>{callback(["u", "d"])}} className={`${s.arrow} ${s.half} ${s.down}`} >
                                <DOWN_ARROW/>
                            </button>
                        </>
                        :
                        <button onClick={()=>{callback(["u"])}} className={`${s.arrow} ${s.full} ${s.down}`}>
                            <UP_ARROW/>
                        </button>
                    }
                </div>
            </div>
            <div style={{position: "absolute", bottom: 0, left:"25%", height: ARROWS_WIDTH, width: "50%"}}>
                <div style={{position: "relative", width:"100%", height: "100%"}}>
                    {dual?
                        <>
                            <button onClick={()=>{callback(["d", "u"])}} className={`${s.arrow} ${s.half} ${s.up}`}>
                                <UP_ARROW/>
                            </button>
                            <button onClick={()=>{callback(["d", "d"])}} className={`${s.arrow} ${s.half} ${s.down}`}>
                                <DOWN_ARROW/>
                            </button>
                        </>
                        :
                        <button onClick={()=>{callback(["d"])}} className={`${s.arrow} ${s.full} ${s.up}`}>
                            <DOWN_ARROW/>
                        </button>
                    }
                </div>
            </div>
        </>
    )
}



function LEFT_ARROW() {
    return <svg style={{width: "100%", height:"100%"}} id="svg_css_ex1" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path fill="black" stroke="none" d="M0,50 L100,100 L100,0 L0,50" />
    </svg>
}

function RIGHT_ARROW() {
    return <svg style={{width: "100%", height:"100%"}} id="svg_css_ex1" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path fill="black" stroke="none" d="M100,50 L0,100 L0,0 L100,50" />
    </svg>
}

function DOWN_ARROW() {
    return <svg style={{width: "100%", height:"100%"}} id="svg_css_ex1" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path fill="black" stroke="none" d="M50,100 L100,0 L0,0 L50,100" />
    </svg>
}

function UP_ARROW() {
    return <svg style={{width: "100%", height:"100%"}} id="svg_css_ex1" viewBox="0 0 100 100" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <path fill="black" stroke="none" d="M50,0 L100,100 L0,100 L50,0" />
    </svg>
}
