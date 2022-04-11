import React from "react";
import { SearchIcon } from "@heroicons/react/outline";
import Select from "react-select";
import { procedures } from "../procedures";

function WidgetFilters({ address }) {
  const [selectedProcedure, setSelectedProcedure] = React.useState(null);

  // Keep track of local state called searchedCoords
  // If a user does a search or not track changing zoom level and map position

  const inputRef = React.useRef();
  // make a useref to read value of input field

  let autocomplete;
  // Create a variable for maps-places-autocomplete: assigned later

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

  React.useEffect(() => {
    if (address !== "") {
      inputRef.current.value = address;
    }
  }, [address]);

  return (
    <div className="filter_holder w-full justify-between items-center">
      <Select
        // This is the procedure dropdown element
        // use the first options to stop mobile bringing up native keyboard
        inputProps={{ readOnly: true }}
        blurInputOnSelect={true}
        searchable={false}
        isSearchable={false}
        options={procedures}
        placeholder="Select Procedure"
        className="procedure_filter w-full my-2 ring-transparent"
        isClearable={true}
        classNamePrefix="procedure"
        value={selectedProcedure}
        onChange={(val) => {
          if (val && val.value) {
            setSelectedProcedure({
              value: val.value,
              label: val.value,
            });
          } else {
            setSelectedProcedure(null);
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
          defaultValue={address}
        />
      </div>

      {/* renders the clickable search icon */}
      <div
        className="search_button bg-blue-900 h-12"
        onClick={() => {
          const procedure = selectedProcedure ? selectedProcedure.value : null;
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
