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

// Sections arranged in two columns (A: CLIPS + COLOR, B: TRACKS) + CLEAN right
var sections = [
    { x: 10,  y: 34,  label: "CLIPS" },
    { x: 10,  y: 92,  label: "COLOR" },
    { x: 130, y: 34,  label: "TRACKS" }
];

var cbs = [
    // Col A — CLIPS
    { x:12,  y:50,  w:10, h:10, key:"deleteClips",          label:"Muted clips",
      tip:"Deletes muted clips (Session + Arrangement) on every track." },
    { x:12,  y:66,  w:10, h:10, key:"deleteEmptyClips",     label:"Empty clips",
      tip:"Deletes 0-length clips and MIDI clips without notes." },
    // Col A — COLOR
    { x:12,  y:108, w:10, h:10, key:"recolorGroupChildren", label:"Group children",
      tip:"Colors tracks inside a group with the group color." },
    { x:12,  y:124, w:10, h:10, key:"recolorGroupClips",    label:"Clips in groups",
      tip:"Colors clips on grouped tracks with the group color." },
    // Col B — TRACKS
    { x:132, y:50,  w:10, h:10, key:"deleteBypassed",       label:"Bypassed plugins",
      tip:"Deletes off devices (skips ones with on/off automation)." },
    { x:132, y:66,  w:10, h:10, key:"deleteMutedTracks",    label:"Muted tracks",
      tip:"Deletes muted tracks. Group tracks are preserved." },
    { x:132, y:82,  w:10, h:10, key:"deleteEmptyGroups",    label:"Muted/empty groups",
      tip:"Deletes muted groups and groups where all tracks are muted or empty." },
    { x:132, y:98,  w:10, h:10, key:"deleteTracks",         label:"Unused tracks",
      tip:"Deletes tracks with no clips and no incoming routing." }
];

var DEVICE_TIP =
    "AutoClean tidies up your Ableton session: removes muted/empty clips, bypassed plugins, " +
    "unused/muted tracks, and recolors tracks + clips inside groups. " +
    "Toggle the options, then press CLEAN. All changes can be undone with Cmd/Ctrl+Z.";

var ALL_TIP = "Toggle all cleanup options at once.";
var CLEAN_TIP = "Run every enabled cleanup phase. Undo with Cmd/Ctrl+Z.";

var allBox   = { x:12,  y:12,  w:10, h:10 };
var btnRect  = { x:242, y:48,  w:88, h:88, r:12 };
var STATUS_Y = 156;

// ─── Palette (Living Electronics cream + gold) ──────────────────────────────

var PAL = {
    bg:         [1.000, 0.996, 0.976, 1.0],   // #FFFEF9
    textPrim:   [0.102, 0.102, 0.102, 1.0],   // #1A1A1A
    textSec:    [0.290, 0.290, 0.290, 1.0],   // #4A4A4A
    boxBg:      [0.980, 0.972, 0.945, 1.0],
    boxBorder:  [0.500, 0.500, 0.500, 1.0],
    accent:     [0.831, 0.686, 0.216, 1.0],   // #D4AF37 gold
    accentDim:  [0.650, 0.520, 0.140, 1.0],
    divider:    [0.831, 0.686, 0.216, 0.45]
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

    // Master "All" toggle (top-left)
    drawCheckbox(g, allBox.x, allBox.y, allBox.w, allBox.h, allSelected());
    setColor(g, PAL.textSec);
    g.select_font_face("Arial");
    g.set_font_size(10);
    g.move_to(allBox.x + allBox.w + 6, allBox.y + allBox.h);
    g.text_path("Select all");
    g.fill();

    // Section headers (gold, uppercase, with underline bar)
    g.select_font_face("Arial Bold");
    g.set_font_size(9);
    for (var k = 0; k < sections.length; k++) {
        var sec = sections[k];
        setColor(g, PAL.accent);
        g.move_to(sec.x, sec.y);
        g.text_path(sec.label);
        g.fill();
        setColor(g, PAL.divider);
        g.rectangle(sec.x, sec.y + 3, 100, 1);
        g.fill();
    }

    // Checkboxes + labels
    g.select_font_face("Arial");
    g.set_font_size(10);
    for (var i = 0; i < cbs.length; i++) {
        var cb = cbs[i];
        drawCheckbox(g, cb.x, cb.y, cb.w, cb.h, !!opts[cb.key]);

        setColor(g, PAL.textPrim);
        g.move_to(cb.x + cb.w + 6, cb.y + cb.h - 1);
        g.text_path(cb.label);
        g.fill();
    }

    // CLEAN button (rounded, gold)
    drawRoundedRect(g, btnRect.x, btnRect.y, btnRect.w, btnRect.h, btnRect.r);
    setColor(g, isRunning ? PAL.accentDim : PAL.accent);
    g.fill();

    // Subtle inner highlight
    drawRoundedRect(g, btnRect.x + 1, btnRect.y + 1, btnRect.w - 2, btnRect.h - 2, btnRect.r - 1);
    g.set_source_rgba(1, 1, 1, 0.25);
    g.stroke();

    // CLEAN label — dark text on gold
    setColor(g, PAL.textPrim);
    g.select_font_face("Arial Bold");
    g.set_font_size(18);
    g.move_to(btnRect.x + 15, btnRect.y + btnRect.h / 2 + 6);
    g.text_path("CLEAN");
    g.fill();

    // Status / hover line (hover tip takes priority while idle)
    setColor(g, hoverMsg ? PAL.textPrim : PAL.textSec);
    g.select_font_face("Arial");
    g.set_font_size(9);
    g.move_to(10, STATUS_Y);
    g.text_path(hoverMsg || statusMsg);
    g.fill();
}

function drawCheckbox(g, x, y, w, h, checked) {
    setColor(g, PAL.boxBg);
    g.rectangle(x, y, w, h);
    g.fill();
    setColor(g, checked ? PAL.accent : PAL.boxBorder);
    g.rectangle(x, y, w, h);
    g.stroke();
    if (checked) {
        setColor(g, PAL.accent);
        g.rectangle(x + 2, y + 2, w - 4, h - 4);
        g.fill();
    }
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

// ─── Mouse clicks ────────────────────────────────────────────────────────────

function onclick(x, y, but, cmd, shift, capslock, option, ctrl) {
    if (isRunning) return;

    // Master "All" toggle
    if (x >= allBox.x && x <= allBox.x + 80 &&
        y >= allBox.y - 2 && y <= allBox.y + allBox.h + 2) {
        setAll(!allSelected());
        mgraphics.redraw();
        return;
    }

    // Individual checkboxes (row hit: from checkbox to ~110px right)
    for (var i = 0; i < cbs.length; i++) {
        var cb = cbs[i];
        if (x >= cb.x && x <= cb.x + 110 && y >= cb.y - 1 && y <= cb.y + cb.h + 1) {
            opts[cb.key] = !opts[cb.key];
            mgraphics.redraw();
            return;
        }
    }

    if (x >= btnRect.x && x <= btnRect.x + btnRect.w &&
        y >= btnRect.y && y <= btnRect.y + btnRect.h) {
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
}

// ─── Hover → Ableton info box ────────────────────────────────────────────────

var lastHoverIdx = -99;

function hoverIndex(x, y) {
    if (x >= allBox.x && x <= allBox.x + 80 &&
        y >= allBox.y - 2 && y <= allBox.y + allBox.h + 2) return -10;
    if (x >= btnRect.x && x <= btnRect.x + btnRect.w &&
        y >= btnRect.y && y <= btnRect.y + btnRect.h) return -20;
    for (var i = 0; i < cbs.length; i++) {
        var cb = cbs[i];
        if (x >= cb.x && x <= cb.x + 110 && y >= cb.y - 1 && y <= cb.y + cb.h + 1) return i;
    }
    return -1;
}

function onidle(x, y) {
    var idx = hoverIndex(x, y);
    if (idx === lastHoverIdx) return;
    lastHoverIdx = idx;
    hoverMsg = (idx === -10) ? ALL_TIP
             : (idx === -20) ? CLEAN_TIP
             : (idx >= 0)    ? cbs[idx].tip
             : "";
    mgraphics.redraw();
}

function onidleout() {
    if (lastHoverIdx === -99 && !hoverMsg) return;
    lastHoverIdx = -99;
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
