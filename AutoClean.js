// AutoClean.js — jsui + Live API
// Max for Live Audio Effect device
// Place on Master channel. Click checkboxes to configure, CLEAN to run.

autowatch = 1;

mgraphics.init();
mgraphics.relative_coords = 0;
mgraphics.autofill = 0;

inlets  = 1;
outlets = 0;

post("[AutoClean] loaded\n");

// ─── State ───────────────────────────────────────────────────────────────────

var opts = {
    deleteClips:          true,
    deleteEmptyClips:     true,
    deleteBypassed:       true,
    deleteMutedTracks:    false,
    deleteEmptyGroups:    false,
    deleteTracks:         true,
    recolorGroupChildren: true,
    recolorGroupClips:    true
};

var statusMsg = "Ready";
var hoverMsg  = "";
var isRunning = false;

// Device dimensions (fit Ableton device slot)
var W = 340;
var H = 168;

// ─── Geometry ────────────────────────────────────────────────────────────────

// Header height
var HDR_H = 24;

// Toggle switch dimensions
var TGL_W = 26;
var TGL_H = 14;

// Row spacing
var ROW_H = 18;

// Sections arranged in two columns (A: CLIPS + COLOR, B: TRACKS) + CLEAN right
var sections = [
    { x: 8,   y: 28,  w: 116, h: 50, label: "CLIPS" },
    { x: 8,   y: 82,  w: 116, h: 54, label: "COLOR" },
    { x: 130, y: 28,  w: 116, h: 108, label: "TRACKS" }
];

var cbs = [
    // Col A — CLIPS
    { x:16,  y:42,   w:TGL_W, h:TGL_H, key:"deleteClips",          label:"Muted clips",
      tip:"Deletes muted clips (Session + Arrangement) on every track." },
    { x:16,  y:60,   w:TGL_W, h:TGL_H, key:"deleteEmptyClips",     label:"Empty clips",
      tip:"Deletes 0-length clips and MIDI clips without notes." },
    // Col A — COLOR
    { x:16,  y:96,   w:TGL_W, h:TGL_H, key:"recolorGroupChildren", label:"Group children",
      tip:"Colors tracks inside a group with the group color." },
    { x:16,  y:116,  w:TGL_W, h:TGL_H, key:"recolorGroupClips",    label:"Clips in groups",
      tip:"Colors clips on grouped tracks with the group color." },
    // Col B — TRACKS (26px row spacing for two-line labels)
    { x:138, y:42,   w:TGL_W, h:TGL_H, key:"deleteBypassed",       label:"Bypassed",    label2:"plugins",
      tip:"Deletes off devices (skips ones with on/off automation)." },
    { x:138, y:68,   w:TGL_W, h:TGL_H, key:"deleteMutedTracks",    label:"Muted tracks",
      tip:"Deletes muted tracks. Group tracks are preserved." },
    { x:138, y:88,   w:TGL_W, h:TGL_H, key:"deleteEmptyGroups",    label:"Muted/empty", label2:"groups",
      tip:"Deletes muted groups and groups where all tracks are muted or empty." },
    { x:138, y:114,  w:TGL_W, h:TGL_H, key:"deleteTracks",         label:"Unused tracks",
      tip:"Deletes tracks with no clips and no incoming routing." }
];

var DEVICE_TIP =
    "AutoClean tidies up your Ableton session: removes muted/empty clips, bypassed plugins, " +
    "unused/muted tracks, and recolors tracks + clips inside groups. " +
    "Toggle the options, then press CLEAN. All changes can be undone with Cmd/Ctrl+Z.";

var ALL_TIP = "Toggle all cleanup options at once.";
var CLEAN_TIP = "Run every enabled cleanup phase. Undo with Cmd/Ctrl+Z.";

var allBox   = { x:300,  y:6,  w:TGL_W, h:TGL_H };
var btnRect  = { x:252, y:28, w:82, h:108, r:14 };
var STATUS_Y = 160;

// Button interaction states
var btnPressed = false;
var btnHover   = false;

// ─── Palette (Dark & Gold) ──────────────────────────────────────────────────

var PAL = {
    bg:         [0.118, 0.118, 0.118, 1.0],   // #1E1E1E
    panelBg:    [0.165, 0.165, 0.165, 1.0],   // #2A2A2A
    panelBord:  [0.220, 0.220, 0.220, 1.0],   // #383838
    textPrim:   [0.800, 0.800, 0.800, 1.0],   // #CCCCCC
    textSec:    [0.533, 0.533, 0.533, 1.0],   // #888888
    tglOff:     [0.250, 0.250, 0.250, 1.0],   // #404040
    tglKnob:    [0.700, 0.700, 0.700, 1.0],   // #B3B3B3
    accent:     [0.831, 0.686, 0.216, 1.0],   // #D4AF37 gold
    accentHi:   [0.920, 0.780, 0.340, 1.0],   // lighter gold (gradient top)
    accentDim:  [0.600, 0.480, 0.120, 1.0],   // darker gold (pressed)
    divider:    [0.831, 0.686, 0.216, 0.30]
};

// ─── Paint ───────────────────────────────────────────────────────────────────

function setColor(g, c) { g.set_source_rgba(c[0], c[1], c[2], c[3]); }

function paint() {
    var g = mgraphics;
    g.set_line_width(1.0);

    // Background
    setColor(g, PAL.bg);
    g.rectangle(0, 0, W, H);
    g.fill();

    // ── Header bar ──
    setColor(g, PAL.panelBg);
    g.rectangle(0, 0, W, HDR_H);
    g.fill();

    // Brand: "AUTOCLEAN"
    g.select_font_face("Arial Bold");
    g.set_font_size(12);
    setColor(g, PAL.accent);
    g.move_to(8, 16);
    g.text_path("AUTOCLEAN");
    g.fill();

    // "by Living Electronics"
    g.select_font_face("Arial");
    g.set_font_size(9);
    setColor(g, PAL.textSec);
    g.move_to(90, 16);
    g.text_path("by Living Electronics");
    g.fill();

    // "All" toggle in header (right side)
    setColor(g, PAL.textSec);
    g.select_font_face("Arial");
    g.set_font_size(9);
    g.move_to(allBox.x - 20, allBox.y + allBox.h - 2);
    g.text_path("All");
    g.fill();
    drawToggle(g, allBox.x, allBox.y, allBox.w, allBox.h, allSelected());

    // Gold separator line
    setColor(g, PAL.divider);
    g.rectangle(0, HDR_H, W, 1);
    g.fill();

    // ── Section panels ──
    for (var k = 0; k < sections.length; k++) {
        var sec = sections[k];
        // Panel background
        drawRoundedRect(g, sec.x, sec.y, sec.w, sec.h, 6);
        setColor(g, PAL.panelBg);
        g.fill();
        // Panel border
        drawRoundedRect(g, sec.x, sec.y, sec.w, sec.h, 6);
        setColor(g, PAL.panelBord);
        g.set_line_width(0.5);
        g.stroke();
        g.set_line_width(1.0);

        // Section label
        g.select_font_face("Arial Bold");
        g.set_font_size(9);
        setColor(g, PAL.accent);
        g.move_to(sec.x + 8, sec.y + 11);
        g.text_path(sec.label);
        g.fill();
    }

    // ── Toggle switches + labels ──
    for (var i = 0; i < cbs.length; i++) {
        var cb = cbs[i];
        drawToggle(g, cb.x, cb.y, cb.w, cb.h, !!opts[cb.key]);

        setColor(g, PAL.textPrim);
        g.select_font_face("Arial");
        g.set_font_size(10);
        g.move_to(cb.x + cb.w + 6, cb.y + cb.h - 2);
        g.show_text(cb.label);

        // Second line for long labels (same style)
        if (cb.label2) {
            g.move_to(cb.x + cb.w + 6, cb.y + cb.h + 9);
            g.show_text(cb.label2);
        }
    }

    // ── CLEAN button ──
    var bx = btnRect.x;
    var by = btnRect.y;
    var bw = btnRect.w;
    var bh = btnRect.h;
    var br = btnRect.r;

    if (btnPressed || isRunning) {
        // ── Pressed state: shift down 2px, darker gold, no shadow ──
        drawRoundedRect(g, bx, by + 2, bw, bh - 2, br);
        setColor(g, PAL.accentDim);
        g.fill();

        // Inset shadow at top edge
        drawRoundedRect(g, bx + 1, by + 3, bw - 2, bh - 4, br - 1);
        g.set_source_rgba(0, 0, 0, 0.25);
        g.stroke();

        // CLEAN text
        g.select_font_face("Arial Bold");
        g.set_font_size(18);
        setColor(g, PAL.bg);
        g.move_to(bx + 12, by + 2 + (bh - 2) / 2 + 7);
        g.show_text("CLEAN");

    } else if (btnHover) {
        // ── Hover state: lighter gold, stronger shadow ──
        drawRoundedRect(g, bx + 1, by + 3, bw, bh, br);
        g.set_source_rgba(0, 0, 0, 0.35);
        g.fill();

        drawRoundedRect(g, bx, by, bw, bh, br);
        setColor(g, PAL.accentHi);
        g.fill();

        // Highlight stroke
        drawRoundedRect(g, bx + 1, by + 1, bw - 2, bh - 2, br - 1);
        g.set_source_rgba(1, 1, 1, 0.2);
        g.stroke();

        drawRoundedRect(g, bx, by, bw, bh, br);
        g.set_source_rgba(0, 0, 0, 0.1);
        g.stroke();

        // CLEAN text
        g.select_font_face("Arial Bold");
        g.set_font_size(18);
        setColor(g, PAL.bg);
        g.move_to(bx + 12, by + bh / 2 + 7);
        g.show_text("CLEAN");

    } else {
        // ── Normal state: gold with drop shadow ──
        drawRoundedRect(g, bx + 1, by + 2, bw, bh, br);
        g.set_source_rgba(0, 0, 0, 0.3);
        g.fill();

        drawRoundedRect(g, bx, by, bw, bh, br);
        setColor(g, PAL.accent);
        g.fill();

        // Subtle highlight stroke
        drawRoundedRect(g, bx + 1, by + 1, bw - 2, bh - 2, br - 1);
        g.set_source_rgba(1, 1, 1, 0.12);
        g.stroke();

        drawRoundedRect(g, bx, by, bw, bh, br);
        g.set_source_rgba(0, 0, 0, 0.12);
        g.stroke();

        // CLEAN text
        g.select_font_face("Arial Bold");
        g.set_font_size(18);
        setColor(g, PAL.bg);
        g.move_to(bx + 12, by + bh / 2 + 7);
        g.show_text("CLEAN");
    }

    // ── Version ──
    g.select_font_face("Arial");
    g.set_font_size(8);
    setColor(g, PAL.textSec);
    g.move_to(bx + bw - 14, by + bh + 12);
    g.text_path("v2");
    g.fill();

    // ── Status / hover line ──
    setColor(g, hoverMsg ? PAL.textPrim : PAL.textSec);
    g.select_font_face("Arial");
    g.set_font_size(9);
    g.move_to(10, STATUS_Y);
    g.text_path(hoverMsg || statusMsg);
    g.fill();
}

function drawToggle(g, x, y, w, h, on) {
    var r = h / 2;
    // Track
    drawPill(g, x, y, w, h);
    setColor(g, on ? PAL.accent : PAL.tglOff);
    g.fill();

    // Knob
    var knobR = r - 2;
    var knobX = on ? (x + w - r) : (x + r);
    var knobY = y + r;
    g.arc(knobX, knobY, knobR, 0, Math.PI * 2);
    setColor(g, on ? [1, 1, 1, 0.95] : PAL.tglKnob);
    g.fill();
}

function drawPill(g, x, y, w, h) {
    var r = h / 2;
    g.arc(x + r, y + r, r, Math.PI * 0.5, Math.PI * 1.5);
    g.arc(x + w - r, y + r, r, Math.PI * 1.5, Math.PI * 0.5);
    g.close_path();
}

function drawRoundedRect(g, x, y, w, h, r) {
    g.move_to(x + r, y);
    g.line_to(x + w - r, y);
    g.curve_to(x + w, y, x + w, y, x + w, y + r);
    g.line_to(x + w, y + h - r);
    g.curve_to(x + w, y + h, x + w, y + h, x + w - r, y + h);
    g.line_to(x + r, y + h);
    g.curve_to(x, y + h, x, y + h, x, y + h - r);
    g.line_to(x, y + r);
    g.curve_to(x, y, x, y, x + r, y);
    g.close_path();
}

function allSelected() {
    for (var i = 0; i < cbs.length; i++) {
        if (!opts[cbs[i].key]) return false;
    }
    return true;
}

function setAll(v) {
    for (var i = 0; i < cbs.length; i++) opts[cbs[i].key] = v;
}

// ─── Hit testing ─────────────────────────────────────────────────────────────

function hitButton(x, y) {
    return x >= btnRect.x && x <= btnRect.x + btnRect.w &&
           y >= btnRect.y && y <= btnRect.y + btnRect.h;
}

function hitAllBox(x, y) {
    return x >= allBox.x - 24 && x <= allBox.x + allBox.w + 4 &&
           y >= allBox.y - 2  && y <= allBox.y + allBox.h + 4;
}

function hitCbIndex(x, y) {
    for (var i = 0; i < cbs.length; i++) {
        var cb = cbs[i];
        var rowH = cb.label2 ? cb.h + 12 : cb.h;
        if (x >= cb.x && x <= cb.x + 100 && y >= cb.y - 1 && y <= cb.y + rowH + 1) return i;
    }
    return -1;
}

// ─── Mouse clicks ────────────────────────────────────────────────────────────

function onclick(x, y, but, cmd, shift, capslock, option, ctrl) {
    if (isRunning) return;

    // Master "All" toggle
    if (hitAllBox(x, y)) {
        setAll(!allSelected());
        mgraphics.redraw();
        return;
    }

    // Individual toggles
    var ci = hitCbIndex(x, y);
    if (ci >= 0) {
        opts[cbs[ci].key] = !opts[cbs[ci].key];
        mgraphics.redraw();
        return;
    }

    // CLEAN button — only show pressed state, don't fire yet
    if (hitButton(x, y)) {
        btnPressed = true;
        mgraphics.redraw();
    }
}

// ondrag: track mouse while button held (update pressed visual if dragged off)
function ondrag(x, y, but, cmd, shift, capslock, option, ctrl) {
    if (!btnPressed) return;
    mgraphics.redraw();
}

// ─── Hover & mouse-up detection ──────────────────────────────────────────────

var lastHoverIdx = -99;

function hoverIndex(x, y) {
    if (hitAllBox(x, y)) return -10;
    if (hitButton(x, y)) return -20;
    var ci = hitCbIndex(x, y);
    if (ci >= 0) return ci;
    return -1;
}

function onidle(x, y) {
    // Detect mouse-up after button press: onidle fires when button is released
    if (btnPressed) {
        btnPressed = false;
        mgraphics.redraw();
        if (hitButton(x, y) && !isRunning) {
            post("[AutoClean] CLEAN pressed\n");
            try {
                runClean();
            } catch (e) {
                post("[AutoClean] ERROR: " + e.message + "\n");
                statusMsg = "Error — see Max console";
                isRunning = false;
                mgraphics.redraw();
            }
        }
        return;
    }

    // Normal hover tracking
    var newHover = hitButton(x, y);
    var idx = hoverIndex(x, y);

    if (idx !== lastHoverIdx || newHover !== btnHover) {
        lastHoverIdx = idx;
        btnHover = newHover;
        hoverMsg = (idx === -10) ? ALL_TIP
                 : (idx === -20) ? CLEAN_TIP
                 : (idx >= 0)    ? cbs[idx].tip
                 : "";
        mgraphics.redraw();
    }
}

function onidleout() {
    if (lastHoverIdx === -99 && !hoverMsg && !btnHover) return;
    lastHoverIdx = -99;
    btnHover = false;
    hoverMsg = "";
    mgraphics.redraw();
}

// Also handle 'bang' from inlet as fallback trigger
function bang() {
    if (!isRunning) {
        try { runClean(); }
        catch (e) { post("[AutoClean] ERROR: " + e.message + "\n"); isRunning = false; }
    }
}

// ─── Logging ─────────────────────────────────────────────────────────────────

function addLog(msg) {
    if (!msg || msg.length === 0) return;
    statusMsg = msg;
    post("[AutoClean] " + msg + "\n");
    mgraphics.redraw();
}

// ─── Main cleanup ─────────────────────────────────────────────────────────────

function runClean() {
    isRunning = true;
    mgraphics.redraw();

    addLog("Started...");

    var liveSet    = new LiveAPI("live_set");
    var trackCount = liveSet.getcount("tracks");

    if (trackCount === 0) {
        addLog("No tracks found.");
        isRunning = false;
        mgraphics.redraw();
        return;
    }

    addLog("Tracks: " + trackCount);
    addLog("");

    safePhase("clips",      opts.deleteClips,           function(){ deleteDisabledClips(liveSet, trackCount); });
    safePhase("empty",      opts.deleteEmptyClips,      function(){ deleteEmptyClips(liveSet, trackCount); });
    safePhase("bypassed",   opts.deleteBypassed,        function(){ deleteBypassedDevices(liveSet, trackCount); });
    safePhase("recolor",    opts.recolorGroupChildren,  function(){ recolorGroupChildren(liveSet, trackCount); });
    safePhase("clip-color", opts.recolorGroupClips,     function(){ recolorGroupClips(liveSet, trackCount); });
    // Re-query track count — previous phases may have changed it.
    safePhase("muted",      opts.deleteMutedTracks,     function(){ deleteMutedTracks(liveSet, parseInt(liveSet.getcount("tracks"))); });
    safePhase("emptygrp",   opts.deleteEmptyGroups,     function(){ deleteEmptyOrMutedGroups(liveSet, parseInt(liveSet.getcount("tracks"))); });
    safePhase("tracks",     opts.deleteTracks,          function(){ deleteUnusedTracks(liveSet, parseInt(liveSet.getcount("tracks"))); });

    addLog("Done.");
    isRunning = false;
    mgraphics.redraw();
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInt(api, prop) {
    var v = api.get(prop);
    return (v === null || v === undefined) ? 0 : parseInt(v);
}

function getStr(api, prop) {
    var v = api.get(prop);
    return (v === null || v === undefined) ? "" : String(v);
}

function isNormalTrack(track) {
    return getInt(track, "has_audio_input") === 1 || getInt(track, "has_midi_input") === 1;
}

function safePhase(name, enabled, fn) {
    if (!enabled) return;
    try { fn(); }
    catch (e) {
        post("[AutoClean] phase '" + name + "' failed: " + e.message + "\n");
        addLog("Phase " + name + " skipped (error)");
    }
}

// ─── Phase 1: Delete muted clips ─────────────────────────────────────────────

function deleteDisabledClips(liveSet, trackCount) {
    addLog("[Clips] Scanning...");
    var deleted = 0;

    for (var t = 0; t < trackCount; t++) {
        var track = new LiveAPI("live_set tracks " + t);
        if (!isNormalTrack(track)) continue;

        var slotCount = track.getcount("clip_slots");
        for (var s = 0; s < slotCount; s++) {
            var slot = new LiveAPI("live_set tracks " + t + " clip_slots " + s);
            if (getInt(slot, "has_clip") === 1) {
                var clip = new LiveAPI("live_set tracks " + t + " clip_slots " + s + " clip");
                if (getInt(clip, "muted") === 1) {
                    try { slot.call("delete_clip"); deleted++; } catch(e) {}
                }
            }
        }

        // Arrangement clips (iterate reverse — deletions shift indices)
        var arrCount = track.getcount("arrangement_clips");
        for (var a = arrCount - 1; a >= 0; a--) {
            var ac = new LiveAPI("live_set tracks " + t + " arrangement_clips " + a);
            if (!ac || parseInt(ac.id) === 0) continue;
            if (getInt(ac, "muted") === 1) {
                var acId = parseInt(ac.id);
                try { track.call("delete_clip", "id", acId); deleted++; } catch(e) {}
            }
        }
    }

    addLog("Muted clips: " + deleted + " deleted");
}

// ─── Phase 2: Delete bypassed devices ────────────────────────────────────────

function deleteBypassedDevices(liveSet, trackCount) {
    addLog("Bypassed: scanning");
    var deleted = 0;

    // Regular tracks
    for (var t = 0; t < trackCount; t++) {
        deleted += scanTrackForBypassed("live_set tracks " + t, t);
    }
    // Return tracks
    var retCount = parseInt(liveSet.getcount("return_tracks"));
    for (var r = 0; r < retCount; r++) {
        deleted += scanTrackForBypassed("live_set return_tracks " + r, -1);
    }
    // Master track
    deleted += scanTrackForBypassed("live_set master_track", -1);

    addLog("Bypassed: " + deleted + " deleted");
}

function scanTrackForBypassed(trackPath, tIndex) {
    var removed = 0;
    var track = new LiveAPI(trackPath);
    if (!track || parseInt(track.id) === 0) return 0;

    var devCount = track.getcount("devices");
    for (var d = devCount - 1; d >= 0; d--) {
        try {
            var dev = new LiveAPI(trackPath + " devices " + d);
            if (getInt(dev, "is_active") !== 0) continue;
            // Skip our own AutoClean device — never delete self
            var devName = getStr(dev, "name");
            if (devName && devName.indexOf("AutoClean") >= 0) continue;
            if (hasOnOffAutomationPath(track, trackPath, d)) continue;
            track.call("delete_device", d);
            removed++;
        } catch (e) { /* skip */ }
    }
    return removed;
}

function hasOnOffAutomationPath(track, trackPath, d) {
    var param = new LiveAPI(trackPath + " devices " + d + " parameters 0");
    if (!param || parseInt(param.id) === 0) return false;
    var paramId = parseInt(param.id);

    var slotCount = track.getcount("clip_slots");
    for (var s = 0; s < slotCount; s++) {
        var slot = new LiveAPI(trackPath + " clip_slots " + s);
        if (getInt(slot, "has_clip") === 1) {
            var clip = new LiveAPI(trackPath + " clip_slots " + s + " clip");
            var res  = clip.call("get_automation_envelope", paramId);
            if (res && res.length > 0 && parseInt(res[0]) !== 0) return true;
        }
    }
    var arrCount = track.getcount("arrangement_clips");
    for (var a = 0; a < arrCount; a++) {
        var ac   = new LiveAPI(trackPath + " arrangement_clips " + a);
        var res2 = ac.call("get_automation_envelope", paramId);
        if (res2 && res2.length > 0 && parseInt(res2[0]) !== 0) return true;
    }
    return false;
}

function hasOnOffAutomation(track, t, d) {
    var param = new LiveAPI("live_set tracks " + t + " devices " + d + " parameters 0");
    if (!param || parseInt(param.id) === 0) return false;
    var paramId = parseInt(param.id);

    // Check session clips
    var slotCount = track.getcount("clip_slots");
    for (var s = 0; s < slotCount; s++) {
        var slot = new LiveAPI("live_set tracks " + t + " clip_slots " + s);
        if (getInt(slot, "has_clip") === 1) {
            var clip = new LiveAPI("live_set tracks " + t + " clip_slots " + s + " clip");
            var res  = clip.call("get_automation_envelope", paramId);
            if (res && res.length > 0 && parseInt(res[0]) !== 0) return true;
        }
    }

    // Check arrangement clips
    var arrCount = track.getcount("arrangement_clips");
    for (var a = 0; a < arrCount; a++) {
        var ac   = new LiveAPI("live_set tracks " + t + " arrangement_clips " + a);
        var res2 = ac.call("get_automation_envelope", paramId);
        if (res2 && res2.length > 0 && parseInt(res2[0]) !== 0) return true;
    }

    return false;
}

// ─── Phase 3: Delete unused tracks ───────────────────────────────────────────

function deleteMutedTracks(liveSet, trackCount) {
    addLog("Muted tracks: scanning");
    var deleted = 0;

    for (var t = trackCount - 1; t >= 0; t--) {
        try {
            var track = new LiveAPI("live_set tracks " + t);
            if (!isNormalTrack(track)) continue;
            if (getInt(track, "is_foldable") === 1) continue;
            if (getInt(track, "mute") !== 1) continue;
            liveSet.call("delete_track", t);
            deleted++;
        } catch (e) { /* skip */ }
    }

    addLog("Muted tracks: " + deleted + " deleted");
}

function deleteUnusedTracks(liveSet, trackCount) {
    addLog("Unused tracks: scanning");
    var deleted = 0;

    // Build set of routing targets (names that other tracks output to)
    var routingTargets = collectRoutingTargets(liveSet, trackCount);

    for (var t = trackCount - 1; t >= 0; t--) {
        try {
            var track = new LiveAPI("live_set tracks " + t);
            if (!isNormalTrack(track)) continue;
            if (getInt(track, "is_foldable") === 1) continue;

            if (trackHasClips(track, t)) continue;

            var name = getStr(track, "name");
            if (routingTargets[name]) continue; // something routes into this track

            liveSet.call("delete_track", t);
            deleted++;
        } catch (e) { /* skip */ }
    }

    addLog("Unused tracks: " + deleted + " deleted");
}

function trackHasClips(track, t) {
    var slotCount = track.getcount("clip_slots");
    for (var s = 0; s < slotCount; s++) {
        var slot = new LiveAPI("live_set tracks " + t + " clip_slots " + s);
        if (getInt(slot, "has_clip") === 1) return true;
    }
    if (track.getcount("arrangement_clips") > 0) return true;
    return false;
}

function collectRoutingTargets(liveSet, trackCount) {
    var targets = {};

    var record = function(api) {
        try {
            var ort = api.get("output_routing_type");
            if (!ort) return;
            var s = (typeof ort === "string") ? ort : JSON.stringify(ort);
            // Extract display_name values from the routing type dict.
            var re = /"display_name"\s*:\s*"([^"]+)"/g;
            var m;
            while ((m = re.exec(s)) !== null) {
                targets[m[1]] = true;
            }
        } catch (e) { /* ignore */ }
    };

    for (var t = 0; t < trackCount; t++) {
        record(new LiveAPI("live_set tracks " + t));
    }
    var retCount = parseInt(liveSet.getcount("return_tracks"));
    for (var r = 0; r < retCount; r++) {
        record(new LiveAPI("live_set return_tracks " + r));
    }
    return targets;
}

// ─── Phase 4: Delete empty clips ─────────────────────────────────────────────

function deleteEmptyClips(liveSet, trackCount) {
    addLog("Empty clips: scanning");
    var deleted = 0;

    for (var t = 0; t < trackCount; t++) {
        var track = new LiveAPI("live_set tracks " + t);
        if (!isNormalTrack(track)) continue;

        var slotCount = track.getcount("clip_slots");
        for (var s = 0; s < slotCount; s++) {
            var slot = new LiveAPI("live_set tracks " + t + " clip_slots " + s);
            if (getInt(slot, "has_clip") !== 1) continue;

            var clip = new LiveAPI("live_set tracks " + t + " clip_slots " + s + " clip");
            try {
                if (clipIsEmpty(clip)) {
                    slot.call("delete_clip");
                    deleted++;
                }
            } catch (e) { /* skip this clip */ }
        }

        // Arrangement clips
        var arrCount = track.getcount("arrangement_clips");
        for (var a = arrCount - 1; a >= 0; a--) {
            var ac = new LiveAPI("live_set tracks " + t + " arrangement_clips " + a);
            if (!ac || parseInt(ac.id) === 0) continue;
            try {
                if (clipIsEmpty(ac)) {
                    var acId = parseInt(ac.id);
                    track.call("delete_clip", "id", acId);
                    deleted++;
                }
            } catch (e) { /* skip */ }
        }
    }

    addLog("Empty clips: " + deleted + " deleted");
}

function clipIsEmpty(clip) {
    var len = parseFloat(clip.get("length"));
    if (isNaN(len) || len <= 0) return true;

    var isMidi = getInt(clip, "is_midi_clip") === 1;
    if (isMidi) {
        try {
            var notes = clip.call("get_notes_extended", 0, 128, 0, len);
            if (notes === null || notes === undefined) return false;
            var s = (typeof notes === "string") ? notes : String(notes);
            // Empty if notes array is empty OR no pitch entries exist.
            if (/"notes"\s*:\s*\[\s*\]/.test(s)) return true;
            if (s.indexOf("\"pitch\"") < 0) return true;
            return false;
        } catch (e) { return false; }
    }
    return false;
}

// ─── Phase: Delete muted / empty groups ─────────────────────────────────

function deleteEmptyOrMutedGroups(liveSet, trackCount) {
    addLog("Groups: scanning");
    var deleted = 0;

    // Iterate reverse — deleting a group removes its children too, shifting indices.
    for (var t = trackCount - 1; t >= 0; t--) {
        try {
            var track = new LiveAPI("live_set tracks " + t);
            if (getInt(track, "is_foldable") !== 1) continue;

            // Case 1: group itself is muted
            if (getInt(track, "mute") === 1) {
                liveSet.call("delete_track", t);
                deleted++;
                continue;
            }

            // Case 2: all children inside the group are muted or empty
            if (groupChildrenAllEmpty(liveSet, t)) {
                liveSet.call("delete_track", t);
                deleted++;
            }
        } catch (e) { /* skip */ }
    }

    addLog("Groups: " + deleted + " deleted");
}

function groupChildrenAllEmpty(liveSet, groupIndex) {
    var groupTrack = new LiveAPI("live_set tracks " + groupIndex);
    var groupId    = parseInt(groupTrack.id);
    var trackCount = parseInt(liveSet.getcount("tracks"));

    // Collect all tracks that belong to this group (any nesting depth).
    // A track belongs to this group if walking up the group_track chain
    // eventually reaches groupId.
    var leafTracks = [];

    for (var t = groupIndex + 1; t < trackCount; t++) {
        var child = new LiveAPI("live_set tracks " + t);

        if (!isDescendantOf(child, groupId)) break;

        // Only inspect leaf tracks (not sub-group headers).
        if (getInt(child, "is_foldable") === 1) continue;

        leafTracks.push(t);
    }

    // Safety: don't delete groups with no detected children.
    if (leafTracks.length === 0) return false;

    for (var i = 0; i < leafTracks.length; i++) {
        var idx = leafTracks[i];
        var leaf = new LiveAPI("live_set tracks " + idx);

        // Muted tracks count as "empty".
        if (getInt(leaf, "mute") === 1) continue;

        // Any clips → group is NOT empty.
        if (trackHasClips(leaf, idx)) return false;
    }

    return true;
}

// Walk up the group_track chain to check if a track is inside the given group.
function isDescendantOf(track, ancestorId) {
    var seen = {};
    var current = track;
    for (var depth = 0; depth < 20; depth++) {
        var pid = parseGroupId(current.get("group_track"));
        if (!pid || pid === 0) return false;
        if (pid === ancestorId) return true;
        if (seen[pid]) return false;  // cycle guard
        seen[pid] = true;
        current = new LiveAPI("id " + pid);
        if (!current || parseInt(current.id) === 0) return false;
    }
    return false;
}

// ─── Phase: Recolor ──────────────────────────────────────────────────────────

function recolorGroupClips(liveSet, trackCount) {
    addLog("Clip color: scanning");
    var recolored = 0;

    for (var t = 0; t < trackCount; t++) {
        try {
            var track = new LiveAPI("live_set tracks " + t);
            if (getInt(track, "is_foldable") === 1) continue;

            var groupId = parseGroupId(track.get("group_track"));
            if (!groupId) continue;

            var parent = new LiveAPI("id " + groupId);
            if (!parent || parseInt(parent.id) === 0) continue;
            var parentColor = parseInt(parent.get("color"));
            if (isNaN(parentColor)) continue;

            var slotCount = track.getcount("clip_slots");
            for (var s = 0; s < slotCount; s++) {
                var slot = new LiveAPI("live_set tracks " + t + " clip_slots " + s);
                if (getInt(slot, "has_clip") !== 1) continue;
                var clip = new LiveAPI("live_set tracks " + t + " clip_slots " + s + " clip");
                try { clip.set("color", parentColor); recolored++; } catch (e) {}
            }

            var arrCount = track.getcount("arrangement_clips");
            for (var a = 0; a < arrCount; a++) {
                var ac = new LiveAPI("live_set tracks " + t + " arrangement_clips " + a);
                if (!ac || parseInt(ac.id) === 0) continue;
                try { ac.set("color", parentColor); recolored++; } catch (e) {}
            }
        } catch (e) { /* skip */ }
    }

    addLog("Clip color: " + recolored + " clips");
}

function parseGroupId(raw) {
    if (!raw) return 0;
    if (typeof raw === "object" && raw.length >= 2) return parseInt(raw[1]);
    var n = parseInt(raw);
    return isNaN(n) ? 0 : n;
}

function recolorGroupChildren(liveSet, trackCount) {
    addLog("Recolor: scanning");
    var recolored = 0;

    for (var t = 0; t < trackCount; t++) {
        try {
            var track = new LiveAPI("live_set tracks " + t);
            if (getInt(track, "is_foldable") === 1) continue;

            var groupIdVal = track.get("group_track");
            var groupId = 0;
            if (groupIdVal) {
                if (typeof groupIdVal === "object" && groupIdVal.length >= 2) {
                    groupId = parseInt(groupIdVal[1]);
                } else {
                    groupId = parseInt(groupIdVal);
                }
            }
            if (!groupId || isNaN(groupId) || groupId === 0) continue;

            var parent = new LiveAPI("id " + groupId);
            if (!parent || parseInt(parent.id) === 0) continue;

            var parentColor = parseInt(parent.get("color"));
            var myColor     = parseInt(track.get("color"));
            if (isNaN(parentColor) || parentColor === myColor) continue;

            track.set("color", parentColor);
            recolored++;
        } catch (e) { /* skip this track */ }
    }

    addLog("Recolor: " + recolored + " tracks");
}
