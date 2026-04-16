{
	"patcher" : 	{
		"fileversion" : 1,
		"appversion" : 		{
			"major" : 9,
			"minor" : 0,
			"revision" : 10,
			"architecture" : "x64",
			"modernui" : 1
		}
,
		"classnamespace" : "box",
		"rect" : [ 1412.0, 353.0, 340.0, 168.0 ],
		"openinpresentation" : 1,
		"gridsize" : [ 8.0, 8.0 ],
		"devicewidth" : 340.0,
		"boxes" : [ 			{
				"box" : 				{
					"annotation" : "AutoClean tidies up your Ableton session: removes muted/empty clips, bypassed plugins, unused/muted tracks, and recolors tracks + clips inside groups. Toggle the options, then press CLEAN. All changes can be undone with Cmd/Ctrl+Z.",
					"filename" : "AutoClean.js",
					"hint" : "AutoClean",
					"id" : "obj-jsui",
					"maxclass" : "jsui",
					"numinlets" : 1,
					"numoutlets" : 1,
					"outlettype" : [ "" ],
					"parameter_enable" : 0,
					"patching_rect" : [ 0.0, 0.0, 340.0, 168.0 ],
					"presentation" : 1,
					"presentation_rect" : [ 0.0, 0.0, 340.0, 168.0 ]
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-plugin-in",
					"maxclass" : "newobj",
					"numinlets" : 1,
					"numoutlets" : 3,
					"outlettype" : [ "signal", "signal", "" ],
					"patching_rect" : [ 400.0, 50.0, 100.0, 20.0 ],
					"text" : "plugin~ 2"
				}

			}
, 			{
				"box" : 				{
					"id" : "obj-plugin-out",
					"maxclass" : "newobj",
					"numinlets" : 3,
					"numoutlets" : 0,
					"patching_rect" : [ 400.0, 150.0, 100.0, 20.0 ],
					"text" : "plugout~ 2"
				}

			}
 ],
		"lines" : [ 			{
				"patchline" : 				{
					"destination" : [ "obj-plugin-out", 0 ],
					"source" : [ "obj-plugin-in", 0 ]
				}

			}
, 			{
				"patchline" : 				{
					"destination" : [ "obj-plugin-out", 1 ],
					"source" : [ "obj-plugin-in", 1 ]
				}

			}
 ],
		"dependency_cache" : [ 			{
				"name" : "AutoClean.js",
				"bootpath" : "~/Dropbox/Projekte/Claude Code/Ableton Auto Clean",
				"patcherrelativepath" : ".",
				"type" : "TEXT",
				"implicit" : 1
			}
 ],
		"autosave" : 0,
		"oscreceiveudpport" : 0
	}

}
