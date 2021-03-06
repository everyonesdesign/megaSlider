//TODO add effects, pagination, previews, autoheight
//TODO check ie7,8 opacity compatibility
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
            controls: true,
            prevText: "Prev",
            nextText: "Next",
            pagination: true,
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

        slider.modules = {
            pagination: true,
            controls: true,
            auto: true,
            responsive: true
        }; //all the connected additional modules (except for effects) are in this object


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

            //add controls
            if (slider.modules.controls&&slider.options.controls) {
                initSliderControls();
            }

            if (slider.modules.pagination&&slider.options.pagination) {
                initSliderPagination();
            }

            //start auto
            if (slider.options.auto) startAuto();
            if (slider.options.stopAutoOnHover) $slider.hover(stopAuto, startAuto);


            //onload callback execution
            slider.options.onSliderLoad();
        }

        function generateEffectName(effectArgument) {
            var effectName,
                effectsArray = [],
                effectsMax,
                randomEffectNumber,
                effectToParse;
            if (typeof(effectArgument) == "string") effectToParse = effectArgument;
                else {effectToParse = slider.options.effects}
            if (effectToParse === "all") {
                $.each(slider.effects, function(index) {
                    effectsArray.push(index);
                });
            } else {
                effectsArray = effectToParse.split(",");
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
            var effectString = null,
                effect, //get effect from list
                dataAttributeEffect = $slides.eq(nextSlide).data("effect");
            if (dataAttributeEffect) effectString = dataAttributeEffect; //if attribute effect is set, use it
            if (typeof(customEffect) == "string") effectString = customEffect; //if argument effect is set, use it (NOTE: it has highest priority)
            effect = generateEffectName(effectString);
            if (typeof(slider.effects[effect]) === "function") slider.effects[effect](); //if effect if defined execute it
            else console.error("The specified effect \"" + effect + "\" is missing"); //else error
            setTimeout(function() { //execute after transition ends
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



        function initSliderPagination() {
            var $container = $("<div class='megaSlider-pagination'></div>").appendTo($slider),
                itemProto = "<a href='javascript:;' class='megaSlider-paginationItem'></a>";
            for (var i=0; i<$slides.length; i++) {
                $(itemProto).clone().text(i+1).click(function() {goToSlide(i)}).appendTo($container);
            }
        }

        function initSliderControls() {
            var $container = $("<div class='megaSlider-controls'></div>").appendTo($slider),
                arrow = "<a href='javascript:;' class='megaSlider-control'></a>",
                $prev,
                $next;
            $prev = $(arrow).clone().addClass("prev").text(slider.options.prevText).click(goToNextSlide);
            $next = $(arrow).clone().addClass("next").text(slider.options.nextText).click(goToPrevSlide);
            $container.append($prev).append($next);
        }



        /*** EFFECTS FOR SLIDER***/
        slider.effects = {};

        //move to right
        slider.effects.moveRight = function() {
            moveEffects("moveRight");
        };

        //move to left
        slider.effects.moveLeft = function() {
            moveEffects("moveLeft");
        };

        //move to bottom
        slider.effects.moveBottom = function() {
            moveEffects("moveBottom");
        };

        //move to top
        slider.effects.moveTop = function() {
            moveEffects("moveTop");
        };


        function moveEffects(effect) {
            var $currentSlide = $slides.eq(currentSlide),
                $nextSlide = $slides.eq(nextSlide);
            if (effect == "moveRight"||effect == "moveLeft") {
                $currentSlide.animate(
                    {"left": (effect == "moveRight") ? slider._width : -slider._width},
                    {
                        "duration": slider.options.duration,
                        "easing": slider.options.easing
                    }
                );
                $nextSlide
                    .css("left", (effect == "moveRight") ? -slider._width : slider._width)
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
            } else if (effect == "moveBottom"||effect == "moveTop") {
                $currentSlide.animate(
                    {
                        "top": (effect == "moveBottom") ? slider._height : -slider._height
                    },
                    {
                        "duration": slider.options.duration,
                        "easing": slider.options.easing
                    }
                );
                $nextSlide
                    .css({
                        "top": (effect == "moveBottom") ? -slider._height : slider._height,
                        "left": 0
                        })
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
            moveOntoEffects("moveOntoRight");
        };

        //move onto left
        slider.effects.moveOntoLeft = function() {
            moveOntoEffects("moveOntoLeft");
        };

        //move onto bottom
        slider.effects.moveOntoBottom = function() {
            moveOntoEffects("moveOntoBottom");
        };

        //move onto top
        slider.effects.moveOntoTop = function() {
            moveOntoEffects("moveOntoTop");
        };

        //moveOnto general function
        function moveOntoEffects(effect) {
            var $currentSlide = $slides.eq(currentSlide),
                $nextSlide = $slides.eq(nextSlide);
            if (effect == "moveOntoRight"||effect == "moveOntoLeft") {
                $nextSlide
                    .css({"left": (effect == "moveOntoRight") ? -slider._width : slider._width, "z-index": 1})
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
            } else if (effect == "moveOntoBottom"||effect == "moveOntoTop") {
                $nextSlide
                    .css({"top": (effect == "moveOntoBottom") ? -slider._height : slider._height, "left": 0, "z-index": 1})
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
            }

        }


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
        slider.effects.waveRight = function() {
            waveEffects("waveRight");
        };

        //wave left
        slider.effects.waveLeft = function() {
            waveEffects("waveLeft");
        };

        //wave bottom
        slider.effects.waveBottom = function() {
            waveEffects("waveBottom");
        };

        //wave top
        slider.effects.waveTop = function() {
            waveEffects("waveTop");
        };

        //general wave effects function
        function waveEffects(effect) {
            var $currentSlide = $slides.eq(currentSlide),
                $nextSlide = $slides.eq(nextSlide),
                blocksNumber,
                blockMetrics;
            if (effect=="waveRight"||effect=="waveLeft")  {//horizontal transitions
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

                //clone style
                $clone.css({
                    "left": (effect == "waveRight") ? -blockMetrics*i + "px" : "auto",
                    "right": (effect == "waveLeft") ? -blockMetrics*i + "px" : "auto",
                    "top": (effect == "waveBottom") ? -blockMetrics*i + "px" : "auto",
                    "bottom": (effect == "waveTop") ? -blockMetrics*i + "px" : "auto",
                    "width": (effect == "waveRight"||effect == "waveLeft") ? $currentSlide.width() : "",
                    "height": (effect == "waveBottom"||effect == "waveTop") ? $currentSlide.height() : "",
                    "max-width": "none",
                    "max-height": "none"
                });

                //wrap styles and animation
                $parent.css({
                    "position": "absolute",
                    "z-index": 2,
                    "overflow": "hidden",
                    "left": (effect == "waveRight") ?
                        i*blockMetrics + "px" :
                        (effect == "waveLeft") ?
                            "" : 0,
                    "right": (effect == "waveLeft") ? i*blockMetrics + "px" : "auto",
                    "top": (effect == "waveBottom") ?
                        i*blockMetrics + "px" :
                        (effect == "waveTop") ?
                            "" : "auto",
                    "bottom": (effect == "waveTop") ? i*blockMetrics + "px" : "auto",
                    "width": (effect == "waveRight"||effect == "waveLeft") ? Math.ceil(slider._width/blocksNumber) + "px" : "100%",
                    "height": (effect == "waveBottom"||effect == "waveTop") ? Math.ceil(slider._height/blocksNumber) + "px" : "100%"
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


        
        

        //wave bottom right
        slider.effects.waveBottomRight = function() {
            waveDiagonalEffects("waveBottomRight");
        };
        //wave bottom left
        slider.effects.waveBottomLeft = function() {
            waveDiagonalEffects("waveBottomLeft");
        };
        //wave top right
        slider.effects.waveTopRight = function() {
            waveDiagonalEffects("waveTopRight");
        };
        //wave top left
        slider.effects.waveTopLeft = function() {
            waveDiagonalEffects("waveTopLeft");
        };

        //wave diagonally general function
        function waveDiagonalEffects(effect) {
            var $currentSlide = $slides.eq(currentSlide),
                $nextSlide = $slides.eq(nextSlide);
            for (var i=0;i<slider.options.horizontalBlocks;i++) {
                for (var j=0;j<slider.options.verticalBlocks;j++) {
                    var $clone = $currentSlide.clone()
                            .appendTo($slidesWrap)
                            .wrap("<div></div>"),

                    //added wrap to a variable
                        $parent = $clone.parent();
                    $clone.css({
                        "left": (effect == "waveBottomRight"||effect == "waveTopRight") ?
                            -Math.ceil(slider._width/slider.options.horizontalBlocks)*i + "px":
                            "auto",
                        "right": (effect == "waveBottomRight"||effect == "waveTopRight") ?
                            "auto" :
                            -Math.ceil(slider._width/slider.options.horizontalBlocks)*i + "px",
                        "top": (effect == "waveBottomRight"||effect == "waveBottomLeft") ?
                            -Math.ceil(slider._height/slider.options.verticalBlocks)*j + "px":
                            "auto",
                        "bottom": (effect == "waveBottomRight"||effect == "waveBottomLeft") ?
                            "auto":
                            -Math.ceil(slider._height/slider.options.verticalBlocks)*j + "px",
                        "width": $currentSlide.width(),
                        "height": $currentSlide.height(),
                        "max-width": "none"
                    });
                    $parent.css({
                        "left": (effect == "waveBottomRight"||effect == "waveTopRight") ?
                            Math.ceil(slider._width/slider.options.horizontalBlocks)*i + "px":
                            "auto",
                        "right": (effect == "waveBottomRight"||effect == "waveTopRight") ?
                            "auto":
                            Math.ceil(slider._width/slider.options.horizontalBlocks)*i + "px",
                        "top": (effect == "waveBottomRight"||effect == "waveBottomLeft") ?
                            Math.ceil(slider._height/slider.options.verticalBlocks)*j + "px":
                            "auto",
                        "bottom": (effect == "waveBottomRight"||effect == "waveBottomLeft") ?
                            "auto":
                            Math.ceil(slider._height/slider.options.verticalBlocks)*j + "px",
                        "width": Math.ceil(slider._width/slider.options.horizontalBlocks) + "px",
                        "height": Math.ceil(slider._height/slider.options.verticalBlocks) + "px",
                        "position": "absolute",
                        "z-index": 2,
                        "overflow": "hidden"
                    });
                    (function($parent, i, j){
                        setTimeout(function() {
                            $parent.animate({
                                "opacity": 0
                            }, {
                                "duration": (i+j)/(slider.options.horizontalBlocks+slider.options.verticalBlocks)*slider.options.duration,
                                "easing": "linear",
                                "complete": function() {
                                    $(this).remove();
                                }
                            });
                        }, (i)/2/(slider.options.horizontalBlocks+slider.options.verticalBlocks)*slider.options.duration);
                    }($parent, i, j));
                }
            }
            //show next slide, hide previous
            $nextSlide.css("left", 0);
            hideSlides($currentSlide);
        }



        //fold bottom right
        slider.effects.foldBottomRight = function() {
            foldDiagonalEffects("foldBottomRight");
        };
        //fold bottom left
        slider.effects.foldBottomLeft = function() {
            foldDiagonalEffects("foldBottomLeft");
        };
        //fold top right
        slider.effects.foldTopRight = function() {
            foldDiagonalEffects("foldTopRight");
        };
        //fold top left
        slider.effects.foldTopLeft = function() {
            foldDiagonalEffects("foldTopLeft");
        };

        //fold diagonally general function
        function foldDiagonalEffects(effect) {
            var $currentSlide = $slides.eq(currentSlide),
                $nextSlide = $slides.eq(nextSlide);
            for (var i=0;i<slider.options.horizontalBlocks;i++) {
                for (var j=0;j<slider.options.verticalBlocks;j++) {
                    var $clone = $currentSlide.clone()
                            .appendTo($slidesWrap)
                            .wrap("<div></div>"),

                    //added wrap to a variable
                        $parent = $clone.parent();
                    $clone.css({
                        "left": (effect == "foldBottomRight"||effect == "foldTopRight") ?
                            -Math.ceil(slider._width/slider.options.horizontalBlocks)*i + "px":
                            "auto",
                        "right": (effect == "foldBottomRight"||effect == "foldTopRight") ?
                            "auto" :
                            -Math.ceil(slider._width/slider.options.horizontalBlocks)*i + "px",
                        "top": (effect == "foldBottomRight"||effect == "foldBottomLeft") ?
                            -Math.ceil(slider._height/slider.options.verticalBlocks)*j + "px":
                            "auto",
                        "bottom": (effect == "foldBottomRight"||effect == "foldBottomLeft") ?
                            "auto":
                            -Math.ceil(slider._height/slider.options.verticalBlocks)*j + "px",
                        "width": $currentSlide.width(),
                        "height": $currentSlide.height(),
                        "max-width": "none"
                    });
                    $parent.css({
                        "left": (effect == "foldBottomRight"||effect == "foldTopRight") ?
                            Math.ceil(slider._width/slider.options.horizontalBlocks)*i + "px":
                            "auto",
                        "right": (effect == "foldBottomRight"||effect == "foldTopRight") ?
                            "auto":
                            Math.ceil(slider._width/slider.options.horizontalBlocks)*i + "px",
                        "top": (effect == "foldBottomRight"||effect == "foldBottomLeft") ?
                            Math.ceil(slider._height/slider.options.verticalBlocks)*j + "px":
                            "auto",
                        "bottom": (effect == "foldBottomRight"||effect == "foldBottomLeft") ?
                            "auto":
                            Math.ceil(slider._height/slider.options.verticalBlocks)*j + "px",
                        "width": Math.ceil(slider._width/slider.options.horizontalBlocks) + "px",
                        "height": Math.ceil(slider._height/slider.options.verticalBlocks) + "px",
                        "position": "absolute",
                        "z-index": 2,
                        "overflow": "hidden"
                    });
                    (function($parent, i, j){
                        setTimeout(function() {
                            $parent.animate({
                                "width": 0,
                                "height": 0
                            }, {
                                "duration": (i+j)/(slider.options.horizontalBlocks+slider.options.verticalBlocks)*slider.options.duration,
                                "easing": "linear",
                                "complete": function() {
                                    $(this).remove();
                                }
                            });
                        }, (i)/2/(slider.options.horizontalBlocks+slider.options.verticalBlocks)*slider.options.duration);
                    }($parent, i, j));
                }
            }
            //show next slide, hide previous
            $nextSlide.css("left", 0);
            hideSlides($currentSlide);
        }
        


        //fold right
        slider.effects.foldRight = function() {
            foldEffects("foldRight");
        };

        //fold left
        slider.effects.foldLeft = function() {
            foldEffects("foldLeft");
        };

        //fold bottom
        slider.effects.foldBottom = function() {
            foldEffects("foldBottom");
        };

        //fold top
        slider.effects.foldTop = function() {
            foldEffects("foldTop");
        };

        //general fold effects function
        function foldEffects(effect) {
            var $currentSlide = $slides.eq(currentSlide),
                $nextSlide = $slides.eq(nextSlide),
                blocksNumber,
                blockMetrics;
            if (effect=="foldRight"||effect=="foldLeft")  {//horizontal transitions
                blocksNumber = slider.options.horizontalBlocks;
                blockMetrics = Math.ceil(slider._width/blocksNumber);
            }   else {                                        //vertical transitions
                blocksNumber = slider.options.verticalBlocks;
                blockMetrics = Math.ceil(slider._height/blocksNumber);
            }

            //creating blocks for fold
            for (var i=0; i<blocksNumber; i++) {

                //creating clone of current slide, insert it and set its width to be equal with original one
                var $clone = $currentSlide.clone()
                    .appendTo($slidesWrap)
                    .wrap("<div></div>"),

                    //added wrap to a variable
                    $parent = $clone.parent();

                //clone style
                $clone.css({
                    "left": (effect == "foldRight") ? -blockMetrics*i + "px" : "auto",
                    "right": (effect == "foldLeft") ? -blockMetrics*i + "px" : "auto",
                    "top": (effect == "foldBottom") ? -blockMetrics*i + "px" : "auto",
                    "bottom": (effect == "foldTop") ? -blockMetrics*i + "px" : "auto",
                    "width": (effect == "foldRight"||effect == "foldLeft") ? $currentSlide.width() : "",
                    "height": (effect == "foldBottom"||effect == "foldTop") ? $currentSlide.height() : "",
                    "max-width": "none",
                    "max-height": "none"
                });

                //wrap styles and animation
                $parent.css({
                    "position": "absolute",
                    "z-index": 2,
                    "overflow": "hidden",
                    "left": (effect == "foldRight") ?
                        i*blockMetrics + "px" :
                        (effect == "foldLeft") ?
                            "" : 0,
                    "right": (effect == "foldLeft") ? i*blockMetrics + "px" : "auto",
                    "top": (effect == "foldBottom") ?
                        i*blockMetrics + "px" :
                        (effect == "foldTop") ?
                            "" : "auto",
                    "bottom": (effect == "foldTop") ? i*blockMetrics + "px" : "auto",
                    "width": (effect == "foldRight"||effect == "foldLeft") ? Math.ceil(slider._width/blocksNumber) + "px" : "100%",
                    "height": (effect == "foldBottom"||effect == "foldTop") ? Math.ceil(slider._height/blocksNumber) + "px" : "100%"
                });
                (function($parent, i, effect){
                    var durationCoef = 1/4; // means that last 1/4 of transition time is time when all the blocks are animated already
                    setTimeout(function() {
                        $parent.animate({
                            "width": (effect == "foldRight"||effect == "foldLeft") ? 0 : "100%",
                            "height": (effect == "foldTop"||effect == "foldBottom") ? 0 : "100%"
                        }, {
                            "duration": slider.options.duration*durationCoef,
                            "complete": function() {
                                $(this).remove();
                            }
                        });
                    }, i*(1 - durationCoef)/blocksNumber*slider.options.duration);
                }($parent, i, effect));
            }

            //show next slide, hide previous
            $nextSlide.css("left", 0);
            hideSlides($currentSlide);
        }






        //slice right
        slider.effects.sliceRight = function() {
            sliceEffects("sliceRight");
        };

        //slice left
        slider.effects.sliceLeft = function() {
            sliceEffects("sliceLeft");
        };

        //slice bottom
        slider.effects.sliceBottom = function() {
            sliceEffects("sliceBottom");
        };

        //slice top
        slider.effects.sliceTop = function() {
            sliceEffects("sliceTop");
        };

        //crossSlice right
        slider.effects.crossSliceRight = function() {
            sliceEffects("sliceRight", true);
        };

        //crossSlice left
        slider.effects.crossSliceLeft = function() {
            sliceEffects("sliceLeft", true);
        };

        //crossSlice bottom
        slider.effects.crossSliceBottom = function() {
            sliceEffects("sliceBottom", true);
        };

        //crossSlice top
        slider.effects.crossSliceTop = function() {
            sliceEffects("sliceTop", true);
        };

        //general slice effects function
        function sliceEffects(effect, crossSlice) {
            var $currentSlide = $slides.eq(currentSlide).css("z-index", 1),
                $nextSlide = $slides.eq(nextSlide),
                blocksNumber,
                blockMetrics;
            if (effect=="sliceRight"||effect=="sliceLeft")  {//horizontal transitions
                blocksNumber = slider.options.horizontalBlocks;
                blockMetrics = Math.ceil(slider._width/blocksNumber);
            }   else {                                        //vertical transitions
                blocksNumber = slider.options.verticalBlocks;
                blockMetrics = Math.ceil(slider._height/blocksNumber);
            }

            var $toRemove = $();

            //creating blocks for slice
            for (var i=0; i<blocksNumber; i++) {

                //creating clone of current slide, insert it and set its width to be equal with original one
                var $clone = $nextSlide.clone()
                        .appendTo($slidesWrap)
                        .wrap("<div></div>"),
                        crossMult = (i%2==1 && crossSlice) ? -1 : 1;

                //added wrap to a variable
                    $parent = $clone.parent();

                //clone style
                $clone.css({
                    "left": (effect == "sliceRight") ? -blockMetrics*i + "px" : "auto",
                    "right": (effect == "sliceLeft") ? -blockMetrics*i + "px" : "auto",
                    "top": (effect == "sliceBottom") ? -blockMetrics*i + "px" : "auto",
                    "bottom": (effect == "sliceTop") ? -blockMetrics*i + "px" : "auto",
                    "width": (effect == "sliceRight"||effect == "sliceLeft") ? $currentSlide.width() : "",
                    "height": (effect == "sliceBottom"||effect == "sliceTop") ? $currentSlide.height() : "",
                    "max-width": "none",
                    "max-height": "none"
                });

                //wrap styles and animation
                $parent.css({
                    "position": "absolute",
                    "z-index": 2,
                    "overflow": "hidden",
                    "left": (effect == "sliceRight") ?
                        i*blockMetrics + "px" :
                        (effect == "sliceLeft") ?
                            "" : -slider._width*crossMult,
                    "right": (effect == "sliceLeft") ? i*blockMetrics + "px" : "auto",
                    "top": (effect == "sliceBottom") ?
                        i*blockMetrics + "px" :
                        (effect == "sliceTop") ?
                            "" : -slider._height*crossMult,
                    "bottom": (effect == "sliceTop") ? i*blockMetrics + "px" : "auto",
                    "width": (effect == "sliceRight"||effect == "sliceLeft") ? Math.ceil(slider._width/blocksNumber) + "px" : "100%",
                    "height": (effect == "sliceBottom"||effect == "sliceTop") ? Math.ceil(slider._height/blocksNumber) + "px" : "100%"
                }).animate({"opacity": 0}, 0); //cross-browser hide parent
                $toRemove = $toRemove.add($parent);
                (function($parent, i, effect){
                    var durationCoef = 1/4; // means that last 1/4 of transition time is time when all the blocks are animated already
                    setTimeout(function() {
                        $parent.animate({
                            "left": (effect == "sliceTop"||effect == "sliceBottom") ? 0 : $parent.css("left"),
                            "top": (effect == "sliceLeft"||effect == "sliceRight") ? 0 : $parent.css("top"),
                            opacity: 1
                        }, {
                            "duration": slider.options.duration*durationCoef,
                            "easing": "linear"
                        });
                    }, i*(1 - durationCoef)/blocksNumber*slider.options.duration);
                }($parent, i, effect));
            }

            //show next slide, hide previous
            $nextSlide.css("left", 0);
            setTimeout(function() {
                $toRemove.remove();
                $currentSlide.css("z-index", "");
                hideSlides($currentSlide);
            }, slider.options.duration);
        }




        return this;
    }
}(jQuery));