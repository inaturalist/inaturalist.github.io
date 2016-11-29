import React, { PropTypes } from 'react';

const RecentObservations = ( { observations } ) => (
  <div className="RecentObservations">
    <div className="observations">
      { observations.map( o => {
        const p = o.photos[0];
        const size = "small";
        const dims = p.dimensions( );
        if ( !dims || !dims.width ) {
          return;
        }
        let height = 150;
        let width;
        if ( dims ) {
          width = height / dims.height * dims.width;
        } else {
          width = height;
        }
        let flexGrow = 1;
        if ( o.faves_count > 0 ) {
          height = height * 4;
          width = width * 4;
          flexGrow = 4;
        } else if ( o.comments_count > 0 ) {
          height = height * 2;
          width = width * 2;
          flexGrow = 2;
        }
        return (
          <a
            key={`recent-observations-${o.id}`}
            href={`http://www.inaturalist.org/observations/${o.id}`}
            width={width}
            height={height}
            style={{
              width,
              maxWidth: 2 * width,
              minHeight: height,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundImage: `url(${p.photoUrl( size )})`,
              flexGrow
            }}
          />
        );
      } ) }
    </div>
  </div>
);

RecentObservations.propTypes = {
  observations: PropTypes.array
};

export default RecentObservations;
