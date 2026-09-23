window.HELP_IMPROVE_VIDEOJS = false;


$(document).ready(function() {
    // Check for click events on the navbar burger icon

    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var options = {
			slidesToScroll: 1,
			slidesToShow: 1,
			loop: true,
			infinite: true,
			autoplay: !reducedMotion.matches,
            duration: 300,
			autoplaySpeed: 5000,
    }

		// Initialize all div with carousel class
    var carousels = bulmaCarousel.attach('.carousel', options);
	
    bulmaSlider.attach();
    reducedMotion.addEventListener("change", function (event) {
      carousels.forEach(function (carousel) {
        carousel.options.autoplay = !event.matches;
        if (event.matches) carousel.stop();
        else carousel.start();
      });
    });

})
