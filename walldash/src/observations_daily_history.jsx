import React, { PropTypes } from 'react';
import _ from "lodash";
import C3Chart from "./c3chart";
import moment from "moment";

const ObservationsHistory = ( { researchFrequency, needsIDFrequency, casualFrequency } ) => {
  const dateKeys = _.keys( researchFrequency ).sort( );
  const dates = dateKeys.map( k => new Date( k ) );
  const researchLabel = "Research";
  const needsIDLabel = "Needs ID";
  const casualLabel = "Casual";
  return (
    <div className="ObservationsHistory">
      <C3Chart
        config={{
          data: {
            x: "x",
            columns: [
              ["x", ...dates],
              [casualLabel, ...dateKeys.map( d => casualFrequency[d] || 0 )],
              [needsIDLabel, ...dateKeys.map( d => needsIDFrequency[d] || 0 )],
              [researchLabel, ...dateKeys.map( d => researchFrequency[d] || 0 )]
            ],
            types: {
              [researchLabel]: "area",
              [needsIDLabel]: "area",
              [casualLabel]: "area"
            },
            colors: {
              [researchLabel]: "#74ac00",
              [needsIDLabel]: "#FFEE91",
              [casualLabel]: "#aaa"
            },
            groups: [[researchLabel, needsIDLabel, casualLabel]],
            labels: {
              format: ( v, id, i, j ) => {
                if ( i === 0 || i === ( dateKeys.length - 1 ) ) {
                  return v;
                }
                return null;
              }
            },
            order: null
          },
          axis: {
            x: {
              type: "timeseries",
              tick: {
                format: date => moment( date ).format( "h a" )
              }
            }
          },
          legend: {
            show: false
          },
          point: {
            show: false
          }
        }}
      />
    </div>
  );
}

ObservationsHistory.propTypes = {
  researchFrequency: PropTypes.object,
  needsIDFrequency: PropTypes.object,
  casualFrequency: PropTypes.object
};

ObservationsHistory.defaultProps = {
  researchFrequency: { },
  needsIDFrequency: { },
  casualFrequency: { }
};

export default ObservationsHistory;
