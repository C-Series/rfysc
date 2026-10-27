var api = "https://personalized-icq-hdtv-employ.trycloudflare.com/api/channels"

var channels = [];

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

// build cards with DOM calls so channel names are never parsed as HTML
function render(filter) {
    var q = (filter || "").trim().toLowerCase();
    var $list = $(".list").empty();
    var shown = 0;

    channels.forEach(function (c, i) {
        if (q && (c.name || "").toLowerCase().indexOf(q) === -1) return;
        shown++;

        var $card = $("<div>").addClass("card")
            .append($("<span>").addClass("rank").text(i + 1))
            .append($("<img>").attr({ loading: "lazy", src: c.image, alt: "" }).addClass("card-img"))
            .append(
                $("<div>").addClass("card-text")
                    .append($("<span>").addClass("name").text(c.name))
                    .append($("<span>").addClass("subscribers").attr("title", abb(c.subscriberCount)).text(Number(c.subscriberCount).toLocaleString()))
            );

        $list.append($card);
    });

    if (!shown) {
        $list.append($("<p>").addClass("list-status").text(q ? "No channels match your filter." : "No channels to show."));
    }

    $(".list-count").text(shown + (shown === 1 ? " channel" : " channels") + (q ? " shown" : ""));
}

function doFetch() {
    fetch(api).then(res => res.json()).then(data => {
        channels = (data.channels || []).slice().sort(function (a, b) {
            return b.subscriberCount - a.subscriberCount;
        });
        render($(".list-filter").val());
    }).catch(function () {
        $(".list").empty().append($("<p>").addClass("list-status").text("Couldn't load channels. Refresh to try again."));
    });
}

$(".list-filter").on("input", function () {
    render($(this).val());
});

doFetch()
