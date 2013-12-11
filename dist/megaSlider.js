//TODO add $this.options to achieve slider object from outside
//TODO add auto, effects, controls, previews,
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
                startSlide: 0,
                beforeSlide: function() {},
                afterSlide: function() {}
            };

            options = $.extend(defaults, options);

            var $this = $(this),
                $images = $this.find("img"),
                $slides = $images.wrap("<div class='megaSlider-slide'>"),
                currentSlide,
                nextSlide;

            //slider initialization
            initSlider();
            function initSlider() {
                var heightToSet = calculateMinHeight();
                $this.addClass("megaSlider").height(heightToSet);
                currentSlide = options.startSlide;
                nextSlide = options.startSlide+1;
            }

            //main change slide function
            function changeSlide(effect) {
                options.beforeSlide();

                options.afterSlide();
            }

            //calculate width and height of blocks before transition
            function calculateBlockHeightAndWidth() {
                var width = $this.width(),
                    height = $this.height(),
                    blockWidth = width/options.horizontalBlocks;
                blockHeight = width/options.verticalBlocks;
                return {
                    blockWidth: blockWidth,
                    blockHeight: blockHeight
                }
            }

            //function to calculate minimal height among images
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

        });

        return this;
    }
}(jQuery));