import React, { PropTypes } from "react";
import ReactDOM from "react-dom";
import L from "leaflet";
import cluster from "leaflet-markercluster";

class ObservationsMap extends React.Component {
  componentDidMount( ) {
    var layer = L.tileLayer( "http://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png", { attribution: false } );
    this.map = L.map( ReactDOM.findDOMNode( this ), {
      scrollWheelZoom: false,
      center: [0, 0],
      zoom: 2
    } );
    this.map.addLayer( layer );
  }
  componentDidUpdate( ) {
    if ( this.obsLayer ) {
      this.map.removeLayer( this.obsLayer );
    }
    // this.markers = new L.MarkerClusterGroup( );
    // for (var i = this.props.observations.length - 1; i >= 0; i--) {
    //   let o = this.props.observations[i];
    //   if ( o.latitude && o.longitude ) {
    //     let marker = new L.Marker( { lat: o.latitude, lon: o.longitude} );
    //     // this.markers.addLayer( marker );
    //     this.map.addLayer( marker )
    //   }
    // }
    this.obsLayer = L.tileLayer( `http://api.inaturalist.org/v1/heatmap/{z}/{x}/{y}.png?${this.props.params}` );
    this.obsLayer.addTo( this.map );
  }
  render( ) {
    return (
      <div>
        <div
          className="ObservationsMap"
          style={{
            minHeight: "100px"
          }}
        ></div>
      </div>
    );
  }
}

ObservationsMap.propTypes = {
  params: PropTypes.string
};

export default ObservationsMap;
