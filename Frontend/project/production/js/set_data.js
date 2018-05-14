$(document).ready(function () {
    var user = getUserFromToken();

    user === null ? $("#userNav").text("Guest") : $("#userNav").text(user[0].Username);
    user === null ? $("#userTop").text("Guest") : $("#userTop").text(user[0].Username);

    $( "#submit-data-form" ).submit(function( event ) {
        var form_data = new FormData();

        form_data.append("location", $("#location").val());
        form_data.append("device", $("#location").val());
        form_data.append("distribution", $("#distribution").val());
        form_data.append("sensor", $("#sensor").val());
        form_data.append("url", $("#url").val());
        form_data.append("interval", $("#interval").val());
        form_data.append("filename", $("#filename").val());
        form_data.append("extension", $("input[name=extension]:checked").val());
        form_data.append("format", $("input[name=format]:checked").val());
        form_data.append("username", $("#username").val());
        form_data.append("password", $("#password").val());
        form_data.append("email", $("#email").val());
        form_data.append("observations", $("#observations").val());
        
        $.ajax({
            data: form_data,
            url: "/api/get_third_party_data",
            method: "PUT",
            contentType: false,
            cache: false,
            processData: false,
            success: function(result) {
                if(result.success === true)
                    new PNotify({
                        title: 'Data submitted successfully',
                        text: 'Data submitted on the Database. Waiting for admin approval.',
                        type: 'success',
                        styling: 'bootstrap3'
                    });
                else{
                    new PNotify({
                        title: 'Error occurred',
                        text: 'Server response: ' + result.result,
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

    // Todo - Load Cache Values to save time
    window.onload = function () {
        
    };

    // Call program
    // console.log("TODO");

});