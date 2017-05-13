function Nav() {


    function constructor() {

        $.get("/pages/nav.html", function(data) {
            $("#side-menu-insert").html(data).attr("data-conversation-list", "true");

            setEvents();
        });

        
    }
 
    function setEvents() {
        var $logout_btn         = $("#logout");

        $logout_btn.on('click', function() {
            account_id = null;

            localStorage.removeItem("account_id");
            localStorage.removeItem("hash");
            localStorage.removeItem("salt");
            localStorage.removeItem("phone_number");
            localStorage.removeItem("name");
            setPage(PAGE_LOGIN);

        })
    }
    constructor();
}
