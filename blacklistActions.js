const Blacklist  =  require( "./countryBlacklist" );
exports.isBlacklisted =
    async function ( countryName )
    {
        query      = { countryName : countryName };
        bl  = await Blacklist.findOne( query );
        return bl;
    };
exports.getBlacklist =
    ( req , res ) =>
    {
        Blacklist.find(
            req.query,
            ( err , bl ) =>
            {
                if ( err )
                {
                    res.send(err);
                }
                res.send( bl );
            });
    };

