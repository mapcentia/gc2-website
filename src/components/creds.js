import {Claims, Status} from '@mapcentia/gc2-sdk'
import {useRef, useState} from 'react'
import styles from './consoleWidgets.module.css'

function Creds(props) {
    if (props.status.auth === false) {
        return null
    }

    let email = ''
    let uid = ''
    let accessToken = ''
    try {
        const claims = new Claims().get()
        const tokens = new Status().getTokens()
        email = claims?.email ?? ''
        uid = claims?.uid ?? ''
        accessToken = tokens?.accessToken ?? ''
    } catch (e) {
        console.log(e)
    }

    const [copied, setCopied] = useState(false)
    const textRef = useRef(null)

    async function copyToClipboard() {
        try {
            const text = accessToken || ''
            if (!text) return
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text)
            } else {
                // Fallback
                const el = textRef.current
                if (!el) return
                el.removeAttribute('readOnly')
                el.select()
                document.execCommand('copy')
                el.setAttribute('readOnly', true)
                window.getSelection()?.removeAllRanges()
            }
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1500)
        } catch (e) {
            console.log(e)
        }
    }

    return (
        <>
            <div className={`card ${styles.card}`}>
                <div className="card__header">
                    <h3 className={styles.cardTitle}>Credentials</h3>
                </div>
                <div className="card__body">
                    <p className={styles.sectionIntro}>Signed in account details and current access token.</p>
                    <div className={styles.identityGrid}>
                        <div className={styles.identityItem}>
                            <span className={styles.identityLabel}>UID</span>
                            <span className={styles.identityValue}>{uid || 'Unknown'}</span>
                        </div>
                        <div className={styles.identityItem}>
                            <span className={styles.identityLabel}>Email</span>
                            <span className={styles.identityValue}>{email || 'Unknown'}</span>
                        </div>
                    </div>

                    <label htmlFor="accessToken" className={styles.tokenLabel}>Access token (JWT)</label>
                    <div className={styles.tokenRow}>
                        <input
                            id="accessToken"
                            ref={textRef}
                            readOnly
                            value={accessToken}
                            className={styles.tokenField}
                            placeholder="No access token available"
                        />
                        <button
                            type="button"
                            className={`button button--sm ${styles.copyButton} ${copied ? 'button--success' : 'button--secondary'}`}
                            onClick={copyToClipboard}
                            aria-live="polite"
                            title="Copy to clipboard"
                        >
                            {copied ? 'Copied!' : 'Copy'}
                        </button>
                    </div>

                    <small className={styles.tokenHint}>
                        Keep this token secret. You can regenerate it from your account if needed.
                    </small>
                </div>
            </div>
        </>
    )
}

export default Creds
