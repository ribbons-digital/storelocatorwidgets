import React from "react";
import { SearchIcon } from "@heroicons/react/outline";
import Select from "react-select";

function SearchBarFilters() {
  const [selectedOption, setSelectedOption] = React.useState(null);

  // Keep track of local state called searchedCoords
  // If a user does a search or not track changing zoom level and map position

  const inputRef = React.useRef();
  // make a useref to read value of input field

  let autocomplete;
  // Create a variable for maps-places-autocomplete: assigned later

  // function getProcedures() {
  //   // arranging procedure list
  //   const clinics = originalData;
  //   const list = clinics
  //     .map((location) => {
  //       return location.services.split(",");
  //     })
  //     .flat();

  //   const procedures = [...new Set(list)].map((item) =>
  //     item[0] === " " ? item.substring(1, item.length) : item
  //   );

  //   return [...new Set(procedures)];
  // }

  // function getProceduresList() {
  //   return getProcedures().map((procedure) => {
  //     return {
  //       value: procedure,
  //       label: procedure,
  //     };
  //   });
  // }

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
  }, []);

  return (
    <div className="filter_holder flex flex-row w-full space-x-4 justify-between items-center">
      <Select
        // This is the procedure dropdown element
        // use the first options to stop mobile bringing up native keyboard
        inputProps={{ readOnly: true }}
        blurInputOnSelect={true}
        searchable={false}
        isSearchable={false}
        options={[]}
        placeholder="Select Procedure"
        className="procedure_filter w-full md:w-1/2 lg:w-1/3 my-2"
        isClearable={true}
        classNamePrefix="procedure"
        value={selectedOption}
        onChange={(val) => {
          setSelectedOption({
            value: val,
            label: val,
          });
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

      <div className="address_filter flex-auto md:w-1/2 relative my-2">
        <input
          // This is the address select element
          className="address_filter-input px-3 py-3 w-full"
          placeholder="Search by Address or Suburb"
          ref={inputRef}
        />
      </div>

      {/* renders the clickable search icon */}
      <div
        className="search_filter_container bg-blue-900 h-12"
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

export default SearchBarFilters;
