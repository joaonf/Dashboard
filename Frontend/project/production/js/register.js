$( document ).ready(function() {
    $( "#register-form" ).submit(function( event ) {
        var email = $("#email_r").val();
        var username = $("#username_r").val();
        var password = $("#password_r").val();

        password = md5(password);

        $.ajax({
            data: {
                "username": username,
                "password": password,
                "email": email
            },
            url: "/api/register",
            type: "POST",
            success: function(result) {
                if (result.success === true) {
                    window.location.href = "#signin"
                    new PNotify({
	                    title: 'Successful registration',
	                    text: 'You can now login into the page.',
	                    type: 'success',
	                    styling: 'bootstrap3'
	                });
                }
                else{
	                new PNotify({
	                    title: 'Username already registered',
	                    text: 'The username ' + username + ' is already registered.',
	                    type: 'error',
	                    styling: 'bootstrap3'
	                });
                }
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                console.log(XMLHttpRequest);
                console.log(textStatus);
                console.log(errorThrown);
            }
        });
    });
});