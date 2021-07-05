import { useState, useEffect } from 'react';

const API_DOMAIN = 'http://localhost:3004';

export const useFetch = <T>(url: string): [T, boolean] => {
  const [ data, setData ] = useState()
  const [ loading, setLoading ] = useState(true)
  useEffect(() => {
    setLoading(true)
    fetch(API_DOMAIN+url).then(d => d.json()).then(setData).finally(() => setLoading(false))
  },[url])
  return [data, loading];
}
