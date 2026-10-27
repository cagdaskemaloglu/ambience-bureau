// Dünya haritası için kullanılan paketlerin (d3-geo, topojson-client,
// world-atlas) resmi tip paketlerini ayrıca kurmamak için minimal tip
// bildirimleri. Bu dosya bir "script" d.ts'dir — import/export içermemeli.
declare module 'd3-geo' {
  export function geoNaturalEarth1(): any
  export function geoPath(projection?: any): any
}
declare module 'topojson-client' {
  export function feature(topology: any, object: any): any
}
declare module 'world-atlas/countries-110m.json' {
  const data: any
  export default data
}
