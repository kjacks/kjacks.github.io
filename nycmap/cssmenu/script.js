
function addFilterInteraction(){
	console.log("here");
	$('#cssmenu li.active').addClass('open').children('ul').show();
		$('#cssmenu li.has-sub>a, #all').on('click', function(){
			$(this).removeAttr('href');
			var element = $(this).parent('li');
			if (element.hasClass('open')) {
				element.removeClass('open');
				element.find('li').removeClass('open');
				element.find('ul').slideUp(200);
				$('#all').addClass('active');
				curr_filter.filter = 'all';
				csvLayer.setFilter(toDisplay);
			}
			else {
				element.addClass('open');
				element.children('ul').slideDown(200);
				element.siblings('li').children('ul').slideUp(200);
				element.siblings('li').removeClass('open');
				element.siblings('li').find('li').removeClass('open');
				element.siblings('li').find('ul').slideUp(200);
				$('#all').removeClass('active');
				curr_filter.level = this.classList[0];
				curr_filter.filter = $(this).data('filter');
	   			csvLayer.setFilter(toDisplay);
			}
		});

		$('#all').on('click', function() {
			if ($(this).hasClass('active') && curr_filter.filter != 'all') {
				$('#all').removeClass('active');
			} else {
				$('#all').addClass('active');
			}
		})

	//function for submenu items
	$('ul>li>ul>li>a').on('click', function() {
		console.log("in sub");
		curr_filter.level = this.classList[0];
		$('.selected').removeClass("selected");
		$(this).addClass("selected");
		
	    // For each filter link, get the 'data-filter' attribute value.
	    curr_filter.filter = $(this).data('filter');
	    
	    csvLayer.setFilter(toDisplay);
	    
	    return false;
	});

}




