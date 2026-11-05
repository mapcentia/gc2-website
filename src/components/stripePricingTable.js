import {useState} from 'react'
import {Claims} from '@mapcentia/gc2-sdk'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'

import {useUser} from '../hooks/user'
import styles from './consoleWidgets.module.css'

function StripePricingTable(props) {
    const {siteConfig: {customFields: {stripeLinks}}} = useDocusaurusContext()

    const PLANS = [
        {
            name: 'Free',
            monthly: 0,
            yearly: 0,
            features: [
                'Unlimited API requests',
                '1G data storage',
                '3 sub-users',
                '10.000 cost units per day',
                'Community support',
            ],
            cta: 'Current plan',
            paymentLinks: {monthly: null, yearly: null},
        },
        {
            name: 'Personal',
            monthly: 9,
            yearly: 90,
            features: [
                'Unlimited API requests',
                '5G data storage',
                '10 sub-users',
                '50.000 cost units per day',
                'Email support'
            ],
            cta: 'Get started',
            highlighted: true,
            paymentLinks: {
                monthly: stripeLinks.personalMonthly,
                yearly: stripeLinks.personalYearly,
            },
        },
        {
            name: 'Pro',
            monthly: 29,
            yearly: 290,
            features: [
                'Unlimited API requests',
                '15G data storage',
                '1.000 sub-users',
                '100.000 cost units per day',
                'Email support'
            ],
            cta: 'Get started',
            paymentLinks: {
                monthly: stripeLinks.proMonthly,
                yearly: stripeLinks.proYearly,
            },
        },
    ]
    const [yearly, setYearly] = useState(false)

    const apiHost = process.env.NODE_ENV === 'production'
        ? 'https://api.gc2.io'
        : 'http://localhost:8080'

    let uid
    try {
        const claims = new Claims().get()
        uid = claims.uid
    } catch (e) {
        console.log(e)
    }

    const isLoggedIn = !!uid

    const {data, error, isFetching} = useUser(uid)

    if (isLoggedIn && isFetching) {
        return <p className={styles.status}>Loading billing data...</p>
    }
    if (isLoggedIn && error) {
        return <div className="alert alert--danger" role="alert">An error has occurred: {error.message}</div>
    }

    if (isLoggedIn && data?.private_properties?.customer) {
        return <form className="mb-0" method="POST" action={`${apiHost}/console/billing`}>
            <input type="hidden" name="id" value={data.private_properties?.customer}/>
            <button className="button button--outline button--success" type="submit">Manage billing</button>
        </form>
    }

    function buildLink(url) {
        if (!url) return null
        const sep = url.includes('?') ? '&' : '?'
        const params = new URLSearchParams()
        if (data?.name) params.set('client_reference_id', data.name)
        if (data?.email) params.set('prefilled_email', data.email)
        return `${url}${sep}${params.toString()}`
    }

    return (
        <div className={styles.billingBox}>
            {!isLoggedIn && (
                <div className={`alert alert--warning ${styles.loginNotice}`} role="alert">
                    Sign in to select a plan.
                </div>
            )}
            <div className={styles.toggleRow}>
                <span className={!yearly ? styles.toggleActive : styles.toggleInactive}>Monthly</span>
                <button
                    type="button"
                    role="switch"
                    aria-checked={yearly}
                    className={`${styles.toggleSwitch} ${yearly ? styles.toggleOn : ''}`}
                    onClick={() => setYearly(v => !v)}
                >
                    <span className={styles.toggleKnob}/>
                </button>
                <span className={yearly ? styles.toggleActive : styles.toggleInactive}>
                    Yearly <span className={styles.badge}>2 months free</span>
                </span>
            </div>

            <div className={styles.pricingGrid}>
                {PLANS.map(plan => {
                    const price = yearly ? plan.yearly : plan.monthly
                    const link = isLoggedIn ? plan.paymentLinks[yearly ? 'yearly' : 'monthly'] : null
                    const href = buildLink(link)

                    return (
                        <div
                            key={plan.name}
                            className={`${styles.tierCard} ${plan.highlighted ? styles.tierHighlighted : ''}`}
                        >
                            {plan.highlighted && <div className={styles.tierBadge}>Popular</div>}
                            <h3 className={styles.tierName}>{plan.name}</h3>
                            <div className={styles.tierPrice}>
                                <span className={styles.tierAmount}>
                                    ${price}
                                </span>
                                <span className={styles.tierInterval}>
                                    / {yearly ? 'year' : 'month'}
                                </span>
                            </div>
                            <ul className={styles.tierFeatures}>
                                {plan.features.map(f => (
                                    <li key={f}>{f}</li>
                                ))}
                            </ul>
                            {href ? (
                                <a
                                    className={`button button--block ${plan.highlighted ? 'button--primary' : 'button--outline button--primary'}`}
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {plan.cta}
                                </a>
                            ) : (
                                <button
                                    className={`button button--block ${plan.highlighted ? 'button--primary' : 'button--outline button--secondary'}`}
                                    disabled
                                >
                                    {plan.cta}
                                </button>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default StripePricingTable
