const API = "http://localhost:5555/api/channels";
const API_FASTEST = "http://localhost:5555/api/fastest";

let currentId = 74;      // channel currently shown
let allChannels = [];    // every channel, loaded once for search

const subOdo = new Odometer({
    el: document.getElementById("subscriberCount"),
    value: 0,
    format: "(,ddd)",
    duration: 2000
});



/* ---------- Live chart ---------- */

const MAX_POINTS = 720; // ~30 minutes of history at one point every 2.5s

Highcharts.setOptions({
    time: { useUTC: false },          // show the viewer's local time
    lang: { thousandsSep: "," }
});

const chart = Highcharts.chart("subChart", {
    chart: {
        type: "line",
        backgroundColor: "transparent",
        style: { fontFamily: "Roboto, Arial, sans-serif" }
    },
    title: { text: undefined },
    legend: { enabled: false },
    xAxis: {
        type: "datetime",
        lineColor: "#e1e1e1",
        tickColor: "#e1e1e1",
        labels: { style: { color: "#777" } }
    },
    yAxis: {
        title: { text: undefined },
        allowDecimals: false,
        gridLineColor: "#eee",
        labels: { style: { color: "#777" } }
    },
    tooltip: {
        xDateFormat: "%H:%M:%S",
        pointFormat: "<b>{point.y:,.0f}</b> subscribers"
    },
    plotOptions: {
        series: {
            color: "#0c7eac",
            lineWidth: 2,
            marker: { enabled: false },   // <- hides the dots
            animation: { duration: 400 }
        }
    },
    series: [{ name: "Subscribers", data: [] }]
});

function addChartPoint(count) {
    const series = chart.series[0];
    // shift the oldest point off once we hit the limit
    series.addPoint([Date.now(), count], true, series.data.length >= MAX_POINTS);
}

const tabs = {
    info: {
        selector: document.querySelector(".info"),
        content: document.querySelector(".infocontent")
    },
    livecount: {
        selector: document.querySelector(".livecount"),
        content: document.querySelector(".subcount")
    }
}

function closeTab(e) {
    tabs[e].selector.classList.remove("selected");
    tabs[e].content.style.display = "none";
}

function openTab(e) {
    tabs[e].selector.classList.add("selected");
    tabs[e].content.style.display = "block";
}

document.querySelector(".button_fullList").addEventListener("click", () => {
    window.location.href = "channels"
})

document.querySelector(".info").addEventListener("click", () => {
    openTab('info');
    closeTab('livecount')
})

document.querySelector(".livecount").addEventListener("click", () => {
    closeTab('info');
    openTab('livecount')
})

/* ---------- Live count ---------- */

$.getJSON(API_FASTEST, function(e) {
    for (let i = 0; i < 10; i++) {
        var element = `
            <div class="fast_channel fast_channel_1">
                <img src="${e.items[i].image}" alt="" class="fast_pfp">
                <span class="channel_name">${e.items[i].name}</span>
            </div>`


        $(".fast_ch_inner").append(element);
    }
})



function update() {
    const id = currentId;
    $.getJSON(API + "?ids=" + id, function (e) {
        if (id !== currentId) return; // user switched channel while this was loading
        const c = e.channels[0];
        $(".alt-pfp").attr("src", c.image);
        $(".channelName").text(c.name);
        $(".mtxDesc").text(c.info || c.description);
        subOdo.update(c.subscriberCount);
        addChartPoint(c.subscriberCount);
    });
}

update();
setInterval(update, 3000);

/* ---------- Search ---------- */

const $input = $(".search-bar");
const $results = $(".search-results");
let shown = [];
let activeIndex = -1;

// Load every channel once so searching is instant
$.getJSON(API, function (data) {
    allChannels = Array.isArray(data) ? data : (data.channels || []);
});

function closeResults() {
    $results.hide().empty();
    shown = [];
    activeIndex = -1;
}

function setActive(i) {
    activeIndex = i;
    $results.children(".result").each(function (idx) {
        $(this).toggleClass("active", idx === i);
    });
}

function selectChannel(c) {
    currentId = c.id;
    chart.series[0].setData([]); // start a fresh graph for the new channel
    // Show what we already know right away, then let update() refresh it
    $(".alt-pfp").attr("src", c.image);
    $(".channelName").text(c.name);
    $input.val("").blur();
    closeResults();
    update();
}

function renderResults(query) {
    const q = query.trim().toLowerCase();
    closeResults();
    if (!q) return;

    shown = allChannels
        .filter(c => (c.name || "").toLowerCase().includes(q))
        // names that start with the query come first
        .sort((a, b) => {
            const aStarts = a.name.toLowerCase().startsWith(q) ? 0 : 1;
            const bStarts = b.name.toLowerCase().startsWith(q) ? 0 : 1;
            return aStarts - bStarts;
        })
        .slice(0, 8);

    if (shown.length === 0) {
        $results.append($("<div>").addClass("result-empty").text("No channels found"));
    } else {
        shown.forEach(function (c, i) {
            const $row = $("<div>").addClass("result")
                .append($("<img>").attr("src", c.image).attr("alt", ""))
                .append($("<span>").addClass("result-name").text(c.name))
                .append($("<span>").addClass("result-subs").text(Number(c.subscriberCount).toLocaleString()))
                // mousedown fires before the input loses focus, so the click isn't lost
                .on("mousedown", function (ev) {
                    ev.preventDefault();
                    selectChannel(c);
                })
                .on("mouseenter", function () { setActive(i); });
            $results.append($row);
        });
    }
    $results.show();
}

$input.on("input", function () {
    renderResults($(this).val());
});

$input.on("keydown", function (ev) {
    if (ev.key === "ArrowDown" && shown.length) {
        ev.preventDefault();
        setActive((activeIndex + 1) % shown.length);
    } else if (ev.key === "ArrowUp" && shown.length) {
        ev.preventDefault();
        setActive((activeIndex - 1 + shown.length) % shown.length);
    } else if (ev.key === "Enter" && shown.length) {
        ev.preventDefault();
        selectChannel(shown[activeIndex >= 0 ? activeIndex : 0]);
    } else if (ev.key === "Escape") {
        closeResults();
    }
});

$input.on("focus", function () {
    if ($input.val()) renderResults($input.val());
});

$input.on("blur", closeResults);