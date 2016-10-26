import React, { Component, PropTypes } from 'react';
import inatjs from "inaturalistjs";
import moment from "moment";
import logo from './logo.svg';
import './App.css';
import '../node_modules/c3/c3.min.css';
import RecentObservations from "./recent_observations";
import ObservationsHistory from "./observations_history";
import ObservationsDailyHistory from "./observations_daily_history";
import ObservationsMap from "./observations_map";
import commaNumber from "comma-number";

class App extends Component {
  state = {
    observations: [],
    observationsFrequency: {},
    observationsFrequencyByHour: {}
  };
  componentDidMount( ) {
    this.load1MinuteData( );
    this.load24HourData( );
    this.load100DayData( );
  }
  load1MinuteData( ) {
    this.getObservations( );
    setTimeout( e => this.load1MinuteData( ), 1000 * 60 * 5 );
  }
  load24HourData( ) {
    this.getObservationsFrequencyByHour( );
    this.getRecentStats( );
    setTimeout( e => this.load24HourData( ), 1000 * 60 * 60 );
  }
  load100DayData( ) {
    this.getObservationsFrequency( );
    setTimeout( e => this.load100DayData( ), 1000 * 60 * 60 );
  }
  getObservations( ) {
    const that = this;
    inatjs.observations.search( { per_page: 200, verifiable: true, ttl: 25 } ).then( response => {
      console.log( "[DEBUG] updating observations, first: ", response.results[0].id );
      that.setState( { observations: response.results } );
    } );
  }
  getObservationsFrequency( ) {
    const that = this;
    const oneHundredDayAgo = moment( ).subtract( 100, "days" ).format( );
    inatjs.observations.histogram( {
      interval: "day",
      created_d1: oneHundredDayAgo,
      date_field: "created",
      quality_grade: "research"
    } ).then( response => {
      that.setState( { observationsFrequencyResearch: response.results.day } );
    } );
    inatjs.observations.histogram( {
      interval: "day",
      created_d1: oneHundredDayAgo,
      date_field: "created",
      quality_grade: "needs_id"
    } ).then( response => {
      that.setState( { observationsFrequencyNeedsID: response.results.day } );
    } );
    inatjs.observations.histogram( {
      interval: "day",
      created_d1: oneHundredDayAgo,
      date_field: "created",
      quality_grade: "casual"
    } ).then( response => {
      that.setState( { observationsFrequencyCasual: response.results.day } );
    } );
  }
  getObservationsFrequencyByHour( ) {
    const that = this;
    inatjs.observations.histogram( {
      interval: "hour",
      quality_grade: "research",
      date_field: "created",
      created_d1: moment( ).subtract( 1, "days" ).format( )
    } ).then( response => {
      that.setState( { observationsFrequencyByHourResearch: response.results.hour } );
    } );
    inatjs.observations.histogram( {
      interval: "hour",
      quality_grade: "needs_id",
      date_field: "created",
      created_d1: moment( ).subtract( 1, "days" ).format( )
    } ).then( response => {
      that.setState( { observationsFrequencyByHourNeedsID: response.results.hour } );
    } );
    inatjs.observations.histogram( {
      interval: "hour",
      quality_grade: "casual",
      date_field: "created",
      created_d1: moment( ).subtract( 1, "days" ).format( )
    } ).then( response => {
      that.setState( { observationsFrequencyByHourCasual: response.results.hour } );
    } );
  }
  getRecentStats( ) {
    const oneDayAgo = moment( ).subtract( 1, "days" ).format( );
    const that = this;
    inatjs.observations.search( {
      quality_grade: "research",
      created_d1: oneDayAgo
    } ).then( response => {
      that.setState( { one_day_research_grade_total: response.total_results } );
    } );
    inatjs.observations.search( {
      quality_grade: "needs_id",
      created_d1: oneDayAgo
    } ).then( response => {
      that.setState( { one_day_needs_id_total: response.total_results } );
    } );
    inatjs.observations.search( {
      quality_grade: "casual",
      created_d1: oneDayAgo
    } ).then( response => {
      that.setState( { one_day_casual_total: response.total_results } );
    } );
    inatjs.observations.observers( {
      created_d1: oneDayAgo
    } ).then( response => {
      that.setState( { totalObservers: response.total_results } );
    } );
  }
  render() {
    const totalObservations =
      parseInt( this.state.one_day_research_grade_total ) +
      parseInt( this.state.one_day_needs_id_total ) +
      parseInt( this.state.one_day_casual_total );
    return (
      <div className="App">
        <div className="charts">
          <h1>Past 24 Hours</h1>
          <ObservationsDailyHistory
            researchFrequency={this.state.observationsFrequencyByHourResearch}
            needsIDFrequency={this.state.observationsFrequencyByHourNeedsID}
            casualFrequency={this.state.observationsFrequencyByHourCasual}
          />
          <div className="stats">
            <big>
              <strong>{commaNumber( totalObservations )}</strong> observations
              by <strong>{commaNumber( this.state.totalObservers )}</strong> people
            </big>
            <small>
              <span className="research">
                { commaNumber( this.state.one_day_research_grade_total || 0 ) } RG
              </span>, <span className="needs_id">
                { commaNumber( this.state.one_day_needs_id_total || 0 ) } Needs ID
              </span>, <span className="casual">
                { commaNumber( this.state.one_day_casual_total || 0 ) } Casual
              </span>
            </small>
          </div>
          <ObservationsMap params={`verifiable=true&created_d1=${moment( ).subtract( 1, "days" ).format( )}`} />
          <h1>Past 100 Days</h1>
          <ObservationsHistory
            researchFrequency={this.state.observationsFrequencyResearch}
            needsIDFrequency={this.state.observationsFrequencyNeedsID}
            casualFrequency={this.state.observationsFrequencyCasual}
          />
          <ObservationsMap params={`verifiable=true&created_d1=${moment( ).subtract( 100, "days" ).format( )}`} />
          <small id="map-attribution">
            Map tiles © OpenStreetMap contributors, © CARTO
          </small>
        </div>
        <RecentObservations observations={this.state.observations}/>
      </div>
    );
  }
}

export default App;
