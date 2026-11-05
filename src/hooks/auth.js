import {useEffect, useState, useCallback} from 'react'
import {Status} from '@mapcentia/gc2-sdk'

function useAuth() {
    const [isAuth, setIsAuth] = useState(false);
    const status = new Status();

    const setAuth = useCallback((status) => {
        setIsAuth(status);
    }, [])

    useEffect(() => {
        setIsAuth(status.isAuth())
    }, [isAuth]);

    return [isAuth, setAuth];
}

export {useAuth}
