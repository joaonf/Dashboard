$( document ).ready(function() {
    $( "#login-form" ).submit(function( event ) {
        var jsonObject;

        var username = $("#username").val();
        var password = $("#password").val();
        password = md5(password);

        $.ajax({
            data: {
                "username": username,
                "password": password
            },
            url: "/api/login",
            method: "GET",
            success: function(result) {
                jsonObject = JSON.parse(result.result[0].data);

                if(jsonObject.length > 0){
                    createCookie("token", jsonObject[0].Token, null);
                    window.location.href = "/project/production/index.html"; 
                }
                else{
                    new PNotify({
                        title: 'Invalid Login',
                        text: 'Username/password does not exist in the database.',
                        type: 'error',
                        styling: 'bootstrap3'
                    });
                }
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
            	new PNotify({
                    title: 'Error Occurred',
                    text: 'Server under maintenance. Try again later.',
                    type: 'error',
                    styling: 'bootstrap3'
                });
                console.log(XMLHttpRequest);
                console.log(textStatus);
                console.log(errorThrown);
            }
        });
    });


});

function continueAsGuest() {
    document.cookie.split(";").forEach(function(c) { document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); });
    window.location.href = "/project/production/index.html";
}