//TODO add effects, controls, pagination, previews, autoheight
;
(function($) {
    $.fn.megaSlider = function(options) {

        if(this.length == 0) return this;

        // multiple elements support
        if(this.length > 1){
            this.each(function(){$(this).megaSlider(options)});
            return this;
        }

        //setting options
        var defaults = {
            //props
            effects: "all", //effect, list of effects divided with "," or keyword "all" which will implement all available effects
            auto: false, //autoplay
            pause: 5000, //pause between transitions if auto is enabled
            duration: 500, //each transition duration
            horizontalBlocks: 8, //number of horizontal blocks for box effects
            verticalBlocks: 4, //number of vertical blocks for box effects
            stopAutoOnHover: true, //stop auto when hovered
            slideHeight: "max", //how height of slider id defined.
                                // "max" - slider gets max height of slides.
                                // "min" - slider gets min height of slides cutting some elements
                                // "auto" - slider adapts for each element
            easing: "swing", //transition easing
            startSlide: 0, //number of init slide, zero-based
            reverse: false, //play in reverse direction
            responsive: true, //dynamically changes slider height
            //callbacks
            beforeSlide: function() {}, //executed just before transition. first argument is active slide number
            afterSlide: function() {}, //executed just after transition. first argument is active slide number
            onSliderLoad: function() {} //executed when slider has been initialized
        };

        var slider = this, //define slider variable
            $slider = $(slider),
            $slides = $slider.children().addClass("megaSlider-slide").css("overflow", "hidden"),
            $slidesWrap,
            slidesQty = $slides.length,
            isSliderAnimated = false,
            currentSlide,
            nextSlide;

        //write options in slider object to be able to read/change them later
        slider.options = $.extend(defaults, options);

        //public methods
        slider.goToNextSlide = function() {goToNextSlide(); return this;};
        slider.goToPrevSlide = function() {goToPrevSlide(); return this;};
        slider.goToSlide = function(slideNumber) {goToSlide(slideNumber); return this;};
        slider.getSlideNumber = function() {return currentSlide;};
        slider.startAuto = function() {startAuto(); return this;};
        slider.stopAuto = function() {stopAuto(); return this;};
        slider.update = function(options) { //change slider options
            slider.options = $.extend(slider.options, options);
        };
        slider.destroy = function() {  //remove slider
            $slider.removeClass("megaSlider")[0].removeAttribute("style");
            stopAuto();
            $slides.removeClass("megaSlider-slide").unwrap().each(function() {
                $(this)[0].removeAttribute("style");
            });
        };

        //slider initialization
        initSlider();
        function initSlider() {

            //calc slider height and set it
            setSliderHeight();

            //set basic css to slider element
            $slider.addClass("megaSlider").css({"position": "relative"});

            //set current and next slides number
            currentSlide = slider.options.startSlide;
            if (!slider.options.reverse) {
                nextSlide = increaseNumber(currentSlide);
            } else {
                nextSlide = decreaseNumber(currentSlide);
            }

            //hide all slides except for the active one. wrap them, define slides wrap
            hideSlides($slides);
            $slides.wrapAll("<div class='megaSlider-slides'>").css({"position": "absolute"}).eq(currentSlide).css({"left": 0});
            $slidesWrap = $slides.parent();

            //set slider width and height variables
            updateSliderWidthAndHeight();

            //start auto
            if (slider.options.auto) startAuto();
            if (slider.options.stopAutoOnHover) $slider.hover(stopAuto, startAuto);

            //onload callback execution
            slider.options.onSliderLoad();
        }

        function generateEffectName() {
            var effectName,
                effectsArray = [],
                effectsMax,
                randomEffectNumber;
            if (slider.options.effects === "all") {
                $.each(slider.effects, function(index, value) {
                    effectsArray.push(index);
                });
            } else {
                effectsArray = slider.options.effects.split(",");
            }
            effectsMax = effectsArray.length-1;
            randomEffectNumber = Math.floor(Math.random() * (effectsMax + 1));
            effectName = effectsArray[randomEffectNumber];
            return effectName;
        }

        //go to next slide. actually, this function just takes currentSlide and nextSlide numbers and makes the transition
        function goToNextSlide() {
            if (isSliderAnimated) return;
            slider.options.beforeSlide(nextSlide);
            isSliderAnimated = true;
            var effect = generateEffectName();
            if (typeof(slider.effects[effect]) === "function") slider.effects[effect](); //if effect if defined execute it
            else console.error("The specified effect \"" + effect + "\" is missing"); //else error
            slider.options.afterSlide(nextSlide);
        }

        //go to prev slide. works by setting next slide lower than current one by 1
        function goToPrevSlide() {
            if (isSliderAnimated) return;
            nextSlide = decreaseNumber(currentSlide);
            goToNextSlide();
        }

        //go to slide with number passed as argument
        function goToSlide(slideNumber) {
            if (isSliderAnimated) return;
            nextSlide = slideNumber;
            goToNextSlide();
        }

        function setSliderHeight() {
            var heightToSet = "";
            if (slider.options.slideHeight == "min") {
                heightToSet = calculateMinHeight();
            } else if (slider.options.slideHeight == "max")  {
                heightToSet = calculateMaxHeight();
            }
            $slider.height(heightToSet);
        }

        //general function to calculate slider width and height
        function updateSliderWidthAndHeight() {
            slider._width = $slider.width();
            slider._height = $slider.height();
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
                if (thisHeight > maxHeight) {
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

        //responsive slider version
        makeSliderResponsive();
        function makeSliderResponsive() {
            if (!slider.options.responsive) return;
            $(window).resize(function() {
                updateSliderWidthAndHeight();
                setSliderHeight();
            });
        }



        /*** EFFECTS FOR SLIDER***/
        slider.effects = {};

        //move to right
        slider.effects.moveToRight = function() {
            var $currentSlide = $slides.eq(currentSlide),
                $nextSlide = $slides.eq(nextSlide);
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
                        isSliderAnimated = false;
                    }
                });
        };

        //move to left
        slider.effects.moveToLeft = function() {
            var $currentSlide = $slides.eq(currentSlide),
                $nextSlide = $slides.eq(nextSlide);
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
                        isSliderAnimated = false;
                    }
                });
        };

        //move to bottom
        slider.effects.moveToBottom = function() {
            var $currentSlide = $slides.eq(currentSlide),
                $nextSlide = $slides.eq(nextSlide);
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
                        isSliderAnimated = false;
                    }
                });
        };

        //move to top
        slider.effects.moveToTop = function() {
            var $currentSlide = $slides.eq(currentSlide),
                $nextSlide = $slides.eq(nextSlide);
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
                        isSliderAnimated = false;
                    }
                });
        };

        //move onto right
        slider.effects.moveOntoRight = function() {
            var $currentSlide = $slides.eq(currentSlide),
                $nextSlide = $slides.eq(nextSlide);
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
                        isSliderAnimated = false;
                    }
                });
        };

        //move onto left
        slider.effects.moveOntoLeft = function() {
            var $currentSlide = $slides.eq(currentSlide),
                $nextSlide = $slides.eq(nextSlide);
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
                        isSliderAnimated = false;
                    }
                });
        };

        //move onto bottom
        slider.effects.moveOntoBottom = function() {
            var $currentSlide = $slides.eq(currentSlide),
                $nextSlide = $slides.eq(nextSlide);
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
                        isSliderAnimated = false;
                    }
                });
        };

        //move onto top
        slider.effects.moveOntoTop = function() {
            var $currentSlide = $slides.eq(currentSlide),
                $nextSlide = $slides.eq(nextSlide);
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
                        isSliderAnimated = false;
                    }
                });
        };

        //fade
        slider.effects.fade = function() {
            var $currentSlide = $slides.eq(currentSlide),
                $nextSlide = $slides.eq(nextSlide);
            $nextSlide
                .css({"left": 0, "z-index": 1})
                .animate({"opacity": 0}, 0) //animate used for IE lte 8 support
                .animate(
                {
                    "opacity": 1
                },
                {
                    "duration": slider.options.duration,
                    "easing": slider.options.easing,
                    "complete": function() {
                        hideSlides($currentSlide);
                        $nextSlide.css("z-index", "");
                        setNewSlidesNumbers();
                        isSliderAnimated = false;
                    }
                });
        };

        //vertical blocks wave
        slider.effects.waveToRight = function() {
            var $currentSlide = $slides.eq(currentSlide),
                $nextSlide = $slides.eq(nextSlide);
            for (var i=0; i<slider.options.horizontalBlocks; i++) {
                var $clone = $currentSlide.clone()
                    .appendTo($slidesWrap)
                    .wrap("<div></div>")
                    .css({
                            "left": -Math.ceil(slider._width/slider.options.horizontalBlocks)*i + "px",
                            "width": $currentSlide.width(),
                            "max-width": "none"
                        }),
                $parent = $clone.parent();
                $parent
                    .css({
                    "position": "absolute",
                    "z-index": 2,
                    "overflow": "hidden",
                    "height": "100%",
                    "width": Math.ceil(slider._width/slider.options.horizontalBlocks) + "px",
                    "top": 0,
                    "left": i*Math.ceil(slider._width/slider.options.horizontalBlocks) + "px"
                }).animate({
                    "opacity": 0
                }, {
                    "duration": slider.options.duration*(i+1)/(slider.options.horizontalBlocks+1),
                    "complete": function() {
                        $(this).remove();
                    }
                });
            }
            $nextSlide.css("left", 0);
            hideSlides($currentSlide);
            setTimeout(function() {
                isSliderAnimated = false;
                setNewSlidesNumbers();
            }, slider.options.duration)
        };


        return this;
    }
}(jQuery));