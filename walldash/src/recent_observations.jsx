import React, { PropTypes } from 'react';

const RecentObservations = ( { observations } ) => (
  <div className="RecentObservations">
    <div className="observations">
      { observations.map( o => {
        const p = o.photos[0];
        const size = "small";
        if ( !p.dimensions( size ) || !p.dimensions( size ).width ) {
          return;
        }
        return (
          <a
            key={`recent-observations-${o.id}`}
            href={`http://www.inaturalist.org/observations/${o.id}`}
          >
            <img
              src={p.photoUrl( size )}
              width={p.dimensions( size ).width}
              height={p.dimensions( size ).height}
            />
          </a>
        );
      } ) }
    </div>
  </div>
);

RecentObservations.propTypes = {
  observations: PropTypes.array
};

export default RecentObservations;
