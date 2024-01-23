import Image from 'next/image'
import styles from './page.module.css'
import {MapComponent} from "./components/MapComponent";



export default async function Home() {

    return (
        <main className={styles.main}>
            <MapComponent></MapComponent>
        </main>
    )
}
