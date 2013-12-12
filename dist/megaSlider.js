//TODO add $this.options to achieve slider object from outside
//TODO add auto, effects, controls, previews, autoheight
;
(function($) {
    $.fn.megaSlider = function(options) {

        //loop for multiple sliders call
        $(this).each(function() {

            //setting options
            var defaults = {
                auto: false,
                pause: 5000,
                duration: 500,
                horizontalBlocks: 8,
                verticalBlocks: 4,
                pauseOnHover: true,
                slideHeight: "min",
                startSlide: 0,
                beforeSlide: function() {},
                afterSlide: function() {},
                onSliderLoad: function() {}
            };

            var $this = $(this),
                $images = $this.find("img"),
                $slides = $images.wrap("<div class='megaSlider-slide'>"),
                currentSlide,
                nextSlide;

            //write options in $this object to be able to read/changethem later
            $this.options = $.extend(defaults, options);

            //public methods
            $this.goToNextSlide = function() {};
            $this.goToPrevSlide = function() {};
            $this.getSlideNumber = function() {};
            $this.startAuto = function() {};
            $this.stopAuto = function() {};

            //slider initialization
            initSlider();
            function initSlider() {
                var heightToSet = calculateMinHeight();
                $this.addClass("megaSlider").height(heightToSet);
                currentSlide = $this.options.startSlide;
                nextSlide = $this.options.startSlide+1;
            }

            //main change slide function
            function changeSlide(effect) {
                $this.options.beforeSlide();

                $this.options.afterSlide();
            }

            //calculate width and height of blocks before transition
            function calculateBlockHeightAndWidth() {
                var width = $this.width(),
                    height = $this.height(),
                    blockWidth = width/$this.options.horizontalBlocks;
                blockHeight = width/$this.options.verticalBlocks;
                return {
                    blockWidth: blockWidth,
                    blockHeight: blockHeight
                }
            }

            //function to calculate min height among images
            function calculateMinHeight() {
                var minHeight = Infinity;
                $images.each(function() {
                    var thisHeight = $(this).height();
                    if (thisHeight < minHeight) {
                        minHeight = thisHeight;
                    }
                });
                return minHeight;
            }

            //function to calculate max height among images
            function calculateMaxHeight() {
                var maxHeight = 0;
                $images.each(function() {
                    var thisHeight = $(this).height();
                    if (thisHeight > minHeight) {
                        maxHeight = thisHeight;
                    }
                });
                return maxHeight;
            }

        });

        return this;
    }
}(jQuery));