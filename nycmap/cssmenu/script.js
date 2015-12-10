
function addFilterInteraction(){
	console.log("here");
	$('#cssmenu li.active').addClass('open').children('ul').show();
		$('#cssmenu li.has-sub>a').on('click', function(){
			$(this).removeAttr('href');
			var element = $(this).parent('li');
			if (element.hasClass('open')) {
				element.removeClass('open');
				element.find('li').removeClass('open');
				element.find('ul').slideUp(200);
			}
			else {
				element.addClass('open');
				element.children('ul').slideDown(200);
				element.siblings('li').children('ul').slideUp(200);
				element.siblings('li').removeClass('open');
				element.siblings('li').find('li').removeClass('open');
				element.siblings('li').find('ul').slideUp(200);
			}
		});

	$('a').on('click', function() {
		var level = this.classList[0];
		
	    // For each filter link, get the 'data-filter' attribute value.
	    var filter = $(this).data('filter');
	    
	    csvLayer.setFilter(function(f) {
	    	
	        // If the data-filter attribute is set to "all", return
	        // all (true). Otherwise, filter on markers that have
	        // a value set to true based on the filter name.
	        return (filter === 'all') ? true : getField(level, f) === filter;
	    });
	    return false;
	});

	function getField(level, fac) {
		switch(level) {
			case "group":
				return fac.properties.NewGroupType_Decode;
				break;
			case "subgroup":
				return fac.properties.NewSgroup_Decode;
				break;
		}
	}
}



