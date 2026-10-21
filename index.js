// what u doing snooping at my code losr
// it's basic, you wont be suprised
// anyway like and sub to my channel

const BASE = "https://hamilton-rides-seriously-fed.trycloudflare.com/"
const API = BASE + "api/channels";
const API_FASTEST = BASE + "api/fastest";

let currentId = 74;
let allChannels = [];

const MAX_POINTS = 720;

Highcharts.setOptions({
    time: { useUTC: false },
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
            marker: { enabled: false },
            animation: { duration: 400 }
        }
    },
    series: [{ name: "Subscribers", data: [] }]
});

function addChartPoint(count) {
    const series = chart.series[0];
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
    },
    compare: {
        selector: document.querySelector(".compare"),
        content: document.querySelector(".cmpr")
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
    closeTab('livecount');
    closeTab('compare');
})

document.querySelector(".livecount").addEventListener("click", () => {
    closeTab('info');
    closeTab('compare');
    openTab('livecount')
})

document.querySelector(".compare").addEventListener("click", () => {
    closeTab('info');
    openTab('compare');
    closeTab('livecount')
})

$.getJSON(API_FASTEST, function(e) {
    for (let i = 0; i < 10; i++) {
        const c = e.items[i];

        const $element = $(`
            <div class="fast_channel fast_channel_1" style="cursor: pointer;">
                <img src="${c.image}" alt="" class="fast_pfp">
                <span class="channel_name"></span>
            </div>
        `);

        $element.find(".channel_name").text(c.name);

        $element.on("click", function() {
            currentId = c.id;
            chart.series[0].setData([]);

            $(".alt-pfp").attr("src", c.image);
            $(".channelName").text(c.name);

            update();
        });

        $(".fast_ch_inner").append($element);
    }
})

function calcGoal(value) {
   const goal = Math.ceil(value / 100000) * 100000;
    return goal - value;
}

function initOdometer(el, dur, val) {
    return new Odometer({
        el: document.querySelector(el),
        format: "(,ddd)",
        value: val,
        duration: dur || 2000
    });
}

function update() {
    const id = currentId;
    $.getJSON(API + "?ids=" + id, function (e) {
        if (id !== currentId) return;
        const c = e.channels[0];
        $(".alt-pfp").attr("src", c.image);
        $(".channelName").text(c.name);
        if (c.info || c.description) {
            $(".mtxDesc").text(c.info || c.description);
        } else {
            $(".mtxDesc").text("C-Series or the user has not set a description for this channel.");
        }
        
        
        var rpmOdo = initOdometer(".ratePerMinute", 2000, c.ratePerMinute);
        var subOdo = initOdometer(".subscriberCount", 2000, c.subscriberCount);
        var goalOdo = initOdometer(".goalCount", 2000, calcGoal(c.subscriberCount));
        
        rpmOdo.update(c.ratePerMinute);
        subOdo.update(c.subscriberCount);
        goalOdo.update(calcGoal(c.subscriberCount));
        addChartPoint(c.subscriberCount);
    });
}

update();
setInterval(update, 3000);

const $input = $(".search-bar");
const $results = $(".search-results");
let shown = [];
let activeIndex = -1;

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
    chart.series[0].setData([]);
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

const cmp = {
    ids: [currentId, null],        
    data: [null, null],             
    inputs: Array.from(document.querySelectorAll(".compare_search")),
    sel: [
        { pfp: ".cpf1", name: ".compare_channelName.chNm1", subs: ".compare_subscriberCount.chNm1", rpm: ".rpm1" },
        { pfp: ".cpf2", name: ".compare_channelName.chNm2", subs: ".compare_subscriberCount.chNm2", rpm: ".rpm2" }
    ],
    odo: [{}, {}],
    gapOdo: null
};

function cmpInjectCss() {
    const style = document.createElement("style");
    style.textContent = `
        .cmp-wrap { position: relative; width: 100%; }
        .cmp-wrap .compare_search { width: 100%; height: 110%; box-sizing: border-box; }
        .cmp-wrap .search-results { position: absolute; top: 100%; left: 0; right: 0; z-index: 30; }
    `;
    document.head.appendChild(style);
}

function cmpInitOdometers() {
    cmp.sel.forEach(function (s, i) {
        cmp.odo[i].subs = initOdometer(s.subs, 1500, 0);
        cmp.odo[i].rpm  = initOdometer(s.rpm, 1500, 0);
    });
    cmp.gapOdo = initOdometer(".compare_ratePerMinute.gap", 1500, 0);
}

function cmpRender(slot) {
    const c = cmp.data[slot];
    if (!c) return;
    const s = cmp.sel[slot];

    $(s.pfp).attr("src", c.image);
    $(s.name).text(c.name);
    cmp.odo[slot].subs.update(c.subscriberCount);
    cmp.odo[slot].rpm.update(c.ratePerMinute);

    setTimeout(cmpRenderGap, 80)
}

function cmpRenderGap() {
    const a = cmp.data[0];
    const b = cmp.data[1];
    if (!a || !b) return;

    cmp.gapOdo.update(Math.abs(a.subscriberCount - b.subscriberCount));

    const leader = a.subscriberCount >= b.subscriberCount ? a.name : b.name;
    $(".compare_ratePerMinute.gap").next(".tts").text("subscriber gap (" + leader + " ahead)");
}

function cmpFetch(slot) {
    const id = cmp.ids[slot];
    if (id == null) return;

    $.getJSON(API + "?ids=" + id, function (e) {
        if (id !== cmp.ids[slot]) return;
        const c = e.channels && e.channels[0];
        if (!c) return;
        cmp.data[slot] = c;
        cmpRender(slot);
    });
}

function cmpUpdate() {
    if (tabs.compare.content.style.display === "none") return;
    cmpFetch(0);
    cmpFetch(1);
}

function cmpSelectChannel(slot, c) {
    cmp.ids[slot] = c.id;
    cmp.data[slot] = null;

    $(cmp.sel[slot].pfp).attr("src", c.image);
    $(cmp.sel[slot].name).text(c.name);

    cmpFetch(slot);
}

function cmpAttachSearch(input, slot) {
    const $in = $(input);
    $in.attr("autocomplete", "off");

    const $wrap = $("<div>").addClass("cmp-wrap");
    $in.wrap($wrap);
    const $res = $("<div>").addClass("search-results").hide();
    $in.parent().append($res);

    let list = [];
    let active = -1;

    function close() {
        $res.hide().empty();
        list = [];
        active = -1;
    }

    function setActive(i) {
        active = i;
        $res.children(".result").each(function (idx) {
            $(this).toggleClass("active", idx === i);
        });
    }

    function pick(c) {
        cmpSelectChannel(slot, c);
        $in.val("").blur();
        close();
    }

    function render(query) {
        const q = query.trim().toLowerCase();
        close();
        if (!q) return;

        list = allChannels
            .filter(c => (c.name || "").toLowerCase().includes(q))
            .sort((a, b) => {
                const aS = a.name.toLowerCase().startsWith(q) ? 0 : 1;
                const bS = b.name.toLowerCase().startsWith(q) ? 0 : 1;
                return aS - bS;
            })
            .slice(0, 8);

        if (list.length === 0) {
            $res.append($("<div>").addClass("result-empty").text("No channels found"));
        } else {
            list.forEach(function (c, i) {
                const $row = $("<div>").addClass("result")
                    .append($("<img>").attr("src", c.image).attr("alt", ""))
                    .append($("<span>").addClass("result-name").text(c.name))
                    .append($("<span>").addClass("result-subs").text(Number(c.subscriberCount).toLocaleString()))
                    .on("mousedown", function (ev) { ev.preventDefault(); pick(c); })
                    .on("mouseenter", function () { setActive(i); });
                $res.append($row);
            });
        }
        $res.show();
    }

    $in.on("input", function () { render($in.val()); });

    $in.on("keydown", function (ev) {
        if (ev.key === "ArrowDown" && list.length) {
            ev.preventDefault();
            setActive((active + 1) % list.length);
        } else if (ev.key === "ArrowUp" && list.length) {
            ev.preventDefault();
            setActive((active - 1 + list.length) % list.length);
        } else if (ev.key === "Enter" && list.length) {
            ev.preventDefault();
            pick(list[active >= 0 ? active : 0]);
        } else if (ev.key === "Escape") {
            close();
        }
    });

    $in.on("focus", function () { if ($in.val()) render($in.val()); });
    $in.on("blur", close);
}

let cmpLoaded = false;

function initCompare() {
    cmpLoaded = true;

    cmpInjectCss();
    cmpInitOdometers();

    cmp.inputs.forEach(function (input, i) {
        if (i < 2) cmpAttachSearch(input, i);
    });

    $.getJSON(API, function (data) {
        const list = Array.isArray(data) ? data : (data.channels || []);
        if (cmp.ids[1] == null) {
            const other = list
                .filter(c => c.id !== cmp.ids[0])
                .sort((a, b) => b.subscriberCount - a.subscriberCount)[0];
            if (other) cmpSelectChannel(1, other);
        }
    });

    cmpFetch(0);
    setInterval(cmpUpdate, 3000);
}

document.querySelector(".compare").addEventListener("click", function () {
    if (!cmpLoaded) {
        initCompare();
    } else {
        setTimeout(cmpUpdate, 0);
    }
});
