import styles from './page.module.css'
import {Map3dComponent} from '../components/Map3dWidget/Map3dComponent';
import Link from "next/link";


export default async function Home() {
    return (
        <main className={styles.main}>
            <Link href={"/"}>HOME</Link>
            <Map3dComponent></Map3dComponent>
        </main>
    )
}
