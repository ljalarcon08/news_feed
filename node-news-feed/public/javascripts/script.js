$(document).ready(function(){
	updateTime();
	//send to server actual page is 1
	io.emit('act_page',1);
	setInterval(updateTime(), 60*1000);
});

var io=io();

//receives page data update
io.on('update',function(data){
	updateSync(data);
});	

//allow page change
$(document).on("click", "a", function(){
	inactiveAllPages();
	//send to server actual page
	io.emit('act_page',$(this).attr("id"));
	updateTable($(this).attr("id"));    
	//set current page
    $(this).parent('li').addClass('active');
});

//updates page data when receiving new information by socket.io
function updateSync(data){
		$('.row').each(function() {
			$(this).remove();
		});
		var page=$('.active').first().find(":first-child").attr("id");
		for(var i in data.data){
			var tr='';
			var td='';
			tr='<tr class="row">';
			td+=data.data[i].url?'<td class="clickable-row"  data-href="'+data.data[i].url+'">':'<td>';
			td+='<div id="hightd">'+data.data[i].title+'</div>';
			td+='<div id="lowtd"> - '+data.data[i].author+' - </div>';
			td+='</td>';
			var date=new Date(data.data[i].create_at);
			if(data.data[i].url)td+='<td class="time clickable-row" data-href="'+data.data[i].url+'" id="hightime" data-value="'+date.getTime()+'"></td>';
			else td+='<td class="time" id="hightime" data-value="'+date.getTime()+'"></td>';
			td+='<td><input class="delete" type="image" src="images/trashBin.png" data-value="'+date.getTime()+'"></td>';
			tr+=td+'</tr>';
			if(i==0)$('#feed').find('tbody').append(tr);
			else $('#feed').find('tbody:last').append(tr);
		};
		updateTime();
		updatePagination(data.count,page);
}

//when pressing on a row open a new tab url
$(document).on("click","td.clickable-row",function() {
	var win = window.open($(this).data("href"),'_blank');
	if (win) {
	    win.focus();
	} else {
	    alert('Please allow popups for this website');
	}
 });

//action when pressing the garbage can
$(document).on("click","input.delete",function() {
	var deleteOk=confirm('Are you sure?');
	if(deleteOk){
		var create_atMil=$(this).attr('data-value');
		var page=$('.active').first().find(":first-child").attr("id");
	    $.get( "/delete/"+create_atMil, function( data ) {
	    	var maxPageData=page>1?page-1:1;
	    	//decreases number of pages when the last record of a page is deleted
	    	if(maxPageData*8==data.count){
	    		page=page>1?page-1:1;
	    	}
	    	//send to server actual page
	    	io.emit('act_page',page);
	    	updateTable(page);
	    });
	}
 });


//update data when change page
function updateTable(page){
	$.get( "/page/"+page+"/8", function( data ) {
		$('.row').each(function() {
			$(this).remove();
		});
		for(var i in data.data){
			var tr='';
			var td='';
			tr='<tr class="row">';
			td+=data.data[i].url?'<td class="clickable-row"  data-href="'+data.data[i].url+'">':'<td>';
			td+='<div id="hightd">'+data.data[i].title+'</div>';
			td+='<div id="lowtd"> - '+data.data[i].author+' - </div>';
			td+='</td>';
			var date=new Date(data.data[i].create_at);
			if(data.data[i].url)td+='<td class="time clickable-row" data-href="'+data.data[i].url+'" id="hightime" data-value="'+date.getTime()+'"></td>';
			else td+='<td class="time" id="hightime" data-value="'+date.getTime()+'"></td>';
			td+='<td><input class="delete" type="image" src="images/trashBin.png" data-value="'+date.getTime()+'"></td>';
			tr+=td+'</tr>';
			if(i==0)$('#feed').find('tbody').append(tr);
			else $('#feed').find('tbody:last').append(tr);
		};
		updateTime();
		updatePagination(data.count,page);
	});
}


//update the number of pages
function updatePagination(count,page){
    $('li').each(function(){
    	$(this).remove();
    });	
    var i=1
    var power8=0
    while(power8<=count){
    	if(page==i)$('#pages').append('<li class="active"><a id="'+i+'">'+i+' </a></li>');
    	else $('#pages').append('<li><a id="'+i+'">'+i+' </a></li>');
        i=i+1
        power8=i*8
    }
    if(count>8 && count%8!=0){
    	if(page==i)$('#pages').append('<li class="active"><a id="'+i+'">'+i+' </a></li>');
    	else $('#pages').append('<li><a id="'+i+'">'+i+' </a></li>');
    }
} 

//disable current page
function inactiveAllPages(){
    $('.active').each(function(){
    	$(this).removeClass('active');
    });
}

//update current time
function updateTime(){
	$('.time').each(function() {
		var milliSec=parseInt($(this).attr('data-value'));
    	$(this).text(dateFormat(milliSec));
	});
}


//format date to Month DAy: Jan 1
function prettyDate(milliSec){
   var date = new Date(milliSec);
   var d = date.getDate();
   var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun","Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
   var m = monthNames[date.getMonth()];
   var y = date.getFullYear();
   return m+' '+d;
}

//format time to hh:mm - 10:11
function timeAmOrPm(date){
	var hours = date.getHours();
  	var minutes = date.getMinutes();
  	var ampm = hours >= 12 ? 'pm' : 'am';
  	hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}


//compares the date of the record with the current one and updates the date form shown
function dateFormat(milliSec){
	var actualDate = new Date();
	var date=new Date(milliSec);
	if(actualDate.getFullYear()>date.getFullYear()){
		date=date.getFullYear()+' '+prettyDate(milliSec);
	}
	else{
		if(actualDate.getMonth()!=date.getMonth()){
			date=prettyDate(milliSec);
		}
		else{
			if(actualDate.getDate()>date.getDate()+1){
				date=prettyDate(milliSec);
			}
			else if(actualDate.getDate()==date.getDate()+1){
				date='Yesterday';
			}
			else{
				date=timeAmOrPm(date);
			}
		}
	}
	return date;
}