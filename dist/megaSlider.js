//TODO add $this.options to achieve slider object from outside
//TODO add auto, effects, controls, previews, autoheight
;
(function($) {
    $.fn.megaSlider = function(options) {

        if(this.length == 0) return this;

        // support multiple elements
        if(this.length > 1){
            this.each(function(){$(this).megaSlider(options)});
            return this;
        }

        //setting options
        var defaults = {
            //props
            auto: false,
            pause: 5000,
            duration: 500,
            horizontalBlocks: 8,
            verticalBlocks: 4,
            pauseOnHover: true,
            slideHeight: "min",
            startSlide: 0,
            reverse: false,
            cyclic: false,
            infinite: true,
            //callbacks
            beforeSlide: function() {},
            afterSlide: function() {},
            onSliderLoad: function() {}
        };

        var slider = this, //define slider variable
            $slider = $(slider),
            $images = $slider.find("img"),
            slidesQty = $images.length,
            $slides = $images.wrap("<div class='megaSlider-slide'>").parent(),
            currentSlide,
            nextSlide;

        //write options in slider object to be able to read/change them later
        slider.options = $.extend(defaults, options);

        //public methods
        slider.goToNextSlide = function() {};
        slider.goToPrevSlide = function() {};
        slider.getSlideNumber = function() {};
        slider.startAuto = function() {};
        slider.stopAuto = function() {};
        slider.destroy = function() {};

        //slider initialization
        initSlider();
        function initSlider() {
            var heightToSet = calculateMinHeight();
            $slider.addClass("megaSlider").css({"position": "relative"}).height(heightToSet);
            currentSlide = slider.options.startSlide;
            if (!slider.options.reverse) {
                nextSlide = increaseNumber(currentSlide);
            } else {
                nextSlide = decreaseNumber(currentSlide);
            }
            $slides.css({"position": "absolute", "top": 0,  "left": "-9999px"}).eq(currentSlide).css({"left": 0});

            slider.options.onSliderLoad();
        }

        //slide change function
        function changeSlide(effect) {
            slider.options.beforeSlide();
            if (!slider.options.reverse) {
                currentSlide = increaseNumber(currentSlide);
                nextSlide = increaseNumber(nextSlide);
            } else {
                currentSlide = decreaseNumber(currentSlide);
                nextSlide = decreaseNumber(nextSlide);
            }

            slider.options.afterSlide();
        }

        //calculate width and height of blocks before transition
        function calculateBlockHeightAndWidth() {
            var width = $slider.width(),
                height = $slider.height(),
                blockWidth = width/slider.options.horizontalBlocks,
                blockHeight = width/slider.options.verticalBlocks;
            return {
                blockWidth: blockWidth,
                blockHeight: blockHeight
            }
        }

        //function to calculate min height among images
        function calculateMinHeight() {
            var minHeight = Infinity;
            $slides.each(function() {
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
            $slides.each(function() {
                var thisHeight = $(this).height();
                if (thisHeight > minHeight) {
                    maxHeight = thisHeight;
                }
            });
            return maxHeight;
        }

        //correctly increase slide number
        //not affects argument value
        function increaseNumber(numberToIncrease) {
            var innerNumber = numberToIncrease;
            if (innerNumber+1<slidesQty) {
                ++innerNumber
            } else {
                innerNumber = 0;
            }
            return innerNumber;
        }

        //correctly decrease slide number
        //not affects argument value
        function decreaseNumber(numberToDecrease) {
            var innerNumber = numberToDecrease;
            if (innerNumber>0) {
                --innerNumber
            } else {
                innerNumber = slidesQty-1;
            }
            return innerNumber;
        }


        /*** EFFECTS FOR SLIDER***/
        slider.effects = {};

        //move to right
        slider.effects.moveToRight = function() {
            var $curSlide = $slides.eq(currentSlide);
            var $nextSlide = $slides.eq(nextSlide);
        };




        return this;
    }
}(jQuery));