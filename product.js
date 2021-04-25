var mongoose = require('mongoose');
var Schema = mongoose.Schema;

mongoose.Promise = global.Promise;
mongoose.connect(process.env.DB, { useNewUrlParser: true } );
mongoose.set('useCreateIndex', true);


var ProductSchema = new Schema({
    title: { type: String, required: true, index: { unique: true }},
    yearReleased: { type: String ,required: true },
  description:{type: String, required: true},
    ImageURL: {type:String, required: false},
    price:{type: Number, required:true}

});

// return the model

module.exports = mongoose.model('Product', ProductSchema);