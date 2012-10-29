/// <reference path="jquery-1.7.1.intellisense.js"/>
/// <reference path="jquery-1.7.1.js" />
/// <reference path="Wavegrounds.js" />
/// <reference path="http://cdnjs.cloudflare.com/ajax/libs/json2/20110223/json2.js" />

// Controller

if (typeof M === "undefined")
	M = {};

M.Controller = new (function ()
{
	this.BaseAddress = ''; //'http://localhost:8005/';
	this.ServerAddress = ''; //'http://localhost:8005/Sketch/';

	var Ctrl = this;

	this.ActiveController = null;
	this.Instance = null;

	// ---------------------------- Browser Detection -----------------------------
	this.DetectBrowser = function()
	{
		var browser = BrowserDetect.browser.toLowerCase();
		var version = BrowserDetect.version;

		if (browser == 'explorer' && version < 9)
		{
			alert('Your browser is too old.\nInternet Explorer 8 and below are not supported.\nYou should most definitely upgrade your browser!');
			return true;
		}

		if (browser === 'chrome')
		{
			$('.IE').css('display', 'none');
			$('.Firefox').css('display', 'none');
		}
		else if (browser === 'explorer')
		{
			$('.Chrome').css('display', 'none');
			$('.Firefox').css('display', 'none');
		}
		else if (browser === 'firefox')
		{
			$('.IE').css('display', 'none');
			$('.Chrome').css('display', 'none');
		}

		return false;
	}

	// ----------------------------Process start ----------------------------
	this.StartApplication = function ()
	{
		var unsupported = this.DetectBrowser();
		if (unsupported)
			return false;

		var link = document.URL;
		if (link.indexOf('?') > 0)
			link = link.substring(0, link.indexOf('?'));

		this.BaseAddress = link;
		this.ServerAddress = link + '/Sketch/'
		this.ServerAddress = this.ServerAddress.replace('//Sketch', '/Sketch');

		var canvas = document.getElementById("Canvas");
		var m = new M.Main(canvas);
		m.Init();
		//m.Reset();
		this.Instance = m;
		setInterval(function () { m.Process(); }, 10);

		return true;
	}

	this.GetQueryParameters = function ()
	{
		var parameters = {};

		var link = document.URL;
		if (link.indexOf('?') > 0)
			var query = link.substring(link.indexOf('?') + 1);
		else
			return parameters;

		var parts = query.split('&');
		for (i in parts)
		{
			var part = parts[i];
			var key = part.split('=')[0];
			var val = part.split('=')[1];
			parameters[key] = val;
		}

		return parameters;
	}

	// -----------------Default Canvas size and reload controls -----------------
	this.SetDefaults = function (ignoreRef)
	{
		if (ignoreRef !== true)
		{
			var params = this.GetQueryParameters();

			if ('ref' in params)
			{
				this.GetSketch(params.ref);
				return;
			}
		}
		
		// Set default size
		this.Instance.Config.CanvasWidth = Math.roundTo(window.innerWidth * 0.9, 0);
		this.Instance.Config.CanvasHeight = Math.roundTo(window.innerHeight * 0.85, 0);
		this.Instance.ResizeCanvas();
		this.RefreshControls();
		this.RefreshSettings();
	}

	// refresh all display values and sliders from values stored in the current instance
	this.RefreshControls = function()
	{
		$('.Controller').each(function ()
		{
			var id = $(this).prop('id');
			var val = Ctrl.Instance.Config[id];
			Ctrl.SetValue(id, val, false, true);
		});
	}

	// refresh all settings (show/hide sections) from values stored in the current instance
	this.RefreshSettings = function()
	{
		$('#Control .Settings').each(function ()
		{
			var id = $(this).prop('id');
			Ctrl.ShowHideSettings(id);
		});
	}

	// Add controller element and label
	this.AddController = function(elem)
	{
		var id = $(elem).prop('id');
		var label = '<span>' + M.Labels[id] + ':</span>';
		var type = M.ConfigInfo[id].type;

		if (type === 'limit' || type === 'explimit')
			var ctrl = '<div class="ControlHandle"><div class="bar"><div class="indicator">&nbsp;</div></div></div>';
		else if (type === 'lin' || type === 'exp')
			var ctrl = '<div class="ControlHandle"><div class="spinner">Drag</div></div>';
		else if (type === 'color')
			var ctrl = '<div class="ControlColor">&nbsp;</div>';
		else
			var ctrl = '';

		$(elem).before(label);
		$(elem).after(ctrl);

		if (type === 'color')
		{
			$(elem).parent().find('.ControlColor').click(function ()
			{
				Ctrl.GetColor(id);
			});
		}
		else
		{
			$(elem).parent().find('.ControlHandle').mousedown(function ()
			{
				Ctrl.ActiveController = id;
				$('#Control input').attr('unselectable', 'on').css('-moz-user-select', '-moz-none').css('-webkit-user-select', 'none');
			});
		}

		// Event handler for input vox
		$(elem).change(function ()
		{
			Ctrl.SetValue(id, $(this).val(), false);
		});

		// set default value
		this.SetValue(id, M.ConfigInfo[id].def, true, true);
	}

	// Set the control value
	this.SetValue = function(id, val, round, force)
	{
		var info = M.ConfigInfo[id];

		if (info.type !== 'color')
		{
			val = Number(val);
			if (val < info.min)
				val = info.min;
			else if (val > info.max)
				val = info.max;
		}

		if (this.Instance.Config[id] == val && (force !== true))
			return;

		// update slider
		if (info.type == 'limit')
		{
			var width = (val - info.min) / (info.max - info.min) * 100;
			width = Math.roundTo(width, 1);
			width = width.toString() + '%';
			$('#' + id).parent().find('.bar .indicator').css('width', width);
		}
		else if (info.type == 'explimit')
		{
			var width = Math.log(val + 1) / Math.log(info.max + 1) * 100;
			width = Math.roundTo(width, 1);
			width = width.toString() + '%';
			$('#' + id).parent().find('.bar .indicator').css('width', width);
		}

		if (info.type === 'color')
		{
			$('#' + id).val(val);
			$('#' + id).parent().find('.ControlColor').css('background-color', val);
		}
		else
		{
			var roundedVal = Math.roundTo(val, info.precision);

			if (round === true)
				$('#' + id).val(roundedVal);
			else
				$('#' + id).val(val);
		}

		this.Instance.Config[id] = val;
		this.Instance.Reset();
		this.Instance.Process();

		if (id.indexOf('ColorPick') >= 0)
			this.UpdateColorDialog();
	}

	this.PanCanvas = function (dx, dy)
	{
		var scale = 100 / this.Instance.Config.CanvasScale;

		var changeX = dx / this.Instance.Width * scale;
		var changeY = -dy / this.Instance.Height * scale;

		var panX = this.Instance.Config.PanX;
		var panY = this.Instance.Config.PanY;

		this.SetValue('PanX', panX + changeX, true, true);
		this.SetValue('PanY', panY + changeY, true, true);
	}

	this.Zoom = function (delta)
	{
		var val = this.Instance.Config.Zoom * (1 + 0.02 * delta);
		this.SetValue('Zoom', val, true, true);
	}

	this.UpdateColorDialog = function()
	{
		$('#Swatch').css('background-color', this.GetDialogColor());
	}

	this.GetDialogColor = function()
	{
		var R = this.Instance.Config.ColorPickR.toString(16);
		var G = this.Instance.Config.ColorPickG.toString(16);
		var B = this.Instance.Config.ColorPickB.toString(16);

		if (R.length < 2)
			R = '0' + R;
		if (G.length < 2)
			G = '0' + G;
		if (B.length < 2)
			B = '0' + B;

		var str = '#' + R + G + B;
		return str;
	}

	// Show or hide the current setting (config block) depending on model state
	this.ShowHideSettings = function(id)
	{
		var elem = $('#' + id).first();

		var state = this.Instance.Settings[id];
		var disabledLabel = '<div class="DisabledLabel">(Disabled)</div>';

		if (state === false)
		{
			$(elem).parent().addClass('DisabledState');
			$(elem).after(disabledLabel);

			// save original height
			var height = $(elem).parent().height();
			$.data(document.getElementById(id), 'height', height);

			$(elem).parent().animate({ 'height': '30px' }, 200);
		}
		else
		{
			$(elem).parent().removeClass('DisabledState');
			$(elem).parent().find('.DisabledLabel').remove();

			// retrieve original height
			var height = $.data(document.getElementById(id), 'height');

			$(elem).parent().animate({ 'height': height }, 200);
		}
	}


	// Show modal dialogs
	this.ShowDialog = function(dialogId, onCloseEvent)
	{
		var dialog = $('#' + dialogId);
		dialog.addClass('DialogActive');
		dialog.appendTo("body");

		// set top margin
		if (window.innerHeight <= 450)
			dialog.css('margin-top', '-150px');
		else if (window.innerHeight <= 550)
			dialog.css('margin-top', '-200px');
		else
			dialog.css('margin-top', '-250px');

		var dialogClose = $(".DialogClose").clone();
		dialogClose.appendTo(dialog);

		var blinds = $(".DialogBlinds").clone();
		blinds.addClass('BlindsActive');
		blinds.appendTo("body");

		// add close action
		$(".DialogClose").click(function ()
		{
			$("body .BlindsActive").remove();
			$("body .DialogActive .DialogClose").remove();
			$("body .DialogActive").appendTo('#DialogContainer');
			$(".DialogActive").removeClass('DialogActive');

			if (typeof onCloseEvent !== "undefined" && onCloseEvent !== null)
				onCloseEvent();
		});
	}

	this.GetColor = function(id)
	{
		var color = DecomposeColor(this.Instance.Config[id]);
		this.SetValue('ColorPickR', color[0]);
		this.SetValue('ColorPickG', color[1]);
		this.SetValue('ColorPickB', color[2]);

		var callback = function () { Ctrl.SetValue(id, Ctrl.GetDialogColor()); };
		this.ShowDialog('ColorPickerDialog', callback);
	}

	// ----------------------------------------------------------------------
	// --------------------------- Event Handlers ---------------------------
	// ----------------------------------------------------------------------

	this.EventToggleSettings = function (id)
	{
		var state = this.Instance.Settings[id];
		state = !state;
		this.Instance.Settings[id] = state;

		this.ShowHideSettings(id);
		this.Instance.Reset();
		this.Instance.Process();
	}

	this.EventGetImage = function ()
	{
		$('#ImageCodeJson').val(this.GetSerialized());

		var dataURL = document.getElementById("Canvas").toDataURL();
		document.getElementById("ImageOutput").src = dataURL;
		this.ShowDialog("GetImageDialog");
	}

	this.EventSaveShare = function ()
	{
		//$('#ImageShareResults').css('height', '0px');
		//$('#ImageShareSave').css('height', 120);

		Ctrl.ShowDialog("SaveShareDialog");
		Ctrl.PostSketch();
	}

	this.GetSerialized = function ()
	{
		var sketch = this.Instance.GetData();
		sketch.Config = JSON.stringify(sketch.Config);
		sketch.Settings = JSON.stringify(sketch.Settings);
		sketch.Version = M.VersionInfo;
		sketch.Public = $('#SharePublic').prop('checked');

		var ser = JSON.stringify(sketch);
		return ser;
	}

	this.PostSketch = function ()
	{
		var ser = this.GetSerialized();

		$.ajax(
		{
			url: Ctrl.ServerAddress + 'Save',
			type: "POST",
			data: ser,
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			success: function (data)
			{
				if(data.Status !== 'OK')
					var link = data.Message;
				else
					var link = Ctrl.BaseAddress + '?ref=' + data.Ref;
				
				var twitterLink = 'https://twitter.com/intent/tweet?hashtags=Wavegrounds&text=My image:&url=' + encodeURIComponent(link);
				var fblink = '<div class="fb-like" data-href="http://www.google.com" data-send="false" data-width="450" data-show-faces="false" data-font="arial"></div>';
				$('#ImageUrl').val(link);
				$('#ShareTwitter a').prop('href', twitterLink);
				$('#ShareFacebook').html(fblink);
				$('#ImageShareResults').animate({ height: 240 }, 150);
				$('#ImageShareSave').animate({ height: 0 }, 150);

			}
		});
	}

	this.GetSketch = function (ref)
	{
		$.ajax(
		{
			url: Ctrl.ServerAddress + 'Load/' + ref,
			type: "GET",
			dataType: "json",
			error: function()
			{
				Ctrl.ShowDialog('FailedToLoadDialog');
				Ctrl.SetDefaults(true);
			},
			success: function (data)
			{
				if (data.Status !== 'OK')
				{
					Ctrl.ShowDialog('FailedToLoadDialog');
					Ctrl.SetDefaults(true);
					return;
				}

				var sketch = {};
				sketch.Version = data.Version;
				sketch.Config = JSON.parse(data.Config);
				sketch.Settings = JSON.parse(data.Settings);
				Ctrl.LoadSketch(sketch);
			}
		});
	}

	this.LoadSketch = function(sketch)
	{
		this.Instance.SetData(sketch.Version, sketch.Config, sketch.Settings);

		this.Instance.ResizeCanvas();
		this.RefreshControls();
		this.RefreshSettings();
	}

	this.EventRestoreImage = function ()
	{
		this.ShowDialog("RestoreImageDialog");
	}

	this.Restore = function ()
	{
		var text = $('#RestoreImageCodeJson').val();
		var data = JSON.parse(text);

		var sketch = {};
		sketch.Version = data.Version;
		sketch.Config = JSON.parse(data.Config);
		sketch.Settings = JSON.parse(data.Settings);
		Ctrl.LoadSketch(sketch);
	}

	this.EventInstructions = function ()
	{
		this.ShowDialog("InstructionsDialog");
	}

	this.EventAbout = function ()
	{
		var val = 'Version ' + M.VersionInfo;
		$('#VersionString').html(val);
		this.ShowDialog("AboutDialog");
	}

})();
