;
(function($) {
    $.fn.megaSlider = function(options) {

        var $this = $(this),
            autoTimeout;

        //setting options
        var defaults = {
            auto: false,
            pause: 5000,
            duration: 500,
            horizontalBlocks: 8,
            verticalBlocks: 4,
            pauseOnHover: true,
            beforeSlide: function() {},
            afterSlide: function() {}
        };

        options = $.extend(defaults, options);

        //slider initialization
        function initSlider() {

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

        return this;
    }
}(jQuery));