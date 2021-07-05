import { useState, useEffect, useRef, DependencyList } from 'react';
import { fetchData } from './util';


export const useFetch = <T>(url: string, query: Object|undefined): [T, boolean] => {
  const [ data, setData ] = useState<T>()
  const [ loading, setLoading ] = useState<boolean>(true)
  useEffect(() => {
    setLoading(true)
    fetchData(url, query).then(setData).finally(() => setLoading(false))
  },[url])
  return [data, loading];
}

// Run useEffect with a debounce time. Runs immediately the first time.
export const useEffectDebounced = (fn: (() => void), timeout: number, args: DependencyList) => {
  const firstRender = useRef<boolean>(true)
  useEffect(() => {
    if (firstRender.current) {
      fn();
      firstRender.current = false
    } else {
      const timer = setTimeout(fn, timeout)
      return () => clearTimeout(timer)
    }
  }, args)
}
