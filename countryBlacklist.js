var mongoose  =  require( 'mongoose' );
var Schema    =  mongoose.Schema;


var blacklistSchema  =  new Schema({
    countryName :	{type : String, required : true, unique : true}
});
var Blacklist  =  mongoose.model( 'Blacklist' , blacklistSchema );
module.exports  =  Blacklist;