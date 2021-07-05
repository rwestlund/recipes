
const API_DOMAIN = 'http://localhost:3004';
// Fetch API data. Query params are the second arg.
export const fetchData = <T>(url: string, query: Object|undefined): Promise<T> => {
  const str = getQueryString(query)
  return fetch(API_DOMAIN+url+str).then(d => d.json())
}

// Transform { query: 'test', page: 2 } into '?query=test&page=2'.
export const getQueryString = (query: Object|undefined) : String => {
  return (query && typeof query === 'object')
      ? '?' + Object.keys(query)
        .map(k => encodeURIComponent(k)+"="+encodeURIComponent(query[k]))
        .join("&")
      : '';
}

