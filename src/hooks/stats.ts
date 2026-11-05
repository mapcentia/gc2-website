import {useQuery} from '@tanstack/react-query'
import {Stats} from '@mapcentia/gc2-sdk'

function useStats() {
    return useQuery({
        queryKey: ['stats'],
        queryFn: () => {
            const stat = new Stats()
            return stat.get()
        }
    })
}

export {useStats}
