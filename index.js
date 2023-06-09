import express from 'express';
import fetch from 'node-fetch';
import 'dotenv/config';
const app = express();
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
const port = process.env.PORT || 3000;
const environment = process.env.ENVIRONMENT || 'sandbox';
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;
const endpoint_url = environment === 'sandbox' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com';

app.post('/create_order', (req, res) => {
    console.log(req.body);
    get_access_token()
        .then(access_token => {
            let order_data_json = {
                'intent': req.body.intent.toUpperCase(),
                "payer": {"email_address": req.body.email, "name": {"given_name": req.body.fname,"surname": req.body.lname},
                "phone": {"phone_type": "FAX","phone_number": {"national_number": req.body.phone}},
                'address': {"address_line_1": req.body.street,"address_line_2": req.body.optional,"admin_area_2": req.body.city,"admin_area_1": req.body.state,"postal_code": req.body.zip,"country_code": req.body.country},
                },
                "payment_source" : {"card" : {"number" : "1234567812345678", "security_code": "918", "expiry": "01-30"}},
                'purchase_units': [{'amount': {'currency_code': 'USD' , 'value': '450.00'}}]
            };
            const data = JSON.stringify(order_data_json)

            fetch(endpoint_url + '/v2/checkout/orders', { //https://developer.paypal.com/docs/api/orders/v2/#orders_create
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${access_token}`
                    },
                    body: data
                })
                .then(res => res.json())
                .then(json => {
                    res.send(json);
                })
        })
        .catch(err => {
            console.log(err);
            res.status(500).send(err)
        })
});

app.post('/complete_order', (req, res) => {
    get_access_token()
        .then(access_token => {
            fetch(endpoint_url + '/v2/checkout/orders/' + req.body.order_id + '/' + req.body.intent, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${access_token}`
                    },
                    body: req.body
                })
                .then(res => res.json())
                .then(json => {
                    console.log(json);
                    res.send(json);
                }) //Send minimal data to client
        })
        .catch(err => {
            console.log(err);
            res.status(500).send(err)
        })
});

//Servers the index.html file
app.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/index.html');
});
//Servers the style.css file
app.get('/style.css', (req, res) => {
    res.sendFile(process.cwd() + '/style.css');
});
//Servers the script.js file
app.get('/script.js', (req, res) => {
    res.sendFile(process.cwd() + '/script.js');
});

function get_access_token() {
    const auth = `${client_id}:${client_secret}`
    const data = 'grant_type=client_credentials'
    return fetch(endpoint_url + '/v1/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(auth).toString('base64')}`
            },
            body: data
        })
        .then(res => res.json())
        .then(json => {return json.access_token;})
}

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`)
})
