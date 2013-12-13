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
            verticalBlocks: 6, //number of vertical blocks for box effects
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
        slider.goToNextSlide = function(customEffect) {goToNextSlide(customEffect); return this;};
        slider.goToPrevSlide = function(customEffect) {goToPrevSlide(customEffect); return this;};
        slider.goToSlide = function(slideNumber, customEffect) {goToSlide(slideNumber, customEffect); return this;};
        slider.getSlideNumber = function() {return currentSlide;};
        slider.startAuto = function(effect) {startAuto(effect); return this;};
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
        function goToNextSlide(customEffect) {
            if (isSliderAnimated) return; //if transition in process
            slider.options.beforeSlide(nextSlide); //callback
            isSliderAnimated = true; //show that slider is animated then
            var effect = generateEffectName(), //get effect from list
                dataAttributeEffect = $slides.eq(nextSlide).data("effect");
            if (dataAttributeEffect) effect = dataAttributeEffect; //if attribute effect is set, use it
            if (customEffect) effect = customEffect; //if argument effect is set, use it (NOTE: it has highest priority)
            if (typeof(slider.effects[effect]) === "function") slider.effects[effect](); //if effect if defined execute it
            else console.error("The specified effect \"" + effect + "\" is missing"); //else error
            setTimeout(function() { //execute after trantition ends
                isSliderAnimated = false;
                setNewSlidesNumbers();
                slider.options.afterSlide(nextSlide); //callback
            }, slider.options.duration);
        }

        //go to prev slide. works by setting next slide lower than current one by 1
        function goToPrevSlide(customEffect) {
            if (isSliderAnimated) return;
            nextSlide = decreaseNumber(currentSlide);
            goToNextSlide(customEffect);
        }

        //go to slide with number passed as argument
        function goToSlide(slideNumber, customEffect) {
            if (isSliderAnimated) return;
            nextSlide = slideNumber;
            goToNextSlide(customEffect);
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
        function startAuto(effect) {
            if (slider.auto) stopAuto(); //if auto is already started, stop it
            if (typeof(effect) == "string") slider.auto = setInterval(function() {goToNextSlide(effect)}, slider.options.pause); //if effect is set use it
                else slider.auto = setInterval(function() {goToNextSlide()}, slider.options.pause); //else just start auto with default options
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
            moveEffects("moveToRight");
        };

        //move to left
        slider.effects.moveToLeft = function() {
            moveEffects("moveToLeft");
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
                    }
                });
        };


        function moveEffects(effect) {
            var $currentSlide = $slides.eq(currentSlide),
                $nextSlide = $slides.eq(nextSlide);
            if (effect == "moveToRight"||effect == "moveToLeft") {
                $currentSlide.animate(
                    {"left": (effect == "moveToRight") ? slider._width : -slider._width},
                    {
                        "duration": slider.options.duration,
                        "easing": slider.options.easing
                    }
                );
                $nextSlide
                    .css("left", (effect == "moveToRight") ? -slider._width : slider._width)
                    .animate(
                    {
                        "left": 0
                    },
                    {
                        "duration": slider.options.duration,
                        "easing": slider.options.easing,
                        "complete": function() {
                            hideSlides($currentSlide);
                        }
                    });
            } else if (effect == "moveToBottom") {
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
                        }
                    });
            } else if (effect == "moveToTop") {
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
                        }
                    });
            }
            setTimeout(function() {
                hideSlides($currentSlide);
            }, slider.options.duration);
        }

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
                    }
                });
        };

        //wave right
        slider.effects.waveToRight = function() {
            waveEffects("waveToRight");
        };

        //wave left
        slider.effects.waveToLeft = function() {
            waveEffects("waveToLeft");
        };

        //wave bottom
        slider.effects.waveToBottom = function() {
            waveEffects("waveToBottom");
        };

        //wave top
        slider.effects.waveToTop = function() {
            waveEffects("waveToTop");
        };

        //general wave effects function
        function waveEffects(effect) {
            var $currentSlide = $slides.eq(currentSlide),
                $nextSlide = $slides.eq(nextSlide),
                blocksNumber,
                blockMetrics;
            if (effect=="waveToRight"||effect=="waveToLeft")  {//horizontal transitions
                blocksNumber = slider.options.horizontalBlocks;
                blockMetrics = Math.ceil(slider._width/blocksNumber);
            }   else {                                        //vertical transitions
                blocksNumber = slider.options.verticalBlocks;
                blockMetrics = Math.ceil(slider._height/blocksNumber);
            }

            //creating blocks for wave
            for (var i=0; i<blocksNumber; i++) {

                //creating clone of current slide, insert it and set its width to be equal with original one
                var $clone = $currentSlide.clone()
                    .appendTo($slidesWrap)
                    .wrap("<div></div>"),

                    //added wrap to a variable
                    $parent = $clone.parent();

                //depending on effect set corrections
                if (effect == "waveToRight") {
                    $clone.css({
                        "left": -blockMetrics*i + "px",
                        "width": $currentSlide.width(),
                        "max-width": "none"
                    });
                    $parent.css({
                        "top": 0,
                        "left": i*blockMetrics + "px",
                        "height": "100%",
                        "width": Math.ceil(slider._width/blocksNumber) + "px"
                    });
                } else if (effect == "waveToLeft") {
                    $clone.css({
                        "right": -blockMetrics*i + "px",
                        "left": "auto",
                        "width": $currentSlide.width(),
                        "max-width": "none"
                    });
                    $parent.css({
                        "top": 0,
                        "right": i*blockMetrics + "px",
                        "height": "100%",
                        "width": Math.ceil(slider._width/blocksNumber) + "px"
                    });
                } else if (effect == "waveToBottom") {
                    $clone.css({
                        "top": -blockMetrics*i + "px",
                        "height": $currentSlide.height()
                    });
                    $parent.css({
                        "left": 0,
                        "top": i*blockMetrics + "px",
                        "width": "100%",
                        "height": Math.ceil(slider._height/blocksNumber) + "px"
                    });
                } else if (effect == "waveToTop") {
                    $clone.css({
                        "bottom": -blockMetrics*i + "px",
                        "top": "auto",
                        "height": $currentSlide.height()
                    });
                    $parent.css({
                        "left": 0,
                        "bottom": i*blockMetrics + "px",
                        "width": "100%",
                        "height": Math.ceil(slider._height/blocksNumber) + "px"
                    });
                }

                //wrap basic styles and animation
                $parent
                    .css({
                    "position": "absolute",
                    "z-index": 2,
                    "overflow": "hidden"
                }).animate({
                    "opacity": 0
                }, {
                    "duration": slider.options.duration*(i+1)/(blocksNumber+1),
                    "complete": function() {
                        $(this).remove();
                    }
                });
            }

            //show next slide, hide previous
            $nextSlide.css("left", 0);
            hideSlides($currentSlide);
        }

        return this;
    }
}(jQuery));