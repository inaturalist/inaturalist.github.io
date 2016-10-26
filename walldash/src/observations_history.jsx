import React, { PropTypes } from 'react';
import _ from "lodash";
import C3Chart from "./c3chart";
import moment from "moment";

const ObservationsHistory = ( { researchFrequency, needsIDFrequency, casualFrequency } ) => {
  const dates = _.keys( needsIDFrequency ).sort( );
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
              [researchLabel, ...dates.map( d => researchFrequency[d] || 0 )],
              [needsIDLabel, ...dates.map( d => needsIDFrequency[d] || 0 )],
              [casualLabel, ...dates.map( d => casualFrequency[d] || 0 )]
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
                if ( i === 0 || i === ( dates.length - 1 ) ) {
                  return v;
                }
                return null;
              }
            }
          },
          axis: {
            x: {
              type: "timeseries",
              tick: {
                count: 10,
                format: date => moment( date ).format( "D MMM YY" )
              }
            }
          },
          legend: {
            show: true
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
