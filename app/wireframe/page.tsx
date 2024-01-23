import styles from './page.module.css'
import {Map3dComponent} from '../components/Map3dComponent';


export default async function Home() {
    return (
        <main className={styles.main}>
            <Map3dComponent></Map3dComponent>
        </main>
    )
}
