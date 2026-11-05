import {CodeFlow} from '@mapcentia/gc2-sdk'
import {useEffect, useMemo} from "react";
import styles from "./consoleWidgets.module.css";

function LoginButton(props) {
    const {auth, setAuth} = props.status;

    let options;

    if (process.env.NODE_ENV === 'production') {
        options = {
            redirectUri: 'https://gc2.io/console/',
            clientId: 'gc2',
            host: 'https://api.gc2.io',
        }
    } else {
        options = {
            redirectUri: 'http://localhost:4000/console/',
            clientId: 'gc2',
            host: 'http://localhost:8080',
        }
    }

    const codeFlow = useMemo(() => {
        if (typeof window === 'undefined') {
            return null;
        }
        return new CodeFlow(options)
    }, [options.clientId, options.host, options.redirectUri])

    const signInHandler = (e) => {
        if (!codeFlow) return;
        codeFlow.signIn()
    }
    const signOutHandler = (e) => {
        if (!codeFlow) return;
        setAuth(false)
        codeFlow.signOut()
    }

    useEffect(() => {
        if (!codeFlow) return;

        codeFlow.redirectHandle().then((isSignedIn) => {
            setAuth(isSignedIn)
        }).catch((err) => console.info(err))

        let params = new URLSearchParams(window.location.search)
        let r = params.get("r")
        if (r !== null) {
            codeFlow.signIn()
        }
    }, [codeFlow, setAuth])

    if (auth)
        return (
            <div className={styles.actions}>
                <button className={`button button--outline button--primary ${styles.signOut}`} onClick={signOutHandler}>
                    Sign out
                </button>
            </div>
        )
    else
        if (process.env.NODE_ENV === 'production') {
            return (
                <div className={styles.actions}>
                    <a className="button button--primary" href="https://api.gc2.io/signup?redirect_uri=https://gc2.io/console?r">Sign
                        up for
                        an account</a>
                    <span className={styles.muted}>or</span>
                    <button className="button button--secondary" onClick={signInHandler}>Sign in</button>
                </div>
            )
        }
        return (
            <div className={styles.actions}>
                <a className="button button--primary" href="http://localhost:8080/signup?redirect_uri=http://localhost:4000/console?r">Sign
                    up for
                    an account</a>
                <span className={styles.muted}>or</span>
                <button className="button button--secondary" onClick={signInHandler}>Sign in</button>
            </div>
        )

}

export default LoginButton;
