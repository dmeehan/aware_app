$(document).ready(function () {
    $('form.record-form').each(function () {
        var $form = $(this),
            MINWIDTH = 500; // this variable declares the breaking width where the form will collapse to the vertical stack

        //attach resize handler that will make sure the form is in the vertical layout when the form is a minimum width
        $(window).resize(function () {
            toggleWidthBasedLayout();
        }).trigger('resize');

        function toggleWidthBasedLayout() {
            //console.log('form width: ' + $form.width());
            if ($form.width() <= MINWIDTH) {
                $form.addClass('vertical');
            } else {
                $form.removeClass('vertical');
            }
        }
    });
});
// add change to post to source
//function attachLookupModal($modalAnchor, url) {
//    $modalAnchor.click(function () {
//        alert("lookup url = " + url);
//        return false;
//    });
//}