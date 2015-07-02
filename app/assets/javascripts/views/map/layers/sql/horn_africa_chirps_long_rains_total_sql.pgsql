with geom as (
  select st_memunion(the_geom_webmercator) as the_geom_webmercator from 
grpcountries_250k_polygon where region = 'Horn')

select ST_ColorMap( ST_Union(ST_clip( t.the_raster_webmercator,geom.the_geom_webmercator, true)),'bluered') the_raster_webmercator 
from hornofafrica_chirps_long_rains_total t, geom  