//TODO add effects, controls, previews, autoheight
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
            effects: "moveToRight",
            auto: false,
            pause: 5000,
            duration: 500,
            horizontalBlocks: 8,
            verticalBlocks: 4,
            stopAutoOnHover: true,
            slideHeight: "min",
            easing: "swing",
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
            $slides = $slider.children().addClass("megaSlider-slide"),
            slidesQty = $slides.length,
            currentSlide,
            nextSlide;

        //write options in slider object to be able to read/change them later
        slider.options = $.extend(defaults, options);

        //public methods
        slider.goToNextSlide = function() {goToNextSlide();};
        slider.goToPrevSlide = function() {goToPrevSlide();};
        slider.getSlideNumber = function() {return currentSlide;};
        slider.startAuto = function() {startAuto();};
        slider.stopAuto = function() {stopAuto();};
        slider.destroy = function() {};

        //slider initialization
        initSlider();
        function initSlider() {
            var heightToSet;
            if (slider.options.slideHeight == "min") {
                heightToSet = calculateMinHeight();
            } else {
                heightToSet = calculateMaxHeight();
            }
            $slider.addClass("megaSlider").css({"position": "relative"}).height(heightToSet);
            currentSlide = slider.options.startSlide;
            if (!slider.options.reverse) {
                nextSlide = increaseNumber(currentSlide);
            } else {
                nextSlide = decreaseNumber(currentSlide);
            }
            hideSlides($slides);
            $slides.css("position", "absolute").eq(currentSlide).css({"left": 0});
            setSliderWidthAndHeight();
            if (slider.options.auto) startAuto();
            if (slider.options.stopAutoOnHover) $slider.hover(stopAuto, startAuto);
            slider.options.onSliderLoad();
        }

        //slide change function
        function goToNextSlide() {
            slider.options.beforeSlide();
            var effect = slider.options.effects;
            if (typeof(slider.effects[effect]) === "function") slider.effects[effect](); //if effect if defined execute it
            slider.options.afterSlide();
        }

        //go to prev slide. works by setting next slide lower than current one by 1
        function goToPrevSlide() {
            nextSlide = decreaseNumber(currentSlide);
            goToNextSlide();
        }

        //general function to calculate slider width and height
        function setSliderWidthAndHeight() {
            slider._width = $slider.width();
            slider._height = $slider.height();
        }

        //calculate width and height of blocks before transition
        function calculateBlockHeightAndWidth() {
            var blockWidth = slider._width/slider.options.horizontalBlocks,
                blockHeight = slider._height/slider.options.verticalBlocks;
            return {
                blockWidth: blockWidth,
                blockHeight: blockHeight
            }
        }

        //calculate min height among images
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

        //calculate max height among images
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

        //increase/decrease slides number according to slider direction
        function setNewSlidesNumbers() {
            if (!slider.options.reverse) {
                nextSlide = increaseNumber(nextSlide);
                currentSlide = decreaseNumber(nextSlide);
            } else {
                nextSlide = decreaseNumber(nextSlide);
                currentSlide = increaseNumber(nextSlide);
            }
        }

        //start autoplay
        function startAuto() {
            if (slider.auto) return;
            slider.auto = setInterval(goToNextSlide, slider.options.pause);
        }

        //stop autoplay
        function stopAuto() {
            clearInterval(slider.auto);
            slider.auto = null;
        }

        //hide slide or slides behind the scenes
        function hideSlides($slide) {
            $slide.css({"top": 0, "left": "-9999px", "z-index": ""});
        }






        /*** EFFECTS FOR SLIDER***/
        slider.effects = {};

        //move to right
        slider.effects.moveToRight = function() {
            var $currentSlide = $slides.eq(currentSlide);
            var $nextSlide = $slides.eq(nextSlide);
            $currentSlide.animate(
                    {
                        "left": slider._width
                    },
                    {
                        "duration": slider.options.duration,
                        "easing": slider.options.easing
                    }
            );
            $nextSlide
                .css("left", -slider._width)
                .animate(
                    {
                        "left": 0
                    },
                    {
                        "duration": slider.options.duration,
                        "easing": slider.options.easing,
                        "complete": function() {
                            hideSlides($currentSlide);
                            setNewSlidesNumbers();
                        }
                    });
        };

        //move to left
        slider.effects.moveToLeft = function() {
            var $currentSlide = $slides.eq(currentSlide);
            var $nextSlide = $slides.eq(nextSlide);
            $currentSlide.animate(
                    {
                        "left": -slider._width
                    },
                    {
                        "duration": slider.options.duration,
                        "easing": slider.options.easing
                    }
            );
            $nextSlide
                .css("left", slider._width)
                .animate(
                    {
                        "left": 0
                    },
                    {
                        "duration": slider.options.duration,
                        "easing": slider.options.easing,
                        "complete": function() {
                            hideSlides($currentSlide);
                            setNewSlidesNumbers();
                        }
                    });
        };

        //move to bottom
        slider.effects.moveToBottom = function() {
            var $currentSlide = $slides.eq(currentSlide);
            var $nextSlide = $slides.eq(nextSlide);
            $currentSlide.animate(
                    {
                        "top": slider._height
                    },
                    {
                        "duration": slider.options.duration,
                        "easing": slider.options.easing
                    }
            );
            $nextSlide
                .css({"top": -slider._height, "left": 0})
                .animate(
                    {
                        "top": 0
                    },
                    {
                        "duration": slider.options.duration,
                        "easing": slider.options.easing,
                        "complete": function() {
                            hideSlides($currentSlide);
                            setNewSlidesNumbers();
                        }
                    });
        };

        //move to top
        slider.effects.moveToTop = function() {
            var $currentSlide = $slides.eq(currentSlide);
            var $nextSlide = $slides.eq(nextSlide);
            $currentSlide.animate(
                    {
                        "top": -slider._height
                    },
                    {
                        "duration": slider.options.duration,
                        "easing": slider.options.easing
                    }
            );
            $nextSlide
                .css({"top": slider._height, "left": 0})
                .animate(
                    {
                        "top": 0
                    },
                    {
                        "duration": slider.options.duration,
                        "easing": slider.options.easing,
                        "complete": function() {
                            hideSlides($currentSlide);
                            setNewSlidesNumbers();
                        }
                    });
        };

        //move onto right
        slider.effects.moveOntoRight = function() {
            var $currentSlide = $slides.eq(currentSlide);
            var $nextSlide = $slides.eq(nextSlide);
            $nextSlide
                .css({"left": -slider._width, "z-index": 1})
                .animate(
                    {
                        "left": 0
                    },
                    {
                        "duration": slider.options.duration,
                        "easing": slider.options.easing,
                        "complete": function() {
                            hideSlides($currentSlide);
                            $nextSlide.css("z-index", "");
                            setNewSlidesNumbers();
                        }
                    });
        };

        //move onto left
        slider.effects.moveOntoLeft = function() {
            var $currentSlide = $slides.eq(currentSlide);
            var $nextSlide = $slides.eq(nextSlide);
            $nextSlide
                .css({"left": slider._width, "z-index": 1})
                .animate(
                    {
                        "left": 0
                    },
                    {
                        "duration": slider.options.duration,
                        "easing": slider.options.easing,
                        "complete": function() {
                            hideSlides($currentSlide);
                            $nextSlide.css("z-index", "");
                            setNewSlidesNumbers();
                        }
                    });
        };

        //move onto bottom
        slider.effects.moveOntoBottom = function() {
            var $currentSlide = $slides.eq(currentSlide);
            var $nextSlide = $slides.eq(nextSlide);
            $nextSlide
                .css({"top": -slider._height, "left": 0, "z-index": 1})
                .animate(
                    {
                        "top": 0
                    },
                    {
                        "duration": slider.options.duration,
                        "easing": slider.options.easing,
                        "complete": function() {
                            hideSlides($currentSlide);
                            $nextSlide.css("z-index", "");
                            setNewSlidesNumbers();
                        }
                    });
        };

        //move onto top
        slider.effects.moveOntoTop = function() {
            var $currentSlide = $slides.eq(currentSlide);
            var $nextSlide = $slides.eq(nextSlide);
            $nextSlide
                .css({"top": slider._height, "left": 0, "z-index": 1})
                .animate(
                    {
                        "top": 0
                    },
                    {
                        "duration": slider.options.duration,
                        "easing": slider.options.easing,
                        "complete": function() {
                            hideSlides($currentSlide);
                            $nextSlide.css("z-index", "");
                            setNewSlidesNumbers();
                        }
                    });
        };


        return this;
    }
}(jQuery));