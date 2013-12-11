;
(function($) {
    $.fn.megaSlider = function(options) {

        var $this = $(this);

        //setting options
        var defaults = {
            auto: false,
            pause: 5000,
            duration: 500,
            horizontalBlocks: 8,
            verticalBlocks: 4,
            afterSlide: function() {},
            beforeSlide: function() {}
        };

        options = $.extend(defaults, options);

        function changeSlide(effect) {

        }

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

    }
})(jQuery);