import React from "react";
import { SearchIcon } from "@heroicons/react/outline";
import Select from "react-select";
import { hasQueryStrings } from "../utils";
import queryString from "query-string";
import { map } from "../Map/Google_Map";

const distanceOptions = [
  {
    label: "10 KM",
    value: 10000,
  },
  {
    label: "20 KM",
    value: 20000,
  },
  {
    label: "30 KM",
    value: 30000,
  },
  {
    label: "40 KM",
    value: 40000,
  },
];

function WidgetFilters({
  // all the props we passed from app.jsx line 168.
  locations,
  setView,
  setLocations,
  filterConfig,
  setFilterConfig,
  originalData,
  view,
  setSearchResult,
  resetData,
}) {
  const [searchedCoords, setSearchedCoords] = React.useState(null);

  // Keep track of local state called searchedCoords
  // If a user does a search or not track changing zoom level and map position

  const inputRef = React.useRef();
  // make a useref to read value of input field

  const locationQueries = queryString.parse(window.location.search);
  // use query string library to check if there are query strings in the url - as page can be loaded in two different ways

  let autocomplete;
  // Create a variable for maps-places-autocomplete: assigned later

  function getProcedures() {
    // arranging procedure list
    const clinics = originalData;
    const list = clinics
      .map((location) => {
        return location.services.split(",");
      })
      .flat();

    const procedures = [...new Set(list)].map((item) =>
      item[0] === " " ? item.substring(1, item.length) : item
    );

    return [...new Set(procedures)];
  }

  function getProceduresList() {
    return getProcedures().map((procedure) => {
      return {
        value: procedure,
        label: procedure,
      };
    });
  }

  function filterStores() {
    // when you click search, we call this function
    let distanceList;
    let filteredStores = originalData;

    // we need to use localstorage because if we don't we have an error using state
    // this is error handling because engaging google api for places wipes what we save in state
    // For example - doing a second search - going back to a page - the moment we engage the api - it cache clears state (this was annoying af)
    // so as a workaround - we store in localstorage and pull the value back.
    const procedure = localStorage.getItem("procedure");

    const distance = !localStorage.getItem("distance")
      ? // Ternery statements are fun.
        // we have a default of 50km
        // if there's nothing in local storage - use default
        filterConfig.distance
      : //or use value in local storage
        Number(localStorage.getItem("distance"));

    if (inputRef.current && inputRef.current.value === "") {
      // if nothing has been entered in the input field - we assign an empty array
      distanceList = [];
    } else {
      // otherwise we assign the value to the distance list variable
      distanceList = filterConfig.distanceList;
      // whenever we do a distance matrix calculation.
      //We save the result to the filterConfig.distanceList and assign it to the distanceList variable
    }

    if (
      (!procedure || procedure === "null" || procedure === "undefined") &&
      distanceList.length === 0
    )
      return;
    // if there's no procesdure and the array is empty - no filtering

    if (procedure && procedure !== "null" && procedure !== "undefined") {
      // but if there is a procedure, then filter stores by procedure
      filteredStores = filteredStores.filter((location) =>
        location.services.includes(procedure)
      );
    }

    if (distanceList.length > 0) {
      // if the distancelist is 1 or above an address has been entered, we can search by area
      //

      let distanceListSortedByDistance = distanceList
        .filter(
          (item) =>
            Number(item.distanceFromUserLocation.split(" ")[0]) * 1000 <
            distance
        )
        //filter array by checking the sgtore distance is less than the distance in the dropdown

        .sort(
          (a, b) =>
            Number(a.distanceFromUserLocation.split(" ")[0]) -
            Number(b.distanceFromUserLocation.split(" ")[0])
        );

      const storeIds = distanceListSortedByDistance
        //sort the result by distance so we get nearest clinics first

        .map((store) => store.storeId);
      //map over the filtered array and sorted array retrieve store ID's

      filteredStores = filteredStores
        .filter(
          (store) => storeIds.find((id) => id === store.locationID)
          //addition sort to arrange the ID's in order of shortest distance
        )
        .sort(
          (a, b) =>
            storeIds.indexOf(a.locationID) - storeIds.indexOf(b.locationID)
        );

      distanceListSortedByDistance = distanceListSortedByDistance.filter(
        (item) =>
          filteredStores.find((store) => store.locationID === item.storeId)
      );

      filteredStores = filteredStores.map((store, i) => ({
        ...store,
        distanceFromUserLocation:
          distanceListSortedByDistance[i].distanceFromUserLocation,
      }));
    }

    const zoomLevel = getZoomLevel();

    setView({
      ...view,
      detail: false,
      clinic: null,
      zoomLevel:
        searchedCoords && !view.initialSearch
          ? zoomLevel
          : searchedCoords && view.initialSearch
          ? 12.5
          : 4.5,
      hasSearched: true,
      initialSearch: false,
      center: searchedCoords ?? {
        lat: -23.700552,
        lng: 133.882675,
      },
    });

    setLocations(filteredStores);
    //Call setSearchResult to save the search result.
    // in ClinicDetail component, we can use it when clicking on the "back to result" button
    setSearchResult({
      result: filteredStores,
      zoomLevel: searchedCoords ? zoomLevel : 4.5,
      center: searchedCoords ?? {
        lat: -33.8688,
        lng: 151.2093,
      },
    });
  }

  function getZoomLevel() {
    const distance = !localStorage.getItem("distance")
      ? 40000
      : Number(localStorage.getItem("distance"));
    if (distance === 10000) {
      return 13;
    } else if (distance === 20000) {
      return 12;
    } else if (distance === 30000) {
      return 11;
    } else if (distance === 40000) {
      return 10.5;
    } else {
      return 4.5;
    }
  }

  async function performDistanceCalculations({
    withQueryStrings = false,
    initial = false,
  }) {
    // function to perform distance calculations
    // accepts an optional argument called initial - default set to false
    // This function is used in several instances and needs the optional argument to work

    let place;
    // This variable is held for later - set later depending on places being retrieved by query string
    // if the address comes in from the homepage widget via query string, we retrieve the information from "places-service" api without autocomplete

    const { location } = locationQueries;
    //Extract locations info from the query string

    if (
      hasQueryStrings(locationQueries) &&
      location &&
      withQueryStrings &&
      !initial
    ) {
      getPlace(location);
    }
    if (
      // If user skips homepage and goes straight to searching on the main map page
      // There are no query strings
      (!hasQueryStrings(locationQueries) && !initial) ||
      (hasQueryStrings(locationQueries) &&
        location &&
        !withQueryStrings &&
        !initial)
    ) {
      place = autocomplete.getPlace();
      // get the place info from the address input field (autocomplete)
      if (!place.geometry) {
        // as function above - get a suggestion
        getPlaceSuggestion(place.name);
      } else {
        // use selected data and call distance matrix
        getPlaceDistance(place);
        setSearchedCoords({
          lat: Number(place.geometry.location.lat()),
          lng: Number(place.geometry.location.lng()),
        });
      }
    }
    if (initial) {
      initialSearch();
    }
  }

  function getPlace(location) {
    console.log(location);
    let place;
    // Check if there's a query in url, checks location in query string,
    // Checks if the perform distance calculation has been called with argument set to true
    // if that's all good - create a map as a requirement to engage places api.
    const googleMap = new google.maps.Map(document.getElementById("map"), {
      center: view.center,
      zoom: view.zoomLevel,
      mapTypeControl: false,
    });

    const request = {
      query: location,
      fields: ["name", "geometry"],
    };

    const service = new google.maps.places.PlacesService(googleMap);
    // Use googlemap creation to engage place-service api - again, necessary if we have a query string
    // if we have it, call findPlaceFromQuery from places-service api
    service.findPlaceFromQuery(request, async (results, status) => {
      //check the status, if we get an ok we assign results to 'place' variable
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        place = results[0];

        //place variable- if you have a complete google recognised address;
        // Google returns with a 'geometry' property inside of it
        if (!place.geometry) {
          // But if we don't  have that geometry property.... - we need to engage a different google service

          getPlaceSuggestion(place.name);
          // if the query string address isn't cohesive or is misspelled - we ask for a suggestion
        } else {
          // if there is place geometry - get calculating on the distance
          getPlaceDistance(place);

          setSearchedCoords({
            lat: Number(place.geometry.location.lat()),
            lng: Number(place.geometry.location.lng()),
          });
        }
      }
    });
  }

  function initialSearch() {
    if (view.userLocation) {
      const geocoder = new google.maps.Geocoder();
      geocoder
        .geocode({ location: view.userLocation })
        .then((res) => {
          if (res.results[0]) {
            inputRef.current.value = res.results[0].formatted_address;
            getPlace(res.results[0].formatted_address);
          }
        })
        .catch((e) => console.log(e.message));
    }
  }

  // A function to get place detail using Google Autocomplete getQueryPredictions API (Google Suggestions)
  // This is called when user enters an address and presses the ENTER key right away without picking an address from the autocomplete dropdown
  function getPlaceSuggestion(placeName) {
    const service = new google.maps.places.AutocompleteService();

    service.getQueryPredictions(
      // use this to get a predicted suggestion from google suggestions api
      { input: placeName },
      async (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          inputRef.current.value = results[0].description;
          const request = {
            placeId: results[0].place_id,
            fields: ["name", "geometry"],
          };

          const placeService = new google.maps.places.PlacesService(map);
          placeService.getDetails(request, callback);

          function callback(place, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
              getPlaceDistance(place);
              setSearchedCoords({
                lat: Number(place.geometry.location.lat()),
                lng: Number(place.geometry.location.lng()),
              });
            }
          }
        }
      }
    );
  }

  async function getPlaceDistance(place) {
    // get a list of clinics filtered by procedure and pass it in to Oni API to get the distance list
    const clinicData = getClinicDataForOniEndpoint();

    const data = {
      userLat: Number(place.geometry.location.lat()),
      userLng: Number(place.geometry.location.lng()),
      storeLocations: clinicData,
    };

    fetch(
      import.meta.env.VITE_ONI_API_ENDPOINT_URL +
        import.meta.env.VITE_ONI_API_AUTH_KEY,
      {
        method: "POST",
        mode: "cors",
        body: JSON.stringify(data),
      }
    )
      .then((res) => res.json())
      .then((data) => {
        const list = data.storeInformationList.filter(
          (store) => store.distanceFromUserLocation !== "N/A"
        );

        setFilterConfig({
          // Call this function and save the list to the distance list property.
          // this is passed down via props on app.jsx
          ...filterConfig,
          distanceList: list,
        });
      })
      .catch((err) => console.log(err));
  }

  React.useEffect(() => {
    // Check for query strings in URL.
    // if Query is found saves the value to local storage
    // assigns the value of the location to the input field
    if (hasQueryStrings(locationQueries)) {
      const { location, procedure } = locationQueries;

      if (!!procedure || procedure !== "null") {
        localStorage.setItem("procedure", procedure);
      }
      if (location) {
        inputRef.current.value = location;

        performDistanceCalculations({ withQueryStrings: true, initial: false });
        // if a location query string is available - call distance matrix api
      }
    } else if (Object.entries(locationQueries).length === 0) {
      performDistanceCalculations({ withQueryStrings: false, initial: true });
    }
  }, []);

  function getClinicDataForOniEndpoint() {
    const clinics = [...originalData];

    const filteredClinics = clinics.map((clinic) => ({
      storeId: clinic.locationID,
      lat: clinic.address.coords1.lat,
      lng: clinic.address.coords1.long,
    }));

    return filteredClinics;
  }

  React.useEffect(() => {
    // This side effect extentiates googles autocomplete function for places.

    const options = {
      //Sets the options to look at Australia only
      // types: ["(regions)"],
      componentRestrictions: { country: "au" },
    };

    autocomplete = new window.google.maps.places.Autocomplete(
      // pass in 2 params, 1st is the input field called by the user
      // pass in the options like the country code
      inputRef.current,
      options
    );

    autocomplete.setFields(["address_components", "geometry", "name"]);
    // set specific fields for searching

    autocomplete.addListener("place_changed", () => {
      // Add an event listener in case user types into location field
      // When you select one, the places change and perform new distance calculations

      performDistanceCalculations({ withQueryStrings: false, initial: false });
    });
  }, []);

  React.useEffect(() => {
    // if there is a query string - calls the filter stores function
    // this is the same function as clicking the search icon but works automatically
    if (view.initialSearch) {
      filterStores();
    }

    if (
      hasQueryStrings(locationQueries) &&
      locationQueries.location &&
      locationQueries.procedure
    ) {
      filterStores();
    }
  }, [filterConfig.distanceList.length]);

  return (
    // Render 4 things:
    // The procedure drop down
    // The address autocomplete
    // the distance dropdown
    // the clickable search icon
    // the number of results readout

    <div className="filter_holder w-full  justify-between items-center">
      <Select
        // This is the procedure dropdown element
        // use the first options to stop mobile bringing up native keyboard
        inputProps={{ readOnly: true }}
        blurInputOnSelect={true}
        searchable={false}
        isSearchable={false}
        options={getProceduresList()}
        placeholder="Select Procedure"
        className="procedure_filter w-full  my-2 ring-transparent"
        isClearable={true}
        classNamePrefix="procedure"
        value={
          localStorage.getItem("procedure") === null ||
          localStorage.getItem("procedure") === "null" ||
          localStorage.getItem("procedure") === undefined ||
          localStorage.getItem("procedure") === "undefined"
            ? null
            : {
                value: localStorage.getItem("procedure"),
                label: localStorage.getItem("procedure"),
              }
        }
        onChange={(val) => {
          setFilterConfig({
            ...filterConfig,
            procedure: val ? val.value : null,
          });
          if (val && val.value) {
            localStorage.setItem("procedure", val.value);
          } else {
            localStorage.removeItem("procedure");
          }
        }}
        styles={{
          control: (styles) => ({
            ...styles,
            borderRadius: "0px",
            height: "50px",
            border: "1x solid rgba(30, 58, 138, 1)",
          }),
        }}
      />

      <div className="address_filter relative my-2">
        <input
          // This is the address select element
          className="address_filter-input px-3 py-3 w-full"
          placeholder="Search by Address or Suburb"
          ref={inputRef}
        />
      </div>

      {/* renders the clickable search icon */}
      <div
        className="search_button bg-blue-900 h-12"
        onClick={() => {
          const procedure = localStorage.getItem("procedure");
          if (inputRef.current) {
            document.location =
              "/our-locations/?procedure=" +
              procedure +
              "&location=" +
              inputRef.current.value;
          }
        }}
      >
        <SearchIcon className="search_filter_icon bg-blue-900 text-white p-2 h-12" />
      </div>
    </div>
  );
}

export default WidgetFilters;
