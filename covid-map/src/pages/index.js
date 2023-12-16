import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { Helmet } from "react-helmet";
import L from "leaflet";
import { Marker, useMap } from "react-leaflet";

import { promiseToFlyTo, getCurrentLocation } from "lib/map";

import Layout from "components/Layout";
import Container from "components/Container";
import Map from "components/Map";

import axios from 'axios';
import { useTracker } from "hooks";

const LOCATION = { lat: 33.7743, lng: -117.9380 };   // middle of the world
  // { lat: 38.9072, lng: -77.0369 };  // in Los Angeles

  const CENTER = [LOCATION.lat, LOCATION.lng];
const DEFAULT_ZOOM = 2;
const ZOOM = 10;

const timeToZoom = 2000;

function countryPointToLayer (feature = {}, latlng) { 
  const { properties = {} } = feature;
  let updatedFormatted;
  let casesString;

  const {
    country,
    updated,
    cases, 
    deaths,
    recovered,
    population,
    tests,
  } = properties;

  casesString = `${cases}`;

  if      (cases > 1000000) { casesString = `${casesString.slice(0, -6)}M+`; }
  else if (cases > 1000)    { casesString = `${casesString.slice(0, -3)}k+`;  }
  
  if (updated)      { updatedFormatted = new Date(updated).toLocaleString(); }

  const html = `
    <span class="icon-marker">
      <span class="icon-marker-tooltip">
        <h2>${country}</h2>
        <ul>
          <li><strong>Population:</strong> ${population}</li>
          <li><strong>Confirmed:</strong> ${cases}</li>
          <li><strong>Deaths:</strong> ${deaths}</li>
          <li><strong>Recovered:</strong> ${recovered}</li>
          <li><strong>Tests:</strong> ${tests}</li>
          <li><strong>Last Update:</strong> ${updatedFormatted}</li>
        </ul>
      </span>
      ${casesString} 
    </span>
  `;

  return L.marker(latlng, {
    icon: L.divIcon({
      className: 'icon',
      html
    }),
    riseOnHover: true
  });
}

const MapEffect = ({ markerRef }) => {
  console.log('in MapEffect...');
  const map = useMap();

  useEffect(() => {
    if (!markerRef.current || !map) return;

    (async function run() {
      console.log('about to call axios to get the data...');

      // const options = {
      //   method: 'GET',
      //   url: 'https://api.api-ninjas.com/v1/covid19',
      //   // params: {country: 'China'},    // for one country -- if blank will get all countries
      //   headers: {
      //     'X-API-Key': 'Vx489MBLcso/FNugQeMLNw==7tSBYITt1WeQkCTu',
      //     'X-API-Host': 'api.api-ninjas.com'
      //   }
      // };


      const options = {
        method: 'GET',
        url: 'https://disease.sh/v3/covid-19/countries',
        // params: {country: 'China'},    // for one country -- if blank will get all countries
        // headers: {
        //   'Disease.sh': 'disease.sh'
        // }
      };
      
      let response; 
      
      try { response = await axios.request(options); 
      } catch (error) { 
        console.error(error);  
        return; 
      }
      console.log(response.data);
      // const rdr = response.data.response;    // for rapidapi
      // const data = rdr;

      const data = response.data;     // for disease.sh
      const hasData = Array.isArray(data) && data.length > 0;
      if (!Array.isArray(data)) { console.log('not an array!'); return; }
      if (data.length === 0) { console.log('data length is === 0'); }

      if (!hasData) { console.log('No data, sorry!');  return; }

      const geoJson = {
        type: 'FeatureCollection',
        features: data.map((country = {}) => {
          const {countryInfo = {} } = country;
          const { lat, long: lng } = countryInfo;
          return {
            type: 'Feature',
            properties: {
              ...country,
            },
            geometry: {
              type: 'Point',
              coordinates: [ lng, lat]
            }
          }
        })
      }

      console.log('geoJson', geoJson);

      const geoJsonLayers = new L.GeoJSON(geoJson, { 
        pointToLayer: countryPointToLayer
      });
      var _map = markerRef.current._map;
      geoJsonLayers.addTo(_map);

      const location = await getCurrentLocation().catch(() => LOCATION);

      setTimeout(async () => {
        await promiseToFlyTo(map, { zoom: ZOOM, center: location, });
      }, timeToZoom);
    })();
  }, [map, markerRef]);

  return null;
};

MapEffect.propTypes = {
  markerRef: PropTypes.object,
};

const IndexPage = () => {
  console.log('in IndexPage, before useRef');
  const markerRef = useRef();

  const mapSettings = {
    center: CENTER,
    defaultBaseMap: "OpenStreetMap",
    zoom: DEFAULT_ZOOM,
  };

  return (
    <Layout pageName="home">
      <Helmet><title>Home Page</title></Helmet>
      {/* do not delete MapEffect and Marker
             with current code or axios will not run */}
      <Map {...mapSettings}>
       <MapEffect markerRef={markerRef} />            
       <Marker ref={markerRef} position={CENTER} />
      </Map>

      <div className="tracker">

         <div className="tracker-stats">
           <ul>
             <li className="tracker-stat">
               <p className="tracker-stat-primary">
                ---
                 <strong>Total Tests</strong>
               </p>
               <p className="tracker-stat-secondary">
                 ---
                 <strong>Per 1 Million</strong>
               </p>
             </li>
             <li className="tracker-stat">
               <p className="tracker-stat-primary">
                ---
                 <strong>Total Cases</strong>
               </p>
               <p className="tracker-stat-secondary">
                 ---
                 <strong>Per 1 Million</strong>
               </p>
             </li>
             <li className="tracker-stat">
               <p className="tracker-stat-primary">
                 ---
                 <strong>Total Deaths</strong>
               </p>
               <p className="tracker-stat-secondary">
                 --- 
                 <strong>Per 1 Million</strong>
               </p>
             </li>
             <li className="tracker-stat">
               <p className="tracker-stat-primary">
                 ---
                 <strong>Active</strong>
               </p>
             </li>
             <li className="tracker-stat">
               <p className="tracker-stat-primary">
                 ---
                 <strong>Critical</strong>
               </p>
             </li>
             <li className="tracker-stat">
               <p className="tracker-stat-primary">
                 ---
                 <strong>Recovered</strong>
               </p>
             </li>
           </ul>
         </div>

         <div className="tracker-last-updated">
           <p>---</p>
         </div>
       </div>

       <Container type="content" className="text-center home-start">
         <h2>Demo Mapping App with Gatsby and React Leaflet</h2>
         <ul>
           <li>
             Uses{ ' ' }
             <a href="https://github.com/ExpDev07/coronavirus-tracker-api">
               github.com/ExpDev07/coronavirus-tracker-api
             </a>{ ' ' }
             via <a href="https://coronavirus-tracker-api.herokuapp.com/">coronavirus-tracker-api.herokuapp.com</a>
           </li>
           <li>
             Which uses jhu - <a href="https://github.com/CSSEGISandData/COVID-19">github.com/CSSEGISandData/COVID-19</a>{ ' ' }
             - Worldwide Data repository operated by the Johns Hopkins University Center for Systems Science and
             Engineering (JHU CSSE).
           </li>
           <li>
             And csbs -{ ' ' }
             <a href="https://www.csbs.org/information-covid-19-coronavirus">
               csbs.org/information-covid-19-coronavirus
             </a>{ ' ' }
             - U.S. County data that comes from the Conference of State Bank Supervisors.
           </li>
         </ul>

         {/* <h2>Want to build your own map?</h2>
//         <p>
//           Check out{ ' ' }
//           <a href="https://github.com/colbyfayock/gatsby-starter-leaflet">
//             github.com/colbyfayock/gatsby-starter-leaflet
//           </a>
//         </p> */}
       </Container>
    </Layout>
  );
};

export default IndexPage;

// import React, { useRef, useEffect } from 'react';
// import PropTypes from "prop-types";
// import Helmet from 'react-helmet';
// import L from 'leaflet';
// import { Marker, useMap } from "react-leaflet";

// import { promiseToFlyTo, geoJsonToMarkers, clearMapLayers } from 'lib/map';
// import { trackerLocationsToGeoJson, trackerFeatureToHtmlMarker } from 'lib/coronavirus';
// import { commafy, friendlyDate } from 'lib/util';

// import Layout from 'components/Layout';
// import Container from 'components/Container';
// import Map from 'components/Map';

// import { useTracker } from 'hooks';

// const LOCATION = {
//   lat: 0,
//   lng: 0,
// };
// const CENTER = [LOCATION.lat, LOCATION.lng];
// const DEFAULT_ZOOM = 1;

// const IndexPage = () => {
//   const { data: countries = [] } = useTracker({
//     api: 'countries',
//     // fetcherTracker: fetchTrackerCountries
//   });

//   const { data: stats = {} } = useTracker({
//     api: 'all',
//   });

//   const hasCountries = Array.isArray( countries ) && countries.length > 0;

//   /**
//    * mapEffect
//    * @description Fires a callback once the page renders
//    * @example Here this is and example of being used to zoom in and set a popup on load
//    */

//   async function mapEffect({ leafletElement: map } = {}) {
//     if ( !map || !hasCountries ) return;

//     clearMapLayers({
//       map,
//       excludeByName: ['OpenStreetMap'],
//     });

//     const locationsGeoJson = trackerLocationsToGeoJson( countries );

//     const locationsGeoJsonLayers = geoJsonToMarkers( locationsGeoJson, {
//       onClick: handleOnMarkerClick,
//       featureToHtml: trackerFeatureToHtmlMarker,
//     });

//     const bounds = locationsGeoJsonLayers.getBounds();

//     locationsGeoJsonLayers.addTo( map );

//     map.fitBounds( bounds );
//   }

//   function handleOnMarkerClick({ feature = {} } = {}, event = {}) {
//     const { target = {} } = event;
//     const { _map: map = {} } = target;

//     const { geometry = {}, properties = {} } = feature;
//     const { coordinates } = geometry;
//     const { countryBounds, countryCode } = properties;

//     promiseToFlyTo( map, {
//       center: {
//         lat: coordinates[1],
//         lng: coordinates[0],
//       },
//       zoom: 3,
//     });

//     if ( countryBounds && countryCode !== 'US' ) {
//       const boundsGeoJsonLayer = new L.GeoJSON( countryBounds );
//       const boundsGeoJsonLayerBounds = boundsGeoJsonLayer.getBounds();

//       map.fitBounds( boundsGeoJsonLayerBounds );
//     }
//   }

//   const mapSettings = {
//     center: CENTER,
//     defaultBaseMap: 'OpenStreetMap',
//     zoom: DEFAULT_ZOOM,
//     mapEffect,
//   };

//   return (
//     <Layout pageName="home">
//       <Helmet>
//         <title>Home Page</title>
//       </Helmet>

//       <div className="tracker">
//         <Map {...mapSettings} />

//         <div className="tracker-stats">
//           <ul>
//             <li className="tracker-stat">
//               <p className="tracker-stat-primary">
//                 { stats ? commafy( stats?.tests ) : '-' }
//                 <strong>Total Tests</strong>
//               </p>
//               <p className="tracker-stat-secondary">
//                 { stats ? commafy( stats?.testsPerOneMillion ) : '-' }
//                 <strong>Per 1 Million</strong>
//               </p>
//             </li>
//             <li className="tracker-stat">
//               <p className="tracker-stat-primary">
//                 { stats ? commafy( stats?.cases ) : '-' }
//                 <strong>Total Cases</strong>
//               </p>
//               <p className="tracker-stat-secondary">
//                 { stats ? commafy( stats?.casesPerOneMillion ) : '-' }
//                 <strong>Per 1 Million</strong>
//               </p>
//             </li>
//             <li className="tracker-stat">
//               <p className="tracker-stat-primary">
//                 { stats ? commafy( stats?.deaths ) : '-' }
//                 <strong>Total Deaths</strong>
//               </p>
//               <p className="tracker-stat-secondary">
//                 { stats ? commafy( stats?.deathsPerOneMillion ) : '-' }
//                 <strong>Per 1 Million</strong>
//               </p>
//             </li>
//             <li className="tracker-stat">
//               <p className="tracker-stat-primary">
//                 { stats ? commafy( stats?.active ) : '-' }
//                 <strong>Active</strong>
//               </p>
//             </li>
//             <li className="tracker-stat">
//               <p className="tracker-stat-primary">
//                 { stats ? commafy( stats?.critical ) : '-' }
//                 <strong>Critical</strong>
//               </p>
//             </li>
//             <li className="tracker-stat">
//               <p className="tracker-stat-primary">
//                 { stats ? commafy( stats?.recovered ) : '-' }
//                 <strong>Recovered</strong>
//               </p>
//             </li>
//           </ul>
//         </div>

//         <div className="tracker-last-updated">
//           <p>Last Updated: { stats ? friendlyDate( stats?.updated ) : '-' }</p>
//         </div>
//       </div>

//       <Container type="content" className="text-center home-start">
//         <h2>Demo Mapping App with Gatsby and React Leaflet</h2>
//         <ul>
//           <li>
//             Uses{ ' ' }
//             <a href="https://github.com/ExpDev07/coronavirus-tracker-api">
//               github.com/ExpDev07/coronavirus-tracker-api
//             </a>{ ' ' }
//             via <a href="https://coronavirus-tracker-api.herokuapp.com/">coronavirus-tracker-api.herokuapp.com</a>
//           </li>
//           <li>
//             Which uses jhu - <a href="https://github.com/CSSEGISandData/COVID-19">github.com/CSSEGISandData/COVID-19</a>{ ' ' }
//             - Worldwide Data repository operated by the Johns Hopkins University Center for Systems Science and
//             Engineering (JHU CSSE).
//           </li>
//           <li>
//             And csbs -{ ' ' }
//             <a href="https://www.csbs.org/information-covid-19-coronavirus">
//               csbs.org/information-covid-19-coronavirus
//             </a>{ ' ' }
//             - U.S. County data that comes from the Conference of State Bank Supervisors.
//           </li>
//         </ul>

//         {/* <h2>Want to build your own map?</h2>
//         <p>
//           Check out{ ' ' }
//           <a href="https://github.com/colbyfayock/gatsby-starter-leaflet">
//             github.com/colbyfayock/gatsby-starter-leaflet
//           </a>
//         </p> */}
//       </Container>
//     </Layout>
//   );
// };

// export default IndexPage;