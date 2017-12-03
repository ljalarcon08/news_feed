'use strict'

var mongoose=require('mongoose');
var dbOptions=require('./db.json');

var Schema=mongoose.Schema;
var ObjectId=Schema.ObjectId;
mongoose.Promise = global.Promise;
var nodeSchema=new Schema({
	create_at:"date",
	title:"string",
	url:"string",
	author:"string",
	story_text:"string",
	comment_text:"string",
	story_id:"number",
	parent_id:"number",
	is_visible:"boolean"
},
{
	collection:"nodeNew"
});
var PriceModel=mongoose.model('NodeNew',nodeSchema);
mongoose.connect(`mongodb://${dbOptions.mongo.host}/${dbOptions.mongo.db}`,{ useMongoClient: true });


module.exports=PriceModel;