var express = require('express');
var router = express.Router();
var NodeModel=require('../models/node-model');
var request = require('request');
var current_page=1;


//home page
router.get('/', function(req, res, next) {
	//get (eight) records for page (one)
	NodeModel.getAllBySortedDatePage(1,8,(rows)=>{
		NodeModel.countAll((count)=>{
 			res.render('index', { data: rows ,count:count});
		});
	});
	//socket io for home page
	res.io.once('connection',(socket)=>{
		//client to get page to update
		socket.on('act_page',(page)=>{
			current_page=page;
		});
		//Daemon send data for update page every half hour
		setInterval(()=>{
			NodeModel.getAllBySortedDatePage(current_page,8,(rows)=>{
				NodeModel.countAll((count)=>{
					socket.emit('update',{data:rows,count:count});
				});
			});
		},30*10*1000);
	});

});

//get that is responsible for hiding deleted data - create_at in MilliSeconds
router.get('/delete/:create_at', function(req, res, next) {
	NodeModel.disable(req.params.create_at,(rows)=>{
			NodeModel.countAll((count)=>{
				var msg={
					msg:'ok',
					count:count
				};
		 		res.json(msg);
		 	});
	});
});

//sends the corresponding records to a page
router.get('/page/:page/:page_size', function(req, res, next) {
	NodeModel.getAllBySortedDatePage(req.params.page,parseInt(req.params.page_size),(rows)=>{
		NodeModel.countAll((count)=>{
 			res.json({ data: rows ,count:count});
		});
	});
});

//get data from api
function getData(){
	var date = new Date();
	request.get('https://hn.algolia.com/api/v1/search_by_date?query=nodejs',
		(error, response,body) =>{
	  if (!error && response.statusCode == 200) {
	  		var json_=JSON.parse(body);
	  		for(var i in json_.hits){
	  			//if story_title or title isnt null then save data
	  			if(json_.hits[i].story_title!=null||json_.hits[i].title!=null){
		  			addData(json_.hits[i]);

		  		}
	  		}
	  }
	  else{
	  	throw error;
	  }
	});
}

setInterval(()=>{
		getData();
},60*60*1000);

//with the information of the api create json and insert into database
function addData(nodeHits){
	//if story_title is not null then use, if not then use title
	var title=(nodeHits.story_title!=null)?nodeHits.story_title:nodeHits.title;
	//if story_url is not null then use, if not then use url
	var url=(nodeHits.story_url!=null)?nodeHits.story_url:nodeHits.url;
	nodeNew={
		create_at:nodeHits.created_at,
		title:title,
		url:url,
		author:nodeHits.author,
		story_text:nodeHits.story_text,
		comment_text:nodeHits.comment_text,
		story_id:nodeHits.story_id,
		parent_id:nodeHits.parent_id,
		is_visible:true
	};
	NodeModel.insert(nodeNew,(err)=>{
		if(err)console.log(err);
	});	
}

module.exports = router;
