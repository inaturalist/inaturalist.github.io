import React, { PropTypes } from 'react';
import _ from "lodash";
import C3Chart from "./c3chart";

const SparkLine = ( { frequency } ) => {
  const dateKeys = _.keys( frequency ).sort( );
  const dates = dateKeys.map( k => new Date( k ) );
  const seriesLabel = "Verifiable observations by day created";
  return (
    <div className="SparkLine">
      <div className="min">{ frequency[dateKeys[0]] }</div>
      <C3Chart
        config={{
          size: {
            height: 50
          },
          tooltip: {
            show: false
          },
          data: {
            x: "x",
            columns: [
              ["x", ...dates],
              [seriesLabel, ...dateKeys.map( d => frequency[d] || 0 )]
            ],
            colors: {
              [seriesLabel]: "#74ac00"
            }
          },
          axis: {
            x: {
              show: false,
              type: "timeseries"
            },
            y: {
              show: false
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
      <div className="max">{ frequency[dateKeys[dateKeys.length - 1]] }</div>
    </div>
  );
}

SparkLine.propTypes = {
  frequency: PropTypes.object
};

export default SparkLine;
