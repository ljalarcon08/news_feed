'use strict'

var connection=require('./db.js');
var NodeModel=()=>{};

//account all records that have not been left as invisible 
NodeModel.countAll=(cb)=>{
	connection.count({is_visible:true}).exec((err,count)=>{
		if(err)throw err;
		else{
			cb(count);
		}
	});
};

//send all records that have not been left as invisible 
//only send data used by view
//use pagination
//page=number page
//page_size=number of records
NodeModel.getAllBySortedDatePage=(page,page_size,cb)=>{
	connection.find({is_visible:true}).select('create_at title url author -_id').sort({create_at:-1}).skip(page > 0 ?((page-1)*page_size) : 0).limit(page_size).exec((err,rows)=>{
		if(err)throw err;
		else{
			cb(rows);
		}
	});
};

//insert a new record only if create_at does not exist in the collection
NodeModel.insert=(data,cb)=>{
	connection.count({create_at:data.create_at}).exec((err,count)=>{
		if(err)throw err;
		else{
			if(count==0){
				connection.create(data,(err)=>{
					if(err)throw err;
					cb();
				})
			}
			else{
				cb();
			}
		}
	});
};


//leaves a record invisible to the view
//to search for the record use create_at as Millisecond
NodeModel.disable=(data,cb)=>{
	connection.count({create_at:new Date(parseInt(data))}).exec((err,count)=>{
		if(err)throw err;
		else{
			if(count==0){
				cb();
			}	
			else{
				connection.findOneAndUpdate(
					{create_at:new Date(parseInt(data))},
					{
						is_visible:false
					},
					(err)=>{
						if(err)throw(err);
						cb();
					}
					)
				}
			}
		})
};

module.exports=NodeModel;