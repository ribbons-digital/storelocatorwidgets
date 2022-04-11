import SearchBarFilters from "./widgets/SearchBarFilter";
import "./App.css";
import "./SearchBar.css";
import "./Widget.css";
import React from "react";
import WidgetFilters from "./widgets/WidgetFilter";

function App() {
  const [userLocation, setUserLocation] = React.useState(null);
  const [address, setAddress] = React.useState("");

  function initialSearch() {
    if (userLocation) {
      const geocoder = new google.maps.Geocoder();
      geocoder
        .geocode({ location: userLocation })
        .then((res) => {
          if (res.results[0]) {
            setAddress(res.results[0].formatted_address);
          }
        })
        .catch((e) => console.log(e.message));
    }
  }

  React.useEffect(() => {
    // This calls the user location popup
    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    function success(pos) {
      const crd = pos.coords;

      setUserLocation({
        lat: +crd.latitude,
        lng: +crd.longitude,
      });
    }

    function error(err) {
      console.warn(`ERROR(${err.code}): ${err.message}`);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(success, error, options);
      // Checks if geolocation data is available, makes sure page is loaded without query strings
      // Calls get current position function.
      // success, error and option callbacks are defined above
    }
  }, []);

  React.useEffect(() => {
    if (userLocation) {
      initialSearch();
    }
  }, [userLocation]);

  return <WidgetFilters address={address} />;
}

export default App;
