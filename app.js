(function () {
  "use strict";

  var FT_TO_M = 0.3048;
  var IN_TO_CM = 2.54;
  var CUFT_TO_CUM = 0.0283168;
  var CUYD_TO_CUM = 0.764555;
  var TON_TO_TONNE = 0.907185;

  var isMetric = false;

  var lengthInputs = ["s1Length", "s1Width", "s1Diam", "s3Length", "s3Width"];
  var thicknessInputs = ["s1Depth", "s2Diam", "s2Depth", "s3Depth"];

  var labelMap = [
    { selector: "#s1LengthWrap label .unit-len", imperial: "Length (ft)", metric: "Length (m)" },
    { selector: "#s1WidthWrap label .unit-len", imperial: "Width (ft)", metric: "Width (m)" },
    { selector: "#s1DiamWrap label .unit-len", imperial: "Diameter (ft)", metric: "Diameter (m)" },
    { id: "s1Depth", imperial: "Depth / Thickness (in)", metric: "Depth / Thickness (cm)" },
    { id: "s2Diam", imperial: "Hole Diameter (in)", metric: "Hole Diameter (cm)" },
    { id: "s2Depth", imperial: "Excavation Depth (in)", metric: "Excavation Depth (cm)" },
    { id: "s3Length", imperial: "Total Run Length (ft)", metric: "Total Run Length (m)" },
    { id: "s3Width", imperial: "Trench Width (ft)", metric: "Trench Width (m)" },
    { id: "s3Depth", imperial: "Layer Thickness (in)", metric: "Layer Thickness (cm)" }
  ];

  var ROUTE_FENCE = "/concrete-fence-post-calculator";

  // Metadata and SEO content for this route are now injected server-side by
  // _worker.js. This client-side hook only needs to default the tool to the
  // Post Holes tab so the UI matches the page the user landed on.
  function initRouting() {
    if (window.location.pathname === ROUTE_FENCE) {
      var tab2 = document.getElementById("tabBtn2");
      if (tab2) tab2.click();
    }
  }

  function $(id) { return document.getElementById(id); }
  function num(id) {
    var el = $(id);
    if (!el) return 0;
    var v = parseFloat(el.value);
    return isNaN(v) || v < 0 ? 0 : v;
  }

  function bagYieldCuFt(size) {
    if (size === "80") return 0.60;
    if (size === "60") return 0.45;
    return 0.30;
  }

  function fmt(n, places) {
    if (!isFinite(n)) return "0";
    return n.toFixed(places === undefined ? 2 : places);
  }

  function updateUnitLabels() {
    labelMap.forEach(function (entry) {
      var el = entry.id ? $(entry.id) : null;
      var labelEl = null;
      if (el) {
        var wrap = el.closest(".field");
        labelEl = wrap ? wrap.querySelector("label") : null;
        if (labelEl) labelEl.textContent = isMetric ? entry.metric : entry.imperial;
      } else if (entry.selector) {
        var span = document.querySelector(entry.selector);
        if (span) span.textContent = isMetric ? entry.metric : entry.imperial;
      }
    });

    document.querySelectorAll(".unit-vol3").forEach(function (el) {
      el.textContent = isMetric ? "m\u00B3" : "cu ft";
    });
    document.querySelectorAll(".unit-vol3y").forEach(function (el) {
      el.textContent = isMetric ? "m\u00B3" : "cu yd";
    });

    $("s1YdOut").closest(".results__row").style.display = isMetric ? "none" : "flex";
    $("s2YdOut").closest(".results__row").style.display = isMetric ? "none" : "flex";
  }

  function convertFieldValues(toMetric) {
    lengthInputs.forEach(function (id) {
      var el = $(id);
      if (!el || el.value === "") return;
      var v = parseFloat(el.value);
      if (isNaN(v)) return;
      el.value = toMetric ? round4(v * FT_TO_M) : round4(v / FT_TO_M);
    });
    thicknessInputs.forEach(function (id) {
      var el = $(id);
      if (!el || el.value === "") return;
      var v = parseFloat(el.value);
      if (isNaN(v)) return;
      el.value = toMetric ? round4(v * IN_TO_CM) : round4(v / IN_TO_CM);
    });
  }

  function round4(n) {
    return Math.round(n * 10000) / 10000;
  }

  function toFeet(v) { return isMetric ? v / FT_TO_M : v; }
  function toInches(v) { return isMetric ? v / IN_TO_CM : v; }

  function calcSlab() {
    var shape = $("s1Shape").value;
    var depthIn = toInches(num("s1Depth"));
    var volCuFt;

    if (shape === "rect") {
      var length = toFeet(num("s1Length"));
      var width = toFeet(num("s1Width"));
      volCuFt = length * width * (depthIn / 12);
    } else {
      var diam = toFeet(num("s1Diam"));
      var radius = diam / 2;
      volCuFt = Math.PI * radius * radius * (depthIn / 12);
    }

    var volWithWaste = volCuFt * 1.10;
    var cuYd = volWithWaste / 27;
    var bagSize = $("s1Bag").value;
    var bags = Math.ceil(volWithWaste / bagYieldCuFt(bagSize));
    if (volWithWaste <= 0) bags = 0;

    var displayVol = isMetric ? volWithWaste * CUFT_TO_CUM : volWithWaste;
    $("s1VolOut").firstChild.textContent = fmt(displayVol, isMetric ? 3 : 2) + " ";
    $("s1YdOut").firstChild.textContent = fmt(cuYd, 2) + " ";
    $("s1BagsOut").textContent = bags;
  }

  function calcFence() {
    var holes = Math.max(0, Math.round(num("s2Count")));
    var diamIn = toInches(num("s2Diam"));
    var depthIn = toInches(num("s2Depth"));
    var radiusFt = (diamIn / 2) / 12;
    var depthFt = depthIn / 12;

    var cylinderVol = Math.PI * radiusFt * radiusFt * depthFt * holes;

    var postType = $("s2Post").value;
    var sideIn = 0;
    if (postType === "4x4") sideIn = 3.5;
    if (postType === "6x6") sideIn = 5.5;

    var volSaved = (sideIn / 12) * (sideIn / 12) * depthFt * holes;

    var netVol = cylinderVol - volSaved;
    if (netVol < 0) netVol = 0;

    var netWithWaste = netVol * 1.10;
    var cuYd = netWithWaste / 27;
    var bagSize = $("s2Bag").value;
    var bags = Math.ceil(netWithWaste / bagYieldCuFt(bagSize));
    if (netWithWaste <= 0) bags = 0;

    var displayVol = isMetric ? netWithWaste * CUFT_TO_CUM : netWithWaste;
    $("s2VolOut").firstChild.textContent = fmt(displayVol, isMetric ? 3 : 2) + " ";
    $("s2YdOut").firstChild.textContent = fmt(cuYd, 2) + " ";
    $("s2BagsOut").textContent = bags;
  }

  function calcTrench() {
    var length = toFeet(num("s3Length"));
    var width = toFeet(num("s3Width"));
    var depthIn = toInches(num("s3Depth"));

    var volCuFt = length * width * (depthIn / 12);
    var volWithMargin = volCuFt * 1.10;
    var cuYd = volWithMargin / 27;

    var material = $("s3Material").value;
    var multiplier = 1.4;
    if (material === "sand") multiplier = 1.3;
    if (material === "dirt") multiplier = 1.2;

    var tons = cuYd * multiplier;

    var displayVol = isMetric ? volWithMargin * CUFT_TO_CUM : cuYd;
    $("s3VolOut").firstChild.textContent = fmt(displayVol, isMetric ? 3 : 2) + " ";
    document.querySelector("#s3VolOut .unit-vol3y").textContent = isMetric ? "m\u00B3" : "cu yd";

    var displayTons = isMetric ? tons * TON_TO_TONNE : tons;
    $("s3TonOut").firstChild.textContent = fmt(displayTons, 2) + " ";
    $("s3TonUnit").textContent = isMetric ? "tonnes" : "tons";
  }

  function calcAll() {
    calcSlab();
    calcFence();
    calcTrench();
  }

  function setupTabs() {
    var btns = [$("tabBtn1"), $("tabBtn2"), $("tabBtn3")];
    var panels = [$("panel1"), $("panel2"), $("panel3")];
    btns.forEach(function (btn, idx) {
      btn.addEventListener("click", function () {
        btns.forEach(function (b, i) {
          b.classList.toggle("is-active", i === idx);
          b.setAttribute("aria-selected", i === idx ? "true" : "false");
        });
        panels.forEach(function (p, i) {
          p.classList.toggle("is-active", i === idx);
          p.hidden = i !== idx;
        });
      });
    });
  }

  function setupShapeToggle() {
    var shapeSelect = $("s1Shape");
    shapeSelect.addEventListener("change", function () {
      var isRect = shapeSelect.value === "rect";
      $("s1LengthWrap").hidden = !isRect;
      $("s1WidthWrap").hidden = !isRect;
      $("s1DiamWrap").hidden = isRect;
      calcAll();
    });
  }

  function setupUnitToggle() {
    var sw = $("unitSwitch");
    sw.addEventListener("click", function () {
      isMetric = !isMetric;
      sw.setAttribute("aria-checked", isMetric ? "true" : "false");
      $("unitLabelImperial").classList.toggle("is-active", !isMetric);
      $("unitLabelMetric").classList.toggle("is-active", isMetric);
      convertFieldValues(isMetric);
      updateUnitLabels();
      calcAll();
    });
  }

  function setupLiveListeners() {
    var allInputs = document.querySelectorAll(".panel input, .panel select");
    allInputs.forEach(function (el) {
      el.addEventListener("input", calcAll);
      el.addEventListener("change", calcAll);
    });
  }

  function init() {
    setupTabs();
    setupShapeToggle();
    setupUnitToggle();
    setupLiveListeners();
    updateUnitLabels();
    calcAll();
    initRouting();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
