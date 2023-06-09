// Helper / Utility functions
let url_to_head = (url) => {
    return new Promise(function(resolve, reject) {
        var script = document.createElement('script');
        script.src = url;
        script.onload = function() {
            resolve();
        };
        script.onerror = function() {
            reject('Error loading script.');
        };
        document.head.appendChild(script);
    });
}

let handle_close = (event) => {
    event.target.closest(".ms-alert").remove();
}
let handle_click = (event) => {
    if (event.target.classList.contains("ms-close")) {
        handle_close(event);
    }
}
document.addEventListener("click", handle_click);
const paypal_sdk_url = "https://www.paypal.com/sdk/js";
const client_id = "AfBvXrRnMzPfhdXIZfuzGyLAy0SvlTxlG-wyJtk2r_m4GyTjf2Jz7Pl5wk9T4pUJq4Dd7itLME8D9OEr";
const currency = "USD";
const intent = "capture";
const locale = "en_US";

url_to_head(paypal_sdk_url + "?client-id=" + client_id + "&enable-funding=venmo&currency=" + currency + "&intent=" + intent + "&locale=" + locale)
.then(() => {

    let paypal_buttons = paypal.Buttons({
        style: {
            shape: 'pill',
            color: 'white',
            layout: 'horizontal',
            label: 'paypal',
            tagline: 'false'
        },

        createOrder: function(data, actions) {
            return fetch("http://localhost:3000/create_order", {
                method: "post", headers: { "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify({ "intent": intent, "email": document.getElementById("email").value, "fname": document.getElementById("fname").value, "lname": document.getElementById("lname").value, "phone": document.getElementById("phone").value, "street": document.getElementById("street").value, "optional": document.getElementById("optional").value, "state": document.getElementById("state").value, "city": document.getElementById("city").value, "country": document.getElementById("country").value, "zip": document.getElementById("zip").value })
            })
            .then((response) => response.json())
            .then((order) => { return order.id; });
        },
        onApprove: function(data, actions) {
            let order_id = data.orderID;
            return fetch("http://localhost:3000/complete_order", {
                method: "post", headers: { "Content-Type": "application/json; charset=utf-8" },
                body: JSON.stringify({
                    "intent": intent,
                    "order_id": order_id,
                    "payer": data.payer
                })
            })
            .then((response) => response.json())
            .then((order_details) => {
                console.log(order_details);
                let intent_object = intent === "authorize" ? "authorizations" : "captures";
                //Custom Successful Message
                alerts.innerHTML = `<div class=\'ms-alert ms-action\'>Thank you ` + order_details.payer.name.given_name + ` ` + order_details.payer.name.surname + ` for your payment of ` + order_details.purchase_units[0].payments[intent_object][0].amount.value + ` ` + order_details.purchase_units[0].payments[intent_object][0].amount.currency_code + `!</div>`;

                paypal_buttons.close();
             })
             .catch((error) => {
                console.log(error);
                alerts.innerHTML = `<div class="ms-alert ms-action2 ms-small"><span class="ms-close"></span><p>An Error Ocurred!</p>  </div>`;
             });
        },

        onCancel: function (data) {
            alerts.innerHTML = `<div class="ms-alert ms-action2 ms-small"><span class="ms-close"></span><p>Order cancelled!</p>  </div>`;
        },

        onError: function(err) {
            console.log(err);
        }
    });
    paypal_buttons.render('#payment_options');
})
.catch((error) => {
    console.error(error);
});
