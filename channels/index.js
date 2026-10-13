var api = "https://falling-upload-rock-wishing.trycloudflare.com/api/channels"


function abb(num) {
    if (num >= 1_000_000_000) {
        return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
    }

    if (num >= 100_000_000) {
        return (num / 1_000_000).toFixed(0).replace(/\.0$/, '') + 'M';
    }

    if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    }

    if (num >= 1_000) {
        return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    }

    return num.toString();
}

function doFetch() {
    fetch(api).then(res => res.json()).then(data => {
        for (let i = 0; i < data.channels.length; i++) {
            var htmlCard = `
            <div class="card">
                <img loading="lazy" src="${data.channels[i].image}" class="card-img" alt="">
                <div>
                    <span class="name">${data.channels[i].name}</span>
                    <span class="subscribers">${data.channels[i].subscriberCount.toLocaleString()}</span>
                </div>
            </div>
            `

            $(".list").append(htmlCard);
        }
    });
}

doFetch()
