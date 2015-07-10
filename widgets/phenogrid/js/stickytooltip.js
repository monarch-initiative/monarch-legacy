/* Sticky Tooltip script (v1.0)
* Created: Nov 25th, 2009. This notice must stay intact for usage 
* Author: Dynamic Drive at http://www.dynamicdrive.com/
* Visit http://www.dynamicdrive.com/ for full source code
*/


var stickytooltip={
	tooltipoffsets: [1, -1], //additional x and y offset from mouse cursor for tooltips 0,-3  [10, 10]
	fadeinspeed: 0, //duration of fade effect in milliseconds
	rightclickstick: true, //sticky tooltip when user right clicks over the triggering element (apart from pressing "s" key) ?
	stickybordercolors: ["black", "darkred"], //border color of tooltip depending on sticky state
	stickynotice1: ["Press \"s\" or right click to activate sticky box. \"h\" to hide"], //, "or right click", "to sticky box"], //customize tooltip status message
	stickynotice2: "Click outside this box to hide it", //customize tooltip status message
	lastEvent: null,  // saves last mouseevent

	//***** NO NEED TO EDIT BEYOND HERE

	isdocked: false,  // force sticky mode


	positiontooltip:function($, $tooltip, e){
		//var x=e.pageX+this.tooltipoffsets[0], y=e.pageY+this.tooltipoffsets[1]
	    var x=e.pageX+1, y=e.pageY-1;
		var tipw=$tooltip.outerWidth(), tiph=$tooltip.outerHeight(), 
		x=(x+tipw>$(document).scrollLeft()+$(window).width())? x-tipw-(stickytooltip.tooltipoffsets[0]*2) : x
		y=(y+tiph>$(document).scrollTop()+$(window).height())? $(document).scrollTop()+$(window).height()-tiph-10 : y
		$tooltip.css({left:x, top:y});
	},
	
	showbox:function($, $tooltip, e){
		$tooltip.fadeIn(this.fadeinspeed);
		this.positiontooltip($, $tooltip, e);
		stickytooltip.isdocked = true;
	},

	// wrapper function
	show:function(e) {
		if (e == null) e = stickytooltip.lastEvent;
		var $tooltip=$('#mystickytooltip');
		stickytooltip.isdocked = true;
		stickytooltip.showbox($, $tooltip, e);
	},

	hidebox:function($, $tooltip){
		if (!this.isdocked){
			$tooltip.stop(false, true).hide();
			stickytooltip.isdocked = false;
//			$tooltip.css({borderColor:'black'}).find('.stickystatus:eq(0)').css({background:this.stickybordercolors[0]}).html(this.stickynotice1)
		}
	},

	docktooltip:function($, $tooltip, e){
		this.isdocked=true
		//$tooltip.css({borderColor:'darkred'}).find('.stickystatus:eq(0)').css({background:this.stickybordercolors[1]}).html(this.stickynotice2)
	},

	// wrapper function
	closetooltip:function() {		
		var $tooltip=$('#mystickytooltip');
		stickytooltip.isdocked = false;
		stickytooltip.hidebox($, $tooltip);
	},

	init:function(targetselector, tipid){
		jQuery(document).ready(function($){
			var self = this;			
			var $targets=$(targetselector);
			var $tooltip=$('#'+tipid).appendTo(document.body);
			if ($targets.length==0)
				return;
			var $alltips=$tooltip.find('div.atip');
			if (!stickytooltip.rightclickstick)
				stickytooltip.stickynotice1[1]='';

			stickytooltip.hidebox($, $tooltip);
			
			$targets.bind('mouseenter', function(e){  
				// var elem = e.relatedTarget ||  e.toElement || e.fromElement;
				//console.log("sticky:mouseenter: docked=" +stickytooltip.isdocked + " elemid: " + JSON.stringify(elem.id));
				if  (!stickytooltip.isdocked) {
					// this forces the tooltip to be shown
		  			stickytooltip.showbox($, $tooltip, e);
		  			stickytooltip.lastEvent = e;  
		  		}
		     });
			 $targets.bind('mouseout', function(e){  // mouseleave
				var elem = e.relatedTarget ||  e.toElement || e.fromElement;
				//console.log("sticky:mouseout: docked=" +stickytooltip.isdocked + " elemid: " + JSON.stringify(elem.id));
				if (elem.id != 'mystickytooltip' && elem.id != "") {
				    //console.log("hiding...");
					stickytooltip.isdocked = false;
			 		stickytooltip.hidebox($, $tooltip);
				}
			 });
			// $targets.bind('mousemove', function(e){
			// 	if (!stickytooltip.isdocked){
			// 		stickytooltip.positiontooltip($, $tooltip, e);
			// 	}				
			// 	//console.log('mousemove');
			// })
			// $tooltip.bind("mouseenter", function(){
			// 	stickytooltip.hidebox($, $tooltip);
			// 	//console.log('mouseenter2');
			// })
			// $tooltip.bind("click", function(e){
			// 	e.stopPropagation();
			// })
			// $(this).bind("click", function(e){
			// 	if (e.button==0){
			// 		stickytooltip.isdocked=false;
			// 		stickytooltip.hidebox($, $tooltip);
			// 	}
			// })
			// $(this).bind("contextmenu", function(e){
			// 	if (stickytooltip.rightclickstick && $(e.target).parents().andSelf().filter(targetselector).length==1){ //if oncontextmenu over a target element
			// 		stickytooltip.docktooltip($, $tooltip, e);
			// 		return false;
			// 	}
			// })
			// $(this).bind('keypress', function(e){
			// 	var keyunicode=e.charCode || e.keyCode;
			// 	if (keyunicode==115){ //if "s" key was pressed
			// 		stickytooltip.docktooltip($, $tooltip, e);
			// 	} else if (keyunicode==104){ //if "h" key was pressed
			// 		stickytooltip.isdocked=false;
			// 		stickytooltip.hidebox($, $tooltip);
			// 	}
			// })
		}) //end dom ready
	}
}

//stickytooltip.init("targetElementSelector", "tooltipcontainer")
//stickytooltip.init("*[data-tooltip]", "mystickytooltip")


// CommonJS format - Joe
module.exports=stickytooltip;