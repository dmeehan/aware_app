$(document).ready(function () {

    // Prevent double submits when submitting a non-ajax form that passes validation.
    // Show progress indicator to notify user that processing is under way - Scott
    var tryNumber = 0;

    $("input.singleClick").click(function (event) {
        var self = $(this);
        if (self.closest('form').valid()) {
            if (tryNumber > 0) {
                tryNumber++;
                //console.info("form has been submitted already... please wait");
                return false;
            }
            else {
                //console.info("form submitted");
                showProgress();
                tryNumber++;
            }
        }
        else {
            //console.info("form is not valid during single click");
        }
    });


    // SS:COMMENTED OUT - the following code uses timeout delays to prevent double posts, 
    // which was not working all the time.  Replaced by "singleClick" function and specific
    // routines for ajax-specific submits; namely "validateAjaxForm()" and "preventDoubleSubmit(activeForm)"

    //function to show/hide an ajax-related 'working' image
    //var image = $('<img />').attr('src', window.basePath + '/Content/images/Records_Loading.gif');
    ////set up a 3 sec disable on all submit buttons
    //$("input.next, a.next").click(function () {
    //    var $this = $(this);
    //    setTimeout(function () {
    //        $this.prop("disabled", true);
    //    }, 500);
    //    setTimeout(function () {
    //        $this.removeAttr("disabled");
    //    }, 3000);
    //}).removeAttr("disabled");

    setCellsForRecordForms();
    var usernameInput = $("input#UserName");
    if (usernameInput != undefined)
        usernameInput.focus();
    $("#filterForm input").keypress(function (e) {
        if (e.which == 13) {
            $("#filterForm .recordSubmit input").focus().click();
            var $colCenterWrap = $("#colCenter").parent();
            $colCenterWrap.get(0).scrollLeft = 0;
            return false;
        }
    });
    $("#entityFormToggle").each(function () {
        var $this = $(this);
        if ($this.parents("#entityForm").first().hasClass("verticalStack")) {
            $this.addClass("expanded");
        } else {
            $this.addClass("collapsed");
        }
    }).click(function () {
        toggleEntityFormBarStyle();
    });
    $("#entityForm form input[type=submit]").click(function (e) {
        $("#colCenter").parent().get(0).scrollTop = 0;
    });
});


function validateAjaxForm() {
    $.validator.unobtrusive.parse($("form"));
    $("form").validate();
    var validated = $("form").valid();
    if (validated) {
        console.info("validation successful - ajax form");
        //showProgress();  // FOR NOW, use ajaxoptions to control progress indicator
        preventDoubleSubmit($("form"));
        return true;
    }
    else {
        console.info("validation failed - ajax");
        return (validated);
    }
}

function preventDoubleSubmit(activeForm) {
    // prevent double submit on ajax posts, called by validateAjaxForm
    $(":submit", activeForm).attr('disabled', 'disabled');
}

function hideAjaxProgress() {
    if (!validateAjaxForm()) {
        hideProgress();
    }
    // else, don't hide progress indicator, wait for new page instead
}

function hideProgress() {
    $("form").find(".actionPanel .loadMarkerReservedSpace").removeClass("loadingDisplayMarker");
}

function showProgress() {
    $("form").find(".actionPanel .loadMarkerReservedSpace").addClass("loadingDisplayMarker");
}

function updateContainer() {
    var $main = $('#mainContent');
    var $header = $('#header');
    var $footer = $('#footer');
    var $splitter = $(".t-splitter");
    $main.height($(this).height() - $header.height() - $footer.height() - 2);

    // for users with smaller screens, resize the side columns (if they exist) 
    // to give the center panel more space
    if ($(".splitter-pane-left", $splitter).width() != null && $(".splitter-pane-right", $splitter).width() != null) {
        adjustSplitterForSmallerScreen($splitter.data("tSplitter"));
    }
    setCenterColumnLayout();

    //stretch the referral panels if the referral ui is loaded
    if (typeof (updateRequestDetailsAndListPanels) == typeof (Function)) {
        updateRequestDetailsAndListPanels();
    }
    if (typeof (updateReferralDetailsAndListPanels) == typeof (Function)) {
        updateReferralDetailsAndListPanels();
    }
    if (typeof (updateSuppFilterResultsPanel) == typeof (Function)) {
        updateSuppFilterResultsPanel();
    }
    if (typeof (resizeMetricTreePanel) == typeof (Function)) {
        console.info("resize metric tree!");
        resizeMetricTreePanel();
    }

}


function setColumnSizes(size) {
    //$splitter.size(".t-pane:first", size + "px");
    //$splitter.size(".t-pane:last", size + "px");

    $splitter.size(".splitter-pane-left", size + "px");
    $splitter.size(".splitter-pane-right", size + "px");

}

function adjustSplitterForSmallerScreen($splitter) {

    //get the viewport width
    var viewPortWidth = window.innerWidth;
    if (viewPortWidth <= 800) {
        var sideColWidth = Math.round(viewPortWidth / 4);
        setColumnSizes(sideColWidth);
    }
}

//fires whenever the splitter is adjusted
function adjustLayoutElementPositioning(e) {

    // these variables are not being used - Scott
    //var $leftColEle = $("#Splitter2 .t-pane:first");
    //var $rightColEle = $("#Splitter2 .t-pane:last");
    //var $centerColEle = $leftColEle.next().next();

    //if on household, analyze the center panel and adjust the household display as necessary
    var resetFilter = e.type != 'resize';
    setCenterColumnLayout(resetFilter);

    // SS:REVIEW - similar code already exists in record-forms.css (but we need to call it here, so it executed when the splitter is first loaded)
    // play with contentload event in splitter and resize event (see _Layout_Default)
    var $form = $(".splitter-pane-left .record-form");
    if ($form.width() <= 500) {
        $form.addClass('vertical');
    } else {
        $form.removeClass('vertical');
    }

    //check each column and adjust any recordTreeViewNode elements that extend past the visible area of the column
    $("#colLeft, #colCenter, #colRight").each(function () {
        var $column = $(this);
        $(".recordTreeViewNode", $column).each(function () {
            var $node = $(this);
            adjustTreeViewNode($node);
        });
    })

    saveSplitterWidthsToUserSettings();
}

function saveSplitterWidthsToUserSettings() {
    //create an object holding an array to hold the measurements for each splitter and the window width
    var splitterData = {
        splitters: []
    };
    //iterate over any splitters on the page
    var $splitters = $(".t-splitter");
    $splitters.each(function () {
        //for each splitter, get the left col width and the right col width and put them on an object
        var $splitter = $(this),
            $colLeft = $(".colLeft", $splitter).parent(),
            $colRight = $(".colRight", $splitter).parent(),
            $colLeftData = $colLeft.data("pane"),
            $colRightData = $colRight.data("pane"),
            splitter = {};

        splitter.id = $splitter.prop("id");
        splitter.leftColCollapsed = $colLeft.length > 0 ? $colLeftData.collapsed === true : window.prevLeftColCollapsed;
        splitter.rightColCollapsed = $colRight.length > 0 ? $colRightData.collapsed === true : window.prevRightColCollapsed;
        splitter.leftColWidth = $colLeft.length > 0 ? $colLeftData.size : window.prevLeftColWidth;
        splitter.rightColWidth = $colRight.length > 0 ? $colRightData.size : window.prevRightColWidth;
        //attach the object to the splitters array
        splitterData.splitters.push(splitter);
    });
    //send the data via ajax to the server to be saved, allow silent failure
    $.ajax({
        url: window.basePath + "Layout/SaveSplitterSettings",
        type: "post",
        dataType: "json",
        contentType: "application/json; charset=utf-8;",
        data: JSON.stringify(splitterData)
    });
}

function adjustAnnotationTabStrip(e) {
    return; //disabled!
    //if there's an annotation tabstrip on the page (/info/itemdetails)
    //find the tabstrip
    $("#TabStrip").each(function () {
        var $tabStrip = $(this);
        var $column = $("#colCenter").first();
        //get the height of the column
        var maxHeight = $column.parent().height();
        //get height of all other children in the tab strip
        var otherContentHeight = 0;
        $column.children(":not(#" + $tabStrip.prop("id") + ")").each(function () {
            otherContentHeight += $(this).height();
        });
        $tabStrip.height(maxHeight - otherContentHeight - 8);
        var $tabs = $tabStrip.children("ul").first();
        var $contentTabs = null;
        if (e != undefined) {
            $contentTabs = $(e.contentElement);
        } else {
            $contentTabs = $(".t-content", $tabStrip);
        }
        //TODO: get the tab being navigated to, not the one currently marked as active
        $contentTabs.each(function () {
            var $contentTab = $(this);
            //if the content tab is set to display:none, then we have to move it out of hte flow and show it to get the height
            var hadToShow = false;
            if ($contentTab.css("display") == "none") {
                hadToShow = true;
                //change the content tab to have an absolute position, move it way off the screen and set display to block
                $contentTab.css({ "position": "absolute", "top": "-99999px" }).show();
            }
            //get references to each item that needs to have height factored into stretch
            var $panelHeading = $(".panelHeading", $contentTab);
            //stretch the panelbody element to fill (this will handle the annotations tab, but not the records tab - which has its own issue)
            $(".panelBody", $contentTab).each(function () {
                $(this).height($tabStrip.height() - ($panelHeading.height() + $tabs.height() + 48)).css("overflow-y", "auto");
            });
            //if hadToShow == true, change teh content tab css back to original state
            if (hadToShow) {
                $contentTab.hide().css("position", "static");
            }
        });
    });
}

function adjustTreeViewNode($node) {
    var $nodeParent = $node.parents(".t-pane");
    if ($node.width() > $nodeParent.width()) {
        $node.addClass("short");
    } else {
        $node.removeClass("short");
    }
}


function setCellsForRecordForms() {
    //find any recordDetail/recordEdit forms and size the labels and their respective control/display divs to the same height
    $(".recordDetails, .recordEdit").each(function () {
        var $record = $(this);
        var $labels = $(".editor-label", $record);
        if (!$record.parents("#entityForm").first().hasClass("verticalStack")) {
            $labels.each(function () {
                var $this = $(this);
                var $inputEle = $(this).next();
                var heightToSet = $inputEle.height() > $this.height() ? $inputEle.height() : $this.height();
                $this.height(heightToSet);
                $inputEle.height(heightToSet);
            });
        } else {
            $labels.each(function () {
                var $this = $(this);
                var $inputEle = $(this).next();
                $this.height("auto");
                $inputEle.height("auto");
            });
        }
    });
}

function setCenterColumnLayout(resetFilter) {

    var $column = $("div#colCenter");

    // panels marked with "vertStretch" trigger dynamic setting of the height
    // of the designated scrollable region, ".panelInnerScrollBody"
    $("div.panelBorder.vertStretch", $column).each(function () {
        //get all involved elements and heights that are involved in the calc
        var $this = $(this),
            $splitterPane = $this.parents(".t-pane"),
            $heading = $(".panelHeading", $this),
            $instruction = $(".panelInstruction", $this),
            $actionPanel = $(".actionPanel", $this),
            $innerPanel = $(".panelInnerScrollBody", $this),
            $splitterHeight = $splitterPane.height(),
            $validationSummary = $(".validationSummary"),
            $filledHeight = $heading.outerHeight() + $actionPanel.outerHeight() + $instruction.outerHeight();
        if ($validationSummary.outerHeight() > 0) {
            $filledHeight = $filledHeight + $validationSummary.outerHeight() + 8;  // 4px margin
        }
        $innerPanel.css("overflow-y", "auto").height($splitterHeight - ($filledHeight + 3));

    });

    // For stand-alone splitter (i.e. left and right are collapsed)
    // need to dynamically resize width to width of content
    $innerPanelSingle = $(".splitter-pane-single .panelInnerScrollBody");
    $innerPanelSingle.outerWidth($column.outerWidth());

    // special case - Service Requests view - a view with a submittable search
    // AND a submittable button to advance to another page in a wizard.  For this special case,
    // need to dynamically control the width of the view, synching it with the
    // width of the scrollable container.  SS:REVIEW - magic number "14"
    $("div.panelBorder.vertStretchedCenter", $column).each(function () {
        var $this = $(this);
        var $scrollBox = $('.panelCenterScrollBody', $this);
        var $formWidth = $scrollBox.innerWidth();
        $('#clientActionPanel', $this).width($formWidth - 14);
    });

    if ($("#filterForm").length > 0 && resetFilter) {

        var $filterBar = $("#filterBarContainer");
        var $filterToggle = $filterBar.find("#filterBarToggle").first();

        $filterBar.addClass("verticalFilterPanel");
        $filterToggle.removeClass("collapsed").addClass("expanded");
    }
    var $itemTable = $(".itemTable");
    if ($itemTable.length > 0) {
        var $recordTable = $itemTable.find("#recordTable");
        $recordTable.width($column.parent().width())
        var $panelHeading = $(".panelHeading", $column);
        //console.info("panelHeading outer height: " + $panelHeading.outerHeight());
        //console.info("panelHeading inner height: " + $panelHeading.innerHeight());
        //console.info("panelHeading height: " + $panelHeading.height());
        //console.info("splitter outer height: " + $column.parent().outerHeight());
        //console.info("splitter inner height: " + $column.parent().innerHeight());
        //console.info("splitter height: " + $column.parent().height());

        $recordTable.height($column.parent().height() - $panelHeading.outerHeight() - 1);
        $column.parent().css("overflow", "hidden");
    }
    $("body.itemSummary #colCenter .recordSummary").each(function () {
        adjustWidthForSingleLineRecordSummary($(this));
    })
}

function adjustWidthForSingleLineRecordSummary($recordSummary) {
    if ($recordSummary == undefined)
        $recordSummary = $(this).parents(".recordSummary");

    if ($recordSummary != undefined) {
        var totalWidth = 0,
            $column = $recordSummary.parents(".t-pane"),
            columnEle = $column.get(0),
            columnWidth = columnEle.scrollHeight > columnEle.clientHeight ? $column.width() - 17 : $column.width() - 0,
            $recordTiles = $recordSummary.find(".recordTile > .t-treeview");

        $recordTiles.each(function () {
            var width = $(this).width();
            totalWidth += width;
        });

        var horizontalStretch = totalWidth > $column.width(),
            $summaryBody = $recordSummary.find(".panelBorder > .panelBody"),
            $summaryTilesContainer = $summaryBody.children("div");

        if (horizontalStretch) {
            $summaryBody.css("overflow-x", "scroll");
            $summaryBody.width(columnWidth - 0);
        } else {
            $summaryBody.css("overflow-x", "auto");
            $summaryBody.width("auto");
        }
        $summaryTilesContainer.width(totalWidth);
        //todo: get all previous record summary panels and run them through this function in case they need to be adjusted due to a new scrollbar showing
        $recordSummary.prevAll().each(function () {
            adjustWidthForSingleLineRecordSummary($(this));
        });
    }
}

function setShowHideForAjaxCommandBars($ajaxMarkup) {
    var $tileIns = $('.recordTile .t-in', $ajaxMarkup);
    $tileIns.mouseenter(function () {
        $(this).find('ul.commandBar').prop('opacity', 1);
    }).mouseleave(function () {
        $(this).find('ul.commandBar').prop('opacity', 0);
    });
}

function toggleFilterBarStyle($filterBar) {

    var $centerCol = $("#colCenter").first();
    var $filterToggle = $filterBar.find("#filterBarToggle").first();

    if ($filterBar.hasClass("verticalFilterPanel")) {

        $filterBar.removeClass("verticalFilterPanel");
        $filterToggle.removeClass("expanded").addClass("collapsed");

    } else {

        $filterBar.addClass("verticalFilterPanel");
        $filterToggle.removeClass("collapsed").addClass("expanded");
    }
}

function toggleEntityFormBarStyle() {
    var $entityForm = $("#colCenter #entityForm").first();
    var $recordToggle = $entityForm.find("#entityFormToggle").first();
    if ($entityForm != undefined) {
        if ($entityForm.hasClass("verticalStack")) {
            $entityForm.removeClass("verticalStack");
            if ($recordToggle.hasClass("expanded")) $recordToggle.removeClass("expanded");
            $recordToggle.addClass("collapsed");
        } else {
            $entityForm.addClass("verticalStack");
            if ($recordToggle.hasClass("collapsed")) $recordToggle.removeClass("collapsed");
            $recordToggle.addClass("expanded");
        }
        setCellsForRecordForms();
        //TODO: make call to server to save entity form layout state
        $.ajax({
            type: "POST",
            url: window.basePath + "Layout/SaveEntityFormLayoutState",
            data: {
                EntityFormExpanded: $entityForm.hasClass("verticalStack")
            },
            success: function (response) {
                if (!response) {
                    alert("error saving entity form state");
                }
            },
            error: function (xhr, status, errorThrown) {
                $.Zebra_Dialog('<h5>Error!</h5><p>There was an error when executing this request. We apologize for the inconvenience.</p><p>The error thrown was: ' + errorThrown + '</p>', {
                    'type': 'warning',
                    'title': 'Error',
                    'buttons': [
                        { caption: 'OK', callback: function () { return false } }
                    ]
                });
            }
        });
    }
}

function togglePagingAndFilterAjaxIndicator(displayLoad, target) {
    if (displayLoad) {
        $(target).addClass("loadingDisplayMarker");
    } else {
        $(target).removeClass("loadingDisplayMarker");
    }
}

function submitListQuery(pagingAnchor, sortfield, sortdir) {
    //turn on the loading indicator
    togglePagingAndFilterAjaxIndicator(true, '#filterBarToggle')
    //get all data from all of the list-centric forms and combine it into one serialized chunk of data
    var formsData = $('form#filterForm, form#pagingForm, form#sortForm').serialize();
    if (pagingAnchor != undefined)
        formsData = formsData + "&" + pagingAnchor + "=true";
    //look for any supplemental filters on the page that need to be serialized with the center panel inputs
    var $suppFilters = $("form.supplementalFilters");
    if ($suppFilters.length > 0) {
        formsData = formsData + "&IsServiceRequest=true";
        $suppFilters.each(function () {
            var $this = $(this);
            var contextTag = $this.data("contexttag");
            $("input:checked", $this).each(function () {
                formsData = formsData + "&" + contextTag + "-SupplementalFilter=" + $(this).val();
            });
        });
    }
    else {
        $suppFilters = $("form.supplementalInfoFilters");
        if ($suppFilters.length > 0) {
            formsData = formsData + "&IsReferral=true";
            $suppFilters.each(function () {
                var $this = $(this);
                var contextTag = $this.data("contexttag");
                $("input:checked", $this).each(function () {
                    formsData = formsData + "&" + contextTag + "-SupplementalFilter=" + $(this).val();
                });
            });
        }
    }

    var geocodeField = $("input#geocodeResultsField");
    if (geocodeField.length > 0) {
        formsData = formsData + "&geocode=" + geocodeField.val();
    }
    //scroll the center column t-pane full left
    $("#colCenter").parents(".t-pane").scrollLeft(0);
    //send that data to the ajax-centric filtering/paging action, which combines the two previously-seperate actions into one specific for this
    $.ajax({
        type: "POST",
        url: $("#filterForm").get(0).action,
        data: formsData,
        success: function (data, status) {
            var $data = $(data);
            //check to make sure the returned data isn't an error message
            if ($data.hasClass("ajaxerror")) {
                showSearchResultsFailure($data.text());
            } else {
                //reset commands in the modal view need to be hijacked to clear all filter/paging/sorting fields and clear out any present search results, without redirecting to the url tied to the anchor
                $(".itemSelectModal a.command.reset, #itemActionSelectWrapper a.command.reset ").click(function () {
                    //clear out any existing results
                    $("td#filterFormResults").html("").parent().css("display", "none");
                    //fire the reset event on all forms
                    $("form").each(function () {
                        this.reset();
                        //manually clear fields and reset dropdowns
                        var $form = $(this);
                        $form.find("input[type=text], input[type=password], textarea").val("").end()
                            .find("select").prop("selectedIndex", 0).end();
                        //.find(".t-input").each(function () {
                        //    var $realInput = $(this).parent().next("input");
                        //    var $comboBox = $realInput.data("tComboBox");
                        //    $comboBox.value("");
                        //});
                    });
                    //send an ajax request to clear the session query for the model
                    var modelName = $("input#entityModel_ModelName").val();
                    $.ajax({ url: window.basePath + "Entity/ItemSelectReset/" + modelName, type: "POST" });
                    $("#filterSearch").click();
                    return false;
                });
                //in the case of the referral ui, set up the handlers for the checkboxes and radios
                if ($(".referralRowToggle, .referralDetails", $data).length > 0) {
                    attachReferralActionsToSearchResults($data);
                    setSelectedSearchResultsActiveReferralCheckBoxes($data);
                    setSelectedDetailsRadio($("table > tbody", $data).first());
                }

                if ($(".serviceRequestRowToggle, .serviceRequestDetails", $data).length > 0) {
                    attachServiceRequestActionsToSearchResults($data);
                    setSelectedSearchResultsActiveServiceRequestCheckBoxes($data);
                    setSelectedDetailsRadio($("table > tbody", $data).first());
                }

                //replace the current results html with the new results html
                $("#filterFormResults").html($data);
                showSearchResults();
            }
        },
        error: function (xhr, status, errorThrown) {
            showSearchResultsFailure(errorThrown);
        },
        complete: function () {
            //turn off the loading indicator
            togglePagingAndFilterAjaxIndicator(false, '#filterBarToggle')
        }
    });
}

function submitPaging(imgName) {
    var pagingData = $('form#pagingForm, form#sortForm').serialize();
    if (imgName != undefined)
        pagingData = pagingData + "&" + imgName + "=true";
    togglePagingAndFilterAjaxIndicator(true, '.submitAnnotation')
    //post the form via ajax
    //success replaces the item table/paging controls with the updated html
    $.ajax({
        type: "POST",
        url: $('form#pagingForm').get(0).action,
        data: pagingData,
        success: function (data, status) {
            var $data = $(data);

            // in the case of the referral or service request ui, 
            // set up the handlers for the checkboxes and radios

            if ($(".referralRowToggle, .referralDetails", $data).length > 0) {
                attachReferralActionsToSearchResults($data);
                setSelectedSearchResultsActiveReferralCheckBoxes($data);
                setSelectedDetailsRadio($("table > tbody", $data).first());
            }

            if ($(".serviceRequestRowToggle, .serviceRequestDetails", $data).length > 0) {
                attacheServiceRequestActionsToSearchResults($data);
                setSelectedSearchResultsActiveServiceRequestCheckBoxes($data);
                setSelectedDetailsRadio($("table > tbody", $data).first());
            }

            $("#filterFormResults").html($data);
        },
        error: function (xhr, status, errorThrown) {
            $.Zebra_Dialog('<h5>Error!</h5><p>There was an error when executing this request. We apologize for the inconvenience.</p><p>The error thrown was: ' + errorThrown + '</p>', {
                'type': 'warning',
                'title': 'Error',
                'buttons': [
                    { caption: 'OK', callback: function () { return false } }
                ]
            });
        },
        complete: function () {
            togglePagingAndFilterAjaxIndicator(false, '.submitAnnotation')
        }
    });
}

//function that handles the sorting of fields via ajax call to the server
function submitFormSort(sortfield, sortdir) {
    //get a reference to the form
    var sortForm = $("#recordTable form").get(0);

    //insert fields/values for the sort field and sort direction
    var sortFieldInput = sortForm.sortField;
    if (sortFieldInput == undefined) {
        sortFieldInput = document.createElement("input");
        sortFieldInput.name = "sortField";
        sortFieldInput.type = "hidden";
        sortForm.appendChild(sortFieldInput);
    }
    sortFieldInput.value = sortfield;

    var sortDirInput = sortForm.sortDir;
    if (sortDirInput == undefined) {
        sortDirInput = document.createElement("input");
        sortDirInput.name = "sortDir";
        sortDirInput.type = "hidden";
        sortForm.appendChild(sortDirInput);
    }
    sortDirInput.value = sortdir;

    var formData = $("form").serialize();

    //post the form via ajax
    //success replaces the item table/paging controls with the updated html
    //error pops a stupid alert
    toggleSortingAjaxIndicator(true, "#recordTable")
    $.ajax({
        type: "POST",
        url: sortForm.action,
        data: formData,
        success: function (data, status) {
            var $data = $(data);
            attachRadiobuttonActions($data);
            $("#recordTable").html($data);
        },
        error: function (xhr, status, errorThrown) {
            handleGeneralAjaxError(xhr);
        },
        complete: function () {
            toggleSortingAjaxIndicator(false, "#recordTable")
        }
    });
}

function showSearchResults() {
    var verticalFilterBar = $("#filterBarContainer.verticalFilterPanel");
    if (verticalFilterBar != undefined && verticalFilterBar.length > 0) {
        toggleFilterBarStyle(verticalFilterBar);
    }
    $("#filterFormResults").parent().show();
    //setCenterColumnLayout();
    //handle any radio buttons that might be present (modal) and wire up the handler for when they are clicked
    attachRadiobuttonActions($(".itemSelectModal, #itemActionSelectWrapper"));
    var $itemSelectNonModalCont = $("#itemActionSelectWrapper");
    if ($itemSelectNonModalCont.length > 0) {
        resizeItemListElements($itemSelectNonModalCont);
    }
}

function attachRadiobuttonActions($container) {
    var $radios = $container.find("input[type=radio]");
    if ($radios.length > 0) {
        $radios.click(function () {
            handleModalRadioSelect($(this));
        });
        if ($("body").data("modalfieldvalue") != undefined) {
            var modalValueToSelect = $("body").data("modalfieldvalue");
            $radios.each(function () {
                var $this = $(this);
                var $val = $this.val();
                if ($val == modalValueToSelect)
                    //$this.prop("checked", true);
                    $this.click();
            });
        }
        else {
            $selectedRadio = $("input[type=radio]:checked");
            if ($selectedRadio != null) {
                $selectedRadio.click();
            }
        }
    }
}

function showSearchResultsFailure(errormsg) {
    $("#filterFormResults").html("<span class='field-validation-error'>" + errormsg + "</span>");
    showSearchResults();
}

function toggleSortingAjaxIndicator(showImage, target) {
    if (showImage) {
        //append the ajax loader div to the target div
        var $target = $(target);
        var ajaxLoader = "<div id='ajaxSortingIndicator'><span><span class='submitNoteLoading'>Loading...</span></span></div>";
        var $ajaxLoader = $(ajaxLoader).css({ 'width': $target.width(), 'height': $target.height() });
        $(target).append($ajaxLoader).fadeIn('fast');
    } else {
        //find the ajax loader div in the target div and remove it
        $("#ajaxSortingIndicator", $(target)).fadeOut('fast', function () {
            $(this).remove();
        });
    }
}

function handleTreeviewError(xhr) {
    // place the error text somewhere in the DOM
    $(xhr.currentTarget).append("<div class='ajaxError'>There was an error retrieving this content. We apologize for the inconvenience.</div>");
    return false;
}

function checkForAjaxGeneralError(xhr) {
    return $(xhr.responseText).prop("id") == "ajaxErrorModal";
}

function handleAjaxGeneralError(xhr) {
    //TODO: flesh this out with any client-side checks (ie, is there already a modal up?)
    var $modal = $(xhr.responseText);
    $("a#ajaxErrorModalClose", $modal).click(function () {
        $(this).parents("#ajaxErrorModal").remove();
    });
    $("#wrap").append($modal);
    $modal.show();
}

function attachLookupModal($modalAnchor, url) {
    var $container = $modalAnchor.parent();

    var $inputs = $("input", $container);
    var $selects = $("select", $container);
    var $spans = $("span:not(.t-select, .t-icon)", $container);

    $modalAnchor.click(function () {
        $anchor = $(this);
        $anchor.addClass("modalLoading");
        $.ajax({
            type: "POST",
            url: url,
            data: "modelName=" + $modalAnchor.data().modelname + "&fieldName=" + $modalAnchor.data().fieldname,
            success: function (data, status) {
                var $data = $(data);
                $("#wrap").append($data);
                var $itemSelectModal = $(".itemSelectModal", $data).first();
                var modalFieldValue = null;
                var modalFieldText = null;
                var $modalInputs = $container.find("input, select");
                if ($modalInputs.length > 0) {
                    var existingValue = $modalInputs.first().val();
                    if (existingValue != "00000000-0000-0000-0000-000000000000") {
                        modalFieldValue = existingValue;
                    } else {
                        modalFieldValue = "";
                    }
                    if ($container.hasClass("selectLookupField")) {
                        modalFieldText = $(".t-input", $container).first().text();
                    } else if ($container.hasClass("labelLookupField")) {
                        modalFieldText = $("span", $container).first().text();
                    }
                }
                if (modalFieldValue.length > 0) {
                    $("body").data("modalfieldvalue", modalFieldValue);
                    insertSelectedItemMarker(modalFieldValue, modalFieldText);
                }
                $itemSelectModal.find("input#selectSubmit").click(function () {
                    var $selectedItemMarker = $(this).parent().find(".selectedItemMarker");
                    if ($selectedItemMarker.length > 0) {
                        var value = $selectedItemMarker.data("value");
                        var text = $selectedItemMarker.data("text");
                        if ($spans.length)
                            $spans.text(text);
                        if ($inputs.length) {
                            for (var i = 0; i <= $inputs.length; i++) {
                                var $input = $($inputs[i]);
                                if ($input.hasClass('t-input')) {//telerik combo box
                                    var $realInput = $input.parent().next("input");
                                    var $comboBox = $realInput.data("tComboBox");
                                    $comboBox.value(value);
                                } else {
                                    $input.val(value);
                                    if ($input.length > 0) {
                                        specialHandlingForClientProvidersByValue($input[0].id, value);
                                    }
                                }
                            }
                        }
                        if ($selects.length) {
                            $selects.val(value).children().removeAttr("selected").parent().find("option[value=" + value + "]").attr("selected", "selected");
                        }
                    } else {
                        if ($spans.length)
                            for (var i = 0; i <= $spans.length; i++) {
                                var $span = $($spans[i]);
                                if ($span.hasClass('t-input')) {//telerik combo box
                                    var $realinput = $span.parent().next("input");
                                    var $comboBox = $realinput.data("tComboBox");
                                    if ($comboBox == undefined)
                                        $comboBox = $realinput.data("tDropDownList");
                                    $comboBox.select(0);
                                } else {
                                    $span.text('');
                                }
                            }
                        if ($inputs.length) {
                            for (var i = 0; i <= $inputs.length; i++) {
                                var $input = $($inputs[i]);
                                if ($input.hasClass('t-input')) {//telerik combo box
                                    var $realInput = $input.parent().next("input");
                                    var $comboBox = $realInput.data("tComboBox");
                                    $comboBox.select(2);
                                } else {
                                    $input.val('');
                                }
                            }
                        }
                        if ($selects.length) {
                            $selects[0].selectedIndex = 0;
                        }
                    }
                    $("#itemSelectModalWrap").remove();
                });
                $itemSelectModal.find("input#selectCancel").click(function () {
                    $(".dumbBoxWrap").remove();
                    return false;
                });
                $(".dumbBoxWrap").show();
                var $window = $(window);
                var windowHeight = $window.height();
                $itemSelectModal.find("table").each(function () {
                    $this = $(this);
                    var modalHeight = $itemSelectModal.first().height();
                    var filterHeight = $("tr#filterPanelRow").first().height();
                    var buttonsHeight = $itemSelectModal.find(".modalActions").first().height();
                    $this.height(modalHeight - (filterHeight + buttonsHeight + 20));
                });
                $(".itemSelectModal .modalActions").width($(".itemSelectModal").width() - 12);
                $(".itemSelectModal").animate({ top: 40, height: windowHeight - 120 }, 'fast');
            },
            error: function (xhr, status, errorThrown) {
                $.Zebra_Dialog('<h5>Error!</h5><p>There was an error when executing this request. We apologize for the inconvenience.</p><p>The error thrown was: ' + errorThrown + '</p>', {
                    'type': 'warning',
                    'title': 'Error',
                    'buttons': [
                        { caption: 'OK', callback: function () { return false } }
                    ]
                });
            },
            complete: function () {
                //change loader to arrow
                $anchor.removeClass("modalLoading");
            }

        });
        return false;
    });
}

function attachNonModalLookupActions($actionsPanel, selectUrl, returnUrl, contextRecord) {
    $actionsPanel.find("input#selectSubmit").click(function () {
        //TODO: takes the selected radio's value and an id for the record and passes it to a set action on the controller that sets the specified value for the record in question
        var $this = $(this);
        //using the selectUrl param, make an ajax post and send the id of the selected radio as serialized data
        var $selRadio = $("#colCenter table input[type=radio]:checked");
        //if ($selRadio.length != 0) {
        //    //check for an empty guid, and if present - replace it with the selected id
        //    var marker = "00000000-0000-0000-0000-000000000000";
        //    if (selectUrl.indexOf(marker) > -1) {
        //        selectUrl = selectUrl.replace(marker, $selRadio.first().val());
        //    }
        //    //make sure there's a querystring delimiter in the url
        //    if (selectUrl.indexOf("?") == -1) {
        //        selectUrl += "?";
        //    } else if (!selectUrl.substr(selectUrl.length - 1, 1) != "&") { //if there's a querystring delimiter already, make sure the url ends with an & so more paramters can be attached
        //        selectUrl += "&";
        //    }
        //    if (contextRecord != undefined && contextRecord.length > 0 && selectUrl.indexOf("contextRecord=") == -1) {
        //        selectUrl += "contextRecord=" + contextRecord + "&";
        //    }
        //    if ($selRadio.data("returnfields") != null) {
        //        selectUrl += "returnFields=" + $selRadio.data("returnfields");
        //    }
        //    window.location.href = selectUrl;
        //} else {
        //    alert("error - must select value");
        //}

        //check for an empty guid, and if present - replace it with the selected id
        var marker = "00000000-0000-0000-0000-000000000000";
        if (selectUrl.indexOf(marker) > -1) {
            selectUrl = selectUrl.replace(marker, $selRadio.first().val());
        }
        //make sure there's a querystring delimiter in the url
        if (selectUrl.indexOf("?") == -1) {
            selectUrl += "?";
        } else if (!selectUrl.substr(selectUrl.length - 1, 1) != "&") { //if there's a querystring delimiter already, make sure the url ends with an & so more paramters can be attached
            selectUrl += "&";
        }
        if (contextRecord != undefined && contextRecord.length > 0 && selectUrl.indexOf("contextRecord=") == -1) {
            selectUrl += "contextRecord=" + contextRecord + "&";
        }
        if ($selRadio.length == 0) // if radio was not selected, then clear all return field values - Scott
        {
            // grab return field structure from first radio button in the radio button list
            var $firstRadio = $("#colCenter table input[type=radio]:first");

            // split returnFields structure into array of returnField pairs
            var returnFieldPairs = $firstRadio.data("returnfields").split(",");
            var clearedReturnFields = "";

            // loop through pairs, replacing populated values with empty strings
            for (i = 0; i < returnFieldPairs.length; i++) {
                // split each pair into fieldName and Value
                // where fieldName is at position 0 and Value is at position 1
                var returnFieldPair = returnFieldPairs[i].split(".");
                returnFieldPair[1] = "";

                // reconstruct fieldPair but replace populated value with an empty string
                clearedReturnFields += returnFieldPair[0] + "." + returnFieldPair[1] + ",";
            }
            clearedReturnFields = clearedReturnFields.substring(0, clearedReturnFields.length - 1);  // trim last comma

            // now returnFields can be used to clear out the designated fields
            selectUrl += "returnFields=" + clearedReturnFields;
        }
        else {
            if ($selRadio.data("returnfields") != null) {
                selectUrl += "returnFields=" + $selRadio.data("returnfields");
            }
        }
        window.location.href = selectUrl;



    });
    $actionsPanel.find("input#selectCancel").click(function () {
        //TODO: calls a cancel action on the controller that bounces back to the last page in history
        //redirect to the cancelUrl parameter
        if (returnUrl != undefined && returnUrl.length > 0) {
            window.location = returnUrl;
        } else {
            window.history.back();
        }
        return false;
    });
}

function handleModalRadioSelect($radio) {
    var value = $radio.val();
    var text = $radio.next("input[type=hidden]").val();
    insertSelectedItemMarker(value, text);
}

function insertSelectedItemMarker(value, text) {
    //find the record actions div
    var $recordActions = $(".itemSelectModal, #itemActionSelectWrapper").find(".modalActions");
    if ($recordActions.length > 0) {
        //look for an existing 'selected item' anchor previously inserted
        var $selectedItemMarkers = $recordActions.find(".selectedItemMarker");
        //if found, alter properties of existing...otherwise create new
        //properties on 'selected item' element need to include the text and value fields used in the submit function
        if ($selectedItemMarkers.length > 0) {
            var $selectedItemMarker = $selectedItemMarkers.first();
            $selectedItemMarker.data({ "text": text, "value": value }).children(".selectedItemMarkerText").text(text);
        } else {
            var $selectedItemMarker = $("<span class='selectedItemMarker'><span class='selectedItemMarkerText'>" + text + "</span><a class='action clear' href='#'><span class='Icon'>&nbsp;</span></a></span>");
            $selectedItemMarker.data({ "text": text, "value": value });
            $selectedItemMarker.find("a").click(function () {
                $(this).parent().remove();
                $(".itemSelectModal, #itemActionSelectWrapper").find("input[type=radio]").prop("checked", false);
                $("body").data("modalfieldvalue", "");
            });
            $recordActions.append($selectedItemMarker);
        }
    }
}

function resizeItemListElements($container) {
    $container.find("#filteredPageTableContainer").each(function () {
        $this = $(this);
        var containerHeight = $(".t-pane").eq(1).height();
        var filterHeight = $("tr#filterPanelRow").first().height();
        var buttonsHeight = $container.find(".actionPanel").first().height();
        $this.height(containerHeight - buttonsHeight - 20);
        $this.css("overflow-y", "scroll");
    });
    $(".actionPanel", $container).width($container.width() - 12);
}

function attachEntityFormFunctions($modalAnchor, modelName, fieldName, currentValue) {
    var $t_dropdown = $("#Identity." + fieldName).data("tDropDownList");
    if ($t_dropdown.length == 0)
        console.error("telerik dropdown not found");
    //TODO: build the url based on whether currentValue is undefined or empty
    var isEdit = currentValue != undefined && currentValue.length > 0;
    var url = "/Entity/_" + (isEdit ? "ItemModalEdit" : "ItemModalCreate") + "/" + modelName;
    if (isEdit)
        url = url + "/" + currentValue;
    //TODO: click action needs to handle launching the modal via ajax
    $modalAnchor.click(function () {
        $.ajax({
            type: "POST",
            url: url,
            success: function (data, status) {
                //insert the returned form data
                $("#wrap").append(data);
                //TODO: handle the events for the buttons inside of the form
                $(".itemCreateEditModal input#selectSubmit").click(function () {
                    //TODO: set up ajax post to create/edit post action
                    //success on call should hide modal and insert value from new object into dropdown
                    //error should show a message?
                    //how does validation fit in?
                });
                $(".itemCreateEditModal input#selectCancel").click(function () {
                    $(".dumbBoxWrap").remove();
                    return false;
                });
            },
            error: function (xhr, status, errorThrown) {
                $.Zebra_Dialog('<h5>Error!</h5><p>There was an error when executing this request. We apologize for the inconvenience.</p><p>The error thrown was: ' + errorThrown + '</p>', {
                    'type': 'warning',
                    'title': 'Error',
                    'buttons': [
                        { caption: 'OK', callback: function () { return false } }
                    ]
                });
            }
        });
    });
    //if edit, the id needs to be passed - don't currently have it

    //TODO: inside of create/edit modal form, we need to figure out how to take a return from the inner ajax call and tie it to the outer call

    //TODO: on outer call success, returned data needs to be inserted into the telerik dropdown or updated.
}

function autoloadComboBoxes(e) {
    var $target = $("#" + e.target.id);
    var $targetCb = $target.data("tComboBox");
    $targetCb.fill();
}

function autoloadDropDownLists(e) {
    var $target = $("#" + e.target.id);
    var $targetCb = $target.data("tDropDownList");
    $targetCb.fill();

    specialHandling(e);

}



function specialHandlingForClientProvidersByValue(id, value) {
    if (id == "Entity_Identity_ClientProvider_ProviderId") {
        var $hideableDiv = $("#hideIfProviderSelected");
        if ($hideableDiv != null) {
            if (value.length > 0) {
                $hideableDiv.css("display", "none");
            }
            else {
                $hideableDiv.css("display", "block");
            }
        }
    }
}


function specialHandlingForClientProviders(e) {
    if (e.currentTarget.name == "Entity.Identity.ClientProvider_ProviderId") {
        var $hideableDiv = $("#hideIfProviderSelected");
        if ($hideableDiv != null) {
            if (e.target.value.length > 0) {
                $hideableDiv.css("display", "none");
            }
            else {
                $hideableDiv.css("display", "block");
            }
        }
    }
}

function specialHandling(e) {
    specialHandlingForClientProviders(e);
}

function lookupSelectDropdownChanged(e) {
    var event = e;

    specialHandling(e);
    //TODO: need to get the current value of the event target (e.target, i think)
    //if value is empty set to create, otherwise set to edit
    if (e.target.value.length > 0) {

    } else {

    }

}

function attachContentToggle($anchor) {
    var COLLAPSED = "collapsed",
        EXPANDED = "expanded",
        isCollapsed = $anchor.hasClass("collapsed"),
        $recordSummaryPanel = $anchor.parents(".recordSummary").first(),
        $panelBody = $recordSummaryPanel.find(".panelBody"),
        panelId = $recordSummaryPanel.attr("id"),
        stateToSet = isCollapsed ? EXPANDED : COLLAPSED;
    if (isCollapsed) {
        $panelBody.hide();
        $anchor.removeClass(EXPANDED);
        stateToSet = EXPANDED;
    }

    $anchor.click(function () {
        if ($panelBody.length > 0) {
            $.ajax({
                url: window.basePath + "Layout/SaveSummaryPanelDisplayState",
                type: "post",
                data: "id=" + panelId + "&state=" + stateToSet,
                success: function (result) {
                    if (isCollapsed) {
                        $panelBody.show();
                        $anchor.addClass(EXPANDED).removeClass(COLLAPSED);
                        stateToSet = COLLAPSED;
                    } else {
                        $panelBody.hide();
                        $anchor.addClass(COLLAPSED).removeClass(EXPANDED);
                        stateToSet = EXPANDED;
                    }
                    isCollapsed = !isCollapsed;
                },
                error: function (error) {
                    alert("error saving");
                }
            });
        }
        return false;
    });
}

function attachReferralActionsToSearchResults($markup) {
    $(".referralRowToggle", $markup).click(function () {
        var $this = $(this);
        //get id value of the checkbox for the locator
        var locator = $this.val();
        var contactId = $this.data("contactid");

        // if checkbox checked, add corresponding service location
        // otherwise, remove it
        if ($this.is(":checked")) {
            addReferralListItem(locator, contactId, false);
        }
        else {
            removeReferralListItem(locator, contactId);
        }
    });

    $(".referralRowRadio", $markup).click(function () {
        var $this = $(this);
        //get id value of the checkbox for the locator
        var locator = $this.val();
        setSelectedReferralDetails($this);
    });
}

function addReferralListItem(locator, contactId, setRadio) {
    var $referralList = $("#referralList");

    // create a variable for the ajax url
    var url = window.basePath + "Info/";

    // add item to list of referrals
    console.info("add item referral: " + locator);
    url = url + "_AddItemReferral/" + locator;

    // When first ajaz request is isued, remove the previous request list content and replace with a loading indicator
    if (activeAjaxConnections == 0) {
        $referralList.find(".panelBody").html("<div class='centeredLoadMarkerWrap loadingDisplayMarker'></div>");
    }

    //make the ajax request to update the referral list and get refreshed markup
    $.ajax({
        url: url,
        type: "post",
        data: "contactId=" + contactId,
        beforeSend: function (xhr) {
            activeAjaxConnections++;
            console.info("active connections: " + activeAjaxConnections);
            var $checkbox = $(":checkbox[value=" + locator + "]");
            $checkbox.prop('disabled', true);
        },
        success: function (data, status, xhr) {
            // when all pending ajax requests have completed, replace the current referral list with the returned data
            if (activeAjaxConnections == 1) {
                var $data = $(data);
                $referralList.html($data);
                updateReferralDetailsAndListPanels();

                // when adding, doesn't already exist
                toggleDetailsPanelActionState(false, $("#referralDetails"));
                setSelectedSearchResultsActiveReferralCheckBoxes($("div#recordTable"));
                setSelectedDetailsRadio($referralList, locator, setRadio);
            }
        },
        error: function (xhr, status, errorThrown) {
            // remove the loading indicator
            activeAjaxConnections--;
            if (activeAjaxConnections == 0) {
                $(".centeredLoadMarkerWrap", $referralList).remove();
            }
            $referralList.find(".panelBody").html("<p>We're sorry, the details for the selected item could not be retrieved.</p>");
        },
        complete: function () {
            // re-enable checkbox on copmlete of ajax request
            var $checkbox = $(":checkbox[value=" + locator + "]");
            $checkbox.prop('disabled', false);

            activeAjaxConnections--;
            console.info("active connections: " + activeAjaxConnections);
            if (activeAjaxConnections == 0) {
                //remove the loading indicator
                $(".centeredLoadMarkerWrap", $referralList).remove();
            }
        }
    });
}

function removeReferralListItem(locator, contactId) {
    var $referralList = $("#referralList");

    //create a variable for the ajax url
    var url = window.basePath + "Info/";

    // setup ajax post url to remove a referral request
    //console.info("remove: " + locator);
    url = url + "_RemoveItemReferral/" + locator;

    // when first ajax request is encountered, remove the previous referral list content and replace with a loading indicator
    if (activeAjaxConnections == 0) {
        $referralList.find(".panelBody").html("<div class='centeredLoadMarkerWrap loadingDisplayMarker'></div>");
    }

    //make the ajax request to update the referral list and get refreshed markup
    $.ajax({
        url: url,
        type: "post",
        data: "contactId=" + contactId,
        beforeSend: function (xhr) {
            activeAjaxConnections++;
            //console.info("active connections: " + activeAjaxConnections);
            var $checkbox = $(":checkbox[value=" + locator + "]");
            $checkbox.prop('disabled', true);
        },
        success: function (data, status, xhr) {
            // when all pending ajax requests have completed, replace the current referral list with the returned data
            if (activeAjaxConnections == 1) {
                var $data = $(data);
                $referralList.html($data);
                updateReferralDetailsAndListPanels();

                // when adding, doesn't already exist
                toggleDetailsPanelActionState(true, $("#referralDetails"));
                setSelectedSearchResultsActiveReferralCheckBoxes($("div#recordTable"));
            }
        },
        error: function (xhr, status, errorThrown) {
            // remove the loading indicator
            activeAjaxConnections--;
            if (activeAjaxConnections == 0) {
                $(".centeredLoadMarkerWrap", $referralList).remove();
            }
            $referralList.find(".panelBody").html("<p>We're sorry, the details for the selected item could not be retrieved.</p>");
        },
        complete: function () {
            // re-enable checkbox on copmlete of ajax request
            var $checkbox = $(":checkbox[value=" + locator + "]");
            $checkbox.prop('disabled', false);

            activeAjaxConnections--;
            //console.inf("active connections: " + activeAjaxConnections);
            if (activeAjaxConnections == 0) {
                //remove the loading indicator
                $(".centeredLoadMarkerWrap", $referralList).remove();
            }
        }
    });

}

function setSelectedSearchResultsActiveReferralCheckBoxes($data) {
    //this function will look for any existing referrals that are pending or finalized
    var $referralListItems = $("#referralList li");

    //each referral item has an id on the li tag for the service location...look through all checkboxes in the $data and pre-check any matching
    $("input[type=checkbox]", $data).each(function () {
        var $checkbox = $(this);
        var inList = false;
        for (var index = 0; index < $referralListItems.length; index++) {
            var $referralItem = $($referralListItems[index]);
            var referralItemVal = $("input[type=radio]", $referralItem).first().val();
            if (referralItemVal == $checkbox.val()) {
                $checkbox.prop("checked", true);
                inList = true;
            }
        }
        if (!inList) {
            $checkbox.prop("checked", false);
        }
    });
}
