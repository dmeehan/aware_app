/* Javascript variables and functions to set the logout warning and logout redirect timers on page render */
; (function ($) {
    $(document).ready(function () {
        //global variables for timer settings
        //declare global timer
        var timer;
        //get the total logout time from the window object
        var configTime = window.logoutTime * 1000 * 60;
        //set time for logout after warning window has been shown
        var logoutTime = 3 * 1000 * 60;
        //set time for warning window
        var warnTime = configTime - logoutTime;

        initLogoutWarningTimer();

        //Function to set the timer for the logout warning window
        function initLogoutWarningTimer() {
            timer = window.setTimeout(function () {
                initLogoutTimer();
                $.Zebra_Dialog('<h5>Warning!</h5><br /><p>Due to a lack of activity, your session will expire soon.</p><p>Please press the <b>OK</b> button before your authentication expires to refresh your session.</p><p style="margin-top:1em">You have <span style="font-weight:bold" id="logoutTimeDisplay">3 minutes</span> until your session expires.</p>', {
                    'type': 'warning',
                    'title': 'Logout Warning',
                    'buttons': [
                        { caption: 'OK', callback: function () { resetWarningTimer() } }
                    ]
                });
            }, warnTime);
        }

        //Function to set the timer for an automated logout after the warning window has been shown
        function initLogoutTimer() {
            timer = window.setTimeout(function () {
                //window.location.replace(document.location.protocall + '//' + 'some string that gives us the root url plus any subdirectories that make up the base site url' + 'User/LogOff');
                window.location.replace(window.logoutPath);
            }, logoutTime);
            //set up a second timer that counts down each minute until logout
            setLogoutDisplay(logoutTime);
        }

        function setLogoutDisplay(millisecondsLeft) {
            var minutesLeft = (millisecondsLeft / 1000) / 60;
            //set the display on the ui
            $("#logoutTimeDisplay").text(minutesLeft + (minutesLeft > 1 ? " minutes" : " minute"));
            var displayTimer = window.setTimeout(function() {
                if (minutesLeft > 0) {
                    setLogoutDisplay((minutesLeft - 1) * 1000 * 60);
                }
            }, 1000 * 60); 
        }

        //Function to reset the timer (used when activity is detected before the warning dialog has been shown
        function resetWarningTimer() {
            //make ajax call to server that refreshes the auth
            $.ajax({
                url: window.basePath + "User/RefreshAuth",
                type: "POST"
            }).success(function (data, status, xhr) {
                if (data == "logout") {
                    //launch a modal to inform the user that they have been logged out server-side. one OK button - callback sends the user to the user/logout action
                    $.Zebra_Dialog('<h5>Session Expired.</h5><br /><p>We\'re sorry, there your session has expired. You will be redirected to the login page.</p><br />', {
                        'type': 'warning',
                        'title': 'Session Expired',
                        'buttons': [
                            { caption: 'OK', callback: function () { window.location = window.basePath + "User/Login"; } }
                        ]
                    });
                } else {
                    window.clearTimeout(timer);
                    initLogoutWarningTimer();
                }
            }).error(function (xhr, status, errorThrown) {
                $.Zebra_Dialog('<h5>Warning!</h5><br /><p>We\'re sorry, there has been an error re-authenticating you. You will be redirected to the login page.</p><br />', {
                    'type': 'warning',
                    'title': 'Authentication Error',
                    'buttons': [
                        { caption: 'OK', callback: function () { window.location = window.basePath + "User/Login"; } }
                    ]
                });
            });
        }
    });
})(jQuery);